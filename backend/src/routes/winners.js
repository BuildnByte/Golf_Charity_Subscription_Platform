const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

const getClient = (req) => createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: req.headers.authorization } } }
);

router.get('/me', async (req, res) => {
    const supabase = getClient(req);
    const { data, error } = await supabase
        .from('winners')
        .select('*, draws(date)')
        .eq('user_id', req.user.id)
        .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.json({ winnings: data });
});

router.post('/:id/screenshot', async (req, res) => {
    const { screenshot_url } = req.body;
    const supabase = getClient(req);

    if (!screenshot_url) return res.status(400).json({ error: 'Screenshot URL is required' });

    const { data, error } = await supabase
        .from('winners')
        .update({ screenshot_url })
        .eq('id', req.params.id)
        .eq('user_id', req.user.id)
        .select()
        .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Screenshot saved', winner: data });
});

module.exports = router;
