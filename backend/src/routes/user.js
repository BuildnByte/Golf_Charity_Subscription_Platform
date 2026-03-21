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

// Update restricted User Profile charity metrics independently preventing unauthorized Role escalation organically 
router.put('/profile', async (req, res) => {
    const { charity_percentage, selected_charity_id } = req.body;
    const supabase = getClient(req);

    // Fetch existing settings to populate undefined parameters symmetrically
    const { data: currentUser } = await supabase
        .from('users')
        .select('charity_percentage, selected_charity_id')
        .eq('id', req.user.id)
        .single();

    const finalPercentage = charity_percentage !== undefined ? parseInt(charity_percentage) : currentUser?.charity_percentage || 10;
    const finalCharityId = selected_charity_id !== undefined ? selected_charity_id : currentUser?.selected_charity_id || null;

    const { error } = await supabase.rpc('update_user_charity_prefs', {
        p_user_id: req.user.id,
        p_percentage: finalPercentage,
        p_charity_id: finalCharityId
    });

    if (error) { console.log(error); return res.status(500).json({ error: error.message }) };
    res.json({ message: 'Charity Mapping and Allocations systematically secured and deployed.' });
});

// Fetch all draws natively mapped for user participation summaries
router.get('/draws', async (req, res) => {
    const supabase = getClient(req);
    const { data, error } = await supabase.from('draws').select('*').order('date', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json({ draws: data });
});

module.exports = router;
