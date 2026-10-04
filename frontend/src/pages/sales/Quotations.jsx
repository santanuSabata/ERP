import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, ChevronLeft, ChevronRight, Trash2, Edit3, ArrowUpDown, Eye, Send, MessageSquare, Mail, MessageCircle, Copy, Link, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/axios.js';
import QuotationModal from '../../components/sales/QuotationModal.jsx';
import AddQuotation from '../../components/sales/AddQuotation.jsx'; // 👈 Import slide-over component

const Quotations = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('All');
    const [quotations, setQuotations] = useState([]);
    const [activeCompanyId, setActiveCompanyId] = useState(null);
    const [companyDetails, setCompanyDetails] = useState(null);
    const [loading, setLoading] = useState(true); 

    // Slide-over & Modal States
    const [selectedQuotation, setSelectedQuotation] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // 👈 Quotation Slide-over Drawer States
    const [isAddQuotationOpen, setIsAddQuotationOpen] = useState(false);
    const [editingQuotationId, setEditingQuotationId] = useState(null);

    // Sorting State
    const [sortField, setSortField] = useState('quotation_date'); 
    const [sortOrder, setSortOrder] = useState('desc'); 

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);

    // Send Dropdown Open State per row ID
    const [sendDropdownId, setSendDropdownId] = useState(null);
    const dropdownRef = useRef(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setSendDropdownId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchQuotations = async (compId, search, status, page, limit, field, order) => {
        try {
            setLoading(true);
            const targetCompId = compId || activeCompanyId || 1;
            const res = await api.get(`/quotations?companyId=${targetCompId}&search=${search || ''}&status=${status}&page=${page}&limit=${limit}&sortBy=${field}&sortOrder=${order}`);
            if (res.data) {
                setQuotations(res.data.data || []);
                setTotalCount(res.data.totalCount || 0);
            }
        } catch (err) {
            console.error('❌ Failed to fetch quotations:', err);
            toast.error('Could not load quotations');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchCompany = async () => {
            try {
                const companyRes = await api.get('/company');
                const comp = companyRes.data?.data || companyRes.data || { id: 1 };
                const compId = comp.id || 1;
                setActiveCompanyId(compId);
                setCompanyDetails(comp);
            } catch (err) {
                setActiveCompanyId(1);
            }
        };
        fetchCompany();
    }, []);

    useEffect(() => {
        if (activeCompanyId) {
            fetchQuotations(activeCompanyId, searchQuery, activeTab, currentPage, perPage, sortField, sortOrder);
        }
    }, [activeCompanyId, activeTab, currentPage, perPage, sortField, sortOrder]);

    const handleSearchChange = (e) => {
        const val = e.target.value;
        setSearchQuery(val);
        setCurrentPage(1);
        fetchQuotations(activeCompanyId, val, activeTab, 1, perPage, sortField, sortOrder);
    };

    const handleSort = (field) => {
        const isAsc = sortField === field && sortOrder === 'asc';
        const newOrder = isAsc ? 'desc' : 'asc';
        setSortField(field);
        setSortOrder(newOrder);
        setCurrentPage(1);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this quotation?')) return;
        try {
            await api.delete(`/quotations/${id}`);
            toast.success('Quotation deleted.');
            fetchQuotations(activeCompanyId, searchQuery, activeTab, currentPage, perPage, sortField, sortOrder);
        } catch (err) {
            toast.error('Failed to delete quotation.');
        }
    };

    const handleViewQuotation = async (item) => {
        try {
            const res = await api.get(`/quotations/${item.id}`);
            setSelectedQuotation(res.data.data);
            setIsModalOpen(true);
        } catch (err) {
            console.error('❌ Failed to fetch quotation details:', err);
            toast.error('Failed to load quotation preview');
        }
    };

    const handleSendAction = (actionType, item) => {
        setSendDropdownId(null);
        if (actionType === 'copy') {
            navigator.clipboard.writeText(`${window.location.origin}/quotations/view/${item.id}`);
            toast.success('Quotation link copied to clipboard!');
        } else if (actionType === 'whatsapp') {
            toast.success(`Opening WhatsApp to send quotation ${item.quotation_no}`);
        } else if (actionType === 'email') {
            toast.success(`Opening Email client for ${item.customer_name}`);
        } else if (actionType === 'sms') {
            toast.success(`Sending SMS for quotation ${item.quotation_no}`);
        } else if (actionType === 'brand-links') {
            toast.success('Opening brand links configuration');
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const totalPages = Math.ceil(totalCount / perPage) || 1;
    const totalSum = quotations.reduce((acc, curr) => acc + parseFloat(curr.total_amount || 0), 0);

    return (
        <div className="space-y-6 w-full px-6 py-6 pb-16 font-sans text-slate-900">
            
            {/* Top Title Bar */}
            <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-100 shadow-2xs">
                <div>
                    <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                        Quotations <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                    </h1>
                    <p className="text-xs text-slate-400 mt-0.5">Manage and track estimates and client quotations.</p>
                </div>
                {/* 👈 Open AddQuotation Slide-Over */}
                <button 
                    onClick={() => {
                        setEditingQuotationId(null);
                        setIsAddQuotationOpen(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-5 py-3 rounded-2xl shadow-lg flex items-center gap-1.5 cursor-pointer transition"
                >
                    <Plus size={16} /> Create Quotation
                </button>
            </div>

            {/* Filter Tabs & Search */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3 overflow-x-auto">
                    {['All', 'Open', 'Closed', 'Partial', 'Cancelled', 'Drafts'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${activeTab === tab ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            {tab} {tab === 'All' && `(${totalCount})`}
                        </button>
                    ))}
                </div>

                <div className="flex items-center justify-between pt-2">
                    <div className="relative max-w-sm flex-1">
                        <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
                        <input 
                            type="text" placeholder="Search by transaction, customer, bill no..." value={searchQuery} onChange={handleSearchChange}
                            className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="bg-slate-50/80 text-slate-400 uppercase font-extrabold border-b border-slate-100 text-[10px] tracking-wider">
                                <th 
                                    onClick={() => handleSort('total_amount')} 
                                    className="py-3 px-4 cursor-pointer hover:text-slate-700 transition"
                                >
                                    <div className="flex items-center gap-1.5">
                                        Amount <ArrowUpDown size={12} className={sortField === 'total_amount' ? 'text-blue-600' : 'text-slate-400'} />
                                    </div>
                                </th>
                                <th className="py-3 px-4">Status</th>
                                <th 
                                    onClick={() => handleSort('quotation_no')} 
                                    className="py-3 px-4 cursor-pointer hover:text-slate-700 transition"
                                >
                                    <div className="flex items-center gap-1.5">
                                        Bill # <ArrowUpDown size={12} className={sortField === 'quotation_no' ? 'text-blue-600' : 'text-slate-400'} />
                                    </div>
                                </th>
                                <th className="py-3 px-4">Customer</th>
                                <th 
                                    onClick={() => handleSort('quotation_date')} 
                                    className="py-3 px-4 cursor-pointer hover:text-slate-700 transition"
                                >
                                    <div className="flex items-center gap-1.5">
                                        Date <ArrowUpDown size={12} className={sortField === 'quotation_date' ? 'text-blue-600' : 'text-slate-400'} />
                                    </div>
                                </th>
                                <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-slate-400">Loading quotations...</td>
                                </tr>
                            ) : quotations.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-slate-400">No quotations found.</td>
                                </tr>
                            ) : (
                                quotations.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-50/80 transition relative group">
                                        <td className="py-4 px-4 font-extrabold font-mono text-slate-900 text-sm">
                                            ₹{parseFloat(item.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200">
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 font-mono font-bold text-slate-900">{item.quotation_no}</td>
                                        <td className="py-4 px-4">
                                            <p className="font-bold text-slate-900">{item.customer_name}</p>
                                        </td>
                                        <td className="py-4 px-4 text-slate-500 text-[11px]">
                                            <p>{formatDate(item.quotation_date)}</p>
                                            <p className="text-[10px] text-slate-400">by {item.created_by}</p>
                                        </td>
                                        <td className="py-4 px-4 text-right space-x-1.5 relative">
                                            <div className="inline-flex items-center gap-1.5 justify-end">
                                                {/* View Button */}
                                                <button 
                                                    onClick={() => handleViewQuotation(item)}
                                                    className="px-3 py-1.5 bg-violet-50 text-violet-700 hover:bg-violet-100 rounded-xl font-bold flex items-center gap-1 transition cursor-pointer text-xs"
                                                    title="View Quotation"
                                                >
                                                    <Eye size={13} /> View
                                                </button>

                                                {/* Send Dropdown Toggle Button */}
                                                <div className="relative" ref={sendDropdownId === item.id ? dropdownRef : null}>
                                                    <button 
                                                        onClick={() => setSendDropdownId(sendDropdownId === item.id ? null : item.id)}
                                                        className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl font-bold flex items-center gap-1 transition cursor-pointer text-xs"
                                                        title="Send Options"
                                                    >
                                                        <Send size={13} /> Send
                                                    </button>

                                                    {/* Send Popup Menu */}
                                                    {sendDropdownId === item.id && (
                                                        <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-2xl py-2 z-50 text-left">
                                                            <button 
                                                                onClick={() => handleSendAction('whatsapp', item)}
                                                                className="w-full px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition cursor-pointer"
                                                            >
                                                                <MessageCircle size={15} className="text-emerald-600" /> Whatsapp
                                                            </button>
                                                            <button 
                                                                onClick={() => handleSendAction('email', item)}
                                                                className="w-full px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition cursor-pointer"
                                                            >
                                                                <Mail size={15} className="text-blue-500" /> Email
                                                            </button>
                                                            <button 
                                                                onClick={() => handleSendAction('sms', item)}
                                                                className="w-full px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition cursor-pointer"
                                                            >
                                                                <MessageSquare size={15} className="text-slate-500" /> SMS
                                                            </button>
                                                            <div className="my-1 border-t border-slate-100"></div>
                                                            <button 
                                                                onClick={() => handleSendAction('copy', item)}
                                                                className="w-full px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition cursor-pointer"
                                                            >
                                                                <Copy size={15} className="text-slate-500" /> Copy link
                                                            </button>
                                                            <button 
                                                                onClick={() => handleSendAction('brand-links', item)}
                                                                className="w-full px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-between transition cursor-pointer"
                                                            >
                                                                <span className="flex items-center gap-3"><Link size={15} className="text-slate-500" /> Setup brand links</span>
                                                                <span className="bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">New</span>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Edit Button (Opens Slide-Over) */}
                                                <button 
                                                    onClick={() => {
                                                        setEditingQuotationId(item.id);
                                                        setIsAddQuotationOpen(true);
                                                    }} 
                                                    className="p-2 text-slate-400 hover:text-blue-600 transition cursor-pointer bg-slate-50 rounded-xl"
                                                    title="Edit Quotation"
                                                >
                                                    <Edit3 size={15} />
                                                </button>

                                                {/* Delete Button */}
                                                <button 
                                                    onClick={() => handleDelete(item.id)} 
                                                    className="p-2 text-slate-400 hover:text-rose-600 transition cursor-pointer bg-slate-50 rounded-xl"
                                                    title="Delete Quotation"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Summary & Pagination Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs">
                    <div className="flex gap-4">
                        <span className="px-4 py-2 bg-slate-100 rounded-xl font-bold text-slate-700">
                            Total: ₹{totalSum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                        >
                            <ChevronLeft size={14} />
                        </button>
                        <span className="font-bold text-slate-600">Page {currentPage} of {totalPages}</span>
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

            {/* Quotation Preview Modal Component */}
            <QuotationModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                quotation={selectedQuotation} 
                company={companyDetails} 
            />

            {/* 👈 SLIDE-OVER DRAWER FOR ADD / EDIT QUOTATION (75% Width) */}
            {isAddQuotationOpen && (
                <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-2xs flex justify-end transition-opacity">
                    <div className="w-full md:w-3/4 bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden">
                        <div className="p-6 overflow-y-auto flex-1">
                            <AddQuotation 
                                editId={editingQuotationId} 
                                onClose={() => {
                                    setIsAddQuotationOpen(false);
                                    setEditingQuotationId(null);
                                    if (activeCompanyId) {
                                        fetchQuotations(activeCompanyId, searchQuery, activeTab, currentPage, perPage, sortField, sortOrder);
                                    }
                                }} 
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Quotations;