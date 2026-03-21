import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [charityId, setCharityId] = useState('');
    const [charities, setCharities] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        api.get('/charities').then(res => setCharities(res.data.charities)).catch(err => console.error(err));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setError('');
            setLoading(true);
            await register(fullName, email, password, charityId);
            navigate('/charities');
        } catch (err) {
            setError(err.message || 'Failed to register');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
            <div className="max-w-xl w-full space-y-8 bg-white/95 backdrop-blur-sm p-10 rounded-3xl shadow-2xl border border-gray-100">
                <div className="text-center">
                    <h2 className="mt-2 text-4xl font-extrabold text-gray-900 tracking-tight">
                        Create an Account
                    </h2>
                    <p className="text-gray-500 mt-2 font-medium">Join the platform to test your luck and perform structural good</p>
                </div>

                <form className="mt-8 space-y-7" onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl shadow-sm text-sm font-medium animate-in fade-in" role="alert">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Full Name</label>
                            <input
                                type="text"
                                required
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="block w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors font-medium"
                                placeholder="Your Name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Email Address</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors font-medium"
                                placeholder="you@example.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors font-medium"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 animate-in fade-in duration-500">
                        <label className="block text-sm font-black text-gray-900 mb-4 ml-1 flex items-center gap-2">
                            Select Default Foundation
                            <span className="text-red-500">*</span>
                        </label>

                        {charities.length === 0 ? (
                            <div className="text-sm font-medium text-gray-500 bg-gray-50 p-4 rounded-xl border border-gray-200">Loading directory...</div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 gap-4 pb-2">
                                {charities.map(c => (
                                    <div
                                        key={c.id}
                                        onClick={() => setCharityId(c.id)}
                                        className={`flex-shrink-0 rounded-2xl border-2 cursor-pointer transition-all overflow-hidden select-none relative
                                            ${charityId === c.id ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-500/20 shadow-md scale-[1.02]' : 'border-gray-100 bg-white hover:border-indigo-200 hover:bg-gray-50'}
                                        `}
                                    >
                                        <div className="h-24 bg-gray-100 relative">
                                            {c.is_featured && <span className="absolute top-1.5 left-1.5 bg-yellow-400 text-yellow-900 text-[9px] font-black uppercase px-1.5 py-0.5 rounded shadow z-10">Spotlight</span>}
                                            <img src={c.image_url || `https://placehold.co/400x200/4f46e5/ffffff?text=${encodeURIComponent(c.name)}&font=Montserrat`} alt={c.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="p-3">
                                            <p className="font-extrabold text-gray-900 truncate text-sm">{c.name}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {!charityId && <p className="text-xs text-red-500 mt-1 ml-1 font-medium">Please explicitly select a charity to continue.</p>}
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading || !charityId}
                            className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-black rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all active:scale-[0.98]"
                        >
                            {loading ? 'Creating secure profile...' : 'Complete Signup'}
                        </button>
                    </div>

                    <div className="text-center text-sm">
                        <span className="text-gray-600">Already have an account? </span>
                        <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                            Sign in
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
