import { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/axios.js';

const DOCUMENT_TABS = [
    'Invoice', 
    'Purchase', 
    'Sales Return', 
    'Purchase Return', 
    'Purchase Order', 
    'Delivery Challan', 
    'Sales Order', 
    'Estimate',
    'Quotation',
    'Sales Debit Note'

];

const Prefix = () => {
    const [activeMainTab, setActiveMainTab] = useState('Prefixes'); // 'Prefixes' or 'Suffixes'
    const [activeDocTab, setActiveDocTab] = useState('Invoice');
    const [prefixes, setPrefixes] = useState([]);
    const [activeCompanyId, setActiveCompanyId] = useState(null);
    const [loading, setLoading] = useState(false);

    // Inline Form State (for adding or editing directly on the same view)
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [prefixValueInput, setPrefixValueInput] = useState('');
    const [isDefaultInput, setIsDefaultInput] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        api.get('/company')
            .then(res => setActiveCompanyId(res.data?.id || res.data?.data?.id || 1))
            .catch(() => setActiveCompanyId(1));
    }, []);

    const fetchPrefixes = async () => {
        if (!activeCompanyId) return;
        try {
            setLoading(true);
            const entryType = activeMainTab === 'Prefixes' ? 'prefix' : 'suffix';
            const res = await api.get(`/prefix?companyId=${activeCompanyId}&documentType=${activeDocTab}&entryType=${entryType}`);
            setPrefixes(res.data?.data || []);
        } catch (err) {
            console.error('Failed to load prefixes', err);
            toast.error('Could not load configurations');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPrefixes();
        setIsFormOpen(false); // Close form when switching tabs
        setEditingId(null);
    }, [activeCompanyId, activeMainTab, activeDocTab]);

    const handleOpenAdd = () => {
        setEditingId(null);
        setPrefixValueInput('');
        setIsDefaultInput(false);
        setIsFormOpen(true);
    };

    const handleOpenEdit = (item) => {
        setEditingId(item.id);
        setPrefixValueInput(item.prefix_value);
        setIsDefaultInput(item.is_default);
        setIsFormOpen(true);
    };

    const handleSaveInline = async (e) => {
        e.preventDefault();
        if (!prefixValueInput.trim()) {
            toast.error('Please enter a value.');
            return;
        }

        try {
            setSubmitting(true);
            const entryType = activeMainTab === 'Prefixes' ? 'prefix' : 'suffix';
            const payload = {
                companyId: activeCompanyId,
                documentType: activeDocTab,
                entryType,
                prefixValue: prefixValueInput.trim(),
                isDefault: isDefaultInput
            };

            if (editingId) {
                await api.put(`/prefix/${editingId}`, payload);
                toast.success('Updated successfully!');
            } else {
                await api.post('/prefix', payload);
                toast.success('Created successfully!');
            }

            setIsFormOpen(false);
            setEditingId(null);
            setPrefixValueInput('');
            fetchPrefixes();
        } catch (err) {
            console.error('Failed to save configuration:', err);
            toast.error('Failed to save configuration.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this configuration?')) return;
        try {
            await api.delete(`/prefix/${id}`);
            toast.success('Deleted successfully');
            fetchPrefixes();
        } catch (err) {
            toast.error('Failed to delete');
        }
    };

    const handleToggleDefault = async (item) => {
        try {
            const entryType = activeMainTab === 'Prefixes' ? 'prefix' : 'suffix';
            await api.put(`/prefix/${item.id}`, {
                companyId: activeCompanyId,
                documentType: item.document_type,
                entryType,
                prefixValue: item.prefix_value,
                isDefault: !item.is_default
            });
            toast.success('Default status updated');
            fetchPrefixes();
        } catch (err) {
            toast.error('Failed to update default status');
        }
    };

    const entryLabel = activeMainTab === 'Prefixes' ? 'Prefix' : 'Suffix';

    return (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-2xs p-6 sm:p-8 font-sans text-slate-900 space-y-6">
            
            {/* Top Main Navigation Header (Prefixes / Suffixes & Add Button)[cite: 4] */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex gap-8">
                    {['Prefixes', 'Suffixes'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveMainTab(tab)}
                            className={`text-sm font-bold pb-4 -mb-4 transition cursor-pointer ${activeMainTab === tab ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-400 hover:text-slate-700'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                <button 
                    onClick={handleOpenAdd}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-4 py-2 rounded-xl transition cursor-pointer shadow-2xs"
                >
                    <Plus size={15} /> Add {entryLabel}
                </button>
            </div>

            {/* Document Type Sub-Tabs (Invoice, Purchase, etc.)[cite: 4] */}
            <div className="flex items-center gap-6 overflow-x-auto pb-2 border-b border-slate-100 text-xs">
                {DOCUMENT_TABS.map(doc => (
                    <button
                        key={doc}
                        onClick={() => setActiveDocTab(doc)}
                        className={`font-bold pb-2 transition cursor-pointer whitespace-nowrap ${activeDocTab === doc ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-700'}`}
                    >
                        {doc}
                    </button>
                ))}
            </div>

            {/* Data Table Layout matching reference[cite: 4] */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                    <thead>
                        <tr className="bg-slate-50/80 text-slate-400 uppercase font-extrabold border-b border-slate-100 text-[10px] tracking-wider">
                            <th className="py-3 px-4">{entryLabel}</th>
                            <th className="py-3 px-4 text-center w-36">Default</th>
                            <th className="py-3 px-4 text-right w-36">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {loading ? (
                            <tr>
                                <td colSpan={3} className="py-12 text-center text-slate-400">Loading configurations...</td>
                            </tr>
                        ) : prefixes.length === 0 && !isFormOpen ? (
                            <tr>
                                <td colSpan={3} className="py-10 text-center text-slate-400">No {activeMainTab.toLowerCase()} configured for {activeDocTab}.</td>
                            </tr>
                        ) : null}

                        {/* Render existing rows */}
                        {prefixes.map(item => (
                            <tr key={item.id} className="hover:bg-slate-50/80 transition">
                                <td className="py-4 px-4 font-mono font-bold text-slate-900 text-sm">
                                    {item.prefix_value}
                                </td>
                                <td className="py-4 px-4 text-center">
                                    <button 
                                        onClick={() => handleToggleDefault(item)}
                                        className={`w-10 h-6 flex items-center rounded-full p-1 transition cursor-pointer mx-auto ${item.is_default ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start'}`}
                                    >
                                        <div className="bg-white w-4 h-4 rounded-full shadow-md"></div>
                                    </button>
                                </td>
                                <td className="py-4 px-4 text-right space-x-2">
                                    <button 
                                        onClick={() => handleOpenEdit(item)} 
                                        className="px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-xl font-bold transition cursor-pointer inline-flex items-center gap-1 border border-amber-200/50"
                                    >
                                        <Edit3 size={13} /> Edit
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(item.id)} 
                                        className="p-1.5 text-slate-400 hover:text-rose-600 transition cursor-pointer inline-block"
                                        title="Delete"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </td>
                            </tr>
                        ))}

                        {/* Inline Add / Edit Form Row */}
                        {isFormOpen && (
                            <tr className="bg-blue-50/30">
                                <td colSpan={3} className="p-4">
                                    <form onSubmit={handleSaveInline} className="flex flex-col sm:flex-row items-center gap-3">
                                        <div className="flex-1 w-full">
                                            <input 
                                                type="text"
                                                required
                                                autoFocus
                                                placeholder={`Enter ${entryLabel.toLowerCase()} (e.g. INV-)`}
                                                value={prefixValueInput}
                                                onChange={(e) => setPrefixValueInput(e.target.value)}
                                                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-hidden shadow-2xs"
                                            />
                                        </div>

                                        <div className="flex items-center gap-2 px-2">
                                            <input 
                                                type="checkbox"
                                                id="inlineDefault"
                                                checked={isDefaultInput}
                                                onChange={(e) => setIsDefaultInput(e.target.checked)}
                                                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                                            />
                                            <label htmlFor="inlineDefault" className="text-xs font-bold text-slate-700 cursor-pointer whitespace-nowrap">
                                                Default
                                            </label>
                                        </div>

                                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                            <button 
                                                type="button"
                                                onClick={() => { setIsFormOpen(false); setEditingId(null); }}
                                                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                type="submit"
                                                disabled={submitting}
                                                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 cursor-pointer"
                                            >
                                                <Save size={14} /> {submitting ? 'Saving...' : 'Save'}
                                            </button>
                                        </div>
                                    </form>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Dashed Add Action Bar exactly matching reference image[cite: 4] */}
            {!isFormOpen && (
                <div 
                    onClick={handleOpenAdd}
                    className="border-2 border-dashed border-blue-300 hover:border-blue-500 rounded-2xl p-4 text-center text-blue-600 font-bold text-xs cursor-pointer transition flex items-center justify-center gap-1.5 bg-blue-50/20"
                >
                    <Plus size={16} /> Add {entryLabel}
                </div>
            )}
        </div>
    );
};

export default Prefix;