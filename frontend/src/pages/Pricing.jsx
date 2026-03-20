import React, { useState, useEffect } from 'react';
import { api, useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { CreditCard, Check, ArrowLeft, ShieldCheck } from 'lucide-react';

export default function Pricing() {
    const [loading, setLoading] = useState(false);
    const [sub, setSub] = useState(null);
    const [planType, setPlanType] = useState('monthly');
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        api.get('/user/subscription').then(res => {
            if (res.data.subscription && res.data.subscription.status === 'active') {
                setSub(res.data.subscription);
            }
        });
    }, []);

    const handleSubscribe = async () => {
        if (sub) return;
        setLoading(true);
        try {
            const { data: orderData } = await api.post('/payment/create-order', { type: planType });

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "Interview Lotto Inc.",
                description: `${planType === 'yearly' ? 'Yearly' : 'Monthly'} Access`,
                order_id: orderData.order_id,
                handler: async function (response) {
                    try {
                        await api.post('/payment/verify', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        });
                        alert('Transaction successful!');
                        navigate('/dashboard');
                    } catch (verifyErr) {
                        alert('Signature verification failed.');
                    }
                },
                prefill: { email: user?.email || "" },
                theme: { color: "#4f46e5" }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function () { alert("Payment failed."); });
            rzp.open();
        } catch (err) {
            alert("Payment initiation failed. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-5xl w-full">
                <Link to="/dashboard" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 font-bold cursor-pointer transition-colors w-max">
                    <ArrowLeft size={16} /> Dashboard
                </Link>

                {sub && (
                    <div className="bg-green-50 border-l-4 border-green-500 text-green-900 p-5 mb-8 flex items-center gap-4 shadow-sm">
                        <ShieldCheck className="text-green-600 drop-shadow-sm" size={28} />
                        <div>
                            <p className="font-extrabold text-base tracking-tight mb-0.5">Active Subscription</p>
                            <p className="text-sm font-medium opacity-90">Your {sub.plan_id.toUpperCase()} plan is active until {new Date(sub.current_period_end).toLocaleDateString()}.</p>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row border border-gray-100">
                    <div className="p-10 md:p-14 md:w-[55%] bg-indigo-950 text-white relative flex flex-col justify-center">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600 rounded-full blur-[80px] opacity-30 pointer-events-none"></div>
                        <div className="relative z-10">
                            <h2 className="text-4xl font-black tracking-tight mb-5">Lotto Standard Plan</h2>
                            <p className="text-indigo-200 mb-10 text-lg leading-relaxed font-medium">
                                Support charities and participate in the automated algorithmic lottery draws every week.
                            </p>
                            <ul className="space-y-5">
                                <li className="flex items-center gap-4 text-lg"><Check className="text-green-400 shrink-0" size={22} /> <span className="font-medium">Submit your custom 5 numbers for every draw</span></li>
                                <li className="flex items-center gap-4 text-lg"><Check className="text-green-400 shrink-0" size={22} /> <span className="font-medium">Direct a percentage of your fee to your chosen charity</span></li>
                                <li className="flex items-center gap-4 text-lg"><Check className="text-green-400 shrink-0" size={22} /> <span className="font-medium">Secure checkout via Razorpay integration</span></li>
                            </ul>
                        </div>
                    </div>

                    <div className="p-10 md:p-14 md:w-[45%] flex flex-col justify-center bg-white">
                        <div className="flex bg-gray-100 p-1.5 rounded-xl mb-10 border border-gray-200 shadow-inner">
                            <button onClick={() => setPlanType('monthly')} className={`flex-1 py-2.5 text-sm font-extrabold rounded-lg transition-all ${planType === 'monthly' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>Monthly</button>
                            <button onClick={() => setPlanType('yearly')} className={`flex-1 py-2.5 text-sm font-extrabold rounded-lg transition-all flex items-center justify-center gap-2 ${planType === 'yearly' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>Yearly <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest block">Save 20%</span></button>
                        </div>

                        <div className="flex items-baseline justify-center mb-8">
                            <span className="text-6xl font-black text-gray-900 tracking-tighter">₹{planType === 'monthly' ? '800' : '8,000'}</span>
                            <span className="text-gray-500 ml-2 font-bold text-lg leading-none">/{planType === 'monthly' ? 'mo' : 'yr'}</span>
                        </div>

                        <button onClick={handleSubscribe} disabled={loading || !!sub} className={`w-full flex items-center justify-center gap-3 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-lg rounded-xl shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed ${sub && 'opacity-30'}`}>
                            {sub ? <Check size={22} className="stroke-[3]" /> : <CreditCard size={22} className="stroke-[2.5]" />}
                            {sub ? 'Plan Active' : (loading ? 'Processing...' : 'Complete Purchase')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
