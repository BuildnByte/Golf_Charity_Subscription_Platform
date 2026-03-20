import React, { useState } from 'react';
import { api } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Play, ShieldAlert, ArrowLeft, RefreshCw, BarChart2, CheckCircle2, Trophy, Users } from 'lucide-react';

export default function AdminDrawPanel() {
    const [loading, setLoading] = useState(false);
    const [publishLoading, setPublishLoading] = useState(false);
    const [simulation, setSimulation] = useState(null);
    const [error, setError] = useState('');

    const [strategy, setStrategy] = useState('random');
    const [manualMode, setManualMode] = useState(false);
    const [manualInput, setManualInput] = useState('');

    const navigate = useNavigate();

    const handleSimulate = async () => {
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
            setSimulation(res.data.simulation);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to simulate draw.');
        } finally {
            setLoading(false);
        }
    };

    const handlePublish = async () => {
        if (!simulation) return;
        if (!window.confirm('WARNING: You are about to officially publish these numbers! This will permanently deduct jackpots and alert winners. Proceed?')) return;

        setPublishLoading(true);
        setError('');

        try {
            const res = await api.post('/admin/draw/publish', { numbers: simulation.drawNumbers });
            alert('Draw Published Successfully!');
            navigate('/admin');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to publish draw.');
        } finally {
            setPublishLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
            <div className="max-w-5xl mx-auto">
                <button onClick={() => navigate('/admin')} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors font-medium">
                    <ArrowLeft size={16} /> Dashboard
                </button>

                <div className="flex items-center gap-3 mb-8">
                    <ShieldAlert className="text-indigo-600" size={32} />
                    <h1 className="text-3xl font-extrabold text-gray-900">Advanced Draw Engine</h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* Controls Panel */}
                    <div className="md:col-span-1 border border-gray-200 bg-white rounded-2xl shadow-sm p-6 max-h-fit">
                        <h2 className="text-lg font-black tracking-tight mb-4">1. Configure Logic</h2>

                        <div className="space-y-4 mb-6">
                            <label className="block text-sm font-bold text-gray-700">Algorithmic Strategy</label>
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
                                {strategy === 'random' && "Generates 5 pure cryptographic random numbers."}
                                {strategy === 'least_frequent' && "Parses database for numbers chosen least by users to maximize jackpot rollover."}
                                {strategy === 'most_frequent' && "Selects the most popular user choices causing maximum payout distribution."}
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
                            disabled={loading || publishLoading}
                            className="flex items-center justify-center w-full gap-2 px-6 py-3.5 bg-gray-900 text-white rounded-xl hover:bg-black disabled:opacity-50 transition-colors font-black tracking-wide shadow-md"
                        >
                            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                            {loading ? 'Simulating...' : 'Run Simulation'}
                        </button>

                        {error && <div className="mt-4 p-3 bg-red-50 text-red-700 font-medium text-sm rounded-lg border border-red-200">{error}</div>}
                    </div>

                    {/* Simulation Preview Area */}
                    <div className="md:col-span-2 space-y-6">
                        {!simulation ? (
                            <div className="h-full border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center p-12 text-center text-gray-400">
                                <BarChart2 size={48} className="mb-4 opacity-50" />
                                <h3 className="text-lg font-bold">Awaiting Simulation...</h3>
                                <p className="text-sm font-medium mt-1">Run a simulation dry-run to preview potential payouts and winners before official publication.</p>
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl border border-indigo-100 shadow-md overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                                <div className="bg-indigo-600 p-6 flex justify-between items-center text-white">
                                    <div>
                                        <p className="text-indigo-200 text-xs font-black uppercase tracking-widest mb-1 shadow-sm">Predicted Results</p>
                                        <h3 className="text-2xl font-extrabold flex items-center gap-3">
                                            {simulation.drawNumbers.map((n, i) => (
                                                <span key={i} className="inline-block px-3 py-1 bg-white/20 rounded-md backdrop-blur-sm shadow-inner">{n}</span>
                                            ))}
                                        </h3>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-indigo-200 text-sm font-medium">Valid Players</p>
                                        <p className="text-3xl font-black">{simulation.validParticipantsCount}</p>
                                    </div>
                                </div>

                                <div className="p-6">
                                    <h4 className="text-gray-900 font-bold mb-4 uppercase tracking-wider text-sm flex items-center gap-2 bg-gray-50 py-2 px-3 rounded-md">
                                        <Trophy size={16} /> Simulated Financials
                                    </h4>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                            <p className="text-gray-500 text-xs font-bold uppercase mb-1">Gross Yield</p>
                                            <p className="text-lg font-black text-gray-900">${simulation.stats.totalRevenue}</p>
                                        </div>
                                        <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                                            <p className="text-yellow-700 text-xs font-bold uppercase mb-1">Jackpot Pool</p>
                                            <p className="text-lg font-black text-yellow-900">${simulation.stats.pool5}</p>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                            <p className="text-gray-500 text-xs font-bold uppercase mb-1">Prev Rollover</p>
                                            <p className="text-lg font-black text-gray-900">${simulation.stats.previousRollover}</p>
                                        </div>
                                        <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                                            <p className="text-green-700 text-xs font-bold uppercase mb-1">Next Rollover</p>
                                            <p className="text-lg font-black text-green-900">${simulation.stats.nextRollover}</p>
                                        </div>
                                    </div>

                                    <h4 className="text-gray-900 font-bold mb-4 uppercase tracking-wider text-sm flex items-center gap-2 bg-gray-50 py-2 px-3 rounded-md">
                                        <Users size={16} /> Projected Winners
                                    </h4>

                                    <div className="space-y-3 mb-8">
                                        <div className="flex justify-between items-center p-3 rounded-lg border border-gray-100">
                                            <span className="font-bold text-gray-700 text-sm w-32">5-Match (Tier 1)</span>
                                            <span className="font-black text-gray-900 w-16 text-center">{simulation.stats.match5Count}</span>
                                            <span className="font-bold text-green-600 text-right w-32">${simulation.stats.prize5.toFixed(2)} ea</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 rounded-lg border border-gray-100">
                                            <span className="font-bold text-gray-700 text-sm w-32">4-Match (Tier 2)</span>
                                            <span className="font-black text-gray-900 w-16 text-center">{simulation.stats.match4Count}</span>
                                            <span className="font-bold text-green-600 text-right w-32">${simulation.stats.prize4.toFixed(2)} ea</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 rounded-lg border border-gray-100">
                                            <span className="font-bold text-gray-700 text-sm w-32">3-Match (Tier 3)</span>
                                            <span className="font-black text-gray-900 w-16 text-center">{simulation.stats.match3Count}</span>
                                            <span className="font-bold text-green-600 text-right w-32">${simulation.stats.prize3.toFixed(2)} ea</span>
                                        </div>
                                    </div>

                                    <div className="bg-rose-50 border border-rose-100 rounded-xl p-5 mb-6 shadow-sm">
                                        <p className="text-rose-800 text-sm font-bold flex items-center gap-2 mb-2"><ShieldAlert size={16} /> Approval Required</p>
                                        <p className="text-rose-700 text-xs font-medium leading-relaxed">
                                            Review the metrics above carefully. Proceeding will formally publish these numbers, execute the corresponding database transactions, deduct payouts, and instantly alert users of their new status. This action is absolutely irreversible.
                                        </p>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                        <button
                                            onClick={() => setSimulation(null)}
                                            className="px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                                        >
                                            Discard Prediction
                                        </button>
                                        <button
                                            onClick={handlePublish}
                                            disabled={publishLoading}
                                            className="px-8 py-3 bg-green-600 text-white font-black rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors shadow-lg shadow-green-200 flex items-center gap-2"
                                        >
                                            <CheckCircle2 size={18} /> {publishLoading ? 'Publishing...' : 'Finalize & Publish'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
