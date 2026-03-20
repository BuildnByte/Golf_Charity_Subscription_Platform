import React, { useState, useEffect } from 'react';
import { api, useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Trophy, CalendarClock, History, CheckCircle, XCircle } from 'lucide-react';
import ScoreForm from '../components/ScoreForm';

export default function Dashboard() {
    const { user, logout } = useAuth();
    const [sub, setSub] = useState(null);
    const [loading, setLoading] = useState(true);

    const [scores, setScores] = useState([]);

    const fetchScores = async () => {
        if (!user) return;
        try {
            const res = await api.get(`/scores/${user.id}`);
            setScores(res.data.scores);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        const fetchSub = async () => {
            try {
                const res = await api.get('/user/subscription');
                setSub(res.data.subscription);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchSub();
        fetchScores();
    }, []);

    const isSubActive = sub?.status === 'active';
    const subEndDate = sub?.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : 'N/A';

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Welcome, {user?.email?.split('@')[0]}</h1>
                        <p className="text-gray-500 mt-1 font-medium">Manage your entries and monitor your account.</p>
                    </div>
                    <button onClick={logout} className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-50 transition-colors shadow-sm">
                        Sign out
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-7 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-all">
                        <div>
                            <div className="flex items-center gap-3 mb-3 text-indigo-600">
                                <CalendarClock size={22} className="stroke-[2.5]" />
                                <h2 className="font-extrabold text-lg tracking-tight">Subscription Status</h2>
                            </div>
                            <p className="text-gray-600 text-sm mb-5 leading-relaxed">
                                {isSubActive
                                    ? "You have full access to participate in all upcoming weekly draws."
                                    : "You are currently inactive. Purchase an access plan to play."}
                            </p>
                            <div className="flex items-center gap-2 text-sm font-bold bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                                {loading ? (
                                    <span className="text-gray-500 animate-pulse">Loading status...</span>
                                ) : isSubActive ? (
                                    <>
                                        <CheckCircle size={18} className="text-green-500" />
                                        <span className="text-green-700">Active until {subEndDate}</span>
                                    </>
                                ) : (
                                    <>
                                        <XCircle size={18} className="text-red-500" />
                                        <span className="text-red-600">Inactive or Pending</span>
                                    </>
                                )}
                            </div>
                        </div>
                        {isSubActive ? (
                            <Link to="/pricing" className="mt-6 text-sm text-indigo-600 font-bold hover:text-indigo-800 transition-colors flex items-center gap-1">Manage Plan &rarr;</Link>
                        ) : (
                            <Link to="/pricing" className="mt-6 text-sm text-indigo-600 font-bold hover:text-indigo-800 transition-colors flex items-center gap-1">Purchase Active Plan &rarr;</Link>
                        )}
                    </div>

                    <div className="bg-white p-7 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-all">
                        <div>
                            <div className="flex items-center gap-3 mb-3 text-green-600">
                                <Trophy size={22} className="stroke-[2.5]" />
                                <h2 className="font-extrabold text-lg tracking-tight">My Winnings</h2>
                            </div>
                            <p className="text-gray-600 text-sm mb-4 leading-relaxed">View your past winnings and track your prize claim status securely.</p>
                        </div>
                        <Link to="/my-winnings" className="mt-6 text-sm text-indigo-600 font-bold hover:text-indigo-800 transition-colors">Access Winnings Vault &rarr;</Link>
                    </div>

                    <div className="bg-white p-7 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-all">
                        <div>
                            <div className="flex items-center gap-3 mb-3 text-rose-500">
                                <History size={22} className="stroke-[2.5]" />
                                <h2 className="font-extrabold text-lg tracking-tight">Charity Directory</h2>
                            </div>
                            <p className="text-gray-600 text-sm mb-4 leading-relaxed">Review comprehensive profiles, verify your donations, and support new causes.</p>
                        </div>
                        <Link to="/charities" className="mt-6 text-sm text-indigo-600 font-bold hover:text-indigo-800 transition-colors">Select Featured Charity &rarr;</Link>
                    </div>
                </div>

                {/* Score Entry Form Integration */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    {!isSubActive && (
                        <div className="mb-6 bg-red-50 border-1 border-red-200 p-4 rounded-xl text-red-700 flex flex-col justify-center items-center text-center">
                            <p className="font-bold mb-1">Subscription Required</p>
                            <p className="text-sm">You must purchase a plan before you can submit your numbers for the draw.</p>
                        </div>
                    )}
                    <h2 className="text-2xl font-black text-gray-900 mb-6">Your Draw Numbers</h2>
                    <div className={!isSubActive ? "opacity-50 pointer-events-none grayscale" : ""}>
                        <ScoreForm onScoreAdded={fetchScores} />
                    </div>

                    <div className="mt-8">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Entries</h3>
                        {loading ? (
                            <p className="text-sm text-gray-500">Loading scores...</p>
                        ) : scores.length === 0 ? (
                            <p className="text-sm text-gray-500">No scores added yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {scores.map((s) => (
                                    <div key={s.id} className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg border border-gray-200">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-sm">
                                                {s.score}
                                            </div>
                                            <span className="text-gray-700 font-medium">{new Date(s.date).toLocaleDateString()}</span>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${s.is_winner ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                                            {s.is_winner ? 'Winner' : 'Not a winner'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
