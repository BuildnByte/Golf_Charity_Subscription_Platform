import React, { useState } from 'react';
import { api, useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Play, ShieldAlert, ArrowLeft } from 'lucide-react';

export default function AdminDrawPanel() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [manualMode, setManualMode] = useState(false);
    const [manualInput, setManualInput] = useState('');
    const navigate = useNavigate();
    const { user } = useAuth();

    const handleRunDraw = async () => {
        if (!window.confirm('Are you sure you want to run a new draw? This cannot be undone.')) return;

        setLoading(true);
        setError('');
        setResult(null);

        let payload = {};
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
            const res = await api.post('/admin/draw/run', payload);
            setResult(res.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to run draw. Make sure you are an admin!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => navigate('/admin')}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors font-medium"
                >
                    <ArrowLeft size={16} /> Back to Dashboard
                </button>

                <div className="flex items-center gap-3 mb-8">
                    <ShieldAlert className="text-red-600" size={32} />
                    <h1 className="text-3xl font-extrabold text-gray-900">Admin Draw Panel</h1>
                </div>

                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-gray-600 mb-6 font-medium leading-relaxed">
                        Running a draw will generate 5 random numbers, check all active participants, and distribute the mocked prize pool using mathematically balanced proportions. Any 5-match jackpot with zero winners will automatically safely carry over to the next draw.
                    </p>

                    <div className="mb-6 bg-gray-50 p-5 border border-gray-200 rounded-xl shadow-sm">
                        <label className="flex items-center gap-3 font-bold text-gray-800 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={manualMode}
                                onChange={(e) => setManualMode(e.target.checked)}
                                className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                            />
                            Developer Mode: Force specific winning numbers (Testing)
                        </label>
                        {manualMode && (
                            <div className="mt-4">
                                <p className="text-sm text-gray-500 mb-2">Check your user dashboard for your 5 chosen numbers and write them below separated by commas to force a win.</p>
                                <input
                                    type="text"
                                    value={manualInput}
                                    onChange={(e) => setManualInput(e.target.value)}
                                    placeholder="e.g. 5, 12, 25, 32, 45"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-red-500 focus:ring-1 focus:ring-red-500 text-gray-900 font-medium"
                                />
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleRunDraw}
                        disabled={loading}
                        className="flex items-center justify-center w-full gap-2 sm:w-auto px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors font-bold tracking-wide shadow-sm"
                    >
                        <Play size={20} />
                        {loading ? 'Running Draw Algorithm...' : 'Run Official Draw'}
                    </button>

                    {error && (
                        <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 shadow-sm">
                            {error}
                        </div>
                    )}

                    {result && (
                        <div className="mt-8 transition-all">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Draw Results</h2>

                            <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-xl mb-6 shadow-sm">
                                <p className="text-sm font-bold text-indigo-800 uppercase tracking-widest mb-4">Winning Numbers</p>
                                <div className="flex gap-4">
                                    {result.draw.numbers.map((n, i) => (
                                        <span key={i} className="flex items-center justify-center w-14 h-14 bg-indigo-600 text-white font-bold text-2xl rounded-full shadow-md">
                                            {n}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm">
                                    <p className="text-sm text-gray-500 font-medium">Total Participants</p>
                                    <p className="text-3xl font-bold text-gray-900">{result.stats.participants}</p>
                                </div>
                                <div className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm">
                                    <p className="text-sm text-gray-500 font-medium">Total Prize Pool generated</p>
                                    <p className="text-3xl font-bold text-gray-900">${result.draw.total_prize_pool}</p>
                                </div>
                                <div className="p-5 bg-yellow-50 border border-yellow-200 rounded-xl shadow-sm">
                                    <p className="text-sm text-yellow-800 font-medium">5-Match Winners (Jackpot)</p>
                                    <p className="text-3xl font-extrabold text-yellow-900">{result.stats.match5}</p>
                                </div>
                                <div className="p-5 bg-green-50 border border-green-200 rounded-xl shadow-sm">
                                    <p className="text-sm text-green-800 font-medium">Jackpot Carried Over</p>
                                    <p className="text-3xl font-extrabold text-green-900">${result.draw.jackpot_rollover}</p>
                                </div>
                                <div className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm">
                                    <p className="text-sm text-gray-500 font-medium">4-Match Winners</p>
                                    <p className="text-3xl font-bold text-gray-900">{result.stats.match4}</p>
                                </div>
                                <div className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm">
                                    <p className="text-sm text-gray-500 font-medium">3-Match Winners</p>
                                    <p className="text-3xl font-bold text-gray-900">{result.stats.match3}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
