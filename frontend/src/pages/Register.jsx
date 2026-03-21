import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
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
            await register(email, password, charityId);
            navigate('/charities');
        } catch (err) {
            setError(err.message || 'Failed to register');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Create your account
                    </h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded relative" role="alert">
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Email address"
                            />
                        </div>
                        <div>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Password"
                            />
                        </div>
                    </div>

                    <div className="pt-2 animate-in fade-in duration-500">
                        <label className="block text-sm font-bold text-gray-700 mb-3 ml-1">Select a Primary Foundation to Support *</label>
                        {charities.length === 0 ? (
                            <div className="text-sm font-medium text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-200">Loading directory...</div>
                        ) : (
                            <div className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x custom-scrollbar">
                                {charities.map(c => (
                                    <div
                                        key={c.id}
                                        onClick={() => setCharityId(c.id)}
                                        className={`flex-shrink-0 w-48 rounded-xl border-2 cursor-pointer transition-all snap-start overflow-hidden select-none ${charityId === c.id ? 'border-indigo-600 shadow-md ring-4 ring-indigo-50 bg-white scale-[1.02]' : 'border-gray-200 bg-white hover:border-indigo-300 opacity-80 hover:opacity-100'}`}
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

                    <div>
                        <button
                            type="submit"
                            disabled={loading || !charityId}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-black rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                        >
                            {loading ? 'Creating account...' : 'Sign up'}
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
