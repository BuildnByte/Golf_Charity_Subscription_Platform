import React, { useEffect, useState } from 'react';
import { api } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Trophy, Play, CheckCircle, Heart } from 'lucide-react';

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [winners, setWinners] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [sRes, uRes, wRes] = await Promise.all([
                api.get('/admin/stats'),
                api.get('/admin/users'),
                api.get('/admin/winners')
            ]);
            setStats(sRes.data.stats);
            setUsers(uRes.data.users);
            setWinners(wRes.data.winners);
        } catch (err) {
            console.error(err);
            if (err.response?.status === 403) navigate('/admin');
        }
    };

    const handlePay = async (id) => {
        try {
            await api.post(`/admin/winners/${id}/pay`);
            fetchData();
        } catch (err) {
            alert('Failed to update status');
        }
    };

    const handleReject = async (id) => {
        try {
            await api.post(`/admin/winners/${id}/reject`);
            fetchData();
        } catch (err) {
            alert('Failed to reject application');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <nav className="bg-indigo-900 text-white px-8 py-4 flex justify-between">
                <h1 className="text-xl font-bold flex items-center gap-2"><LayoutDashboard /> Admin Hub</h1>
                <Link to="/" className="text-sm text-indigo-200 hover:text-white">Exit Admin</Link>
            </nav>

            <div className="max-w-7xl mx-auto px-4 mt-8 space-y-8">

                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-extrabold text-gray-900">Dashboard Overview</h2>
                    <div className="flex gap-4">
                        <Link to="/admin/charities" className="bg-pink-600 text-white px-6 py-2 rounded-lg flex gap-2 items-center hover:bg-pink-700 font-bold tracking-wide shadow-md">
                            <Heart size={18} className="fill-white" /> Manage Charities
                        </Link>
                        <Link to="/admin/draw" className="bg-indigo-600 text-white px-6 py-2 rounded-lg flex gap-2 items-center hover:bg-indigo-700 font-bold tracking-wide shadow-md">
                            <Play size={18} className="fill-white" /> Run Draw Engine
                        </Link>
                    </div>
                </div>

                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                            <p className="text-gray-500 text-sm">Total Users</p>
                            <p className="text-3xl font-bold mt-2">{stats.totalUsers}</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                            <p className="text-gray-500 text-sm">Draws Run</p>
                            <p className="text-3xl font-bold mt-2">{stats.totalDraws}</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                            <p className="text-gray-500 text-sm">Global Prize Pool (Gross)</p>
                            <p className="text-3xl font-bold text-green-600 mt-2">${stats.totalPrizePool}</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                            <p className="text-gray-500 text-sm">Charity Allocation</p>
                            <p className="text-3xl font-bold text-pink-600 mt-2">${stats.totalCharity}</p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Winners table */}
                    <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex items-center gap-2">
                            <Trophy className="text-yellow-500" />
                            <h3 className="text-lg font-bold">Winner Verification & Payouts</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="p-4 uppercase text-xs font-semibold text-gray-500 tracking-wider">User Email</th>
                                        <th className="p-4 uppercase text-xs font-semibold text-gray-500 tracking-wider">Match</th>
                                        <th className="p-4 uppercase text-xs font-semibold text-gray-500 tracking-wider">Prize</th>
                                        <th className="p-4 uppercase text-xs font-semibold text-gray-500 tracking-wider">Proof (ID)</th>
                                        <th className="p-4 uppercase text-xs font-semibold text-gray-500 tracking-wider">Status</th>
                                        <th className="p-4 uppercase text-xs font-semibold text-gray-500 tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {winners.map(w => (
                                        <tr key={w.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                                            <td className="p-4 font-medium">{w.users?.email || w.user_id.substring(0, 8)}</td>
                                            <td className="p-4 text-gray-600">
                                                <div className="font-bold text-gray-900">{w.match_count} <span className="text-xs font-normal">Mtchs</span></div>
                                                <div className="text-xs text-indigo-600 font-semibold tracking-wide mt-2 border-t border-gray-100 pt-2 space-y-1">
                                                    {w.matched_details?.map((detail, idx) => <span key={idx} className="block">{detail}</span>)}
                                                </div>
                                            </td>
                                            <td className="p-4 text-green-600 font-bold">${w.prize_amount}</td>
                                            <td className="p-4">
                                                {w.screenshot_url ? <a href={w.screenshot_url} target="_blank" rel="noreferrer" className="text-indigo-600 font-medium hover:underline flex items-center gap-1">View Image <LayoutDashboard size={12} /></a> : <span className="text-gray-400 italic">Missing</span>}
                                            </td>
                                            <td className="p-4">
                                                {w.status === 'paid' ? <span className="text-green-600 bg-green-50 px-2 py-1 rounded inline-flex items-center gap-1 font-medium"><CheckCircle size={14} /> Paid</span> : <span className="text-yellow-600 bg-yellow-50 px-2 py-1 rounded font-medium">Pending</span>}
                                            </td>
                                            <td className="p-4">
                                                {w.status === 'pending' && (
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handlePay(w.id)} className="bg-gray-900 text-white px-3 py-1.5 rounded-md hover:bg-gray-800 font-medium transition-colors text-xs whitespace-nowrap">Mark Paid</button>
                                                        <button onClick={() => handleReject(w.id)} className="bg-red-100 text-red-700 px-3 py-1.5 rounded-md hover:bg-red-200 font-medium transition-colors text-xs whitespace-nowrap">Reject ID</button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {winners.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-gray-500">No winners to process yet.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* User List */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[500px]">
                        <div className="p-6 border-b border-gray-100 flex items-center gap-2 flex-shrink-0">
                            <Users className="text-blue-500" />
                            <h3 className="text-lg font-bold">Recent Users</h3>
                        </div>
                        <div className="overflow-y-auto flex-1">
                            <ul className="divide-y divide-gray-50">
                                {users.map(u => (
                                    <li key={u.id} className="p-4 hover:bg-gray-50 transition-colors">
                                        <p className="font-medium text-gray-900 truncate">{u.email}</p>
                                        <p className={`text-xs mt-1 uppercase tracking-wider font-bold ${u.role === 'admin' ? 'text-indigo-600' : 'text-gray-500'}`}>{u.role}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
