const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.use(requireAuth);
router.use(requireAdmin);

const getClient = (req) => createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: req.headers.authorization } } }
);

const REVENUE_PER_ACTIVE_USER = 10;
const TIER_5_PCT = 0.40;
const TIER_4_PCT = 0.35;
const TIER_3_PCT = 0.25;

router.get('/stats', async (req, res) => {
    const supabase = getClient(req);

    const { count: totalUsers } = await supabase.from('users').select('*', { count: 'exact', head: true });
    const { data: draws } = await supabase.from('draws').select('total_prize_pool');

    const totalPrizePool = draws ? draws.reduce((sum, d) => sum + Number(d.total_prize_pool || 0), 0) : 0;
    const totalCharity = totalPrizePool * 0.10;
    const totalDraws = draws ? draws.length : 0;

    res.json({ stats: { totalUsers, totalPrizePool, totalCharity, totalDraws } });
});

router.get('/users', async (req, res) => {
    const supabase = getClient(req);
    const { data, error } = await supabase.from('users').select('id, email, role, created_at').order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json({ users: data });
});

router.get('/winners', async (req, res) => {
    const supabase = getClient(req);
    const { data, error } = await supabase
        .from('winners')
        .select('*, users(email)')
        .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json({ winners: data });
});

router.post('/winners/:id/pay', async (req, res) => {
    const supabase = getClient(req);
    const { data, error } = await supabase
        .from('winners')
        .update({ status: 'paid' })
        .eq('id', req.params.id)
        .select()
        .single();
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Marked as paid', winner: data });
});

router.post('/winners/:id/reject', async (req, res) => {
    const supabase = getClient(req);
    const { data, error } = await supabase
        .from('winners')
        .update({ status: 'rejected' })
        .eq('id', req.params.id)
        .select()
        .single();
    if (error) {
        console.error("WINNER REJECTION ERROR:", error);
        return res.status(500).json({ error: error.message });
    }
    res.json({ message: 'Verification application rejected systematically', winner: data });
});

router.post('/charities', async (req, res) => {
    const supabase = getClient(req);
    const { name, description, image_url, is_featured } = req.body;

    let parsedEvents = req.body.upcoming_events;
    if (typeof parsedEvents === 'string') {
        try { parsedEvents = JSON.parse(parsedEvents); } catch (e) { parsedEvents = []; }
    }

    const { data, error } = await supabase.from('charities').insert([{
        name, description, image_url, is_featured: !!is_featured, upcoming_events: parsedEvents || []
    }]).select().single();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Charity added', charity: data });
});

