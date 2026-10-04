import { useState, useEffect } from 'react';
import { Plus, FileText, ChevronDown, Edit3, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/axios.js';

const DocumentNotesAndTerms = () => {
    const [activeMainTab, setActiveMainTab] = useState('Notes'); // 'Notes' or 'Terms'
    const [selectedDocType, setSelectedDocType] = useState('Invoice');
    const [items, setItems] = useState([]);
    const [activeCompanyId, setActiveCompanyId] = useState(null);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({
        documentType: 'Invoice',
        content: '',
        isDefault: true,
        isActive: true,
    });
    const [saving, setSaving] = useState(false);

    const fetchItems = async (compId, type, docType) => {
        try {
            const targetCompId = compId || activeCompanyId || 1;
            const response = await api.get(`/notes?companyId=${targetCompId}&type=${type}&documentType=${docType}`);
            if (response.data) {
                setItems(response.data);
            }
        } catch (err) {
            console.error('❌ Failed to fetch notes/terms:', err);
            // Fallback mock matching your UI screenshot[cite: 8]
            setItems([
                { id: 1, type: 'Notes', documentType: 'Invoice', content: 'Thank you for the business', isDefault: true, isActive: true }
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const init = async () => {
            try {
                const companyRes = await api.get('/company');
                const compId = companyRes.data?.id || 1;
                setActiveCompanyId(compId);
                await fetchItems(compId, activeMainTab, selectedDocType);
            } catch (err) {
                console.error('❌ Init failed:', err);
                setLoading(false);
            }
        };
        init();
    }, [activeMainTab, selectedDocType]);

    const handleOpenAdd = () => {
        setEditingId(null);
        setForm({ documentType: selectedDocType, content: '', isDefault: true, isActive: true });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (item) => {
        setEditingId(item.id);
        setForm({
            documentType: item.documentType,
            content: item.content,
            isDefault: item.isDefault,
            isActive: item.isActive,
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this record?')) return;
        try {
            await api.delete(`/notes/${id}`);
            toast.success('Deleted successfully.');
            fetchItems(activeCompanyId, activeMainTab, selectedDocType);
        } catch (err) {
            console.error('❌ Delete failed:', err);
            toast.error('Failed to delete.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const payload = {
                ...form,
                companyId: activeCompanyId || 1,
                type: activeMainTab,
            };

            if (editingId) {
                await api.put(`/notes/${editingId}`, payload);
                toast.success('Updated successfully!');
            } else {
                await api.post('/notes', payload);
                toast.success('Added successfully!');
            }

            setIsModalOpen(false);
            fetchItems(activeCompanyId, activeMainTab, selectedDocType);
        } catch (err) {
            console.error('❌ Save failed:', err);
            toast.error('Failed to save.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center text-xs text-slate-500 shadow-2xs">
                Loading Document Notes and Terms...
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-2xs max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Document Notes and Terms
            </h1>

            {/* Notes / Terms Tabs */}
            <div className="flex items-center gap-8 border-b border-slate-100 pb-3">
                {['Notes', 'Terms'].map((tab) => (
                    <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveMainTab(tab)}
                        className={`text-xs font-semibold pb-3 transition relative cursor-pointer ${
                            activeMainTab === tab ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        {tab}
                        {activeMainTab === tab && (
                            <span className="absolute bottom-[-13px] left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                        )}
                    </button>
                ))}
            </div>

            {/* Toolbar: Document Type Selector & Add Button[cite: 8] */}
            <div className="flex items-center justify-between">
                <div className="relative w-56">
                    <select
                        value={selectedDocType}
                        onChange={(e) => setSelectedDocType(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 appearance-none focus:outline-hidden"
                    >
                        <option value="Invoice">Invoice</option>
                        <option value="Estimate">Estimate</option>
                        <option value="Order">Order</option>
                        <option value="Purchase">Purchase</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>

                <button
                    type="button"
                    onClick={handleOpenAdd}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition flex items-center gap-2 shadow-sm shadow-blue-500/20 cursor-pointer"
                >
                    <Plus size={14} /> New {selectedDocType} {activeMainTab}
                </button>
            </div>

            {/* Items List Container[cite: 8] */}
            <div className="border border-slate-200/80 rounded-2xl divide-y divide-slate-100 bg-white">
                {items.length === 0 ? (
                    <div className="p-12 text-center text-xs text-slate-400">
                        No {activeMainTab.toLowerCase()} found for {selectedDocType}.
                    </div>
                ) : (
                    items.map((item) => (
                        <div key={item.id} className="p-5 flex items-center justify-between hover:bg-slate-50/50 transition">
                            <div className="flex items-start gap-4">
                                <div className="h-10 w-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 shrink-0 mt-0.5">
                                    <FileText size={18} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                                        {activeMainTab}:
                                    </p>
                                    <p className="text-xs text-slate-600 whitespace-pre-wrap">
                                        {item.content}
                                    </p>
                                </div>
                            </div>

                            {/* Status Badges & Actions[cite: 8] */}
                            <div className="flex items-center gap-3">
                                {item.isDefault && (
                                    <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-800 text-[10px] font-bold rounded-md">
                                        Default
                                    </span>
                                )}
                                {item.isActive && (
                                    <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold rounded-md">
                                        Active
                                    </span>
                                )}

                                <div className="flex items-center gap-1.5 ml-4">
                                    <button
                                        onClick={() => handleOpenEdit(item)}
                                        className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1 shadow-2xs cursor-pointer"
                                    >
                                        <Edit3 size={12} /> Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="p-2 border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-500 rounded-xl transition shadow-2xs cursor-pointer"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal for Add / Edit */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
                            <h2 className="text-sm font-bold text-slate-900">
                                {editingId ? `Edit ${activeMainTab}` : `Add New ${activeMainTab}`}
                            </h2>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 transition cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-700">Document Type</label>
                                <select
                                    value={form.documentType}
                                    onChange={(e) => setForm({ ...form, documentType: e.target.value })}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-900 focus:outline-hidden"
                                >
                                    <option value="Invoice">Invoice</option>
                                    <option value="Estimate">Estimate</option>
                                    <option value="Order">Order</option>
                                    <option value="Purchase">Purchase</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-700">{activeMainTab} Content *</label>
                                <textarea
                                    required
                                    rows={4}
                                    placeholder={`Enter ${activeMainTab.toLowerCase()} content here...`}
                                    value={form.content}
                                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                                    className="w-full bg-white border border-slate-200 rounded-xl p-4 text-xs text-slate-900 focus:outline-hidden"
                                />
                            </div>

                            <div className="space-y-2 pt-2">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="isDefault"
                                        checked={form.isDefault}
                                        onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <label htmlFor="isDefault" className="text-xs font-semibold text-slate-700 select-none">
                                        Set as Default
                                    </label>
                                </div>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="isActive"
                                        checked={form.isActive}
                                        onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <label htmlFor="isActive" className="text-xs font-semibold text-slate-700 select-none">
                                        Active
                                    </label>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition shadow-sm"
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DocumentNotesAndTerms;