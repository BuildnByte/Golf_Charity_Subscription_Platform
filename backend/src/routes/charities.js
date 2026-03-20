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
    const { charity_id, charity_percentage } = req.body;
    const userId = req.user.id;
    const supabase = getClient(req);

    let updateData = {};
    if (charity_id) updateData.selected_charity_id = charity_id;
    if (charity_percentage) {
        if (charity_percentage < 10 || charity_percentage > 100) {
            return res.status(400).json({ error: 'Charity percentage must uniquely float exactly bounded between 10% and 100%' });
        }
        updateData.charity_percentage = charity_percentage;
    }

    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: 'Provide comprehensive charity selections legitimately configuring user data' });
    }

    const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    res.json({ message: 'Charity selected successfully', user: data });
});

module.exports = router;
