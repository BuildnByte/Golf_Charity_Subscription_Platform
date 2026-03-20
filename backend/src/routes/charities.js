const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { requireAuth } = require('../middleware/auth');

const getClient = (req) => {
    if (!req.headers.authorization) {
        return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    }
    return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: req.headers.authorization } }
    });
};

// GET /charities
router.get('/', async (req, res) => {
    const supabase = getClient(req);
    const { data, error } = await supabase
        .from('charities')
        .select('*')
        .order('name');

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    res.json({ charities: data });
});

// POST /charities/select
router.post('/select', requireAuth, async (req, res) => {
    const { charity_id } = req.body;
    const userId = req.user.id;
    const supabase = getClient(req);

    if (!charity_id) {
        return res.status(400).json({ error: 'Charity ID is required' });
    }

    const { data, error } = await supabase
        .from('users')
        .update({ selected_charity_id: charity_id })
        .eq('id', userId)
        .select()
        .single();

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    res.json({ message: 'Charity selected successfully', user: data });
});

module.exports = router;
