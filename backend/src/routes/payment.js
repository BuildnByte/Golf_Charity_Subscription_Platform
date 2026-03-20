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
        const options = {
            amount: 800 * 100, // ₹800.00 mapping realistically to ~$10 plan
            currency: "INR",
            receipt: `rcpt_${req.user.id.substring(0, 8)}_${Date.now()}`
        };

        const order = await razorpay.orders.create(options);
        res.json({ order_id: order.id, amount: options.amount, currency: options.currency });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create Razorpay Order' });
    }
});

router.post('/verify', async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ error: 'Missing payment details' });
    }

    try {
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ error: 'Invalid payment signature' });
        }

        const supabase = getClient(req);

        const { data, error } = await supabase
            .from('subscriptions')
            .upsert({
                user_id: req.user.id,
                razorpay_order_id,
                razorpay_payment_id,
                status: 'active',
                plan_id: 'standard_10'
            }, { onConflict: 'user_id' })
            .select()
            .single();

        if (error) throw error;

        res.json({ message: 'Payment cryptographically verified and subscription activated!', subscription: data });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Cryptographic verification failed' });
    }
});

module.exports = router;
