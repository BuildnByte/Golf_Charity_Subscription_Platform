import React, { useState } from 'react';
import { api } from '../context/AuthContext';
import { PlusCircle } from 'lucide-react';

export default function ScoreForm({ onScoreAdded }) {
    const [score, setScore] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        const num = parseInt(score, 10);
        if (isNaN(num) || num < 1 || num > 45) {
            setError('Score must be between 1 and 45');
            return;
        }
        if (!date) {
            setError('Date is required');
            return;
        }

        try {
            setLoading(true);
            setError('');
            await api.post('/scores', { score: num, date });
            setScore('');
            if (onScoreAdded) onScoreAdded();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to add score');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start">
                <div className="flex-1 w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Number (1-45)</label>
                    <input
                        type="number"
                        min="1"
                        max="45"
                        value={score}
                        onChange={(e) => setScore(e.target.value)}
                        placeholder="e.g. 42"
                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                    />
                </div>
                <div className="flex-1 w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                    />
                </div>
                <div className="w-full sm:w-auto self-end">
                    <button
                        type="submit"
                        disabled={loading || !score}
                        className="w-full h-[42px] flex items-center justify-center gap-2 px-6 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors font-medium"
                    >
                        <PlusCircle size={20} />
                        Add Score
                    </button>
                </div>
            </div>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-bold flex items-center justify-center">{error}</div>}
        </form>
    );
}
