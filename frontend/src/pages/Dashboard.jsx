import React, { useEffect, useState } from 'react';
import { useAuth, api } from '../context/AuthContext';
import ScoreForm from '../components/ScoreForm';
import { Link } from 'react-router-dom';
import { Heart, Activity, Award, Calendar } from 'lucide-react';

export default function Dashboard() {
    const { user, logout } = useAuth();
    const [scores, setScores] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchScores = async () => {
        try {
            const res = await api.get(`/scores/${user.id}`);
            setScores(res.data.scores);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.id) fetchScores();
    }, [user]);

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <nav className="bg-white shadow-sm border-b border-gray-100 px-8 py-4 flex justify-between items-center">
                <h1 className="text-xl font-bold tracking-tight text-gray-900">Interview Project</h1>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">{user?.email}</span>
                    <button onClick={logout} className="text-sm font-medium text-red-600 hover:text-red-800">Sign out</button>
                </div>
            </nav>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Award className="text-indigo-500" size={24} />
                                <h3 className="text-lg font-semibold text-gray-900">Subscription</h3>
                            </div>
                            <p className="text-sm text-gray-500 mb-4">You are currently on a mocked basic plan.</p>
                            <div className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-bold uppercase rounded-full tracking-wide">
                                Active
                            </div>
                        </div>
                        <Link to="/pricing" className="mt-4 text-sm text-indigo-600 font-medium hover:underline">Purchase Active Plan</Link>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Heart className="text-pink-500" size={24} />
                                <h3 className="text-lg font-semibold text-gray-900">My Charity</h3>
                            </div>
                            {user?.selected_charity_id ? (
                                <p className="text-sm text-gray-700 font-medium leading-relaxed">
                                    You have selected a charity. <br />
                                    <span className="text-xs text-gray-400 font-normal break-all">ID: {user?.selected_charity_id}</span>
                                </p>
                            ) : (
                                <p className="text-sm text-gray-500 mb-4">You haven't selected a charity to support yet.</p>
                            )}
                        </div>
                        <Link to="/charities" className="mt-4 text-sm text-indigo-600 font-medium hover:underline">
                            {user?.selected_charity_id ? 'Change Charity' : 'Select Charity'}
                        </Link>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Activity className="text-orange-500" size={24} />
                                <h3 className="text-lg font-semibold text-gray-900">Draws</h3>
                            </div>
                            <p className="text-sm text-gray-500 mb-4">You have participated in 0 draws this month.</p>
                        </div>
                        <Link to="/my-winnings" className="mt-4 text-sm text-indigo-600 font-medium hover:underline">My Winnings & History</Link>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-xl font-bold text-gray-900 mb-1">My Numbers</h2>
                        <p className="text-sm text-gray-500 mb-6">Enter up to 5 numbers (1-45). Oldest gets replaced when entering a 6th.</p>
                        <ScoreForm onScoreAdded={fetchScores} />
                    </div>

                    <div className="p-6 bg-gray-50/50">
                        {loading ? (
                            <p className="text-sm text-gray-500">Loading scores...</p>
                        ) : scores.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-sm text-gray-500">No scores added yet.</p>
                            </div>
                        ) : (
                            <ul className="space-y-3">
                                {scores.map((s) => (
                                    <li key={s.id} className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                                        <span className="flex items-center justify-center w-10 h-10 bg-indigo-100 text-indigo-700 font-bold text-lg rounded-full">
                                            {s.score}
                                        </span>
                                        <div className="flex items-center text-sm text-gray-500 gap-1 font-medium bg-gray-50 px-3 py-1 rounded-md">
                                            <Calendar size={14} />
                                            {s.date}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