router.put('/charities/:id', async (req, res) => {
    const supabase = getClient(req);
    const { name, description, image_url, is_featured } = req.body;

    let parsedEvents = req.body.upcoming_events;
    if (typeof parsedEvents === 'string') {
        try { parsedEvents = JSON.parse(parsedEvents); } catch (e) { parsedEvents = null; }
    }

    const updatePayload = { name, description, image_url, is_featured: !!is_featured };
    if (parsedEvents !== null) updatePayload.upcoming_events = parsedEvents;

    const { data, error } = await supabase.from('charities').update(updatePayload).eq('id', req.params.id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Charity updated', charity: data });
});

router.delete('/charities/:id', async (req, res) => {
    const supabase = getClient(req);
    const { error } = await supabase.from('charities').delete().eq('id', req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Charity deleted' });
});

async function calculateDrawLogic(supabase, strategy, manualNumbers) {
    const { data: allScores, error: scoresError } = await supabase.from('scores').select('user_id, score, date');
    if (scoresError) throw new Error(scoresError.message);

    const { data: activeSubs, error: subsError } = await supabase.from('subscriptions').select('user_id').eq('status', 'active');
    if (subsError) throw new Error(subsError.message);
    const activeSubUsers = new Set(activeSubs.map(s => s.user_id));

    const userScoresMap = {};
    allScores.forEach(s => {
        if (!userScoresMap[s.user_id]) userScoresMap[s.user_id] = [];
        userScoresMap[s.user_id].push({ score: parseInt(s.score, 10), date: s.date });
    });

    const validParticipants = [];
    for (const [userId, scores] of Object.entries(userScoresMap)) {
        if (scores.length >= 5 && activeSubUsers.has(userId)) {
            validParticipants.push({ userId, scores: scores.slice(-5) });
        }
    }

    let drawNumbers = [];
    if (manualNumbers && Array.isArray(manualNumbers) && manualNumbers.length === 5) {
        drawNumbers = [...manualNumbers].map(Number).sort((a, b) => a - b);
    } else {
        if (strategy === 'least_frequent' || strategy === 'most_frequent') {
            const freq = {};
            for (let i = 1; i <= 45; i++) freq[i] = 0;
            validParticipants.forEach(p => {
                p.scores.forEach(s => { freq[s.score]++; });
            });
            const sortedNums = Object.keys(freq).map(Number).sort((a, b) => {
                const diff = freq[a] - freq[b];
                if (diff !== 0) return strategy === 'least_frequent' ? diff : -diff;
                return Math.random() - 0.5;
            });
            drawNumbers = sortedNums.slice(0, 5).sort((a, b) => a - b);
        } else {
            while (drawNumbers.length < 5) {
                const num = Math.floor(Math.random() * 45) + 1;
                if (!drawNumbers.includes(num)) drawNumbers.push(num);
            }
            drawNumbers.sort((a, b) => a - b);
        }
    }

    const winners = [];
    let match5Count = 0; let match4Count = 0; let match3Count = 0;

    validParticipants.forEach(p => {
        let matchCount = 0;
        let matchedDetails = [];
        p.scores.forEach(s => {
            if (drawNumbers.includes(s.score)) {
                matchCount++;
                matchedDetails.push(`${s.score} (${s.date})`);
            }
        });

        if (matchCount >= 3) {
            winners.push({ userId: p.userId, matchCount, matchedDetails });
            if (matchCount === 5) match5Count++;
            if (matchCount === 4) match4Count++;
            if (matchCount === 3) match3Count++;
        }
    });

    const { data: lastDraw } = await supabase.from('draws').select('jackpot_rollover, status').order('created_at', { ascending: false }).limit(1).maybeSingle();
    const previousRollover = lastDraw && lastDraw.status === 'drawn' ? (lastDraw.jackpot_rollover || 0) : 0;

    const REVENUE_PER_ACTIVE_USER = 10;
    const totalRevenue = validParticipants.length * REVENUE_PER_ACTIVE_USER;

    const pool5 = (totalRevenue * 0.40) + Number(previousRollover);
    const pool4 = totalRevenue * 0.35;
    const pool3 = totalRevenue * 0.25;

    const prize5 = match5Count > 0 ? (pool5 / match5Count) : 0;
    const prize4 = match4Count > 0 ? (pool4 / match4Count) : 0;
    const prize3 = match3Count > 0 ? (pool3 / match3Count) : 0;

    const nextRollover = match5Count === 0 ? pool5 : 0;

    return {
        drawNumbers,
        validParticipantsCount: validParticipants.length,
        winners,
        stats: { match5Count, match4Count, match3Count, previousRollover, nextRollover, totalRevenue, prize5, prize4, prize3, pool5, pool4, pool3 }
    };
}

router.post('/draw/simulate', async (req, res) => {
    try {
        const supabase = getClient(req);
        const { strategy = 'random', manualNumbers } = req.body;
        const result = await calculateDrawLogic(supabase, strategy, manualNumbers);
        res.json({ message: 'Simulation Complete', simulation: result });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/draws/scheduled', async (req, res) => {
    const supabase = getClient(req);
    const { data, error } = await supabase.from('draws').select('*').order('date', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json({ draws: data });
});

router.post('/draws/schedule', async (req, res) => {
    const supabase = getClient(req);
    const { date } = req.body;
    if (!date) return res.status(400).json({ error: 'Date strictly required.' });
    const { data, error } = await supabase.from('draws').insert([{ date, status: 'upcoming', total_prize_pool: 0, jackpot_rollover: 0 }]).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Draw explicitly scheduled', draw: data });
});

router.post('/draw/publish', async (req, res) => {
    try {
        const supabase = getClient(req);
        const { draw_id, numbers } = req.body;

        if (!draw_id) return res.status(400).json({ error: 'draw_id is required to explicitly update a Scheduled Draw container.' });
        if (!numbers || !Array.isArray(numbers) || numbers.length !== 5) {
            return res.status(400).json({ error: 'Must provide exactly 5 simulated numbers to publish' });
        }

        const result = await calculateDrawLogic(supabase, 'random', numbers);

        const { data: drawRecord, error: drawError } = await supabase
            .from('draws')
            .update({
                numbers: result.drawNumbers,
                status: 'published',
                total_prize_pool: result.stats.totalRevenue,
                jackpot_rollover: result.stats.nextRollover
            })
            .eq('id', draw_id)
            .select()
            .single();

        if (drawError) return res.status(500).json({ error: drawError.message });

        if (result.winners.length > 0) {
            const winnerInserts = result.winners.map(w => {
                let prizeAmount = 0;
                if (w.matchCount === 5) prizeAmount = result.stats.prize5;
                if (w.matchCount === 4) prizeAmount = result.stats.prize4;
                if (w.matchCount === 3) prizeAmount = result.stats.prize3;

                return {
                    draw_id: drawRecord.id,
                    user_id: w.userId,
                    match_count: w.matchCount,
                    matched_details: w.matchedDetails,
                    prize_amount: prizeAmount,
                    status: 'pending'
                };
            });

            const { error: winnerError } = await supabase.from('winners').insert(winnerInserts);
            if (winnerError) return res.status(500).json({ error: winnerError.message });
        }

        res.json({ message: 'Draw Published Successfully', draw: drawRecord, stats: result.stats });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
