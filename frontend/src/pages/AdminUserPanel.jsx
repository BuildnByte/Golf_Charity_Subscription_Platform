import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { ShieldAlert, Search, Edit3, ArrowLeft, AlertTriangle, User, Calendar, Trophy, BadgeCheck, X, HardDriveDownload } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminUserPanel() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // all, active, inactive

    // Detailed View State
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [profileData, setProfileData] = useState(null);
    const [profileLoading, setProfileLoading] = useState(false);

    // Editing State Vectors
    const [editAccount, setEditAccount] = useState({ full_name: '', email: '' });
    const [editSub, setEditSub] = useState({ plan_id: '', status: '' });

    // Inline Score Editor State
    const [editingScoreId, setEditingScoreId] = useState(null);
    const [editScoreData, setEditScoreData] = useState({ num: '', date: '' });

    useEffect(() => {
        fetchDirectory();
    }, []);

    const fetchDirectory = async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/users/detailed');
            setUsers(res.data.users || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchProfile = async (id) => {
        try {
            setProfileLoading(true);
            setSelectedUserId(id);
            const res = await api.get(`/admin/users/${id}/profile`);
            setProfileData(res.data);

            // Rehydrate editor forms
            setEditAccount({ full_name: res.data.user.full_name || '', email: res.data.user.email || '' });
            if (res.data.subscription) {
                setEditSub({ plan_id: res.data.subscription.plan_id || 'monthly', status: res.data.subscription.status || 'active' });
            } else {
                setEditSub({ plan_id: 'none', status: 'inactive' });
            }
        } catch (err) {
            console.error(err);
            alert("Failed to load root profile.");
            setSelectedUserId(null);
        } finally {
            setProfileLoading(false);
        }
    };

    const handleUpdateAccount = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/admin/users/${selectedUserId}/account`, editAccount);
            alert("Account explicitly updated.");
            fetchDirectory(); // Update list background
            fetchProfile(selectedUserId); // Refresh deep state
        } catch (err) {
            alert("Failed to execute account mutation.");
        }
    };

    const handleUpdateSubscription = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/admin/users/${selectedUserId}/subscription`, editSub);
            alert("Subscription overridden.");
            fetchDirectory();
            fetchProfile(selectedUserId);
        } catch (err) {
            alert("Failed to execute sub mutation.");
        }
    };

    const handleUpdateScore = async (e) => {
        e.preventDefault();
        if (!editingScoreId) return;
        try {
            await api.put(`/admin/users/${selectedUserId}/scores`, {
                score_id: editingScoreId,
                new_score: parseInt(editScoreData.num),
                new_date: editScoreData.date
            });
            alert("Score successfully audited and overridden.");
            setEditingScoreId(null);
            fetchProfile(selectedUserId); // refresh scores visually
        } catch (err) {
            alert("Failed to forcefully map Score changes.");
        }
    };

    // Calculate Directory Stats logically
    const standardUsers = users.filter(u => u.role !== 'admin');

    const filteredUsers = standardUsers.filter(u => {
        const matchesQuery = (u.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (u.email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            String(u.id).includes(searchQuery);

        let matchesStatus = true;
        const sub = Array.isArray(u.subscriptions) ? u.subscriptions[0] : u.subscriptions;
        const subStatus = sub?.status || 'inactive';

        if (statusFilter === 'active') matchesStatus = subStatus === 'active';
        if (statusFilter === 'inactive') matchesStatus = subStatus !== 'active';

        return matchesQuery && matchesStatus;
    });

    const activeCount = standardUsers.filter(u => {
        const sub = Array.isArray(u.subscriptions) ? u.subscriptions[0] : u.subscriptions;
        return sub?.status === 'active';
    }).length;
    const monthlyCount = standardUsers.filter(u => {
        const sub = Array.isArray(u.subscriptions) ? u.subscriptions[0] : u.subscriptions;
        return sub?.status === 'active' && sub?.plan_id === 'monthly';
    }).length;
    const yearlyCount = standardUsers.filter(u => {
        const sub = Array.isArray(u.subscriptions) ? u.subscriptions[0] : u.subscriptions;
        return sub?.status === 'active' && sub?.plan_id === 'yearly';
    }).length;

    if (selectedUserId) {
        return (
            <div className="min-h-screen bg-transparent pb-12">
                <div className="max-w-6xl mx-auto px-4 mt-8">
                    <button onClick={() => setSelectedUserId(null)} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors font-medium">
                        <ArrowLeft size={16} /> Directory Matrix
                    </button>

                    {profileLoading ? (
                        <div className="flex p-10 justify-center animate-pulse font-bold text-indigo-500">Decrypting user ledger...</div>
                    ) : profileData ? (
                        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200 block">

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Account Matrix */}
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-xl font-black text-gray-900 mb-5 flex items-center gap-2"><User size={22} className="text-indigo-600" /> Identity Matrix</h3>
                                        <form onSubmit={handleUpdateAccount} className="space-y-4">
                                            <div>
                                                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-1 block">Full Name</label>
                                                <input required type="text" value={editAccount.full_name} onChange={e => setEditAccount({ ...editAccount, full_name: e.target.value })} className="w-full bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-xl font-medium text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-1 block">Email Contact</label>
                                                <input required type="email" value={editAccount.email} onChange={e => setEditAccount({ ...editAccount, email: e.target.value })} className="w-full bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-xl font-medium text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                            </div>
                                            <div className="pt-2">
                                                <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-2.5 rounded-xl hover:bg-indigo-700 shadow-sm">Execute Overwrite</button>
                                            </div>
                                        </form>
                                    </div>

                                    <div className="mt-6 pt-5 border-t border-gray-100 bg-gray-50 p-4 rounded-xl">
                                        <p className="text-sm font-bold text-gray-700 mb-2">Charity Trajectory</p>
                                        <p className="font-extrabold text-indigo-900 text-lg">{profileData.user?.charities?.name || 'Unassigned'}</p>
                                        <p className="text-xs font-medium text-gray-600 uppercase tracking-widest mt-1">Split Velocity: {profileData.user?.charity_percentage}%</p>
                                    </div>
                                </div>

                                {/* Subscription Overrides */}
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                                    <h3 className="text-xl font-black text-gray-900 mb-5 flex items-center gap-2"><BadgeCheck size={22} className="text-green-600" /> Service Privileges</h3>

                                    <form onSubmit={handleUpdateSubscription} className="space-y-4 block">
                                        <div>
                                            <label className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-1 block">Plan Topology</label>
                                            <select value={editSub.plan_id} onChange={e => setEditSub({ ...editSub, plan_id: e.target.value })} className="w-full bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-xl font-medium text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                                                <option value="none">Ghost (None)</option>
                                                <option value="monthly">Monthly Active</option>
                                                <option value="yearly">Yearly Active</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-1 block">Operational Status</label>
                                            <select value={editSub.status} onChange={e => setEditSub({ ...editSub, status: e.target.value })} className="w-full bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-xl font-medium text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                                                <option value="active">Secure Active</option>
                                                <option value="inactive">Inactive / Frozen</option>
                                                <option value="cancelled">Terminated</option>
                                            </select>
                                        </div>

                                        {profileData.subscription?.current_period_end && (
                                            <div className="bg-amber-50 text-amber-900 p-3 rounded-xl border border-amber-200 text-sm font-bold flex gap-2 mt-4">
                                                <Calendar size={18} className="shrink-0" />
                                                Next Billing Date strictly mapped to: {new Date(profileData.subscription.current_period_end).toLocaleDateString()}
                                            </div>
                                        )}

                                        <div className="pt-4">
                                            <button type="submit" className="w-full bg-gray-900 text-white font-bold py-2.5 rounded-xl hover:bg-black shadow-lg shadow-gray-300">Force Privilege State</button>
                                        </div>
                                    </form>
                                </div>
                            </div>

                            {/* Analytics & Auditing Matrices */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Score Moderation */}
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 overscroll-contain">
                                    <h3 className="text-xl font-black text-gray-900 mb-2 flex items-center gap-2"><Edit3 size={22} className="text-blue-600" /> Score Topology Editor</h3>
                                    <p className="text-xs text-gray-500 font-medium mb-5">Admin edits directly mutate algorithmic pools. Changes are explicitly audited.</p>

                                    {profileData.scores?.length > 0 ? (
                                        <div className="space-y-3 block">
                                            {profileData.scores.map(s => (
                                                <div key={s.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4 transition-all">
                                                    {editingScoreId === s.id ? (
                                                        <form onSubmit={handleUpdateScore} className="flex flex-col gap-3 animate-in fade-in">
                                                            <div className="flex gap-3">
                                                                <input type="number" required min="1" max="45" value={editScoreData.num} onChange={e => setEditScoreData({ ...editScoreData, num: e.target.value })} className="w-20 bg-white border border-gray-300 px-3 py-2 rounded-lg font-black text-lg focus:ring-indigo-500 focus:outline-none" />
                                                                <input type="date" required value={editScoreData.date} onChange={e => setEditScoreData({ ...editScoreData, date: e.target.value })} className="flex-1 bg-white border border-gray-300 px-3 py-2 rounded-lg font-medium text-gray-900 focus:ring-indigo-500 focus:outline-none" />
                                                            </div>
                                                            <div className="flex justify-end gap-2">
                                                                <button type="button" onClick={() => setEditingScoreId(null)} className="px-3 py-1.5 text-xs font-bold text-gray-600 bg-gray-200 rounded hover:bg-gray-300 transition-colors">Abort</button>
                                                                <button type="submit" className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 rounded hover:bg-blue-700 shadow-sm transition-colors">Commit Corrupt Edit</button>
                                                            </div>
                                                        </form>
                                                    ) : (
                                                        <div className="flex justify-between items-center group">
                                                            <div className="flex flex-col gap-1">
                                                                <div className="flex items-center gap-3">
                                                                    <span className="w-10 h-10 bg-indigo-100 text-indigo-700 font-black rounded-lg flex justify-center items-center text-lg">{s.score}</span>
                                                                    <span className="text-gray-900 font-bold tracking-tight">{new Date(s.date).toLocaleDateString()}</span>
                                                                </div>
                                                                {s.admin_edited_at && <span className="text-[10px] bg-red-100 text-red-800 font-black uppercase px-2 py-0.5 rounded w-max mt-1 tracking-widest flex items-center gap-1"><AlertTriangle size={10} /> Authenticated Core Admin Edit</span>}
                                                            </div>
                                                            <button
                                                                onClick={() => { setEditingScoreId(s.id); setEditScoreData({ num: s.score, date: s.date }); }}
                                                                className="text-gray-400 hover:text-blue-600 transition-colors bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm"
                                                            >
                                                                Edit Flag
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="h-32 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50"><p className="text-gray-500 font-medium text-sm">No topological scores captured centrally.</p></div>
                                    )}
                                </div>

                                {/* Tracking Vault */}
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col h-[500px]">
                                    <h3 className="text-xl font-black text-gray-900 mb-5 flex items-center gap-2"><Trophy size={22} className="text-yellow-500 fill-yellow-500" /> Verification History</h3>
                                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                                        {profileData.winnings?.length > 0 ? (
                                            profileData.winnings.map(w => (
                                                <div key={w.id} className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col gap-2">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="font-bold text-gray-900">{w.draws?.date ? new Date(w.draws.date).toLocaleDateString() : 'Unknown Draw Date'}</p>
                                                            <p className="text-[11px] uppercase tracking-widest font-black text-green-600 mt-0.5">₹{parseFloat(w.prize_amount).toLocaleString()} PRIZE</p>
                                                        </div>
                                                        <span className={`px-2 py-1 text-[10px] uppercase font-black tracking-widest rounded-lg flex items-center gap-1 ${w.status === 'paid' ? 'bg-green-100 text-green-800' : w.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                            {w.status}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs font-semibold text-gray-600 bg-white px-3 py-1.5 rounded-md border border-gray-100 mt-1 flex gap-2 truncate">
                                                        <span className="text-indigo-400">Match Node:</span> {w.matched_details?.join(' / ')}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="h-full flex items-center justify-center"><p className="text-gray-400 font-bold text-sm">No historical winning matches recorded securely.</p></div>
                                        )}
                                    </div>
                                </div>
                            </div>

                        </div>
                    ) : null}
                </div>
            </div>
        );
    }

    // Main Directory Grid
    return (
        <div className="min-h-[calc(100vh-80px)] bg-transparent pb-12">
            <div className="max-w-7xl mx-auto px-4 mt-8">
                <div className="flex items-center gap-2 mb-8">
                    <Link to="/admin" className="text-gray-500 hover:text-gray-900 transition-colors"><ArrowLeft size={20} /></Link>
                    <h1 className="text-3xl font-black text-gray-900 flex items-center gap-2">
                        <ShieldAlert className="fill-indigo-600 text-white" size={28} />
                        User Directory Matrix
                    </h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-center">
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Total Identity Nodes</p>
                        <p className="text-3xl font-black text-gray-900">{standardUsers.length}</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-center">
                        <p className="text-xs text-green-600 font-bold uppercase tracking-widest mb-1">Active Subscribers</p>
                        <p className="text-3xl font-black text-green-700">{activeCount}</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-center">
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Monthly Plan Locks</p>
                        <p className="text-3xl font-black text-gray-900">{monthlyCount}</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-center">
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Yearly Plan Locks</p>
                        <p className="text-3xl font-black text-gray-900">{yearlyCount}</p>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="relative w-full sm:w-96 shrink-0">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Scan exact parameters (Name, Email)..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm text-gray-900 bg-white"
                            />
                        </div>
                        <div className="flex bg-gray-200 p-1 rounded-lg shrink-0 w-full sm:w-auto">
                            <button onClick={() => setStatusFilter('all')} className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-black uppercase tracking-wider rounded-md transition-all ${statusFilter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>All</button>
                            <button onClick={() => setStatusFilter('active')} className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-black uppercase tracking-wider rounded-md transition-all ${statusFilter === 'active' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Active</button>
                            <button onClick={() => setStatusFilter('inactive')} className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-black uppercase tracking-wider rounded-md transition-all ${statusFilter === 'inactive' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Inactive</button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white border-b border-gray-100 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                                    <th className="p-4 pl-6">Client Identity</th>
                                    <th className="p-4">Contact Gateway</th>
                                    <th className="p-4">Charity Split</th>
                                    <th className="p-4">Authorization</th>
                                    <th className="p-4 pr-6 text-right">Topology Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="5" className="p-10 text-center animate-pulse text-indigo-500 font-bold">Connecting to Master Database...</td></tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr><td colSpan="5" className="p-10 text-center text-gray-400 font-bold">No exact identity matches explicitly recorded securely.</td></tr>
                                ) : (
                                    filteredUsers.map(u => {
                                        const sub = Array.isArray(u.subscriptions) ? u.subscriptions[0] : u.subscriptions;
                                        return (
                                            <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/80 transition-colors group cursor-pointer" onClick={() => fetchProfile(u.id)}>
                                                <td className="p-4 pl-6 font-bold text-gray-900 truncate max-w-[200px]">{u.full_name || `Registered ${new Date(u.created_at).toLocaleDateString()}`}</td>
                                                <td className="p-4 text-sm font-medium text-gray-500">{u.email}</td>
                                                <td className="p-4 text-sm font-black text-rose-500">{u.charity_percentage}%</td>
                                                <td className="p-4">
                                                    {sub?.status === 'active' ? (
                                                        <span className="bg-green-100 text-green-800 px-2.5 py-1 text-[10px] uppercase font-black tracking-widest rounded-lg flex items-center w-max gap-1">
                                                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div> Active [{sub.plan_id}]
                                                        </span>
                                                    ) : (
                                                        <span className="bg-gray-100 text-gray-600 px-2.5 py-1 text-[10px] uppercase font-black tracking-widest rounded-lg flex items-center w-max gap-1">
                                                            Offline
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-4 pr-6 text-right">
                                                    <button onClick={(e) => { e.stopPropagation(); fetchProfile(u.id); }} className="text-xs font-bold bg-white border border-gray-200 text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg shadow-sm group-hover:border-indigo-200 transition-all">Audit Node</button>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}
