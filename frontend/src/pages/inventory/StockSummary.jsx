import { useState, useEffect } from 'react';
import { 
    Search, Upload, FileSpreadsheet, Layers, Printer, 
    ChevronLeft, ChevronRight, BarChart2, ArrowDownLeft, ArrowUpRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/axios.js';

const StockSummary = () => {
    const [summaryList, setSummaryList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'

    const [activeCompanyId] = useState(() => localStorage.getItem('activeCompanyId') || 1);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const limit = 10;

    const fetchStockSummary = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/stocks/summary?companyId=${activeCompanyId}`);
            if (res.data?.success) {
                setSummaryList(res.data.data || []);
            }
        } catch (err) {
            console.error('Failed to fetch stock summary:', err);
            toast.error('Could not load stock summary.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStockSummary();
    }, [activeCompanyId]);

    // Filter summary list based on real-time search query
    const filteredList = summaryList.filter(item => 
        item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.productSku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalPages = Math.ceil(filteredList.length / limit) || 1;
    const paginatedList = filteredList.slice((currentPage - 1) * limit, currentPage * limit);

    const exportCsv = () => {
        const headers = ['Product Name', 'SKU', 'Category', 'Total Stock In', 'Total Stock Out', 'Balance', 'Purchase Amount', 'Sales Amount'];
        const rows = filteredList.map(s => [
            s.productName, s.productSku, s.category, s.totalStockIn, s.totalStockOut, s.balance, s.purchaseAmount, s.salesAmount
        ]);
        let csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `stock_summary_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('CSV Exported successfully!');
    };

    return (
        <div className="space-y-6 w-full px-4 sm:px-6 lg:px-8 pb-20 font-sans text-slate-950">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">Product Group Stock Summary</h1>
                    <p className="text-xs text-slate-500 mt-0.5">Aggregated stock in, stock out, balance, purchase amount, and sales amount.</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <button 
                        onClick={exportCsv}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                    >
                        <FileSpreadsheet size={15} /> CSV Export
                    </button>
                    <button 
                        onClick={() => window.print()}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                    >
                        <Printer size={15} /> Print PDF
                    </button>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="relative w-full md:w-80">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                        type="text"
                        placeholder="Search product, SKU, category..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-blue-500"
                    />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                        <button 
                            onClick={() => setViewMode('table')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}
                        >
                            Table
                        </button>
                        <button 
                            onClick={() => setViewMode('card')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${viewMode === 'card' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}
                        >
                            Cards
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content View */}
            {loading ? (
                <div className="p-20 text-center text-xs text-slate-400">Loading stock summary...</div>
            ) : filteredList.length === 0 ? (
                <div className="p-20 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
                    <BarChart2 size={32} className="mx-auto text-slate-300" />
                    <p className="text-xs font-bold text-slate-700">No stock summary records found.</p>
                </div>
            ) : viewMode === 'table' ? (
                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                    <th className="p-4">Product Name</th>
                                    <th className="p-4">SKU / Code</th>
                                    <th className="p-4">Category</th>
                                    <th className="p-4 text-center">Stock In</th>
                                    <th className="p-4 text-center">Stock Out</th>
                                    <th className="p-4 text-center font-bold">Balance</th>
                                    <th className="p-4 text-right">Purchase Amount</th>
                                    <th className="p-4 text-right">Sales Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                                {paginatedList.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition">
                                        <td className="p-4 font-bold text-slate-900">{row.productName}</td>
                                        <td className="p-4 font-mono text-slate-500">{row.productSku}</td>
                                        <td className="p-4 text-slate-600">{row.category}</td>
                                        <td className="p-4 text-center font-mono font-bold text-emerald-600">+{row.totalStockIn}</td>
                                        <td className="p-4 text-center font-mono font-bold text-rose-600">-{row.totalStockOut}</td>
                                        <td className="p-4 text-center font-mono font-bold text-blue-600">{row.balance}</td>
                                        <td className="p-4 text-right font-mono font-semibold">₹{row.purchaseAmount.toFixed(2)}</td>
                                        <td className="p-4 text-right font-mono font-semibold text-emerald-700">₹{row.salesAmount.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {paginatedList.map((row, idx) => (
                        <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">{row.productSku}</span>
                                <span className="text-[11px] font-semibold text-slate-500">{row.category}</span>
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">{row.productName}</h3>
                            </div>
                            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl text-center text-xs">
                                <div>
                                    <div className="text-[10px] text-slate-400">In</div>
                                    <div className="font-mono font-bold text-emerald-600">+{row.totalStockIn}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-slate-400">Out</div>
                                    <div className="font-mono font-bold text-rose-600">-{row.totalStockOut}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-slate-400">Balance</div>
                                    <div className="font-mono font-bold text-blue-600">{row.balance}</div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-xs border-t border-slate-100 pt-3">
                                <span className="text-slate-500">Purchase Amt: <strong className="font-mono text-slate-800">₹{row.purchaseAmount.toFixed(2)}</strong></span>
                                <span className="text-slate-500">Sales Amt: <strong className="font-mono text-emerald-700">₹{row.salesAmount.toFixed(2)}</strong></span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            <div className="flex items-center justify-between pt-4">
                <span className="text-xs text-slate-500">Showing page {currentPage} of {totalPages} ({filteredList.length} total products)</span>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="p-2 border border-slate-200 rounded-xl bg-white disabled:opacity-50 cursor-pointer"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button 
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="p-2 border border-slate-200 rounded-xl bg-white disabled:opacity-50 cursor-pointer"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StockSummary;