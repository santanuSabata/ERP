import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, ChevronDown, ChevronLeft, ChevronRight, Eye, Edit3, Trash2, MessageCircle, MoreHorizontal, Upload, FileSpreadsheet, FileText, Edit, Sheet, Trash } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/axios.js';

const Customers = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('All'); // 'All', 'Groups', 'Deleted'
    const [searchQuery, setSearchQuery] = useState('');
    const [customers, setCustomers] = useState([]);
    const [summary, setSummary] = useState({ totalYouPay: 0, totalYouCollect: 0 });
    const [activeCompanyId, setActiveCompanyId] = useState(null);
    const [loading, setLoading] = useState(true);

    // Pagination & Per-Page States
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);

    // Dropdown States
    const [isActionsOpen, setIsActionsOpen] = useState(false);
    const [openRowMenuId, setOpenRowMenuId] = useState(null);

    const actionsRef = useRef(null);

    const fetchCustomers = async (compId, tab, search, page, limit) => {
        try {
            setLoading(true);
            const targetCompId = compId || activeCompanyId || 1;
            const response = await api.get(`/customers?companyId=${targetCompId}&tab=${tab}&search=${search || ''}&page=${page}&limit=${limit}`);
            if (response.data) {
                setCustomers(response.data.data);
                setSummary(response.data.summary);
                setTotalCount(response.data.totalCount || response.data.data.length);
            }
        } catch (err) {
            console.error('❌ Failed to fetch customers:', err);
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
                await fetchCustomers(compId, activeTab, searchQuery, currentPage, perPage);
            } catch (err) {
                console.error('❌ Init failed:', err);
                setLoading(false);
            }
        };
        init();
    }, [activeTab, currentPage, perPage]);

    // Close action dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (actionsRef.current && !actionsRef.current.contains(e.target)) {
                setIsActionsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearchChange = (e) => {
        const val = e.target.value;
        setSearchQuery(val);
        setCurrentPage(1); // Reset to first page on search
        fetchCustomers(activeCompanyId, activeTab, val, 1, perPage);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this customer?')) return;
        try {
            await api.delete(`/customers/${id}`);
            toast.success('Customer deleted successfully.');
            fetchCustomers(activeCompanyId, activeTab, searchQuery, currentPage, perPage);
        } catch (err) {
            console.error('❌ Delete failed:', err);
            toast.error('Failed to delete customer.');
        }
    };

    const getInitials = (name) => {
        if (!name) return 'C';
        const parts = name.split(' ');
        if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        return name.substring(0, 2).toUpperCase();
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return `Created: ${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}, ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
    };

    const totalPages = Math.ceil(totalCount / perPage) || 1;

    return (
        <div className="space-y-6 w-full px-6 py-6 pb-16 relative">
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">Customers</h1>
                    <span className="h-5 w-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">▶</span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-200/85 pb-2 overflow-x-auto">
                    <div className="flex items-center gap-8">
                        {[
                            { name: 'All Customers', count: totalCount },
                            { name: 'Groups', count: 0 },
                            { name: 'Deleted', count: 0 }
                        ].map((tab) => (
                            <button
                                key={tab.name}
                                type="button"
                                onClick={() => { setActiveTab(tab.name === 'All Customers' ? 'All' : tab.name); setCurrentPage(1); }}
                                className={`text-xs font-semibold pb-2.5 transition relative cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                                    (activeTab === 'All' && tab.name === 'All Customers') || activeTab === tab.name 
                                        ? 'text-blue-600' 
                                        : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                {tab.name}
                                {tab.name === 'All Customers' && (
                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-full">
                                        {totalCount}
                                    </span>
                                )}
                                {((activeTab === 'All' && tab.name === 'All Customers') || activeTab === tab.name) && (
                                    <span className="absolute bottom-[-9px] left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        {/* Actions Dropdown Menu */}
                        <div className="relative" ref={actionsRef}>
                            <button
                                type="button"
                                onClick={() => setIsActionsOpen(!isActionsOpen)}
                                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-2 cursor-pointer bg-white shadow-2xs"
                            >
                                Actions <ChevronDown size={14} className="text-slate-400" />
                            </button>

                            {isActionsOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in duration-150">
                                    <button onClick={() => { setIsActionsOpen(false); toast('Import clicked'); }} className="w-full px-4 py-2.5 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between cursor-pointer">
                                        <span className="flex items-center gap-2.5"><Upload size={14} className="text-slate-400" /> Import</span>
                                        <span className="text-[10px] text-slate-400">🔒</span>
                                    </button>
                                    <button onClick={() => { setIsActionsOpen(false); toast('Download Excel clicked'); }} className="w-full px-4 py-2.5 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between cursor-pointer">
                                        <span className="flex items-center gap-2.5"><FileSpreadsheet size={14} className="text-slate-400" /> Download as Excel</span>
                                        <span className="text-[10px] text-slate-400">🔒</span>
                                    </button>
                                    <button onClick={() => { setIsActionsOpen(false); toast('Download PDF clicked'); }} className="w-full px-4 py-2.5 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between cursor-pointer">
                                        <span className="flex items-center gap-2.5"><FileText size={14} className="text-slate-400" /> Download as PDF</span>
                                        <span className="text-[10px] text-slate-400">🔒</span>
                                    </button>
                                    <button onClick={() => { setIsActionsOpen(false); toast('Bulk Edit clicked'); }} className="w-full px-4 py-2.5 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between cursor-pointer">
                                        <span className="flex items-center gap-2.5"><Edit size={14} className="text-slate-400" /> Bulk Edit</span>
                                        <span className="text-[10px] text-slate-400">🔒</span>
                                    </button>
                                    <button onClick={() => { setIsActionsOpen(false); toast('Export Google Sheets clicked'); }} className="w-full px-4 py-2.5 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between cursor-pointer">
                                        <span className="flex items-center gap-2.5"><Sheet size={14} className="text-slate-400" /> Export to Google Sheets</span>
                                        <span className="text-[10px] text-slate-400">🔒</span>
                                    </button>
                                    <div className="h-px bg-slate-100 my-1" />
                                    <button onClick={() => { setIsActionsOpen(false); toast('Bulk Delete clicked'); }} className="w-full px-4 py-2.5 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center justify-between cursor-pointer font-medium">
                                        <span className="flex items-center gap-2.5"><Trash size={14} className="text-rose-500" /> Bulk Delete</span>
                                        <span className="text-[10px] text-slate-400">🔒</span>
                                    </button>
                                    <button onClick={() => { setIsActionsOpen(false); toast('Delete All Customers clicked'); }} className="w-full px-4 py-2.5 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center justify-between cursor-pointer font-medium">
                                        <span className="flex items-center gap-2.5"><Trash size={14} className="text-rose-500" /> Delete All Customers</span>
                                        <span className="text-[10px] text-slate-400">🔒</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* New Customer Button */}
                        <button
                            type="button"
                            onClick={() => navigate('/customers/add')}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition flex items-center gap-2 shadow-sm shadow-blue-500/20 cursor-pointer whitespace-nowrap"
                        >
                            <Plus size={14} /> New Customer
                        </button>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-sm">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search customers by name, company, phone.."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="w-full bg-white border border-slate-200 focus:border-violet-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden transition shadow-2xs"
                />
            </div>

            {/* Customers Table */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
                <div className="grid grid-cols-12 bg-slate-50/70 border-b border-slate-100 px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <div className="col-span-4 flex items-center gap-1 cursor-pointer">Name ↕</div>
                    <div className="col-span-3">Contact Info</div>
                    <div className="col-span-2 flex items-center gap-1 cursor-pointer">Closing Balance ↕</div>
                    <div className="col-span-3 text-right">Notes</div>
                </div>

                <div className="divide-y divide-slate-100">
                    {loading ? (
                        <div className="p-12 text-center text-xs text-slate-400">Loading customers...</div>
                    ) : customers.length === 0 ? (
                        <div className="p-12 text-center text-xs text-slate-400">
                            No customers found in database.
                        </div>
                    ) : (
                        customers.map((cust) => {
                            const hasBalance = cust.openingBalance > 0;
                            return (
                                <div key={cust.id} className="grid grid-cols-12 items-center px-6 py-4 hover:bg-slate-50/60 transition group relative">
                                    {/* Name */}
                                    <div className="col-span-4 flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-full bg-orange-100 text-orange-700 font-bold text-xs flex items-center justify-center shrink-0">
                                            {getInitials(cust.name)}
                                        </div>
                                        <div className="truncate">
                                            <p className="text-xs font-bold text-slate-900 truncate">{cust.name}</p>
                                            {cust.companyName && (
                                                <p className="text-[11px] text-slate-400 truncate">{cust.companyName}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Contact Info */}
                                    <div className="col-span-3 flex items-center gap-2">
                                        {cust.phone && (
                                            <>
                                                <span className="text-xs text-slate-700 font-mono">{cust.phone}</span>
                                                <MessageCircle size={14} className="text-emerald-500 fill-emerald-50 cursor-pointer" />
                                            </>
                                        )}
                                    </div>

                                    {/* Closing Balance */}
                                    <div className="col-span-2">
                                        {hasBalance ? (
                                            <div className="space-y-0.5">
                                                <p className="text-xs font-bold text-rose-600">
                                                    ₹ {Number(cust.openingBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })} 🔔
                                                </p>
                                                <p className="text-[10px] font-semibold text-rose-500">{cust.balanceType} ↓</p>
                                            </div>
                                        ) : (
                                            <p className="text-xs font-medium text-slate-700">₹ 0.00</p>
                                        )}
                                    </div>

                                    {/* Notes & Row Actions */}
                                    <div className="col-span-3 flex items-center justify-end gap-3">
                                        <div className="text-right text-[11px] text-slate-400">
                                            <p>{formatDate(cust.createdAt)}</p>
                                            <p>by {cust.createdBy}</p>
                                        </div>

                                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition">
                                            <button
                                                onClick={() => toast(`Opening ledger for ${cust.name}`)}
                                                className="px-2.5 py-1 bg-violet-50 hover:bg-violet-100 text-violet-700 text-[11px] font-semibold rounded-lg flex items-center gap-1 transition cursor-pointer"
                                                title="View Ledger"
                                            >
                                                <Eye size={12} /> Ledger
                                            </button>
                                            <button
                                                onClick={() => navigate(`/customers/edit/${cust.id}`)}
                                                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 text-[11px] font-semibold rounded-lg flex items-center gap-1 transition cursor-pointer"
                                                title="Edit Customer"
                                            >
                                                <Edit3 size={12} /> Edit
                                            </button>
                                        </div>

                                        <button
                                            onClick={() => setOpenRowMenuId(openRowMenuId === cust.id ? null : cust.id)}
                                            className="p-1.5 hover:bg-slate-100 text-slate-400 rounded-lg transition cursor-pointer"
                                        >
                                            <MoreHorizontal size={16} />
                                        </button>

                                        {openRowMenuId === cust.id && (
                                            <div className="absolute right-6 top-14 w-36 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-20">
                                                <button
                                                    onClick={() => { setOpenRowMenuId(null); navigate(`/customers/edit/${cust.id}`); }}
                                                    className="w-full px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                                >
                                                    <Edit3 size={12} /> Edit
                                                </button>
                                                <button
                                                    onClick={() => { setOpenRowMenuId(null); handleDelete(cust.id); }}
                                                    className="w-full px-3 py-1.5 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                                                >
                                                    <Trash2 size={12} /> Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer Totals, Per-Page Dropdown & Pagination Bar */}
                <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <div className="px-4 py-2 bg-rose-50 border border-rose-100 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-2 shadow-2xs">
                            <span>You Pay</span>
                            <span className="font-extrabold">₹ {Number(summary.totalYouPay).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-bold text-emerald-700 flex items-center gap-2 shadow-2xs">
                            <span>You Collect</span>
                            <span className="font-extrabold">₹ {Number(summary.totalYouCollect).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Per Page Dropdown */}
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span>Rows per page:</span>
                            <select
                                value={perPage}
                                onChange={(e) => { setPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 focus:outline-hidden cursor-pointer"
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>

                        {/* Pagination Controls */}
                        <div className="flex items-center gap-3 text-xs text-slate-600 font-medium">
                            <span>{currentPage} / {totalPages}</span>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="h-7 w-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 transition disabled:opacity-40 cursor-pointer"
                                >
                                    <ChevronLeft size={14} />
                                </button>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="h-7 w-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 transition disabled:opacity-40 cursor-pointer"
                                >
                                    <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Customers;