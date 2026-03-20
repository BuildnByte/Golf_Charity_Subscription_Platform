const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { requireAuth, requireSubscription } = require('../middleware/auth');

// Protected routes
router.use(requireAuth);

// Helper to create an authenticated supabase client for the current request
const getClient = (req) => createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: req.headers.authorization } } }
);

// GET /scores/:userId
router.get('/:userId', async (req, res) => {
    const { userId } = req.params;

    if (req.user.id !== userId) {
        return res.status(403).json({ error: 'Unauthorized to view these scores' });
    }

    const supabase = getClient(req);

    const { data, error } = await supabase
        .from('scores')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    res.json({ scores: data });
});

// POST /scores
router.post('/', requireSubscription, async (req, res) => {
    const { score, date } = req.body;
    const userId = req.user.id;
    const supabase = getClient(req);

    if (typeof score !== 'number' || score < 1 || score > 45) {
        return res.status(400).json({ error: 'Score must be a number between 1 and 45' });
    }

    // 1. Check current scores
    const { data: currentScores, error: fetchError } = await supabase
        .from('scores')
        .select('id, date')
        .eq('user_id', userId)
        .order('date', { ascending: true }); // oldest first

    if (fetchError) {
        return res.status(500).json({ error: fetchError.message });
    }

    // 2. If >= 5, delete the oldest
    if (currentScores.length >= 5) {
        const toDeleteCount = currentScores.length - 4; // Keep 4, so insert makes it 5
        const idsToDelete = currentScores.slice(0, toDeleteCount).map(s => s.id);

        const { error: deleteError } = await supabase
            .from('scores')
            .delete()
            .in('id', idsToDelete);

        if (deleteError) {
            return res.status(500).json({ error: deleteError.message });
        }
    }

    // 3. Insert the new score
    const insertData = { user_id: userId, score };
    if (date) insertData.date = date;

    const { data, error } = await supabase
        .from('scores')
        .insert([insertData])
        .select()
        .single();

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    res.status(201).json({ message: 'Score added successfully', score: data });
});

module.exports = router;
