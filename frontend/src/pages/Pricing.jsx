import React, { useState } from 'react';
import { api, useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { CreditCard, Check, ArrowLeft, ShieldCheck } from 'lucide-react';

export default function Pricing() {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { user } = useAuth();

    const handleSubscribe = async () => {
        setLoading(true);
        try {
            // 1. Create order on our securely enclosed backend
            const { data: orderData } = await api.post('/payment/create-order');

            // 2. Initialize Razorpay Checkout
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "Interview Lotto Inc.",
                description: "Standard Monthly Access",
                order_id: orderData.order_id,
                handler: async function (response) {
                    try {
                        // 3. Verify on our node backend securely using signature HMAC
                        await api.post('/payment/verify', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        });
                        alert('Payment successful! You can now actively participate in draws.');
                        navigate('/');
                    } catch (verifyErr) {
                        console.error(verifyErr);
                        alert('Signature Verification failed. The transaction may have been tampered with.');
                    }
                },
                prefill: {
                    email: user?.email || "",
                },
                theme: {
                    color: "#4f46e5"
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                alert("Payment failed: " + response.error.description);
            });
            rzp.open();
        } catch (err) {
            console.error(err);
            alert("Failed to initialize payment. Ensure your VITE_RAZORPAY_KEY_ID is set securely in your frontend .env!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 flex items-center justify-center">
            <div className="max-w-4xl w-full">
                <Link to="/" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-8 font-medium">
                    <ArrowLeft size={16} /> Back to Dashboard
                </Link>

                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-5">

                        <div className="p-8 md:p-12 md:col-span-3 bg-indigo-900 text-white flex flex-col justify-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 -tr-translate-y-1/4 translate-x-1/4 w-96 h-96 bg-indigo-800 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

                            <div className="relative z-10">
                                <h2 className="text-4xl font-extrabold mb-4 tracking-tight">Lotto Standard Plan</h2>
                                <p className="text-indigo-200 mb-10 text-lg leading-relaxed">
                                    Join the exclusive lottery pool securely. Purchase standard access to permanently record your weekly 5 matching numbers correctly and win real verified prizes securely.
                                </p>

                                <ul className="space-y-5">
                                    <li className="flex items-center gap-4">
                                        <div className="bg-indigo-700/50 p-1.5 rounded-full ring-2 ring-indigo-800"><Check size={18} className="text-green-400" /></div>
                                        <span className="text-lg">Submit exactly 5 distinct numbers per draw</span>
                                    </li>
                                    <li className="flex items-center gap-4">
                                        <div className="bg-indigo-700/50 p-1.5 rounded-full ring-2 ring-indigo-800"><Check size={18} className="text-green-400" /></div>
                                        <span className="text-lg">10% gross directly funneled to your chosen Charity</span>
                                    </li>
                                    <li className="flex items-center gap-4">
                                        <div className="bg-indigo-700/50 p-1.5 rounded-full ring-2 ring-indigo-800"><Check size={18} className="text-green-400" /></div>
                                        <span className="text-lg">Cryptographically signed Razorpay integration</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div className="p-10 md:p-12 md:col-span-2 flex flex-col items-center justify-center text-center bg-white relative">
                            <div className="absolute top-4 right-4 text-green-600 flex items-center gap-1 text-xs font-bold uppercase tracking-wider bg-green-50 px-2 py-1 rounded">
                                <ShieldCheck size={14} /> Secure Checkout
                            </div>

                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 mt-6">Monthly Access</h3>
                            <div className="flex items-baseline justify-center mb-8 text-gray-900">
                                <span className="text-5xl font-extrabold tracking-tight">₹800</span>
                                <span className="text-gray-500 ml-2 font-medium text-lg">/mo</span>
                            </div>

                            <button
                                onClick={handleSubscribe}
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-4 focus:ring-indigo-500/30 text-lg disabled:opacity-50 disabled:hover:translate-y-0"
                            >
                                <CreditCard size={22} />
                                {loading ? 'Initializing Interface...' : 'Subscribe Securely'}
                            </button>
                            <p className="text-xs text-gray-400 mt-5 font-medium">Safe, encrypted testing transaction seamlessly piped via the verified Razorpay Node SDK API.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
