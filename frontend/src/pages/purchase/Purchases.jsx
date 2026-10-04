import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Search, Plus, FileSpreadsheet, Trash2, Edit3, 
    Eye, X, ChevronLeft, ChevronRight, Printer, 
    SlidersHorizontal, ChevronDown, Settings, Send, DollarSign
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/axios.js';

const Purchases = () => {
    const navigate = useNavigate();
    const [purchases, setPurchases] = useState([]);
    const [summary, setSummary] = useState({ total_amount: 0, paid_amount: 0, pending_amount: 0 });
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('All'); // All, Pending, Paid, Cancelled, Drafts

    const [activeCompanyId] = useState(() => localStorage.getItem('activeCompanyId') || 1);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const limit = 10;

    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedBill, setSelectedBill] = useState(null);
    const [isActionsOpen, setIsActionsOpen] = useState(false);
    const actionsRef = useRef(null);

    const fetchPurchases = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/purchases`, {
                params: { 
                    companyId: activeCompanyId, 
                    search: searchQuery, 
                    status: activeTab !== 'All' ? activeTab : 'All', 
                    page: currentPage, 
                    limit 
                }
            });
            if (res.data?.success) {
                setPurchases(res.data.data || []);
                setTotalCount(res.data.totalCount || 0);
                setSummary(res.data.summary || { total_amount: 0, paid_amount: 0, pending_amount: 0 });
            }
        } catch (err) {
            console.error('Failed to fetch purchases:', err);
            toast.error('Could not load purchase bills.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPurchases();
    }, [searchQuery, activeTab, currentPage, activeCompanyId]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (actionsRef.current && !actionsRef.current.contains(e.target)) {
                setIsActionsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('Remove this purchase bill?')) return;
        try {
            await api.delete(`/purchases/${id}`);
            toast.success('Removed successfully.');
            fetchPurchases();
        } catch (err) {
            toast.error('Delete failed.');
        }
    };

    const exportCsv = () => {
        const headers = ['Bill Number', 'Vendor', 'Date', 'Total Amount', 'Paid Amount', 'Status'];
        const rows = purchases.map(p => [p.billNumber, p.vendorName, p.supplierInvoiceDate, p.totalAmount, p.paidAmount, p.status]);
        let csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const link = document.createElement('a');
        link.setAttribute('href', encodeURI(csvContent));
        link.setAttribute('download', `purchases_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('CSV Exported!');
    };

    const totalPages = Math.ceil(totalCount / limit) || 1;

    return (
        <div className="space-y-6 w-full px-6 py-6 pb-20 font-sans text-slate-900 bg-white min-h-screen">
            
            {/* Top Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
                <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">Purchases</h1>
                    <span className="h-5 w-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">▶</span>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => toast('Opening document settings')} 
                        className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                        <Settings size={14} className="text-slate-500" /> Document Settings
                    </button>
                    <button 
                        onClick={() => navigate('/purchases/add')} 
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer transition"
                    >
                        <Plus size={15} /> Create Purchase
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-8 border-b border-slate-200/80 pb-3 overflow-x-auto text-xs font-semibold">
                {['All', 'Pending', 'Paid', 'Cancelled', 'Drafts'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
                        className={`pb-1 transition relative cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                            activeTab === tab ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        {tab}
                        {tab === 'All' && <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded-full">{totalCount}</span>}
                        {activeTab === tab && (
                            <span className="absolute bottom-[-13px] left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                        )}
                    </button>
                ))}
            </div>

            {/* Filter & Search Bar Row */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-1">
                <div className="relative w-full md:w-80">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                        type="text"
                        placeholder="Search by transaction, customers, invoice etc.."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-blue-500 placeholder-slate-400"
                    />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative" ref={actionsRef}>
                        <button
                            onClick={() => setIsActionsOpen(!isActionsOpen)}
                            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                            Actions <ChevronDown size={14} className="text-slate-400" />
                        </button>
                        {isActionsOpen && (
                            <div className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50 text-xs">
                                <button onClick={() => { setIsActionsOpen(false); exportCsv(); }} className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer">
                                    <FileSpreadsheet size={13} className="text-slate-400" /> Export CSV
                                </button>
                                <button onClick={() => { setIsActionsOpen(false); window.print(); }} className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer">
                                    <Printer size={13} className="text-slate-400" /> Print PDF
                                </button>
                            </div>
                        )}
                    </div>

                    <button className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl cursor-pointer shadow-2xs" title="Advanced Filter">
                        <SlidersHorizontal size={15} className="text-slate-500" />
                    </button>
                </div>
            </div>

            {/* Table Header Columns */}
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
                <div className="grid grid-cols-12 px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200/60">
                    <div className="col-span-2 flex items-center gap-1">Amount ↕</div>
                    <div className="col-span-2 flex items-center gap-1">Status ↕</div>
                    <div className="col-span-2 flex items-center gap-1">Mode ↕</div>
                    <div className="col-span-2 flex items-center gap-1">Bill # ↕</div>
                    <div className="col-span-2">Vendor</div>
                    <div className="col-span-2 flex items-center justify-between">
                        <span>Date ↕</span>
                        <span className="text-[10px] text-slate-400 font-normal">Created time</span>
                    </div>
                </div>

                {loading ? (
                    <div className="p-16 text-center text-xs text-slate-400">Loading purchase bills...</div>
                ) : purchases.length === 0 ? (
                    <div className="py-20 px-6 text-center space-y-3 bg-white">
                        <p className="text-sm font-medium text-slate-600">
                            Oops 😳 ! No purchase bills found.
                        </p>
                        <p className="text-xs text-slate-400">
                            Please select different <span className="text-blue-600 font-semibold cursor-pointer">dates</span> or create a new <span onClick={() => navigate('/purchases/add')} className="text-blue-600 font-semibold cursor-pointer underline">Purchase Bill</span>
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 bg-white text-xs">
                        {purchases.map((bill) => (
                            <div key={bill.id} className="grid grid-cols-12 items-center px-6 py-4 hover:bg-slate-50/80 transition group">
                                <div className="col-span-2 font-mono font-bold text-slate-900">₹{bill.totalAmount.toFixed(2)}</div>
                                <div className="col-span-2">
                                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                                        bill.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                    }`}>
                                        {bill.status}
                                    </span>
                                </div>
                                <div className="col-span-2 text-slate-600 font-medium">{bill.paymentMode}</div>
                                <div className="col-span-2 font-mono text-blue-600 font-semibold">{bill.billNumber}</div>
                                <div className="col-span-2 font-bold text-slate-900 truncate">
                                    <p className="truncate">{bill.vendorName}</p>
                                    <p className="text-[10px] text-slate-400 font-mono font-normal">{bill.vendorPhone || '—'}</p>
                                </div>
                                <div className="col-span-2 flex items-center justify-between text-slate-500">
                                    <span>{bill.supplierInvoiceDate?.split('T')[0]}</span>
                                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition">
                                        <button onClick={() => navigate(`/purchases/edit/${bill.id}`)} className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded cursor-pointer" title="Edit"><Edit3 size={12} /></button>
                                        <button onClick={() => { setSelectedBill(bill); setIsViewModalOpen(true); }} className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded cursor-pointer" title="View"><Eye size={12} /></button>
                                        <button onClick={() => handleDelete(bill.id)} className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded cursor-pointer" title="Delete"><Trash2 size={12} /></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Bottom Summaries & Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between pt-2 gap-4">
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 shadow-2xs flex items-center gap-2">
                        <span className="text-slate-400 font-normal">Total</span>
                        <span className="font-mono text-slate-900">₹{Number(summary.total_amount).toFixed(2)}</span>
                    </div>
                    <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 shadow-2xs flex items-center gap-2">
                        <span className="text-slate-400 font-normal">Paid</span>
                        <span className="font-mono text-emerald-600">₹{Number(summary.paid_amount).toFixed(2)}</span>
                    </div>
                    <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 shadow-2xs flex items-center gap-2">
                        <span className="text-slate-400 font-normal">Pending</span>
                        <span className="font-mono text-amber-600">₹{Number(summary.pending_amount).toFixed(2)}</span>
                    </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-600">
                    <span>{currentPage} / {totalPages}</span>
                    <div className="flex items-center gap-1">
                        <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="h-7 w-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 disabled:opacity-40 cursor-pointer"><ChevronLeft size={14} /></button>
                        <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="h-7 w-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 disabled:opacity-40 cursor-pointer"><ChevronRight size={14} /></button>
                    </div>
                </div>
            </div>

            {/* VIEW DETAILS MODAL */}
            {isViewModalOpen && selectedBill && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-6 shadow-xl">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <h2 className="text-base font-bold text-slate-900">Purchase Bill Details ({selectedBill.billNumber})</h2>
                            <button onClick={() => setIsViewModalOpen(false)} className="p-1.5 text-slate-400 rounded-xl cursor-pointer"><X size={18} /></button>
                        </div>
                        <div className="space-y-4 text-xs">
                            <div className="flex justify-between py-1 border-b border-slate-100"><span className="text-slate-400">Vendor:</span><span className="font-bold text-slate-900">{selectedBill.vendorName}</span></div>
                            <div className="flex justify-between py-1 border-b border-slate-100"><span className="text-slate-400">PO Number:</span><span className="font-mono text-blue-600">{selectedBill.poNumber || 'None'}</span></div>
                            <div className="flex justify-between py-1 border-b border-slate-100"><span className="text-slate-400">Status / Payment Mode:</span><span className="font-semibold">{selectedBill.status} / {selectedBill.paymentMode}</span></div>
                            <div>
                                <p className="font-bold text-slate-700 mb-2">Line Items:</p>
                                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-50 text-[10px] text-slate-400 uppercase"><th className="p-2.5">Product</th><th className="p-2.5 text-center">Qty</th><th className="p-2.5 text-right">Price</th><th className="p-2.5 text-right">Total</th></tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 font-mono">
                                            {selectedBill.items?.map((item, i) => (
                                                <tr key={i}>
                                                    <td className="p-2.5 font-sans font-semibold text-slate-900">{item.productName}</td>
                                                    <td className="p-2.5 text-center">{item.quantity}</td>
                                                    <td className="p-2.5 text-right">₹{item.unitPrice}</td>
                                                    <td className="p-2.5 text-right font-bold text-emerald-700">₹{item.lineTotal.toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="flex justify-between py-2 text-sm font-bold border-t border-slate-100"><span className="text-slate-500">Total Amount:</span><span className="font-mono text-emerald-700">₹{selectedBill.totalAmount.toFixed(2)}</span></div>
                        </div>
                        <div className="flex justify-end pt-2">
                            <button onClick={() => setIsViewModalOpen(false)} className="px-5 py-2 bg-slate-900 text-white font-bold rounded-xl cursor-pointer">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Purchases;