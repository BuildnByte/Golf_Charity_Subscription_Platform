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
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Verification application rejected systematically', winner: data });
});

router.post('/draw/run', async (req, res) => {
    const supabase = getClient(req);

    const { manualNumbers } = req.body;

    let drawNumbers = [];
    if (manualNumbers && Array.isArray(manualNumbers) && manualNumbers.length === 5) {
        drawNumbers = [...manualNumbers].map(Number).sort((a, b) => a - b);
    } else {
        while (drawNumbers.length < 5) {
            const num = Math.floor(Math.random() * 45) + 1;
            if (!drawNumbers.includes(num)) drawNumbers.push(num);
        }
        drawNumbers.sort((a, b) => a - b);
    }

    const { data: allScores, error: scoresError } = await supabase
        .from('scores')
        .select('user_id, score, date');

    if (scoresError) return res.status(500).json({ error: scoresError.message });

    const userScoresMap = {};
    allScores.forEach(s => {
        if (!userScoresMap[s.user_id]) userScoresMap[s.user_id] = [];
        userScoresMap[s.user_id].push({ score: parseInt(s.score, 10), date: s.date });
    });

    const validParticipants = [];
    for (const [userId, scores] of Object.entries(userScoresMap)) {
        if (scores.length >= 5) {
            validParticipants.push({ userId, scores: scores.slice(-5) });
        }
    }

    const winners = [];
    let match5Count = 0;
    let match4Count = 0;
    let match3Count = 0;

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

    const { data: lastDraw } = await supabase
        .from('draws')
        .select('jackpot_rollover, status')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    const previousRollover = lastDraw && lastDraw.status === 'drawn' ? (lastDraw.jackpot_rollover || 0) : 0;
    const totalRevenue = validParticipants.length * REVENUE_PER_ACTIVE_USER;

    const pool5 = (totalRevenue * TIER_5_PCT) + Number(previousRollover);
    const pool4 = totalRevenue * TIER_4_PCT;
    const pool3 = totalRevenue * TIER_3_PCT;

    const prize5 = match5Count > 0 ? (pool5 / match5Count) : 0;
    const prize4 = match4Count > 0 ? (pool4 / match4Count) : 0;
    const prize3 = match3Count > 0 ? (pool3 / match3Count) : 0;

    const nextRollover = match5Count === 0 ? pool5 : 0;

    const { data: drawRecord, error: drawError } = await supabase
        .from('draws')
        .insert([{
            date: new Date().toISOString().split('T')[0],
            numbers: drawNumbers,
            status: 'drawn',
            total_prize_pool: totalRevenue,
            jackpot_rollover: nextRollover
        }])
        .select()
        .single();

    if (drawError) return res.status(500).json({ error: drawError.message });

    if (winners.length > 0) {
        const winnerInserts = winners.map(w => {
            let prizeAmount = 0;
            if (w.matchCount === 5) prizeAmount = prize5;
            if (w.matchCount === 4) prizeAmount = prize4;
            if (w.matchCount === 3) prizeAmount = prize3;

            return {
                draw_id: drawRecord.id,
                user_id: w.userId,
                match_count: w.matchCount,
                matched_details: w.matchedDetails,
                prize_amount: prizeAmount,
                status: 'pending'
            };
        });

        const { error: winnerError } = await supabase
            .from('winners')
            .insert(winnerInserts);

        if (winnerError) return res.status(500).json({ error: winnerError.message });
    }

    res.json({
        message: 'Draw completed',
        draw: drawRecord,
        stats: {
            participants: validParticipants.length,
            match5: match5Count,
            match4: match4Count,
            match3: match3Count,
            previousRollover,
            nextRollover
        }
    });
});

module.exports = router;
