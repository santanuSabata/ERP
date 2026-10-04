import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, ChevronLeft, ChevronRight, Edit3, Trash2, Building2, Phone, Mail, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/axios.js';

const Warehouses = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('All'); // 'All', 'Deleted'
    const [searchQuery, setSearchQuery] = useState('');
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(true);

    // Get active company ID from localStorage matching Topbar / other modules
    const [activeCompanyId, setActiveCompanyId] = useState(() => localStorage.getItem('activeCompanyId') || 1);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);

    const fetchWarehouses = async (compId, tab, search, page, limit) => {
        try {
            setLoading(true);
            const targetCompId = compId || localStorage.getItem('activeCompanyId') || 1;
            const res = await api.get(`/warehouses?companyId=${targetCompId}&tab=${tab}&search=${search || ''}&page=${page}&limit=${limit}`);
            if (res.data) {
                setWarehouses(res.data.data || []);
                setTotalCount(res.data.totalCount || 0);
            }
        } catch (err) {
            console.error('❌ Failed to fetch warehouses:', err);
            toast.error('Could not load warehouses');
        } finally {
            setLoading(false);
        }
    };

    // Re-fetch whenever company changes in localStorage or tab/pagination changes
    useEffect(() => {
        const storedCompId = localStorage.getItem('activeCompanyId') || 1;
        setActiveCompanyId(storedCompId);
        fetchWarehouses(storedCompId, activeTab, searchQuery, currentPage, perPage);
    }, [activeTab, currentPage, perPage]);

    const handleSearchChange = (e) => {
        const val = e.target.value;
        setSearchQuery(val);
        setCurrentPage(1);
        fetchWarehouses(activeCompanyId, activeTab, val, 1, perPage);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this warehouse?')) return;
        try {
            await api.delete(`/warehouses/${id}`);
            toast.success('Warehouse deleted successfully.');
            fetchWarehouses(activeCompanyId, activeTab, searchQuery, currentPage, perPage);
        } catch (err) {
            console.error('❌ Delete failed:', err);
            toast.error('Failed to delete warehouse.');
        }
    };

    const totalPages = Math.ceil(totalCount / perPage) || 1;

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans text-slate-900 px-4 sm:px-6 lg:px-8">
            
            {/* Header */}
            <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-100 shadow-2xs">
                <div>
                    <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Warehouse Management</h1>
                    <p className="text-xs text-slate-400 mt-0.5">Manage storage locations, stock depots, and fulfillment centers for Company ID: {activeCompanyId}</p>
                </div>
                <button 
                    onClick={() => navigate('/warehouses/add')}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition"
                >
                    <Plus size={15} /> Add Warehouse
                </button>
            </div>

            {/* Tabs & Search */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-3">
                    <div className="flex items-center gap-6">
                        {['All', 'Deleted'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
                                className={`text-xs font-semibold pb-1 transition relative cursor-pointer ${activeTab === tab ? 'text-blue-600' : 'text-slate-400 hover:text-slate-700'}`}
                            >
                                {tab === 'All' ? `All Warehouses (${totalCount})` : 'Deleted'}
                                {activeTab === tab && <span className="absolute bottom-[-13px] left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full sm:max-w-sm">
                        <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
                        <input 
                            type="text" placeholder="Search warehouses by name, city, code..." value={searchQuery} onChange={handleSearchChange}
                            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="bg-slate-50/80 text-slate-400 uppercase font-extrabold border-b border-slate-100 text-[10px] tracking-wider">
                                <th className="py-3 px-4">Warehouse Name</th>
                                <th className="py-3 px-4">Code</th>
                                <th className="py-3 px-4">Contact Info</th>
                                <th className="py-3 px-4">Location</th>
                                <th className="py-3 px-4">Status</th>
                                <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-slate-400">Loading warehouses...</td>
                                </tr>
                            ) : warehouses.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-slate-400">No warehouses found for this company.</td>
                                </tr>
                            ) : (
                                warehouses.map(w => (
                                    <tr key={w.id} className="hover:bg-slate-50/80 transition relative group">
                                        <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2.5">
                                            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                                <Building2 size={14} />
                                            </div>
                                            <span>{w.name}</span>
                                        </td>
                                        <td className="py-3.5 px-4 font-mono text-slate-500">{w.code || '—'}</td>
                                        <td className="py-3.5 px-4 space-y-0.5">
                                            <div className="flex items-center gap-1.5 text-slate-600">
                                                <Phone size={12} className="text-slate-400 shrink-0" />
                                                <span>{w.phone || '—'}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                                                <Mail size={12} className="shrink-0" />
                                                <span>{w.email || '—'}</span>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="flex items-center gap-1 text-slate-700">
                                                <MapPin size={12} className="text-slate-400 shrink-0" />
                                                <span>{w.city ? `${w.city}, ${w.state}` : '—'}</span>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            {w.isPrimary ? (
                                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-bold">Primary</span>
                                            ) : (
                                                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-semibold">Secondary</span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4 text-right space-x-1">
                                            <button 
                                                onClick={() => navigate(`/warehouses/edit/${w.id}`)} 
                                                className="p-1.5 text-slate-400 hover:text-violet-600 transition cursor-pointer"
                                                title="Edit Warehouse"
                                            >
                                                <Edit3 size={15} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(w.id)} 
                                                className="p-1.5 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                                                title="Delete Warehouse"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs">
                    <div className="text-slate-500">
                        Showing page {currentPage} of {totalPages} ({totalCount} total warehouses)
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                        >
                            <ChevronLeft size={14} />
                        </button>
                        <button 
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                        >
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Warehouses;