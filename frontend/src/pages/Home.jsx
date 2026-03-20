import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Trophy, Heart, ArrowRight } from 'lucide-react';

export default function Home() {
    const [featuredCharity, setFeaturedCharity] = useState(null);

    useEffect(() => {
        api.get('/charities').then(res => {
            const featured = res.data.charities.find(c => c.is_featured);
            if (featured) setFeaturedCharity(featured);
        }).catch(err => console.error(err));
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
                <div className="flex items-center gap-2 text-indigo-700 font-extrabold text-2xl tracking-tighter">
                    <Trophy size={28} className="stroke-[2.5]" /> LottoInc
                </div>
                <div className="flex gap-4">
                    <Link to="/login" className="px-6 py-2.5 text-gray-700 font-bold hover:text-indigo-600 transition-colors">Log In</Link>
                    <Link to="/register" className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-md hover:bg-indigo-700 hover:shadow-lg transition-all">Get Started</Link>
                </div>
            </nav>

            <main className="flex-grow flex flex-col items-center justify-center text-center p-6 mt-16">
                <h1 className="text-6xl md:text-[5.5rem] font-black text-gray-900 tracking-tighter mb-6 leading-none">Play Fair.<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-pink-500">Give Back.</span></h1>
                <p className="text-xl md:text-2xl text-gray-500 font-medium max-w-2xl mb-12 leading-relaxed">Join the world's most transparent algorithmic lottery where a portion of your participation supports certified charitable organizations.</p>

                <Link to="/register" className="flex items-center gap-3 px-10 py-5 bg-gray-900 text-white font-black text-xl rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1">
                    Start Your Journey <ArrowRight size={24} className="stroke-[3]" />
                </Link>

                {featuredCharity && (
                    <div className="mt-40 max-w-5xl w-full text-left bg-white rounded-[2rem] p-8 md:p-12 shadow-xl border border-gray-100 flex flex-col md:flex-row gap-12 items-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-pink-100 rounded-full blur-3xl opacity-50 -z-10 translate-x-1/3 -translate-y-1/3"></div>
                        <div className="w-full md:w-1/2 relative">
                            <div className="absolute -top-4 -left-4 bg-yellow-400 text-yellow-900 text-sm font-black uppercase px-4 py-1.5 rounded-full shadow-lg tracking-widest flex items-center gap-2 z-10"><Heart size={16} className="fill-yellow-900" /> Spotlight Charity</div>
                            <img src={featuredCharity.image_url || 'https://placehold.co/800x400/4f46e5/ffffff?text=Spotlight+Charity&font=Montserrat'} alt="Featured Charity" className="w-full h-80 object-cover rounded-2xl shadow-md ring-1 ring-black/5 transition-transform hover:scale-105 duration-700" />
                        </div>
                        <div className="w-full md:w-1/2 relative z-10">
                            <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">{featuredCharity.name}</h2>
                            <p className="text-lg text-gray-600 mb-10 leading-relaxed font-medium">{featuredCharity.description}</p>
                            <Link to="/register" className="font-extrabold text-indigo-600 flex items-center gap-2 hover:text-indigo-800 transition-colors text-lg">Support them today &rarr;</Link>
                        </div>
                    </div>
                )}
            </main>

            <footer className="text-center py-12 text-gray-400 font-medium mt-24 border-t border-gray-200">
                &copy; 2026 Interview Lotto Inc. All rights reserved.
            </footer>
        </div>
    );
}
