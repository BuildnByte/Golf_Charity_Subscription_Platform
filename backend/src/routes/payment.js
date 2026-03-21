const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Razorpay = require('razorpay');
const { createClient } = require('@supabase/supabase-js');
const { requireAuth } = require('../middleware/auth');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

const getClient = (req) => createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: req.headers.authorization } } }
);

router.use(requireAuth);

router.post('/create-order', async (req, res) => {
    try {
        const { type, amount, charity_id } = req.body; // 'monthly' | 'yearly' | 'donation'

        let orderAmount = 800 * 100; // Monthly equivalent (₹800)
        if (type === 'yearly') orderAmount = 8000 * 100; // Yearly
        if (type === 'donation') {
            if (!amount || amount < 100) return res.status(400).json({ error: 'Minimum donation is ₹100' });
            orderAmount = amount * 100;
        }

        const options = {
            amount: orderAmount,
            currency: "INR",
            receipt: `rcpt_${req.user.id.substring(0, 8)}_${Date.now()}`,
            notes: {
                payment_type: type || 'monthly',
                charity_id: charity_id || ''
            }
        };

        // Server securely generates the official order request
        const order = await razorpay.orders.create(options);
        res.json({ order_id: order.id, amount: options.amount, currency: options.currency, notes: options.notes });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to securely construct Razorpay Order' });
    }
});

router.post('/verify', async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ error: 'Missing security tokens' });
    }

    try {
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ error: 'Invalid HMAC signature provided' });
        }

        // Fetch securely from Razorpay servers to ensure notes haven't been tampered
        const rzpOrder = await razorpay.orders.fetch(razorpay_order_id);
        const type = rzpOrder.notes?.payment_type || 'monthly';
        const charity_id = rzpOrder.notes?.charity_id;

        const supabase = getClient(req);

        if (type === 'donation') {
            const amountNumeric = rzpOrder.amount / 100;
            const { data, error } = await supabase
                .from('donations')
                .insert([{
                    user_id: req.user.id,
                    charity_id: charity_id,
                    amount: amountNumeric,
                    status: 'successful',
                    razorpay_order_id,
                    razorpay_payment_id
                }]);
            if (error) throw error;

            // Execute RPC securely allocating funds
            await supabase.rpc('increment_charity_amount', { p_charity_id: charity_id, p_amount: amountNumeric });

            return res.json({ message: 'Donation securely verified!', type: 'donation' });
        } else {
            // Subscription dynamic mapping
            const currentPeriodEnd = new Date();
            if (type === 'yearly') {
                currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
            } else {
                currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
            }

            const { data, error } = await supabase
                .from('subscriptions')
                .upsert({
                    user_id: req.user.id,
                    razorpay_order_id,
                    razorpay_payment_id,
                    status: 'active',
                    plan_id: type,
                    current_period_end: currentPeriodEnd.toISOString()
                }, { onConflict: 'user_id' })
                .select()
                .single();

            if (error) throw error;

            // Fetch explicitly mapped User Charity settings naturally
            const { data: userProfile } = await supabase
                .from('users')
                .select('charity_percentage, selected_charity_id')
                .eq('id', req.user.id)
                .single();

            if (userProfile && userProfile.selected_charity_id) {
                const charityPercentage = userProfile.charity_percentage || 10;
                const baseAmount = type === 'yearly' ? 8000 : 800;
                const donationAmount = baseAmount * (charityPercentage / 100);

                // Insert into tracking log safely
                await supabase.from('donations').insert([{
                    user_id: req.user.id,
                    charity_id: userProfile.selected_charity_id,
                    amount: donationAmount,
                    status: 'successful',
                    razorpay_order_id,
                    razorpay_payment_id
                }]);

                // Update Charity Gross amount securely bypassing standard RLS organically
                await supabase.rpc('increment_charity_amount', { p_charity_id: userProfile.selected_charity_id, p_amount: donationAmount });
            }

            return res.json({ message: 'Cryptographic mapping executed. Subscription properly activated!', subscription: data, type });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Systematic verification failed securely' });
    }
});

module.exports = router;
