import { useState, useEffect } from 'react';
import { 
    Search, Plus, Upload, FileSpreadsheet, FileText, Trash2, Edit3, 
    Eye, X, ChevronLeft, ChevronRight, Layers, Printer, ArrowDownLeft, ArrowUpRight,
    TrendingDown, TrendingUp, Building
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/axios.js';

const Stocks = () => {
    const [stocks, setStocks] = useState([]);
    const [productsList, setProductsList] = useState([]);
    const [warehousesList, setWarehousesList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [typeFilter, setTypeFilter] = useState('All');
    const [warehouseFilter, setWarehouseFilter] = useState('All'); // Warehouse filter state
    const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'

    const [activeCompanyId] = useState(() => localStorage.getItem('activeCompanyId') || 1);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const limit = 10;

    // Modals & Drawer States
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
    const [selectedStock, setSelectedStock] = useState(null);

    // Form State including warehouseId
    const [formData, setFormData] = useState({
        stockDate: new Date().toISOString().split('T')[0],
        productId: '',
        productSearchName: '',
        warehouseId: '',
        transactionDate: new Date().toISOString().split('T')[0],
        transactionType: 'Stock Out',
        quantityIn: 0,
        quantityOut: 1,
        issueDate: new Date().toISOString().split('T')[0],
        status: 'Active',
        remarks: '',
        userId: 'Admin'
    });

    const [csvFile, setCsvFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const fetchStocks = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/stocks`, {
                params: {
                    companyId: activeCompanyId,
                    search: searchQuery,
                    status: statusFilter,
                    transactionType: typeFilter,
                    warehouseId: warehouseFilter !== 'All' ? warehouseFilter : undefined,
                    page: currentPage,
                    limit
                }
            });
            if (res.data?.success) {
                setStocks(res.data.data || []);
                setTotalCount(res.data.totalCount || 0);
            }
        } catch (err) {
            console.error('Failed to fetch stocks:', err);
            toast.error('Could not load stock transactions.');
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await api.get(`/products?companyId=${activeCompanyId}&limit=100`);
            if (res.data?.success) {
                setProductsList(res.data.data || []);
            }
        } catch (err) {
            console.error('Failed to fetch products for dropdown:', err);
        }
    };

    const fetchWarehouses = async () => {
        try {
            const res = await api.get(`/warehouses?companyId=${activeCompanyId}`);
            if (res.data?.success) {
                setWarehousesList(res.data.data || []);
            }
        } catch (err) {
            console.error('Failed to fetch warehouses for dropdown:', err);
        }
    };

    useEffect(() => {
        fetchStocks();
        fetchProducts();
        fetchWarehouses();
    }, [searchQuery, statusFilter, typeFilter, warehouseFilter, currentPage, activeCompanyId]);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'productSearchName') {
            const found = productsList.find(p => p.name === value);
            setFormData(prev => ({
                ...prev,
                productSearchName: value,
                productId: found ? found.id : ''
            }));
            return;
        }

        if (name === 'transactionType') {
            if (value === 'Stock In' || value === 'Purchase' || value === 'Return') {
                setFormData(prev => ({ ...prev, transactionType: value, quantityIn: prev.quantityOut || 1, quantityOut: 0 }));
            } else {
                setFormData(prev => ({ ...prev, transactionType: value, quantityOut: prev.quantityIn || 1, quantityIn: 0 }));
            }
            return;
        }

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Open Stock In Drawer
    const openStockInDrawer = () => {
        resetForm();
        setIsEditMode(false);
        setFormData(prev => ({
            ...prev,
            transactionType: 'Stock In',
            quantityIn: 1,
            quantityOut: 0
        }));
        setIsDrawerOpen(true);
    };

    // Open Stock Out Drawer
    const openStockOutDrawer = () => {
        resetForm();
        setIsEditMode(false);
        setFormData(prev => ({
            ...prev,
            transactionType: 'Stock Out',
            quantityIn: 0,
            quantityOut: 1
        }));
        setIsDrawerOpen(true);
    };

    const handleSaveStock = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            const payload = { ...formData, companyId: activeCompanyId };
            if (isEditMode && selectedStock) {
                await api.put(`/stocks/${selectedStock.id}`, payload);
                toast.success('Stock transaction updated successfully!');
            } else {
                await api.post('/stocks', payload);
                toast.success('Stock transaction created successfully!');
            }
            setIsDrawerOpen(false);
            resetForm();
            fetchStocks();
        } catch (err) {
            console.error('Failed to save stock:', err);
            toast.error('Operation failed.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to remove this stock transaction?')) return;
        try {
            await api.delete(`/stocks/${id}`);
            toast.success('Transaction removed successfully.');
            fetchStocks();
        } catch (err) {
            toast.error('Failed to delete transaction.');
        }
    };

    const handleCsvUpload = async (e) => {
        e.preventDefault();
        if (!csvFile) {
            toast.error('Please select a CSV file.');
            return;
        }

        const data = new FormData();
        data.append('file', csvFile);
        data.append('companyId', activeCompanyId);

        try {
            setSubmitting(true);
            await api.post('/stocks/upload-csv', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success('CSV stocks uploaded & imported successfully!');
            setIsCsvModalOpen(false);
            setCsvFile(null);
            fetchStocks();
        } catch (err) {
            toast.error(err.response?.data?.error || 'CSV import failed.');
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            stockDate: new Date().toISOString().split('T')[0],
            productId: '',
            productSearchName: '',
            warehouseId: '',
            transactionDate: new Date().toISOString().split('T')[0],
            transactionType: 'Stock Out',
            quantityIn: 0,
            quantityOut: 1,
            issueDate: new Date().toISOString().split('T')[0],
            status: 'Active',
            remarks: '',
            userId: 'Admin'
        });
        setSelectedStock(null);
    };

    const openEditDrawer = (item) => {
        setSelectedStock(item);
        setIsEditMode(true);
        setFormData({
            stockDate: item.stockDate?.split('T')[0] || '',
            productId: item.productId || '',
            productSearchName: item.productName || '',
            warehouseId: item.warehouseId || '',
            transactionDate: item.transactionDate?.split('T')[0] || '',
            transactionType: item.transactionType || 'Stock Out',
            quantityIn: item.quantityIn || 0,
            quantityOut: item.quantityOut || 1,
            issueDate: item.issueDate?.split('T')[0] || '',
            status: item.status || 'Active',
            remarks: item.remarks || '',
            userId: item.userId || 'Admin'
        });
        setIsDrawerOpen(true);
    };

    const exportCsv = () => {
        const headers = ['Txn ID', 'Stock Date', 'Product', 'Warehouse', 'Type', 'Quantity', 'Status', 'User'];
        const rows = stocks.map(s => {
            const isIn = s.transactionType === 'Stock In' || s.transactionType === 'Return' || s.transactionType === 'Purchase';
            const qty = isIn ? s.quantityIn : s.quantityOut;
            return [s.transactionId, s.stockDate, s.productName, s.warehouseName || 'Main', s.transactionType, qty, s.status, s.userId];
        });
        let csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `stocks_export_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('CSV Exported successfully!');
    };

    const exportPdf = () => {
        window.print();
    };

    const totalPages = Math.ceil(totalCount / limit) || 1;

    return (
        <div className="space-y-6 w-full px-4 sm:px-6 lg:px-8 pb-20 font-sans text-slate-950 relative">
            {/* Header with Stock In & Stock Out Quick Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">Stock In & Stock Out Management</h1>
                    <p className="text-xs text-slate-500 mt-0.5">Track inventory movements, item allocations, and supply chain updates.</p>
                </div>
                <div className="flex items-center gap-2.5 flex-wrap">
                    <button 
                        onClick={openStockInDrawer}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-sm shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer"
                    >
                        <TrendingUp size={15} /> + Stock In
                    </button>
                    <button 
                        onClick={openStockOutDrawer}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer"
                    >
                        <TrendingDown size={15} /> - Stock Out
                    </button>

                    <button 
                        onClick={() => setIsCsvModalOpen(true)}
                        className="px-3.5 py-2.5 bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-semibold rounded-xl transition flex items-center gap-1 cursor-pointer"
                    >
                        <Upload size={14} /> CSV
                    </button>
                    <button 
                        onClick={exportCsv}
                        className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1 cursor-pointer"
                    >
                        <FileSpreadsheet size={14} /> Export
                    </button>
                    <button 
                        onClick={exportPdf}
                        className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1 cursor-pointer"
                    >
                        <Printer size={14} /> Print
                    </button>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="relative w-full md:w-80">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                        type="text"
                        placeholder="Search transaction ID, product, remarks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-blue-500"
                    />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
                    {/* Warehouse Filter Dropdown */}
                    <select 
                        value={warehouseFilter}
                        onChange={(e) => setWarehouseFilter(e.target.value)}
                        className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
                    >
                        <option value="All">All Warehouses</option>
                        {warehousesList.map(w => (
                            <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                    </select>

                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
                    >
                        <option value="All">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Returned">Returned</option>
                        <option value="Overdue">Overdue</option>
                        <option value="Lost">Lost</option>
                        <option value="Completed">Completed</option>
                    </select>

                    <select 
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
                    >
                        <option value="All">All Types</option>
                        <option value="Stock In">Stock In</option>
                        <option value="Stock Out">Stock Out</option>
                        <option value="Issue">Issue</option>
                        <option value="Return">Return</option>
                        <option value="Purchase">Purchase</option>
                        <option value="Sales">Sales</option>
                    </select>

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
                <div className="p-20 text-center text-xs text-slate-400">Loading stock records...</div>
            ) : stocks.length === 0 ? (
                <div className="p-20 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
                    <Layers size={32} className="mx-auto text-slate-300" />
                    <p className="text-xs font-bold text-slate-700">No stock transactions found.</p>
                </div>
            ) : viewMode === 'table' ? (
                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                    <th className="p-4">Txn ID</th>
                                    <th className="p-4">Stock Date</th>
                                    <th className="p-4">Product Name</th>
                                    <th className="p-4">Warehouse</th>
                                    <th className="p-4">Type</th>
                                    <th className="p-4">Quantity</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                                {stocks.map((item) => {
                                    const isIn = item.transactionType === 'Stock In' || item.transactionType === 'Return' || item.transactionType === 'Purchase';
                                    const displayQty = isIn ? item.quantityIn : item.quantityOut;
                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50/50 transition">
                                            <td className="p-4 font-mono font-bold text-blue-600">{item.transactionId}</td>
                                            <td className="p-4 text-slate-600">{item.stockDate?.split('T')[0]}</td>
                                            <td className="p-4">
                                                <div className="font-bold text-slate-900">{item.productName}</div>
                                                <div className="text-[10px] text-slate-400 font-mono">SKU: {item.productSku}</div>
                                            </td>
                                            <td className="p-4 font-semibold text-slate-700">
                                                <span className="inline-flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg">
                                                    <Building size={12} className="text-slate-400" />
                                                    {item.warehouseName || 'Main Warehouse'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] ${isIn ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                                    {isIn ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                                                    {item.transactionType}
                                                </span>
                                            </td>
                                            <td className={`p-4 font-mono font-bold ${isIn ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {isIn ? `+${item.quantityIn}` : `-${item.quantityOut}`}
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                                                    item.status === 'Active' ? 'bg-amber-50 text-amber-600' :
                                                    item.status === 'Returned' ? 'bg-emerald-50 text-emerald-600' :
                                                    item.status === 'Overdue' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right space-x-2">
                                                <button onClick={() => { setSelectedStock(item); setIsViewModalOpen(true); }} className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg cursor-pointer" title="View">
                                                    <Eye size={14} />
                                                </button>
                                                <button onClick={() => openEditDrawer(item)} className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg cursor-pointer" title="Edit">
                                                    <Edit3 size={14} />
                                                </button>
                                                <button onClick={() => handleDelete(item.id)} className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg cursor-pointer" title="Delete">
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {stocks.map((item) => {
                        const isIn = item.transactionType === 'Stock In' || item.transactionType === 'Return' || item.transactionType === 'Purchase';
                        const displayQty = isIn ? item.quantityIn : item.quantityOut;
                        return (
                            <div key={item.id} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">{item.transactionId}</span>
                                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${item.status === 'Active' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                        {item.status}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">{item.productName}</h3>
                                    <p className="text-[11px] text-slate-400 font-mono">SKU: {item.productSku} • Warehouse: {item.warehouseName || 'Main'}</p>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-2xl flex items-center justify-between text-xs">
                                    <span className="font-semibold text-slate-700">{item.transactionType}</span>
                                    <span className={`font-mono font-bold ${isIn ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {isIn ? `+${item.quantityIn}` : `-${item.quantityOut}`}
                                    </span>
                                </div>
                                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                    <button onClick={() => { setSelectedStock(item); setIsViewModalOpen(true); }} className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer">View</button>
                                    <button onClick={() => openEditDrawer(item)} className="px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-semibold rounded-xl cursor-pointer">Edit</button>
                                    <button onClick={() => handleDelete(item.id)} className="px-3 py-1.5 bg-rose-50 text-rose-600 text-xs font-semibold rounded-xl cursor-pointer">Delete</button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            <div className="flex items-center justify-between pt-4">
                <span className="text-xs text-slate-500">Showing page {currentPage} of {totalPages} ({totalCount} total)</span>
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

            {/* SLIDE-OVER DRAWER FOR STOCK IN / OUT */}
            {isDrawerOpen && (
                <div className="fixed inset-0 z-50 overflow-hidden">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
                        onClick={() => setIsDrawerOpen(false)}
                    />

                    <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
                        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
                            {/* Drawer Header */}
                            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                                <h2 className="text-sm font-bold text-slate-900">
                                    {isEditMode ? 'Edit Stock Transaction' : formData.transactionType === 'Stock In' ? 'Record Stock In' : 'Record Stock Out'}
                                </h2>
                                <button 
                                    onClick={() => setIsDrawerOpen(false)}
                                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Drawer Body / Form */}
                            <form onSubmit={handleSaveStock} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs font-medium">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-slate-700">Stock Date *</label>
                                        <input type="date" name="stockDate" value={formData.stockDate} onChange={handleFormChange} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50/50" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-slate-700">Transaction Date *</label>
                                        <input type="date" name="transactionDate" value={formData.transactionDate} onChange={handleFormChange} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50/50" />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-slate-700">Searchable Product *</label>
                                    <input 
                                        type="text" 
                                        name="productSearchName" 
                                        required 
                                        list="products-list-dropdown"
                                        value={formData.productSearchName} 
                                        onChange={handleFormChange} 
                                        placeholder="Type or select product name..." 
                                        className="w-full p-3 border border-slate-200 rounded-xl bg-white" 
                                    />
                                    <datalist id="products-list-dropdown">
                                        {productsList.map(p => (
                                            <option key={p.id} value={p.name} />
                                        ))}
                                    </datalist>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-slate-700">Warehouse *</label>
                                    <select 
                                        name="warehouseId" 
                                        required 
                                        value={formData.warehouseId} 
                                        onChange={handleFormChange} 
                                        className="w-full p-3 border border-slate-200 rounded-xl bg-white font-semibold cursor-pointer"
                                    >
                                        <option value="">Select Warehouse</option>
                                        {warehousesList.map(w => (
                                            <option key={w.id} value={w.id}>{w.name} ({w.code || 'Main'})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-slate-700">Transaction Type</label>
                                    <select name="transactionType" value={formData.transactionType} onChange={handleFormChange} className="w-full p-3 border border-slate-200 rounded-xl bg-white font-semibold cursor-pointer">
                                        <option value="Stock In">Stock In</option>
                                        <option value="Stock Out">Stock Out</option>
                                        <option value="Issue">Issue</option>
                                        <option value="Return">Return</option>
                                        <option value="Purchase">Purchase</option>
                                        <option value="Sales">Sales</option>
                                    </select>
                                </div>

                                {(formData.transactionType === 'Stock In' || formData.transactionType === 'Purchase' || formData.transactionType === 'Return') ? (
                                    <div className="space-y-1">
                                        <label className="text-slate-700 font-bold text-emerald-700">Quantity In *</label>
                                        <input type="number" step="0.01" name="quantityIn" required value={formData.quantityIn} onChange={handleFormChange} className="w-full p-3 border border-emerald-200 bg-emerald-50/30 rounded-xl font-mono font-bold text-emerald-800" />
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        <label className="text-slate-700 font-bold text-blue-700">Quantity Out *</label>
                                        <input type="number" step="0.01" name="quantityOut" required value={formData.quantityOut} onChange={handleFormChange} className="w-full p-3 border border-blue-200 bg-blue-50/30 rounded-xl font-mono font-bold text-blue-800" />
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-slate-700">Issue Date *</label>
                                        <input type="date" name="issueDate" value={formData.issueDate} onChange={handleFormChange} className="w-full p-3 border border-slate-200 rounded-xl" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-slate-700">Status</label>
                                        <select name="status" value={formData.status} onChange={handleFormChange} className="w-full p-3 border border-slate-200 rounded-xl bg-white font-semibold cursor-pointer">
                                            <option value="Active">Active</option>
                                            <option value="Returned">Returned</option>
                                            <option value="Overdue">Overdue</option>
                                            <option value="Lost">Lost</option>
                                            <option value="Completed">Completed</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-slate-700">Remarks</label>
                                    <textarea name="remarks" rows={3} value={formData.remarks} onChange={handleFormChange} placeholder="Add transaction notes..." className="w-full p-3 border border-slate-200 rounded-xl" />
                                </div>

                                <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
                                    <button 
                                        type="button" 
                                        onClick={() => setIsDrawerOpen(false)} 
                                        className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer transition"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={submitting} 
                                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md cursor-pointer transition"
                                    >
                                        {submitting ? 'Saving...' : 'Save Transaction'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* CSV UPLOAD MODAL */}
            {isCsvModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-6 shadow-xl">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <h2 className="text-base font-bold text-slate-900">Upload Stocks CSV</h2>
                            <button onClick={() => setIsCsvModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer">
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleCsvUpload} className="space-y-4 text-xs font-medium">
                            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center space-y-2 bg-slate-50">
                                <Upload size={24} className="mx-auto text-slate-400" />
                                <p className="font-bold text-slate-700">Select CSV file with stock records</p>
                                <input type="file" accept=".csv" onChange={(e) => setCsvFile(e.target.files[0])} className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 cursor-pointer" />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setIsCsvModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer">Cancel</button>
                                <button type="submit" disabled={submitting} className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-md cursor-pointer">{submitting ? 'Uploading...' : 'Import CSV'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* VIEW DETAILS MODAL */}
            {isViewModalOpen && selectedStock && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-xl">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <h2 className="text-base font-bold text-slate-900">Transaction Details ({selectedStock.transactionId})</h2>
                            <button onClick={() => setIsViewModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="space-y-3 text-xs">
                            <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-slate-400">Product Name:</span><span className="font-bold text-slate-900">{selectedStock.productName}</span></div>
                            <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-slate-400">Product SKU:</span><span className="font-mono text-slate-600">{selectedStock.productSku}</span></div>
                            <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-slate-400">Warehouse:</span><span className="font-semibold text-slate-800">{selectedStock.warehouseName || 'Main Warehouse'}</span></div>
                            <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-slate-400">Transaction Type:</span><span className="font-bold text-blue-600">{selectedStock.transactionType}</span></div>
                            <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-slate-400">Quantity In:</span><span className="font-mono font-bold text-emerald-600">{selectedStock.quantityIn}</span></div>
                            <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-slate-400">Quantity Out:</span><span className="font-mono font-bold text-rose-600">{selectedStock.quantityOut}</span></div>
                            <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-slate-400">Stock Date:</span><span className="text-slate-800">{selectedStock.stockDate?.split('T')[0]}</span></div>
                            <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-slate-400">Status:</span><span className="font-semibold text-slate-800">{selectedStock.status}</span></div>
                            <div className="flex flex-col py-2"><span className="text-slate-400 mb-1">Remarks:</span><p className="p-3 bg-slate-50 rounded-xl text-slate-700">{selectedStock.remarks || 'No remarks added.'}</p></div>
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

export default Stocks;