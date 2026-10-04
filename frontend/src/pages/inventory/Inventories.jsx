import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, ChevronLeft, ChevronRight, ArrowDownLeft, ArrowUpRight, Trash2, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/axios.js';

const Inventories = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [inventories, setInventories] = useState([]);
    const [activeCompanyId, setActiveCompanyId] = useState(null);
    const [loading, setLoading] = useState(true);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);

    const fetchInventories = async (compId, search, page, limit) => {
        try {
            setLoading(true);
            const targetCompId = compId || activeCompanyId || 1;
            const res = await api.get(`/inventory?companyId=${targetCompId}&search=${search || ''}&page=${page}&limit=${limit}`);
            if (res.data) {
                setInventories(res.data.data || []);
                setTotalCount(res.data.totalCount || 0);
            }
        } catch (err) {
            console.error('❌ Failed to fetch inventories:', err);
            toast.error('Could not load inventory logs');
        } finally {
            setLoading(false);
        }
    };

    // 1. Fetch Company ID on mount
    useEffect(() => {
        const fetchCompany = async () => {
            try {
                const companyRes = await api.get('/company');
                const compId = companyRes.data?.id || 1;
                setActiveCompanyId(compId);
            } catch (err) {
                console.error('❌ Failed to fetch company ID, falling back to 1:', err);
                setActiveCompanyId(1);
            }
        };
        fetchCompany();
    }, []);

    // 2. Fetch inventories whenever activeCompanyId, currentPage, or perPage changes
    useEffect(() => {
        if (activeCompanyId) {
            fetchInventories(activeCompanyId, searchQuery, currentPage, perPage);
        }
    }, [activeCompanyId, currentPage, perPage]);

    const handleSearchChange = (e) => {
        const val = e.target.value;
        setSearchQuery(val);
        setCurrentPage(1);
        fetchInventories(activeCompanyId, val, 1, perPage);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this stock transaction?')) return;
        try {
            await api.delete(`/inventory/${id}`);
            toast.success('Transaction log deleted.');
            fetchInventories(activeCompanyId, searchQuery, currentPage, perPage);
        } catch (err) {
            console.error('❌ Delete failed:', err);
            toast.error('Failed to delete transaction.');
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const totalPages = Math.ceil(totalCount / perPage) || 1;

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans text-slate-900">
            
            {/* Top Title Bar */}
            <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-100 shadow-2xs">
                <div>
                    <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Inventory Stock Logs</h1>
                    <p className="text-xs text-slate-400 mt-0.5">Track stock adjustments, stock-in, stock-out, and warehouse movements.</p>
                </div>
                <button 
                    onClick={() => navigate('/inventory/add')}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition"
                >
                    <Plus size={15} /> Stock Adjustment
                </button>
            </div>

            {/* Search & Filter Bar */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="relative max-w-sm flex-1">
                        <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
                        <input 
                            type="text" placeholder="Search by item name, type, ref no..." value={searchQuery} onChange={handleSearchChange}
                            className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="bg-slate-50/80 text-slate-400 uppercase font-extrabold border-b border-slate-100 text-[10px] tracking-wider">
                                <th className="py-3 px-4">Item Name</th>
                                <th className="py-3 px-4">Type</th>
                                <th className="py-3 px-4">Quantity</th>
                                <th className="py-3 px-4">Warehouse</th>
                                <th className="py-3 px-4">Reference No</th>
                                <th className="py-3 px-4">Date / Created By</th>
                                <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-slate-400">Loading inventory logs...</td>
                                </tr>
                            ) : inventories.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-slate-400">No inventory logs found.</td>
                                </tr>
                            ) : (
                                inventories.map(item => {
                                    const isIn = item.transactionType === 'Stock In';
                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50/80 transition relative group">
                                            <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2.5">
                                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isIn ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                    {isIn ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                                                </div>
                                                <span>{item.productName}</span>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${isIn ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                                    {item.transactionType}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                                                {isIn ? `+${item.quantity}` : `-${item.quantity}`} <span className="text-[10px] font-normal uppercase text-slate-500">{item.unit}</span>
                                            </td>
                                            <td className="py-3.5 px-4 text-slate-600">{item.warehouseName}</td>
                                            <td className="py-3.5 px-4 font-mono text-slate-500">{item.referenceNo || '—'}</td>
                                            <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                                                <p>{formatDate(item.createdAt)}</p>
                                                <p className="text-[10px] text-slate-400">by {item.createdBy}</p>
                                            </td>
                                            <td className="py-3.5 px-4 text-right space-x-1">
                                                <button 
                                                    onClick={() => navigate(`/inventory/edit/${item.id}`)} 
                                                    className="p-1.5 text-slate-400 hover:text-violet-600 transition cursor-pointer"
                                                    title="Edit Stock Log"
                                                >
                                                    <Edit3 size={15} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(item.id)} 
                                                    className="p-1.5 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                                                    title="Delete Transaction Log"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs">
                    <div className="text-slate-500">
                        Showing page {currentPage} of {totalPages} ({totalCount} entries)
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

export default Inventories;