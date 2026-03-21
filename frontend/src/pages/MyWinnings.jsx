import React, { useEffect, useState } from 'react';
import { api, useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabaseClient';
import { ArrowLeft, UploadCloud } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MyWinnings() {
    const [winnings, setWinnings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploadingId, setUploadingId] = useState(null);

    useEffect(() => {
        fetchWinnings();
    }, []);

    const fetchWinnings = async () => {
        try {
            const res = await api.get('/winners/me');
            setWinnings(res.data.winnings);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e, winnerId) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingId(winnerId);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `screenshots/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('verification')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('verification').getPublicUrl(filePath);

            await api.post(`/winners/${winnerId}/screenshot`, { screenshot_url: data.publicUrl });

            fetchWinnings();
        } catch (err) {
            console.error(err);
            alert('Failed to upload screenshot. Check bucket permissions and try again.');
        } finally {
            setUploadingId(null);
        }
    };

    return (
        <div className="min-h-screen bg-transparent py-12 px-4 sm:px-6">
            <div className="max-w-7xl mx-auto">

                <h1 className="text-3xl font-extrabold text-gray-900 mb-2">My Winnings</h1>
                <p className="text-gray-600 mb-8">Upload a screenshot of your ID to verify your identity and receive your payouts.</p>

                {loading ? (
                    <p>Loading...</p>
                ) : winnings.length === 0 ? (
                    <div className="bg-white p-12 rounded-xl text-center shadow-sm border border-gray-100">
                        <p className="text-lg text-gray-500">You haven't won any draws yet. Keep playing!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {winnings.map(w => (
                            <div key={w.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Draw Date: <span className="font-semibold text-gray-800">{w.draws?.date || 'Unknown'}</span></p>
                                    <p className="text-2xl font-bold text-green-600">₹{Number(w.prize_amount).toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {w.match_count} Matches:
                                        <div className="mt-2 space-y-1">
                                            {w.matched_details?.map((detail, idx) => (
                                                <span key={idx} className="block font-bold text-indigo-700 text-xs bg-indigo-50 px-2 py-1 rounded w-fit">{detail}</span>
                                            ))}
                                        </div>
                                    </p>
                                </div>

                                <div className="flex flex-col items-start md:items-end gap-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide ${w.status === 'paid' ? 'bg-green-100 text-green-800' : w.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {w.status}
                                    </span>

                                    {w.status === 'rejected' && (
                                        <div className="mt-2 text-right">
                                            <p className="text-sm text-red-600 font-bold mb-2">Verification Rejected - Please re-upload valid proof of ID</p>
                                            <div>
                                                <label className="cursor-pointer inline-flex items-center gap-2 bg-red-50 text-red-700 px-4 py-2 rounded-lg font-bold hover:bg-red-100 transition-colors">
                                                    {uploadingId === w.id ? 'Uploading...' : <><UploadCloud size={18} /> Try Uploading Again</>}
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        accept="image/png, image/jpeg"
                                                        onChange={(e) => handleUpload(e, w.id)}
                                                        disabled={uploadingId === w.id}
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                    )}

                                    {w.status === 'pending' && (
                                        <div className="mt-2 text-right">
                                            {w.screenshot_url ? (
                                                <p className="text-sm text-indigo-600 font-bold">Verification Submitted - Awaiting Admin Review</p>
                                            ) : (
                                                <div>
                                                    <label className="cursor-pointer inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg font-medium hover:bg-indigo-100 transition-colors">
                                                        {uploadingId === w.id ? 'Uploading...' : <><UploadCloud size={18} /> Upload Proof of ID</>}
                                                        <input
                                                            type="file"
                                                            className="hidden"
                                                            accept="image/png, image/jpeg"
                                                            onChange={(e) => handleUpload(e, w.id)}
                                                            disabled={uploadingId === w.id}
                                                        />
                                                    </label>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
