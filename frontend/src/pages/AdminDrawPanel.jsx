import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Play, ShieldAlert, ArrowLeft, RefreshCw, BarChart2, CheckCircle2, Trophy, Users, AlertTriangle, CalendarPlus, Info } from 'lucide-react';

export default function AdminDrawPanel() {
    const [loading, setLoading] = useState(false);
    const [publishLoading, setPublishLoading] = useState(false);
    const [simulation, setSimulation] = useState(null);
    const [error, setError] = useState('');

    const [strategy, setStrategy] = useState('random');
    const [manualMode, setManualMode] = useState(false);
    const [manualInput, setManualInput] = useState('');

    // Scheduling State
    const [scheduledDraws, setScheduledDraws] = useState([]);
    const [scheduleDate, setScheduleDate] = useState('');
    const [selectedDrawId, setSelectedDrawId] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        fetchDraws();
    }, []);

    const fetchDraws = async () => {
        try {
            const res = await api.get('/admin/draws/scheduled');
            setScheduledDraws(res.data.draws);
        } catch (err) {
            console.error('Failed to fetch scheduled draws');
        }
    };

    const handleScheduleDraw = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/draws/schedule', { date: scheduleDate });
            setScheduleDate('');
            fetchDraws();
            alert('Draw successfully scheduled!');
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to schedule draw');
        }
    };

    const handleSimulate = async () => {
        if (!selectedDrawId) return setError("Please select a target Scheduled Draw before simulating constraints.");

        setLoading(true);
        setError('');
        setSimulation(null);

        let payload = { strategy };
        if (manualMode && manualInput) {
            const numbers = manualInput.split(',').map(n => parseInt(n.trim(), 10)).filter(n => !isNaN(n));
            if (numbers.length !== 5) {
                setError("Please enter exactly 5 comma-separated numbers (e.g., 5, 12, 25, 32, 45).");
                setLoading(false);
                return;
            }
            payload.manualNumbers = numbers;
        }

        try {
            const res = await api.post('/admin/draw/simulate', payload);
            setSimulation({ ...res.data.simulation, targetDrawId: selectedDrawId });
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to simulate draw.');
        } finally {
            setLoading(false);
        }
    };

    const handlePublish = async () => {
        if (!simulation || !simulation.targetDrawId) return;
        if (!window.confirm('WARNING: You are about to officially publish these numbers! This will permanently deduct jackpots and alert winners. Proceed?')) return;

        setPublishLoading(true);
        setError('');

        try {
            const res = await api.post('/admin/draw/publish', { numbers: simulation.drawNumbers, draw_id: simulation.targetDrawId });
            alert('Draw Published Successfully!');
            navigate('/admin');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to publish draw.');
        } finally {
            setPublishLoading(false);
        }
    };

    const activeDraws = scheduledDraws.filter(d => d.status === 'upcoming');

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
            <div className="max-w-6xl mx-auto">
                <button onClick={() => navigate('/admin')} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors font-medium">
                    <ArrowLeft size={16} /> Dashboard
                </button>

                <div className="flex justify-between items-end mb-8">
                    <div className="flex items-center gap-3">
                        <ShieldAlert className="text-indigo-600" size={32} />
                        <div>
                            <h1 className="text-3xl font-extrabold text-gray-900">Advanced Draw Engine & Scheduler</h1>

                            <div className="group relative inline-flex items-center gap-2 cursor-pointer text-blue-600 mt-2">
                                <Info size={16} />
                                <span className="text-xs font-bold uppercase tracking-wider">How draw allocations work</span>

                                <div className="absolute left-0 top-full mt-2 w-96 bg-gray-900 text-white text-xs p-4 rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 shadow-2xl border border-gray-700 pointer-events-none">
                                    <p className="mb-2"><strong>Revenue Accumulation:</strong> The system automatically extracts the gross monthly fee (₹800/mo, or ₹8000/12 if yearly) from ALL Active Members, regardless of whether they submitted enough scores to be eligible to win.</p>
                                    <p className="mb-2 text-pink-300"><strong>Charity Removal:</strong> Then, it computes each individual user's charity percentage uniquely and surgically deducts it from their portion into the structural foundation pipeline.</p>
                                    <p className="text-green-300"><strong>Prize Siphon:</strong> Finally, exactly <strong>50%</strong> of the <em>Remaining Subgross Revenue</em> is definitively mathematically mapped into this Draw's Prize Pool, with the remainder kept cleanly as platform profit!</p>
                                    <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 border-l border-t border-gray-700 transform rotate-45"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Scheduler & Selector */}
                    <div className="lg:col-span-1 flex flex-col gap-6">

                        {/* Scheduler Tool */}
                        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                            <h2 className="text-lg font-black tracking-tight mb-4 flex items-center gap-2"><CalendarPlus size={20} className="text-indigo-600" /> Schedule Draw</h2>
                            <form onSubmit={handleScheduleDraw} className="flex flex-col gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Target Run Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={scheduleDate}
                                        onChange={(e) => setScheduleDate(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium font-sans"
                                    />
                                </div>
                                <button type="submit" className="w-full py-2.5 bg-indigo-50 text-indigo-700 font-bold rounded-xl hover:bg-indigo-100 transition-colors border border-indigo-200">
                                    Queue Upcoming Draw
                                </button>
                            </form>
                        </div>

                        {/* Overdue/Active List */}
                        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 flex-1">
                            <h2 className="text-lg font-black tracking-tight mb-4">Pending Execution</h2>
                            {activeDraws.length === 0 ? (
                                <p className="text-sm text-gray-500 font-medium italic">No pending draws scheduled.</p>
                            ) : (
                                <div className="space-y-3">
                                    {activeDraws.map(d => {
                                        const dateVal = new Date(d.date);
                                        const isOverdue = dateVal < new Date(new Date().setHours(0, 0, 0, 0));
                                        return (
                                            <div
                                                key={d.id}
                                                className={`p-3 rounded-xl border ${isOverdue ? 'border-red-300 bg-red-50 relative' : 'border-gray-100 bg-gray-50'} transition-all`}
                                            >
                                                {isOverdue && <div className="absolute -top-2.5 -right-2.5 bg-red-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm animate-pulse flex items-center gap-1"><AlertTriangle size={10} /> Overdue</div>}
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className={`font-black tracking-tight ${isOverdue ? 'text-red-900' : 'text-gray-900'}`}>{dateVal.toLocaleDateString()}</p>
                                                        <p className={`text-xs font-medium ${isOverdue ? 'text-red-700' : 'text-gray-500'}`}>Status: Upcoming</p>
                                                    </div>
                                                    {isOverdue && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedDrawId(d.id);
                                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                                            }}
                                                            className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 shadow-sm"
                                                        >
                                                            Select to Execute
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Middle Column: Simulator Controls */}
                    <div className="lg:col-span-1 border border-gray-200 bg-white rounded-2xl shadow-sm p-6">
                        <h2 className="text-lg font-black tracking-tight mb-6 flex items-center gap-2"><Trophy size={20} className="text-rose-500" /> Target Configuration</h2>

                        <div className="space-y-4 mb-6">
                            <label className="block text-sm font-bold text-gray-800">1. Target Draw <span className="text-red-500">*</span></label>
                            <select
                                value={selectedDrawId}
                                onChange={(e) => setSelectedDrawId(e.target.value)}
                                className={`w-full px-4 py-3 bg-white border-2 rounded-xl focus:ring-0 focus:border-indigo-500 font-bold ${!selectedDrawId ? 'border-rose-400 text-rose-900 bg-rose-50' : 'border-gray-200 text-gray-900'}`}
                            >
                                <option disabled value="">-- Explicitly Required --</option>
                                {activeDraws.map(d => <option key={d.id} value={d.id}>{new Date(d.date).toLocaleDateString()}</option>)}
                            </select>
                        </div>

                        <div className="space-y-4 mb-6">
                            <label className="block text-sm font-bold text-gray-800">2. Algorithmic Strategy</label>
                            <select
                                value={strategy}
                                onChange={(e) => setStrategy(e.target.value)}
                                disabled={manualMode}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium disabled:opacity-50"
                            >
                                <option value="random">Random Generation</option>
                                <option value="least_frequent">Least Frequent (Hardest)</option>
                                <option value="most_frequent">Most Frequent (Easiest)</option>
                            </select>
                            <p className="text-xs text-gray-500 font-medium leading-relaxed">
                                Predicts outcomes automatically bypassing native true-random numbers.
                            </p>
                        </div>

                        <hr className="my-6 border-gray-100" />

                        <div className="space-y-4 mb-8">
                            <label className="flex items-center gap-3 font-bold text-gray-800 cursor-pointer">
                                <input type="checkbox" checked={manualMode} onChange={(e) => setManualMode(e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                Developer Override
                            </label>
                            {manualMode && (
                                <input
                                    type="text"
                                    value={manualInput}
                                    onChange={(e) => setManualInput(e.target.value)}
                                    placeholder="e.g. 5, 12, 25, 32, 45"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-gray-900 font-medium"
                                />
                            )}
                        </div>

                        <button
                            onClick={handleSimulate}
                            disabled={loading || publishLoading || !selectedDrawId}
                            className={`flex items-center justify-center w-full gap-2 px-6 py-3.5 rounded-xl transition-colors font-black tracking-wide shadow-md ${!selectedDrawId ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-gray-900 text-white hover:bg-black'}`}
                        >
                            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                            {loading ? 'Simulating...' : 'Run Simulation'}
                        </button>

                        {error && <div className="mt-4 p-3 bg-red-50 text-red-700 font-bold text-sm rounded-lg border border-red-200 shadow-inner">{error}</div>}
                    </div>

                    {/* Right Column: Simulation Preview Area */}
                    <div className="lg:col-span-1 space-y-6 flex flex-col h-full">
                        {!simulation ? (
                            <div className="flex-1 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center p-8 text-center text-gray-400 bg-gray-50/50">
                                <BarChart2 size={48} className="mb-4 opacity-50" />
                                <h3 className="text-lg font-bold">Awaiting Prediction</h3>
                                <p className="text-sm font-medium mt-1">Select a Scheduled Draw and run a dry-simulation to unlock metrics.</p>
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl border border-indigo-100 shadow-xl overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300 flex-1 flex flex-col">
                                <div className="bg-indigo-600 p-6 text-white text-center">
                                    <p className="text-indigo-200 text-xs font-black uppercase tracking-widest mb-2">Simulated Array</p>
                                    <div className="flex justify-center gap-2">
                                        {simulation.drawNumbers.map((n, i) => (
                                            <span key={i} className="w-10 h-10 flex items-center justify-center bg-white text-indigo-900 font-black rounded-full shadow-md text-lg">{n}</span>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-5 flex-1 flex flex-col">
                                    <div className="grid grid-cols-2 gap-3 mb-6">
                                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                            <p className="text-gray-500 text-[10px] font-bold uppercase mb-1">Gross Yield</p>
                                            <p className="text-lg font-black text-gray-900">₹{Number(simulation.stats.totalRevenue).toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                                        </div>
                                        <div className="p-3 bg-yellow-50 rounded-xl border border-yellow-100">
                                            <p className="text-yellow-700 text-[10px] font-bold uppercase mb-1">Jackpot Pool</p>
                                            <p className="text-lg font-black text-yellow-900">₹{Number(simulation.stats.pool5).toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2 mb-6 flex-1">
                                        <div className="flex justify-between items-center p-2.5 rounded-lg border border-gray-100 bg-gray-50/50">
                                            <span className="font-bold text-gray-700 text-[11px] uppercase tracking-wider">Tier 1 (5)</span>
                                            <span className="font-black text-gray-900 text-sm">{simulation.stats.match5Count} <span className="font-medium text-gray-400 text-xs">wins</span></span>
                                        </div>
                                        <div className="flex justify-between items-center p-2.5 rounded-lg border border-gray-100 bg-gray-50/50">
                                            <span className="font-bold text-gray-700 text-[11px] uppercase tracking-wider">Tier 2 (4)</span>
                                            <span className="font-black text-gray-900 text-sm">{simulation.stats.match4Count} <span className="font-medium text-gray-400 text-xs">wins</span></span>
                                        </div>
                                        <div className="flex justify-between items-center p-2.5 rounded-lg border border-gray-100 bg-gray-50/50">
                                            <span className="font-bold text-gray-700 text-[11px] uppercase tracking-wider">Tier 3 (3)</span>
                                            <span className="font-black text-gray-900 text-sm">{simulation.stats.match3Count} <span className="font-medium text-gray-400 text-xs">wins</span></span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handlePublish}
                                        disabled={publishLoading}
                                        className="w-full py-4 bg-green-600 text-white font-black rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors shadow-lg shadow-green-200 flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
                                    >
                                        <CheckCircle2 size={18} /> {publishLoading ? 'Publishing...' : 'Commit Sequence'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
