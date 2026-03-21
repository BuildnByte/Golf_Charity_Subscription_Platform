import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Plus, Edit, Trash2, ArrowLeft, X, Save } from 'lucide-react';

export default function AdminCharitiesPanel() {
    const [charities, setCharities] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCharity, setEditingCharity] = useState(null);

    const [formData, setFormData] = useState({
        name: '', description: '', image_url: '', is_featured: false, upcoming_events: ''
    });

    useEffect(() => {
        fetchCharities();
    }, []);

    const fetchCharities = async () => {
        try {
            const res = await api.get('/charities');
            setCharities(res.data.charities);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (charity = null) => {
        if (charity) {
            setEditingCharity(charity);
            setFormData({
                name: charity.name || '',
                description: charity.description || '',
                image_url: charity.image_url || '',
                is_featured: charity.is_featured || false,
                upcoming_events: charity.upcoming_events ? JSON.stringify(charity.upcoming_events) : ''
            });
        } else {
            setEditingCharity(null);
            setFormData({ name: '', description: '', image_url: '', is_featured: false, upcoming_events: '' });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingCharity) {
                await api.put(`/admin/charities/${editingCharity.id}`, formData);
            } else {
                await api.post('/admin/charities', formData);
            }
            setIsModalOpen(false);
            fetchCharities();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to save charity');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this charity? All associated user selections might be affected.')) return;
        try {
            await api.delete(`/admin/charities/${id}`);
            fetchCharities();
        } catch (err) {
            alert('Failed to delete charity');
        }
    };

    return (
        <div className="min-h-screen bg-transparent pb-12">
            <div className="max-w-6xl mx-auto px-4 mt-8">
                <Link to="/admin" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors font-medium">
                    <ArrowLeft size={16} /> Admin Dashboard
                </Link>

                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Charity Directory</h2>
                        <p className="text-gray-500 mt-1 font-medium">Add, edit, or remove organizations from the public portal.</p>
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 font-bold shadow-md hover:bg-indigo-700 transition"
                    >
                        <Plus size={20} /> Add Charity
                    </button>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-500 font-medium">Loading directory...</div>
                ) : (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="p-4 uppercase text-xs font-bold text-gray-500 tracking-wider">Charity Details</th>
                                    <th className="p-4 uppercase text-xs font-bold text-gray-500 tracking-wider">Status</th>
                                    <th className="p-4 uppercase text-xs font-bold text-gray-500 tracking-wider text-right">Raised</th>
                                    <th className="p-4 uppercase text-xs font-bold text-gray-500 tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {charities.map(c => (
                                    <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4 flex items-center gap-4">
                                            <div className="w-16 h-12 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                                                <img src={c.image_url || `https://placehold.co/800x400/4f46e5/ffffff?text=${encodeURIComponent(c.name)}&font=Montserrat`} alt={c.name} className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">{c.name}</p>
                                                <p className="text-xs text-gray-500 truncate max-w-md">{c.description}</p>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {c.is_featured ? (
                                                <span className="bg-yellow-100 text-yellow-800 text-xs font-black px-2 py-1 rounded uppercase tracking-wide">Featured</span>
                                            ) : (
                                                <span className="text-gray-400 text-sm font-medium">Standard</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            <span className="font-extrabold text-green-600 tracking-tight">₹{(c.amount_raised || 0).toLocaleString()}</span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => handleOpenModal(c)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit size={18} /></button>
                                                <button onClick={() => handleDelete(c.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {charities.length === 0 && <tr><td colSpan="3" className="p-8 text-center text-gray-500 font-medium">No charities found. Add one to start.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                        <div className="bg-indigo-600 p-6 text-white flex justify-between items-center flex-shrink-0">
                            <h3 className="text-xl font-black">{editingCharity ? 'Edit Charity' : 'Add New Charity'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white transition-colors bg-white/20 p-1.5 rounded-full"><X size={20} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1">
                            <form id="charityForm" onSubmit={handleSave} className="space-y-5">
                                <div className="space-y-1">
                                    <label className="text-sm font-bold text-gray-700">Organization Name *</label>
                                    <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-medium" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-bold text-gray-700">Description</label>
                                    <textarea rows="3" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-medium resize-none"></textarea>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-bold text-gray-700">Image Output URL</label>
                                    <input type="url" value={formData.image_url} onChange={e => setFormData({ ...formData, image_url: e.target.value })} placeholder="https://example.com/image.jpg" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-medium" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Upcoming Events (JSON Array)</label>
                                    <textarea rows="2" value={formData.upcoming_events} placeholder='[{"title":"Golf Day","date":"2026-05-10"}]' onChange={e => setFormData({ ...formData, upcoming_events: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-medium font-mono text-sm"></textarea>
                                    <p className="text-xs text-gray-500">Must be a valid JSON array of objects with title and date, or leave completely empty.</p>
                                </div>
                                <div className="flex items-center gap-3 pt-2">
                                    <input type="checkbox" id="featuredToggle" checked={formData.is_featured} onChange={e => setFormData({ ...formData, is_featured: e.target.checked })} className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500" />
                                    <label htmlFor="featuredToggle" className="text-sm font-bold text-gray-900 cursor-pointer">Set as Spotlight Charity (Homepage feature)</label>
                                </div>
                            </form>
                        </div>
                        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0">
                            <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-700 font-bold hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
                            <button type="submit" form="charityForm" className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg flex gap-2 items-center font-bold hover:bg-indigo-700 transition shadow-md"><Save size={18} /> Save Changes</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
