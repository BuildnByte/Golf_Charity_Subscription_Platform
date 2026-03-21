import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Heart, ArrowRight, ShieldCheck, TrendingUp, Users } from 'lucide-react';

export default function Home() {
    const [featuredCharity, setFeaturedCharity] = useState(null);

    useEffect(() => {
        api.get('/charities').then(res => {
            const featured = res.data.charities.find(c => c.is_featured);
            if (featured) setFeaturedCharity(featured);
        }).catch(err => console.error(err));
    }, []);

    return (
        <div className="flex flex-col flex-grow">
            {/* Hero Section */}
            <main className="relative flex flex-col items-center justify-center text-center px-4 py-24 sm:py-32 overflow-hidden bg-white">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 right-1/4 w-[40rem] h-[40rem] bg-indigo-50 rounded-full blur-3xl opacity-70 translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute bottom-0 left-1/4 w-[30rem] h-[30rem] bg-pink-50 rounded-full blur-3xl opacity-70 -translate-x-1/2 translate-y-1/2"></div>
                </div>

                <div className="relative z-10 max-w-5xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold mb-8 shadow-sm">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
                        </span>
                        The next generation of mathematical lotteries
                    </div>

                    <h1 className="text-5xl sm:text-7xl font-black text-gray-900 tracking-tighter mb-8 leading-[1.1]">
                        Play Fair. <br className="hidden sm:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-pink-500 drop-shadow-sm">Give Back Automatically.</span>
                    </h1>

                    <p className="text-xl sm:text-2xl text-gray-500 font-medium max-w-3xl mx-auto mb-12 leading-relaxed">
                        Join the world's most transparent algorithmic lottery where a direct percentage of your participation fee guarantees funding for certified charitable organizations.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to="/register" className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-5 bg-gray-900 text-white font-black text-lg sm:text-xl rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 hover:bg-black">
                            Start Your Journey <ArrowRight size={22} className="stroke-[3]" />
                        </Link>
                        <Link to="/charities" className="w-full sm:w-auto px-10 py-5 text-gray-700 font-black text-lg sm:text-xl bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors">
                            Explore Charities
                        </Link>
                    </div>
                </div>
            </main>

            {/* Feature Grid */}
            <section className="bg-gray-50 py-24 px-4 border-y border-gray-200">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6"><ShieldCheck size={32} /></div>
                        <h3 className="text-xl font-black text-gray-900 mb-3">Provably Transparent</h3>
                        <p className="text-gray-500 font-medium">All simulation logic and draw statistics are securely audited and mathematically fair upon execution.</p>
                    </div>
                    <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-pink-100 text-pink-600 rounded-2xl flex items-center justify-center mb-6"><Heart size={32} /></div>
                        <h3 className="text-xl font-black text-gray-900 mb-3">Social Impact Built-In</h3>
                        <p className="text-gray-500 font-medium">As a subscriber, you manually declare what percentage of your monthly fee systematically routes to charity.</p>
                    </div>
                    <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-6"><TrendingUp size={32} /></div>
                        <h3 className="text-xl font-black text-gray-900 mb-3">Instant Payout Validation</h3>
                        <p className="text-gray-500 font-medium">When you match target numbers, simply upload your ID securely to unlock your automated Jackpot scaling revenue.</p>
                    </div>
                </div>
            </section>

            {/* Charity Spotlight */}
            {featuredCharity && (
                <section className="py-24 px-4 bg-white relative overflow-hidden">
                    <div className="max-w-5xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Charity Spotlight</h2>
                            <p className="text-gray-500 font-medium mt-2">See exactly who our community is empowering this month.</p>
                        </div>

                        <div className="bg-gray-900 rounded-[2rem] p-8 md:p-12 shadow-2xl flex flex-col md:flex-row gap-12 items-center relative overflow-hidden">
                            <div className="w-full md:w-1/2 relative z-10">
                                <span className="inline-flex items-center gap-2 bg-yellow-400 text-yellow-900 text-xs font-black uppercase px-4 py-1.5 rounded-full shadow-lg tracking-widest mb-6"><Heart size={14} className="fill-yellow-900" /> Featured Foundation</span>
                                <h2 className="text-4xl font-black text-white mb-4 tracking-tight leading-tight">{featuredCharity.name}</h2>
                                <p className="text-lg text-gray-400 mb-10 leading-relaxed font-medium">{featuredCharity.description}</p>
                                <Link to="/register" className="font-extrabold text-white bg-indigo-600 hover:bg-indigo-500 px-6 py-3 rounded-xl transition-colors text-lg inline-flex items-center gap-2">Support them today <ArrowRight size={20} /></Link>
                            </div>
                            <div className="w-full md:w-1/2 relative z-10">
                                <img src={featuredCharity.image_url || 'https://placehold.co/800x400/4f46e5/ffffff?text=Spotlight+Charity&font=Montserrat'} alt="Featured Charity" className="w-full h-80 object-cover rounded-2xl shadow-xl ring-1 ring-white/10" />
                            </div>
                        </div>
                    </div>
                </section>
            )}

            <footer className="text-center py-12 text-gray-400 font-medium border-t border-gray-100 bg-white">
                &copy; 2026 Interview Lotto Inc. All platform integrations digitally secured.
            </footer>
        </div>
    );
}
