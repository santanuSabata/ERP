import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, ChevronDown, ChevronLeft, ChevronRight, Eye, Edit3, Trash2, MessageCircle, MoreHorizontal, ArrowRight, Upload, FileSpreadsheet, FileText, Edit, Sheet, Trash } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/axios.js';

const Vendors = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('All'); // 'All', 'Groups', 'Deleted'
    const [searchQuery, setSearchQuery] = useState('');
    const [vendors, setVendors] = useState([]);
    const [summary, setSummary] = useState({ totalYouPay: 0, totalYouCollect: 0 });
    const [loading, setLoading] = useState(true);

    // Get active company ID from localStorage matching Topbar / other modules
    const [activeCompanyId, setActiveCompanyId] = useState(() => localStorage.getItem('activeCompanyId') || 1);

    // Pagination States
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);

    // Dropdown States
    const [isActionsOpen, setIsActionsOpen] = useState(false);
    const [openRowMenuId, setOpenRowMenuId] = useState(null);

    const actionsRef = useRef(null);

    const fetchVendors = async (compId, tab, search, page, limit) => {
        try {
            setLoading(true);
            const targetCompId = compId || localStorage.getItem('activeCompanyId') || 1;
            const response = await api.get(`/vendors?companyId=${targetCompId}&tab=${tab}&search=${search || ''}&page=${page}&limit=${limit}`);
            if (response.data) {
                setVendors(response.data.data || []);
                setSummary(response.data.summary || { totalYouPay: 0, totalYouCollect: 0 });
                setTotalCount(response.data.totalCount || (response.data.data ? response.data.data.length : 0));
            }
        } catch (err) {
            console.error('❌ Failed to fetch vendors:', err);
            toast.error('Could not load vendors');
        } finally {
            setLoading(false);
        }
    };

    // Re-fetch whenever company changes in localStorage or tab/pagination changes
    useEffect(() => {
        const storedCompId = localStorage.getItem('activeCompanyId') || 1;
        setActiveCompanyId(storedCompId);
        fetchVendors(storedCompId, activeTab, searchQuery, currentPage, perPage);
    }, [activeTab, currentPage, perPage]);

    // Close actions dropdown on outside click
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
        setCurrentPage(1);
        fetchVendors(activeCompanyId, activeTab, val, 1, perPage);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this vendor?')) return;
        try {
            await api.delete(`/vendors/${id}`);
            toast.success('Vendor deleted successfully.');
            fetchVendors(activeCompanyId, activeTab, searchQuery, currentPage, perPage);
        } catch (err) {
            console.error('❌ Delete failed:', err);
            toast.error('Failed to delete vendor.');
        }
    };

    const getInitials = (name) => {
        if (!name) return 'V';
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

    if (loading && vendors.length === 0) {
        return (
            <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center text-xs text-slate-500 shadow-2xs w-full px-6">
                Loading Vendors...
            </div>
        );
    }

    return (
        <div className="space-y-6 w-full px-6 py-6 pb-16 relative font-sans text-slate-900">
            
            {/* Top Title Bar with Active Company Badge */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">Vendors</h1>
                    <span className="h-5 w-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">▶</span>
                </div>
                <div className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl">
                    Active Company ID: <span className="font-mono font-bold text-violet-600">{activeCompanyId}</span>
                </div>
            </div>

            {/* Top Action Feature Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div 
                    onClick={() => navigate('/vendors/add')}
                    className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-blue-400 transition cursor-pointer flex items-center justify-between group"
                >
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-900">Add New Vendor</p>
                        <p className="text-[11px] text-slate-500">Create a new vendor manually.</p>
                    </div>
                    <div className="h-8 w-8 rounded-xl bg-slate-50 group-hover:bg-blue-50 group-hover:text-blue-600 text-slate-400 flex items-center justify-center transition">
                        <ArrowRight size={16} />
                    </div>
                </div>

                <div 
                    onClick={() => toast('Bulk Import feature clicked')}
                    className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-blue-400 transition cursor-pointer flex items-center justify-between group"
                >
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-900">Bulk Import Vendors</p>
                        <p className="text-[11px] text-slate-500">Import multiple vendors using an Excel file.</p>
                    </div>
                    <div className="h-8 w-8 rounded-xl bg-slate-50 group-hover:bg-blue-50 group-hover:text-blue-600 text-slate-400 flex items-center justify-center transition">
                        <ArrowRight size={16} />
                    </div>
                </div>

                <div 
                    onClick={() => toast('Custom Fields feature clicked')}
                    className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-blue-400 transition cursor-pointer flex items-center justify-between group"
                >
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-900">Custom Fields</p>
                        <p className="text-[11px] text-slate-500">Add custom fields required for your business needs.</p>
                    </div>
                    <div className="h-8 w-8 rounded-xl bg-slate-50 group-hover:bg-blue-50 group-hover:text-blue-600 text-slate-400 flex items-center justify-center transition">
                        <ArrowRight size={16} />
                    </div>
                </div>
            </div>

            {/* Tabs & Top Controls Bar */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-200/85 pb-2 overflow-x-auto">
                    <div className="flex items-center gap-8">
                        {[
                            { name: 'All Vendors', count: totalCount },
                            { name: 'Groups', count: 0 },
                            { name: 'Deleted', count: 0 }
                        ].map((tab) => (
                            <button
                                key={tab.name}
                                type="button"
                                onClick={() => { setActiveTab(tab.name === 'All Vendors' ? 'All' : tab.name); setCurrentPage(1); }}
                                className={`text-xs font-semibold pb-2.5 transition relative cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                                    (activeTab === 'All' && tab.name === 'All Vendors') || activeTab === tab.name 
                                        ? 'text-blue-600' 
                                        : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                {tab.name}
                                {tab.name === 'All Vendors' && (
                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-full">
                                        {totalCount}
                                    </span>
                                )}
                                {((activeTab === 'All' && tab.name === 'All Vendors') || activeTab === tab.name) && (
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
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50">
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
                                    <button onClick={() => { setIsActionsOpen(false); toast('Delete All Vendors clicked'); }} className="w-full px-4 py-2.5 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center justify-between cursor-pointer font-medium">
                                        <span className="flex items-center gap-2.5"><Trash size={14} className="text-rose-500" /> Delete All Vendors</span>
                                        <span className="text-[10px] text-slate-400">🔒</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* New Vendor Button */}
                        <button
                            type="button"
                            onClick={() => navigate('/vendors/add')}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition flex items-center gap-2 shadow-sm shadow-blue-500/20 cursor-pointer whitespace-nowrap"
                        >
                            <Plus size={14} /> New Vendor
                        </button>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-sm">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search Vendors by company, name, phone etc.."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="w-full bg-white border border-slate-200 focus:border-violet-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden transition shadow-2xs"
                />
            </div>

            {/* Vendors Table */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
                <div className="grid grid-cols-12 bg-slate-50/70 border-b border-slate-100 px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <div className="col-span-4 flex items-center gap-1 cursor-pointer">Name ↕</div>
                    <div className="col-span-3">Contact Info</div>
                    <div className="col-span-2 flex items-center gap-1 cursor-pointer">Closing Balance ↕</div>
                    <div className="col-span-3 text-right">Notes</div>
                </div>

                <div className="divide-y divide-slate-100">
                    {vendors.length === 0 ? (
                        <div className="p-12 text-center text-xs text-slate-400">
                            No vendors found for active company ID {activeCompanyId}.
                        </div>
                    ) : (
                        vendors.map((vendor) => {
                            const hasBalance = vendor.openingBalance > 0;
                            return (
                                <div key={vendor.id} className="grid grid-cols-12 items-center px-6 py-4 hover:bg-slate-50/60 transition group relative">
                                    {/* Name & Company */}
                                    <div className="col-span-4 flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-full bg-orange-100 text-orange-700 font-bold text-xs flex items-center justify-center shrink-0">
                                            {getInitials(vendor.name)}
                                        </div>
                                        <div className="truncate">
                                            <p className="text-xs font-bold text-slate-900 truncate">{vendor.name}</p>
                                            {vendor.companyName && (
                                                <p className="text-[11px] text-slate-400 truncate">{vendor.companyName}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Contact Info */}
                                    <div className="col-span-3 flex items-center gap-2">
                                        {vendor.phone && (
                                            <>
                                                <span className="text-xs text-slate-700 font-mono">{vendor.phone}</span>
                                                <MessageCircle size={14} className="text-emerald-500 fill-emerald-50 cursor-pointer" />
                                            </>
                                        )}
                                    </div>

                                    {/* Closing Balance */}
                                    <div className="col-span-2">
                                        {hasBalance ? (
                                            <div className="space-y-0.5">
                                                <p className="text-xs font-bold text-rose-600">
                                                    ₹ {Number(vendor.openingBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </p>
                                                <p className="text-[10px] font-semibold text-rose-500">{vendor.balanceType || 'You Pay'} ↑</p>
                                            </div>
                                        ) : (
                                            <p className="text-xs font-medium text-slate-700">₹ 0.00</p>
                                        )}
                                    </div>

                                    {/* Notes & Actions */}
                                    <div className="col-span-3 flex items-center justify-end gap-3">
                                        <div className="text-right text-[11px] text-slate-400">
                                            <p>{formatDate(vendor.createdAt)}</p>
                                            <p>by {vendor.createdBy || 'Raj S'}</p>
                                        </div>

                                        {/* Ledger & Edit Action Buttons on Hover */}
                                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition">
                                            <button
                                                onClick={() => toast(`Opening ledger for ${vendor.name}`)}
                                                className="px-2.5 py-1 bg-violet-50 hover:bg-violet-100 text-violet-700 text-[11px] font-semibold rounded-lg flex items-center gap-1 transition cursor-pointer"
                                                title="View Ledger"
                                            >
                                                <Eye size={12} /> Ledger
                                            </button>
                                            <button
                                                onClick={() => navigate(`/vendors/edit/${vendor.id}`)}
                                                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 text-[11px] font-semibold rounded-lg flex items-center gap-1 transition cursor-pointer"
                                                title="Edit Vendor"
                                            >
                                                <Edit3 size={12} /> Edit
                                            </button>
                                        </div>

                                        {/* Three Dots Button */}
                                        <button
                                            onClick={() => setOpenRowMenuId(openRowMenuId === vendor.id ? null : vendor.id)}
                                            className="p-1.5 hover:bg-slate-100 text-slate-400 rounded-lg transition cursor-pointer"
                                        >
                                            <MoreHorizontal size={16} />
                                        </button>

                                        {/* Row Options Dropdown */}
                                        {openRowMenuId === vendor.id && (
                                            <div className="absolute right-6 top-14 w-36 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-20">
                                                <button
                                                    onClick={() => { setOpenRowMenuId(null); navigate(`/vendors/edit/${vendor.id}`); }}
                                                    className="w-full px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                                >
                                                    <Edit3 size={12} /> Edit
                                                </button>
                                                <button
                                                    onClick={() => { setOpenRowMenuId(null); handleDelete(vendor.id); }}
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

                {/* Footer Totals & Pagination */}
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

            {/* Bottom Promo Banner */}
            <div className="bg-sky-50/70 border border-sky-100 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-900">Customer/ Vendor Import</p>
                    <p className="text-[11px] text-slate-600">Upload a list of new customers and vendors or update existing data easily.</p>
                    <div className="flex items-center gap-1.5 pt-1 text-[10px] text-slate-500">
                        <div className="flex -space-x-1.5">
                            <span className="h-5 w-5 rounded-full bg-orange-300 border border-white" />
                            <span className="h-5 w-5 rounded-full bg-blue-300 border border-white" />
                            <span className="h-5 w-5 rounded-full bg-emerald-300 border border-white" />
                        </div>
                        <span>Sudipto Saha and lakhs of businesses use premium</span>
                    </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <button type="button" className="text-xs font-semibold text-slate-700 hover:text-slate-900 cursor-pointer">
                        Talk to a specialist
                    </button>
                    <button type="button" onClick={() => toast('Upgrade clicked')} className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer">
                        Upgrade 🚀
                    </button>
                </div>
            </div>

        </div>
    );
};

export default Vendors;