import { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Edit3, ChevronRight, GripVertical } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/axios.js';

const CrmSettings = () => {
    const [activeTab, setActiveTab] = useState('pipeline');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [limit, setLimit] = useState(10);
    const [page, setPage] = useState(1);
    
    // Modal state for adding/editing items
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);
    const [nameInput, setNameInput] = useState('');

    // Drag-and-drop state
    const [draggedItemIndex, setDraggedItemIndex] = useState(null);

    const fetchTabData = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/crm-settings/meta/${activeTab}`, {
                params: { search, page, limit }
            });
            if (res.data?.success) {
                setItems(res.data.data || []);
            }
        } catch (err) {
            setItems([
                { id: 1, name: activeTab === 'pipeline' ? 'Sales' : `Sample ${activeTab.replace('-', ' ')} 1`, display_order: 1 }
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTabData();
    }, [activeTab, search, page, limit]);

    const handleSave = async (e) => {
        e.preventDefault();
        if (!nameInput.trim()) return toast.error('Please enter a name.');

        try {
            if (currentItem) {
                await api.put(`/crm-settings/meta/${activeTab}/${currentItem.id}`, { name: nameInput });
                toast.success('Updated successfully!');
            } else {
                await api.post(`/crm-settings/meta/${activeTab}`, { name: nameInput, display_order: items.length + 1 });
                toast.success('Created successfully!');
            }
            setIsModalOpen(false);
            setNameInput('');
            setCurrentItem(null);
            fetchTabData();
        } catch (err) {
            toast.error('Operation failed.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this item?')) return;
        try {
            await api.delete(`/crm-settings/meta/${activeTab}/${id}`);
            toast.success('Deleted successfully!');
            fetchTabData();
        } catch (err) {
            toast.error('Failed to delete item.');
        }
    };

    // Drag and Drop Handlers for Up/Down Reordering
    const handleDragStart = (e, index) => {
        setDraggedItemIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        if (draggedItemIndex === null || draggedItemIndex === index) return;

        const updatedItems = [...items];
        const draggedItem = updatedItems[draggedItemIndex];
        updatedItems.splice(draggedItemIndex, 1);
        updatedItems.splice(index, 0, draggedItem);

        setDraggedItemIndex(index);
        setItems(updatedItems);
    };

    const handleDragEnd = async () => {
        setDraggedItemIndex(null);
        try {
            const reorderedPayload = items.map((item, idx) => ({ id: item.id, display_order: idx + 1 }));
            await api.post(`/crm-settings/meta/${activeTab}/reorder`, { orderedIds: reorderedPayload.map(i => i.id) });
            toast.success('Order updated successfully!');
        } catch (err) {
            console.error('Failed to update sort order:', err);
            fetchTabData(); // Revert on failure
        }
    };

    const tabLabels = [
        { id: 'products', label: 'Products' },
        { id: 'pipeline', label: 'Pipeline' },
        { id: 'lead-stages', label: 'Lead Stages' },
        { id: 'deal-stages', label: 'Deal Stages' },
        { id: 'sources', label: 'Sources' },
        { id: 'labels', label: 'Labels' },
        { id: 'contract-type', label: 'Contract Type' } 
    ];

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 space-y-6 pb-20 font-sans text-slate-900">
            
            {/* Header Title & Top-Right Add Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight capitalize">
                        Manage {activeTab.replace('-', ' ')}
                    </h1>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                        <span className="text-blue-600 font-semibold cursor-pointer">Dashboard</span>
                        <span>›</span>
                        <span className="text-slate-600 capitalize">{activeTab.replace('-', ' ')}</span>
                    </div>
                </div>

                <button 
                    onClick={() => { setCurrentItem(null); setNameInput(''); setIsModalOpen(true); }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                    <Plus size={16} />
                </button>
            </div>

            {/* Layout Container: Left CRM Tabs + Right Main Content Card */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left Navigation Sidebar Tabs */}
                <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                    <div className="divide-y divide-slate-100 text-xs font-semibold">
                        {tabLabels.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full px-5 py-4 text-left flex items-center justify-between transition cursor-pointer ${
                                    activeTab === tab.id ? 'bg-slate-900 text-white font-bold' : 'text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                <span>{tab.label}</span>
                                <ChevronRight size={14} className={activeTab === tab.id ? 'text-white' : 'text-slate-400'} />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right Main Panel Card */}
                <div className="lg:col-span-9 bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 space-y-4">
                    
                    {/* Controls Bar: Entries Per Page & Search */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2 text-xs text-slate-600 w-full sm:w-auto">
                            <select 
                                value={limit} 
                                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden cursor-pointer"
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </select>
                            <span>entries per page</span>
                        </div>

                        <div className="relative w-full sm:w-64">
                            <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
                            <input 
                                type="text" placeholder="Search..." 
                                value={search} onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-blue-600" 
                            />
                        </div>
                    </div>

                    {/* Data Table with Drag & Drop Sorting Support */}
                    <div className="border border-slate-100 rounded-2xl overflow-hidden">
                        <div className="grid grid-cols-12 bg-slate-50/80 border-b border-slate-200/60 px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            <div className="col-span-1"></div>
                            <div className="col-span-9 uppercase">{activeTab.replace('-', ' ')} (Drag to Reorder) ↕</div>
                            <div className="col-span-2 text-right">ACTION ↕</div>
                        </div>
                        <div className="divide-y divide-slate-100 text-xs bg-white">
                            {loading ? (
                                <div className="p-8 text-center text-slate-400">Loading entries...</div>
                            ) : items.length === 0 ? (
                                <div className="p-8 text-center text-slate-400">No entries found.</div>
                            ) : (
                                items.map((item, index) => (
                                    <div 
                                        key={item.id} 
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, index)}
                                        onDragOver={(e) => handleDragOver(e, index)}
                                        onDragEnd={handleDragEnd}
                                        className="grid grid-cols-12 items-center px-6 py-3.5 hover:bg-slate-50/80 transition cursor-grab active:cursor-grabbing"
                                    >
                                        <div className="col-span-1 text-slate-400">
                                            <GripVertical size={16} />
                                        </div>
                                        <div className="col-span-9 font-bold text-slate-900">{item.name}</div>
                                        <div className="col-span-2 text-right flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => { setCurrentItem(item); setNameInput(item.name); setIsModalOpen(true); }} 
                                                className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl cursor-pointer shadow-2xs" 
                                                title="Edit"
                                            >
                                                <Edit3 size={14} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(item.id)} 
                                                className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl cursor-pointer shadow-2xs" 
                                                title="Delete"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Footer Entry Count Summary */}
                    <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
                        <span>Showing 1 to {items.length} of {items.length} entries</span>
                    </div>

                </div>
            </div>

            {/* Add / Edit Modal Drawer */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-4 font-sans">
                    <div className="bg-white w-full max-w-md p-6 rounded-3xl shadow-2xl space-y-4">
                        <h2 className="text-sm font-bold text-slate-900">
                            {currentItem ? `Edit ${activeTab.replace('-', ' ')}` : `Add New ${activeTab.replace('-', ' ')}`}
                        </h2>
                        
                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700">Name / Title</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={nameInput} 
                                    onChange={(e) => setNameInput(e.target.value)} 
                                    placeholder="Enter title..." 
                                    className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-blue-600" 
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl cursor-pointer">Cancel</button>
                                <button type="submit" className="px-5 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm">Save Entry</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CrmSettings;