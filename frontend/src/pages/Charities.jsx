import React, { useState, useEffect } from 'react';
import { api, useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, CheckCircle, ArrowLeft, Search, CalendarDays, SlidersHorizontal, CreditCard, X } from 'lucide-react';

export default function Charities() {
    const [charities, setCharities] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedId, setSelectedId] = useState(null);
    const [percentage, setPercentage] = useState(10);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saveLoading, setSaveLoading] = useState(false);

    // Donation Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [donationAmount, setDonationAmount] = useState('500');
    const [donationCharity, setDonationCharity] = useState(null);
    const [donationLoading, setDonationLoading] = useState(false);

    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [charityRes, profileRes] = await Promise.all([
                    api.get('/charities'),
                    api.get('/user/profile')
                ]);
                console.log(charityRes.data.charities);
                setCharities(charityRes.data.charities);

                const profile = profileRes.data.profile;
                setUserProfile(profile);
                if (profile.selected_charity_id) setSelectedId(profile.selected_charity_id);
                if (profile.charity_percentage) setPercentage(profile.charity_percentage);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    const filteredCharities = charities.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleSavePrimary = async () => {
        if (!selectedId) return;
        setSaveLoading(true);
        try {
            await api.post('/charities/select', {
                charity_id: selectedId,
                charity_percentage: percentage
            });
            alert('Settings saved successfully!');
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            alert('Failed to save settings.');
        } finally {
            setSaveLoading(false);
        }
    };

    const openDonationModal = (charity) => {
        setDonationCharity(charity);
        setDonationAmount('500');
        setIsModalOpen(true);
    };

    const handleIndependentDonation = async (e) => {
        e.preventDefault();
        const amount = parseInt(donationAmount);
        if (isNaN(amount) || amount < 100) return alert('Minimum donation is ₹100.');

        setDonationLoading(true);
        try {
            const { data: orderData } = await api.post('/payment/create-order', { type: 'donation', amount, charity_id: donationCharity.id });

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: orderData.amount,
                currency: orderData.currency,
                name: donationCharity.name,
                description: `Independent Donation`,
                order_id: orderData.order_id,
                handler: async function (response) {
                    try {
                        await api.post('/payment/verify', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        });
                        alert('Your donation was successful. Thank you!');
                        setIsModalOpen(false);
                    } catch (verifyErr) {
                        alert('Payment verification failed.');
                    }
                },
                theme: { color: "#ec4899" }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function () { alert("Payment failed."); });
            rzp.open();
        } catch (err) {
            console.error(err);
            alert("Failed to initiate checkout.");
        } finally {
            setDonationLoading(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-gray-50 flex justify-center items-center"><div className="animate-pulse text-indigo-500 font-bold">Loading charities...</div></div>;

    return (
        <div className="min-h-screen bg-transparent py-12 px-4 sm:px-6 relative">
            <div className={`max-w-7xl mx-auto transition-all ${isModalOpen ? 'blur-sm pointer-events-none scale-[0.99] opacity-70 border-none select-none' : ''}`}>
                <div className="mb-10 text-center">
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight font-sans">Charity Directory</h1>
                    <p className="mt-3 text-gray-600 font-medium">Select an organization to receive a percentage of your subscription fee.</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8 flex flex-col items-center justify-between">
                    <div className="relative w-full">
                        <Search className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search charities..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-50 pl-12 pr-4 py-3.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition-all text-gray-800"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    {filteredCharities.map((charity) => {
                        const isFeatured = charity.is_featured;

                        return (
                            <div
                                key={charity.id}
                                onClick={() => setSelectedId(charity.id)}
                                className={`group flex flex-col bg-white rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 ${selectedId === charity.id ? 'ring-4 ring-indigo-500 shadow-xl scale-[1.02]' : 'border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-200'}`}
                            >
                                <div className="h-48 overflow-hidden relative bg-gray-100">
                                    {isFeatured && <div className="absolute top-4 left-4 bg-yellow-400 text-yellow-900 text-xs font-black uppercase px-3 py-1 rounded-full z-10 shadow tracking-widest">Spotlight</div>}
                                    <img src={charity.image_url || `https://placehold.co/800x400/4f46e5/ffffff?text=${encodeURIComponent(charity.name)}&font=Montserrat`} alt={charity.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                    {selectedId === charity.id && (
                                        <div className="absolute inset-0 bg-indigo-900/40 flex items-center justify-center">
                                            <CheckCircle className="text-white drop-shadow-md" size={64} />
                                        </div>
                                    )}
                                </div>

                                <div className="p-6 flex-grow flex flex-col">
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="text-xl font-black text-gray-900">{charity.name}</h3>
                                        <Heart size={20} className={selectedId === charity.id ? 'text-rose-500 fill-rose-500' : 'text-gray-300'} />
                                    </div>
                                    <p className="text-sm text-gray-600 mb-4 leading-relaxed flex-grow">{charity.description}</p>

                                    <div className="mb-6 bg-green-50/50 border border-green-100 px-4 py-2.5 rounded-xl flex justify-between items-center">
                                        <p className="text-xs font-bold text-green-800 uppercase tracking-widest">Total Capital Raised</p>
                                        <p className="text-sm font-black text-green-600">₹{Number(charity.amount_raised || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                                    </div>

                                    {charity.upcoming_events?.length > 0 && (
                                        <div className="mb-6 pt-5 border-t border-gray-100">
                                            <h4 className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-3"><CalendarDays size={14} /> Upcoming Events</h4>
                                            <ul className="space-y-2">
                                                {charity.upcoming_events.map((e, idx) => (
                                                    <li key={idx} className="flex justify-between items-center text-sm font-medium">
                                                        <span className="text-gray-900">{e.title}</span>
                                                        <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-xs">{e.date}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    <button
                                        onClick={(e) => { e.stopPropagation(); openDonationModal(charity); }}
                                        className="mt-auto w-full flex items-center justify-center gap-2 py-3 border-2 border-pink-500 text-pink-600 rounded-xl font-bold hover:bg-pink-50 transition-colors focus:ring-4 focus:ring-pink-100"
                                    >
                                        <CreditCard size={18} /> Direct Donate
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>

                <div className="sticky bottom-6 flex justify-center z-50 pointer-events-none">
                    <button
                        onClick={handleSavePrimary}
                        disabled={!selectedId || saveLoading}
                        className="pointer-events-auto flex items-center gap-3 px-10 py-4 bg-gray-900 hover:bg-black disabled:bg-gray-400 text-white font-black text-lg rounded-2xl shadow-2xl hover:-translate-y-1 transition-all"
                    >
                        {saveLoading ? 'Saving...' : 'Confirm Selection'}
                    </button>
                </div>
            </div>

            {/* Donation Modal Overlay */}
            {isModalOpen && donationCharity && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative z-10 animate-in zoom-in-95 duration-200">
                        <div className="bg-gradient-to-r from-pink-500 to-indigo-600 p-6 text-white flex justify-between items-start">
                            <div>
                                <h3 className="text-2xl font-black mb-1 tracking-tight">Direct Support</h3>
                                <p className="text-pink-100 font-medium text-sm">Donating to {donationCharity.name}</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white transition-colors bg-white/20 p-1.5 rounded-full">
                                <X size={20} className="stroke-[3]" />
                            </button>
                        </div>
                        <form onSubmit={handleIndependentDonation} className="p-6">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Donation Amount (INR)</label>
                            <div className="relative mb-6">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg font-black">₹</span>
                                <input
                                    type="number"
                                    min="100"
                                    required
                                    value={donationAmount}
                                    onChange={(e) => setDonationAmount(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-black text-gray-900 text-xl focus:ring-2 focus:ring-pink-500 focus:outline-none placeholder-gray-300"
                                    placeholder="500"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
                                <button type="submit" disabled={donationLoading} className="flex-[2] flex items-center justify-center gap-2 px-4 py-3.5 bg-pink-600 text-white font-black rounded-xl hover:bg-pink-700 disabled:opacity-50 transition-colors shadow-md text-lg">
                                    <Heart size={18} className="fill-white" /> {donationLoading ? 'Securing...' : `Proceed`}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
