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

// Fetch strictly secure subscription records and proactively expire tampered data if timed out
router.get('/subscription', async (req, res) => {
    const supabase = getClient(req);
    const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', req.user.id)
        .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });

    let subData = data;
    if (subData && subData.status === 'active' && subData.current_period_end) {
        if (new Date(subData.current_period_end) < new Date()) {
            await supabase.from('subscriptions').update({ status: 'expired' }).eq('id', subData.id);
            subData.status = 'expired';
        }
    }

    res.json({ subscription: subData });
});

// Fetch extended user profile featuring strictly their mapped charity relationship and securely configured parameters
router.get('/profile', async (req, res) => {
    const supabase = getClient(req);
    const { data, error } = await supabase
        .from('users')
        .select('*, charities(*)')
        .eq('id', req.user.id)
        .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ profile: data });
});

module.exports = router;
