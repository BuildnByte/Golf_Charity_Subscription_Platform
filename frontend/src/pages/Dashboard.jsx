import React, { useState, useEffect } from 'react';
import { api, useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Trophy, CalendarClock, History, CheckCircle, XCircle, Info } from 'lucide-react';
import ScoreForm from '../components/ScoreForm';

export default function Dashboard() {
    const { user, logout } = useAuth();
    const [sub, setSub] = useState(null);
    const [loading, setLoading] = useState(true);

    const [scores, setScores] = useState([]);

    const [charityProfile, setCharityProfile] = useState(null);
    const [charityList, setCharityList] = useState([]);
    const [isEditingCharity, setIsEditingCharity] = useState(false);
    const [tempCharityId, setTempCharityId] = useState('');

    const [drawsList, setDrawsList] = useState([]);

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
        const fetchSubAndProfile = async () => {
            try {
                const res = await api.get('/user/subscription');
                setSub(res.data.subscription);

                const profileRes = await api.get('/user/profile');
                if (profileRes.data.profile) {
                    setCharityProfile(profileRes.data.profile);
                    setTempCharityId(profileRes.data.profile.selected_charity_id || '');
                }

                const charitiesRes = await api.get('/charities');
                setCharityList(charitiesRes.data.charities);

                try {
                    const drawsRes = await api.get('/user/draws');
                    setDrawsList(drawsRes.data.draws);
                } catch (e) { console.error("Could not fetch schedules") }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchSubAndProfile();
        fetchScores();
    }, []);

    const saveCharityPreference = async () => {
        try {
            await api.put('/user/profile', { selected_charity_id: tempCharityId });
            setCharityProfile(prev => ({ ...prev, selected_charity_id: tempCharityId, charities: charityList.find(c => c.id === tempCharityId) }));
            setIsEditingCharity(false);
            alert('Your active Charity mapping has explicitly securely updated!');
        } catch (err) {
            alert('Failed to systematically mutate charity configuration.');
        }
    };

    const isSubActive = sub?.status === 'active';
    const subEndDate = sub?.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : 'N/A';

    const activeDraws = drawsList.filter(d => d.status === 'upcoming' || d.status === 'active');
    const upcomingDraw = activeDraws.length > 0 ? activeDraws[activeDraws.length - 1] : null;
    const pastDraws = drawsList.filter(d => d.status === 'published' || d.status === 'drawn');

    let eligibility = 'Ineligible';
    if (isSubActive) {
        if (scores.length >= 5) {
            eligibility = 'Eligible';
        } else {
            eligibility = 'Incomplete';
        }
    }

    return (
        <div className="min-h-screen bg-transparent py-12 px-4 sm:px-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Dashboard Overview</h1>
                    <p className="text-gray-500 mt-1 font-medium">Manage your entries and monitor your account.</p>
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

                {/* Secure Charity Management Controller */}
                {charityProfile && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
                        <div className="flex justify-between items-start flex-col gap-4 md:flex-row md:items-start">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900">My Supported Charity</h2>
                                <p className="text-gray-500 text-sm mt-1 mb-2">
                                    Configure exactly where your automated subscription split goes.
                                </p>
                                <div className="group relative inline-flex items-center gap-2 cursor-pointer text-blue-600 mb-2 mt-1">
                                    <Info size={16} />
                                    <span className="text-xs font-bold uppercase tracking-wider">How routing works</span>

                                    <div className="absolute left-0 top-full mt-2 w-72 bg-gray-900 text-white text-xs p-3 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 shadow-xl border border-gray-700 pointer-events-none">
                                        Your selected split percentage ({charityProfile.charity_percentage}%) is automatically deducted from your subscription payment and donated directly to your chosen charity. If you change your charity mid-cycle, the new selection will take effect only on your <strong>next subscription purchase</strong>.
                                        <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 border-l border-t border-gray-700 transform rotate-45"></div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-rose-50 border border-rose-100 text-rose-800 px-5 py-2.5 rounded-xl font-bold text-sm tracking-wide shrink-0">
                                Active Split: {charityProfile.charity_percentage}%
                            </div>
                        </div>

                        <div className={`mt-6 bg-gray-50 border border-gray-200 p-5 rounded-2xl flex flex-col gap-5 ${isEditingCharity ? 'w-full' : 'md:flex-row md:items-center justify-between'}`}>
                            <div className="flex items-center gap-4 flex-shrink-0">
                                <div className="w-14 h-14 bg-white shadow-sm border border-gray-100 rounded-xl flex justify-center items-center text-rose-500">
                                    <History size={26} className="stroke-[2.5]" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-gray-400 mb-0.5 uppercase tracking-wider">Currently Routing to</p>
                                    <p className="text-lg font-extrabold text-gray-900">
                                        {isEditingCharity
                                            ? charityList.find(c => c.id === tempCharityId)?.name || 'Select a charity below'
                                            : charityProfile.charities?.name || 'No Default Charity Selected'}
                                    </p>
                                </div>
                            </div>

                            {!isEditingCharity && (
                                <div>
                                    <button onClick={() => setIsEditingCharity(true)} className="px-5 py-2.5 text-sm font-bold bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm transition-all focus:outline-none">
                                        Change Charity
                                    </button>
                                </div>
                            )}

                            {isEditingCharity && (
                                <div className="w-full mt-2 pt-5 border-t border-gray-200 animate-in fade-in duration-300">
                                    <p className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wider flex justify-between items-center">
                                        <span>Select a Foundation to Support</span>
                                    </p>

                                    <div className="flex gap-4 overflow-x-auto pb-4 snap-x custom-scrollbar">
                                        {charityList.map(c => (
                                            <div
                                                key={c.id}
                                                onClick={() => setTempCharityId(c.id)}
                                                className={`flex-shrink-0 w-64 rounded-xl border-2 cursor-pointer transition-all snap-start overflow-hidden select-none ${tempCharityId === c.id ? 'border-indigo-600 shadow-md ring-4 ring-indigo-50 bg-white scale-[1.02]' : 'border-gray-200 bg-white hover:border-indigo-300'}`}
                                            >
                                                <div className="h-28 bg-gray-100 relative">
                                                    {c.is_featured && <span className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-[10px] font-black uppercase px-2 py-0.5 rounded shadow z-10">Spotlight</span>}
                                                    <img src={c.image_url || `https://placehold.co/400x200/4f46e5/ffffff?text=${encodeURIComponent(c.name)}&font=Montserrat`} alt={c.name} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="p-4">
                                                    <p className="font-extrabold text-gray-900 truncate">{c.name}</p>
                                                    <p className="text-xs text-gray-600 line-clamp-2 mt-1.5 leading-relaxed">{c.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex items-center gap-3 mt-4 justify-end">
                                        <button onClick={() => setIsEditingCharity(false)} className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors">Cancel</button>
                                        <button onClick={saveCharityPreference} disabled={!tempCharityId} className="px-6 py-2.5 text-sm font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm transition-all focus:outline-none disabled:opacity-50">Save Route</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Score Entry Form Integration */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
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

                {/* Draw Participation Engine Widgets */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div className="lg:col-span-1 bg-white p-7 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full">
                        <h3 className="font-black text-gray-900 mb-6 block text-xl">Upcoming Draw</h3>
                        {upcomingDraw ? (
                            <div className="flex-1 bg-indigo-50 border border-indigo-100 rounded-2xl p-6 text-center flex flex-col justify-center items-center relative overflow-hidden shadow-inner">
                                <p className="text-indigo-900 font-extrabold text-[42px] leading-tight mb-1">{new Date(upcomingDraw.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                                <p className="text-indigo-600 font-bold text-xs tracking-[0.2em] uppercase mb-6 opacity-80">Target Lock-in</p>

                                {eligibility === 'Eligible' && <span className="bg-green-500 text-white font-black text-xs px-4 py-2 rounded-lg shadow-md uppercase tracking-wide flex items-center gap-1"><CheckCircle size={14} /> Status: Eligible</span>}
                                {eligibility === 'Incomplete' && <span className="bg-amber-500 text-white font-black text-xs px-4 py-2 rounded-lg shadow-md uppercase tracking-wide">Status: Incomplete <br /><span className="text-[10px] opacity-90 mt-0.5 block">Enter {5 - scores.length} more scores!</span></span>}
                                {eligibility === 'Ineligible' && <span className="bg-red-500 text-white font-black text-xs px-4 py-2 rounded-lg shadow-md uppercase tracking-wide">Status: Ineligible <br /><span className="text-[10px] opacity-90 mt-0.5 block">Requires Active Sub</span></span>}
                            </div>
                        ) : (
                            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center flex flex-col justify-center items-center">
                                <History size={32} className="text-gray-300 mb-3" />
                                <p className="text-gray-500 font-bold">No draws scheduled currently.</p>
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-2 bg-white p-7 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="font-black text-gray-900 mb-6 block text-xl">Participation History</h3>
                        {pastDraws.length === 0 ? (
                            <div className="h-40 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-xl">
                                <p className="text-gray-400 font-bold">No past draws on record.</p>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-56 overflow-y-auto pr-2 custom-scrollbar">
                                {pastDraws.map(d => (
                                    <div key={d.id} className="flex justify-between items-center p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center font-black">
                                                <CalendarClock size={20} />
                                            </div>
                                            <div>
                                                <span className="font-extrabold text-gray-900 block">{new Date(d.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                                <span className="text-xs text-gray-500 font-medium tracking-wide">Official Sequence</span>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-black uppercase bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg tracking-widest">{d.status}</span>
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
