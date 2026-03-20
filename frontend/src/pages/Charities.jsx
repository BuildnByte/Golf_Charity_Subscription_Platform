import React, { useEffect, useState } from 'react';
import { api, useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, HeartHandshake, ArrowLeft } from 'lucide-react';

export default function Charities() {
    const [charities, setCharities] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const navigate = useNavigate();
    const [selecting, setSelecting] = useState(false);

    useEffect(() => {
        const fetchCharities = async () => {
            try {
                const res = await api.get('/charities');
                setCharities(res.data.charities);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchCharities();
    }, []);

    const handleSelect = async (charity_id) => {
        try {
            setSelecting(charity_id);
            const res = await api.post('/charities/select', { charity_id });
            localStorage.setItem('user', JSON.stringify(res.data.user));
            window.location.href = '/';
        } catch (err) {
            console.error(err);
            alert('Failed to select charity');
        } finally {
            setSelecting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors font-medium"
                >
                    <ArrowLeft size={16} /> Back to Dashboard
                </button>

                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 flex items-center gap-3">
                        <HeartHandshake className="text-pink-500" size={32} />
                        Choose a Charity
                    </h1>
                    <p className="mt-2 text-gray-500 text-lg">Every draw gives back. Select the charity you want to support with your participation.</p>
                </div>

                {loading ? (
                    <p className="text-gray-500 font-medium">Loading charities...</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {charities.map((c) => {
                            const isSelected = user?.selected_charity_id === c.id;
                            return (
                                <div
                                    key={c.id}
                                    className={`relative p-6 bg-white rounded-xl shadow-sm border-2 transition-all ${isSelected ? 'border-pink-500 ring-4 ring-pink-50' : 'border-gray-200 hover:border-pink-300'
                                        }`}
                                >
                                    {isSelected && (
                                        <div className="absolute top-4 right-4 text-pink-500">
                                            <CheckCircle size={28} className="fill-pink-50" />
                                        </div>
                                    )}
                                    <h3 className="text-xl font-bold text-gray-900 mb-2 pr-8">{c.name}</h3>
                                    <p className="text-gray-600 text-sm mb-6 leading-relaxed">{c.description}</p>

                                    <button
                                        onClick={() => handleSelect(c.id)}
                                        disabled={isSelected || selecting === c.id}
                                        className={`w-full py-3 rounded-lg text-sm font-bold tracking-wide uppercase transition-colors ${isSelected
                                                ? 'bg-pink-50 text-pink-700 cursor-default border border-pink-100'
                                                : 'bg-gray-900 text-white hover:bg-gray-800'
                                            }`}
                                    >
                                        {selecting === c.id ? 'Selecting...' : isSelected ? 'Currently Selected' : 'Support This'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
