import { useState, useEffect, useRef } from 'react';
import { 
    Search, Plus, FileSpreadsheet, Trash2, Edit3, 
    Eye, X, ChevronLeft, ChevronRight, Printer, 
    ShoppingCart, Trash, SlidersHorizontal, ChevronDown, Settings, Paperclip, ArrowLeft, Sparkles, Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/axios.js';

const PurchaseOrders = () => {
    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [vendorsList, setVendorsList] = useState([]);
    const [productsList, setProductsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('All');
    const [viewMode, setViewMode] = useState('table');

    const [activeCompanyId] = useState(() => localStorage.getItem('activeCompanyId') || 1);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const limit = 10;

    // View Details Modal
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedPo, setSelectedPo] = useState(null);
    const [isActionsOpen, setIsActionsOpen] = useState(false);
    const actionsRef = useRef(null);

    // View Mode: 'list' or 'create' (matches attached layout view)
    const [pageMode, setPageMode] = useState('list'); // 'list' or 'create'
    const [isEditMode, setIsEditMode] = useState(false);

    // Form State matching attached layout[cite: 5]
    const [formData, setFormData] = useState({
        poNumber: '1',
        type: 'Regular',
        dispatchTo: 'SAHANA BEVERAGE, PLOT NO-101/1586/2684, K...',
        vendorId: '',
        vendorSearchName: '',
        orderDate: new Date().toISOString().split('T')[0],
        deliveryDate: new Date().toISOString().split('T')[0],
        reference: '',
        vehicleNo: '',
        salesPerson: '',
        dlNo: '',
        status: 'Draft',
        paymentStatus: 'Pending',
        remarks: '',
        roundOff: true,
        extraDiscount: 0,
        items: [],
        attachments: []
    });

    // Product search input in create form
    const [productSearchInput, setProductSearchInput] = useState('');
    const [productQtyInput, setProductQtyInput] = useState(1);
    const [submitting, setSubmitting] = useState(false);

    const fetchPurchaseOrders = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/purchase-orders`, {
                params: { 
                    companyId: activeCompanyId, 
                    search: searchQuery, 
                    status: activeTab !== 'All' ? activeTab : 'All', 
                    page: currentPage, 
                    limit 
                }
            });
            if (res.data?.success) {
                setPurchaseOrders(res.data.data || []);
                setTotalCount(res.data.totalCount || 0);
            }
        } catch (err) {
            console.error('Failed to fetch purchase orders:', err);
            toast.error('Could not load purchase orders.');
        } finally {
            setLoading(false);
        }
    };

    const fetchVendors = async () => {
        try {
            const res = await api.get(`/vendors?companyId=${activeCompanyId}&limit=100`);
            if (res.data?.success) setVendorsList(res.data.data || []);
        } catch (err) { console.error(err); }
    };

    const fetchProducts = async () => {
        try {
            const res = await api.get(`/products?companyId=${activeCompanyId}&limit=100`);
            if (res.data?.success) setProductsList(res.data.data || []);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        fetchPurchaseOrders();
        fetchVendors();
        fetchProducts();
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

    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name === 'vendorSearchName') {
            const found = vendorsList.find(v => v.name === value);
            setFormData(prev => ({ ...prev, vendorSearchName: value, vendorId: found ? found.id : '' }));
            return;
        }
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleAddProductToBill = () => {
        if (!productSearchInput.trim()) return toast.error('Please select or search a product.');
        const found = productsList.find(p => p.name.toLowerCase() === productSearchInput.toLowerCase()) || productsList[0];
        
        if (!found) return toast.error('Product not found.');

        const newItem = {
            productId: found.id,
            productSearchName: found.name,
            quantity: parseFloat(productQtyInput || 1),
            unitPrice: parseFloat(found.purchasePrice || found.price || 100),
            lineTotal: parseFloat(productQtyInput || 1) * parseFloat(found.purchasePrice || found.price || 100)
        };

        setFormData(prev => ({ ...prev, items: [...prev.items, newItem] }));
        setProductSearchInput('');
        setProductQtyInput(1);
        toast.success('Product added to bill.');
    };

    const handleItemTableChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;
        if (field === 'quantity' || field === 'unitPrice') {
            newItems[index].lineTotal = parseFloat(newItems[index].quantity || 0) * parseFloat(newItems[index].unitPrice || 0);
        }
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const removeItemRow = (index) => {
        setFormData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
    };

    const handleFileAttach = (e) => {
        const files = Array.from(e.target.files);
        if (formData.attachments.length + files.length > 5) return toast.error('Maximum 5 files allowed.');
        setFormData(prev => ({ ...prev, attachments: [...prev.attachments, ...files] }));
    };

    const removeAttachment = (index) => {
        setFormData(prev => ({ ...prev, attachments: prev.attachments.filter((_, i) => i !== index) }));
    };

    const openCreateMode = () => {
        setIsEditMode(false);
        setFormData({
            poNumber: `PO-${Math.floor(100 + Math.random() * 900)}`,
            type: 'Regular',
            dispatchTo: 'SAHANA BEVERAGE, PLOT NO-101/1586/2684, K...',
            vendorId: '',
            vendorSearchName: '',
            orderDate: new Date().toISOString().split('T')[0],
            deliveryDate: new Date().toISOString().split('T')[0],
            reference: '',
            vehicleNo: '',
            salesPerson: '',
            dlNo: '',
            status: 'Draft',
            paymentStatus: 'Pending',
            remarks: '',
            roundOff: true,
            extraDiscount: 0,
            items: [],
            attachments: []
        });
        setPageMode('create');
    };

    const openEditMode = (po) => {
        setSelectedPo(po);
        setIsEditMode(true);
        setFormData({
            poNumber: po.poNumber || '',
            type: 'Regular',
            dispatchTo: 'SAHANA BEVERAGE, PLOT NO-101/1586/2684, K...',
            vendorId: po.vendorId || '',
            vendorSearchName: po.vendorName || '',
            orderDate: po.orderDate?.split('T')[0] || '',
            deliveryDate: po.deliveryDate?.split('T')[0] || '',
            reference: po.remarks || '',
            vehicleNo: '',
            salesPerson: '',
            dlNo: '',
            status: po.status || 'Draft',
            paymentStatus: po.paymentStatus || 'Pending',
            remarks: po.remarks || '',
            roundOff: true,
            extraDiscount: 0,
            items: po.items ? po.items.map(i => ({
                productId: i.productId,
                productSearchName: i.productName,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                lineTotal: i.lineTotal
            })) : [],
            attachments: []
        });
        setPageMode('create');
    };

    const handleSavePo = async (statusOverride = null) => {
        if (!formData.vendorId && !formData.vendorSearchName) return toast.error('Please select or specify a vendor.');
        if (formData.items.length === 0) return toast.error('Please add at least one product line item.');

        try {
            setSubmitting(true);
            const payload = { 
                ...formData, 
                status: statusOverride || formData.status,
                companyId: activeCompanyId 
            };
            if (isEditMode && selectedPo) {
                await api.put(`/purchase-orders/${selectedPo.id}`, payload);
                toast.success('Purchase Order updated successfully!');
            } else {
                await api.post('/purchase-orders', payload);
                toast.success('Purchase Order created successfully!');
            }
            setPageMode('list');
            fetchPurchaseOrders();
        } catch (err) {
            toast.error('Operation failed.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Remove this purchase order?')) return;
        try {
            await api.delete(`/purchase-orders/${id}`);
            toast.success('Removed successfully.');
            fetchPurchaseOrders();
        } catch (err) {
            toast.error('Delete failed.');
        }
    };

    const exportCsv = () => {
        const headers = ['PO Number', 'Vendor', 'Order Date', 'Total Amount', 'Status'];
        const rows = purchaseOrders.map(po => [po.poNumber, po.vendorName, po.orderDate, po.totalAmount, po.status]);
        let csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const link = document.createElement('a');
        link.setAttribute('href', encodeURI(csvContent));
        link.setAttribute('download', `purchase_orders_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('CSV Exported!');
    };

    const taxableAmount = formData.items.reduce((acc, item) => acc + (parseFloat(item.quantity || 0) * parseFloat(item.unitPrice || 0)), 0);
    const totalTax = taxableAmount * 0.18; // 18% GST standard simulation
    const totalAmount = taxableAmount + totalTax - parseFloat(formData.extraDiscount || 0);

    const totalAmountSum = purchaseOrders.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const closedAmountSum = purchaseOrders.filter(p => p.status === 'Received' || p.status === 'Approved').reduce((acc, curr) => acc + curr.totalAmount, 0);

    const totalPages = Math.ceil(totalCount / limit) || 1;

    // ==================== CREATE / EDIT PAGE VIEW ====================
    if (pageMode === 'create') {
        return (
            <div className="w-full min-h-screen bg-slate-50/50 pb-24 font-sans text-slate-900">
                {/* Top Sticky Bar matching attached layout[cite: 5] */}
                <div className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setPageMode('list')} className="p-1.5 hover:bg-slate-100 rounded-xl cursor-pointer text-slate-600" title="Back">
                            <ArrowLeft size={18} />
                        </button>
                        <h1 className="text-sm font-bold text-slate-900">{isEditMode ? 'Edit Purchase Order' : 'Create Purchase Order'}</h1>
                        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-xl text-xs font-mono font-bold text-slate-700">
                            <span>PO -</span>
                            <input type="text" name="poNumber" value={formData.poNumber} onChange={handleFormChange} className="w-16 bg-transparent focus:outline-hidden" />
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => handleSavePo('Draft')} className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl cursor-pointer shadow-2xs">Save as Draft</button>
                        <button onClick={() => { handleSavePo(); window.print(); }} className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl cursor-pointer shadow-2xs">Save and Print v</button>
                        <button onClick={() => handleSavePo('Approved')} disabled={submitting} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1">
                            Save →
                        </button>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
                    {/* Top Secondary Bar[cite: 5] */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4 text-xs">
                        <div className="flex items-center gap-4">
                            <div>
                                <span className="text-slate-400 block text-[10px]">Type</span>
                                <select name="type" value={formData.type} onChange={handleFormChange} className="font-bold text-slate-800 bg-transparent focus:outline-hidden cursor-pointer">
                                    <option value="Regular">Regular</option>
                                    <option value="Job Work">Job Work</option>
                                </select>
                            </div>
                            <div className="h-6 w-px bg-slate-200" />
                            <div>
                                <span className="text-slate-400 block text-[10px]">Dispatch To</span>
                                <input type="text" name="dispatchTo" value={formData.dispatchTo} onChange={handleFormChange} className="font-bold text-slate-800 bg-transparent w-80 focus:outline-hidden" />
                            </div>
                        </div>
                        <button className="text-blue-600 font-semibold flex items-center gap-1 cursor-pointer"><Settings size={13} /> Settings</button>
                    </div>

                    {/* Main Vendor & Dates Box[cite: 5] */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="space-y-1 md:col-span-1">
                                <label className="text-slate-500 text-xs font-semibold">Select Vendor *</label>
                                <div className="relative">
                                    <input type="text" name="vendorSearchName" required list="vendors-create-dropdown" value={formData.vendorSearchName} onChange={handleFormChange} placeholder="Search vendors by name, company..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-blue-500" />
                                    <datalist id="vendors-create-dropdown">{vendorsList.map(v => <option key={v.id} value={v.name} />)}</datalist>
                                </div>
                                <button onClick={() => toast('Opening add vendor modal')} className="text-blue-600 font-semibold text-[11px] pt-1 block cursor-pointer">+ Create Vendor</button>
                            </div>

                            <div className="space-y-1">
                                <label className="text-slate-500 text-xs font-semibold">Purchase Order Date</label>
                                <input type="date" name="orderDate" value={formData.orderDate} onChange={handleFormChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden" />
                            </div>

                            <div className="space-y-1">
                                <label className="text-slate-500 text-xs font-semibold">Payment by</label>
                                <input type="date" name="deliveryDate" value={formData.deliveryDate} onChange={handleFormChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden" />
                            </div>

                            <div className="space-y-1">
                                <label className="text-slate-500 text-xs font-semibold">Reference</label>
                                <input type="text" name="reference" value={formData.reference} onChange={handleFormChange} placeholder="Reference, e.g. PO Number..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden" />
                            </div>
                        </div>

                        {/* Custom Headers[cite: 5] */}
                        <div className="pt-4 border-t border-slate-100 space-y-3">
                            <p className="text-xs font-bold text-slate-700">Custom Headers</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="text-[11px] text-slate-400">Vehicle No</label>
                                    <input type="text" name="vehicleNo" value={formData.vehicleNo} onChange={handleFormChange} placeholder="Vehicle No" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400">Sales Person</label>
                                    <input type="text" name="salesPerson" value={formData.salesPerson} onChange={handleFormChange} placeholder="Sales Person" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400">DL NO</label>
                                    <input type="text" name="dlNo" value={formData.dlNo} onChange={handleFormChange} placeholder="DL NO" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Products & Services Section[cite: 5] */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-slate-900">Products & Services</p>
                            <button className="text-blue-600 font-semibold text-xs flex items-center gap-1 cursor-pointer">+ Add new Product?</button>
                        </div>

                        <div className="flex flex-col md:flex-row items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                            <div className="relative flex-1 w-full">
                                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input type="text" list="products-create-autocomplete" value={productSearchInput} onChange={(e) => setProductSearchInput(e.target.value)} placeholder="Search or scan barcode for existing products" className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-hidden" />
                                <datalist id="products-create-autocomplete">{productsList.map(p => <option key={p.id} value={p.name} />)}</datalist>
                            </div>
                            <div className="w-full md:w-32">
                                <input type="number" step="0.01" value={productQtyInput} onChange={(e) => setProductQtyInput(e.target.value)} placeholder="Qty" className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono" />
                            </div>
                            <button type="button" onClick={handleAddProductToBill} className="w-full md:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer whitespace-nowrap">
                                + Add to Bill
                            </button>
                        </div>

                        {/* Items Table[cite: 5] */}
                        {formData.items.length === 0 ? (
                            <div className="py-16 text-center space-y-3 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                <ShoppingCart size={28} className="mx-auto text-slate-300" />
                                <p className="text-xs text-slate-500">Search existing products to add to this list or add new product to get started! 🚀</p>
                            </div>
                        ) : (
                            <div className="border border-slate-200 rounded-2xl overflow-hidden">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="bg-slate-50 text-[10px] text-slate-400 uppercase font-bold border-b border-slate-200">
                                            <th className="p-3">Product Name</th>
                                            <th className="p-3 text-center">Quantity</th>
                                            <th className="p-3 text-right">Unit Price</th>
                                            <th className="p-3 text-right">Total Amount</th>
                                            <th className="p-3 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-mono">
                                        {formData.items.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50">
                                                <td className="p-3 font-sans font-bold text-slate-900">{item.productSearchName}</td>
                                                <td className="p-3 text-center">
                                                    <input type="number" step="0.01" value={item.quantity} onChange={(e) => handleItemTableChange(idx, 'quantity', e.target.value)} className="w-20 p-1.5 border border-slate-200 rounded-lg text-center" />
                                                </td>
                                                <td className="p-3 text-right">
                                                    <input type="number" step="0.01" value={item.unitPrice} onChange={(e) => handleItemTableChange(idx, 'unitPrice', e.target.value)} className="w-24 p-1.5 border border-slate-200 rounded-lg text-right" />
                                                </td>
                                                <td className="p-3 text-right font-bold text-emerald-700">₹{item.lineTotal.toFixed(2)}</td>
                                                <td className="p-3 text-center">
                                                    <button type="button" onClick={() => removeItemRow(idx)} className="text-rose-500 hover:text-rose-700 cursor-pointer"><Trash size={14} /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Bottom Grid: Notes, Terms & Totals[cite: 5] */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        <div className="lg:col-span-7 space-y-4">
                            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-800">Notes, terms & more...</span>
                                    <button className="text-violet-600 bg-violet-50 hover:bg-violet-100 px-3 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"><Sparkles size={12} /> AI</button>
                                </div>
                                <textarea name="remarks" rows={3} value={formData.remarks} onChange={handleFormChange} placeholder="Enter your notes, say thanks, or anything else..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden" />
                            </div>

                            {/* Attach Files[cite: 5] */}
                            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
                                <label className="text-xs font-bold text-slate-800 block">Attach Files (Max: 5)</label>
                                <div className="flex items-center gap-3">
                                    <label className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer flex items-center gap-1.5 transition text-xs">
                                        <Paperclip size={14} /> Attach Files
                                        <input type="file" multiple onChange={handleFileAttach} className="hidden" />
                                    </label>
                                    <span className="text-[11px] text-slate-400">({formData.attachments.length} attached)</span>
                                </div>
                                {formData.attachments.length > 0 && (
                                    <div className="space-y-1 pt-1 text-xs">
                                        {formData.attachments.map((file, i) => (
                                            <div key={i} className="flex items-center justify-between bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                                                <span className="truncate text-slate-700">{file.name}</span>
                                                <button type="button" onClick={() => removeAttachment(i)} className="text-rose-500 cursor-pointer"><X size={13} /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Calculation Summary Card[cite: 5] */}
                        <div className="lg:col-span-5 bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100 shadow-2xs space-y-4 text-xs font-medium">
                            <div className="flex justify-between text-slate-600">
                                <span>Taxable Amount</span>
                                <span className="font-mono font-bold">₹{taxableAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                                <span>Total Tax (18% GST)</span>
                                <span className="font-mono font-bold">₹{totalTax.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-600 pt-1 border-t border-emerald-200/50">
                                <span>Round Off</span>
                                <input type="checkbox" name="roundOff" checked={formData.roundOff} onChange={handleFormChange} className="cursor-pointer" />
                            </div>
                            <div className="flex justify-between items-center text-slate-900 font-bold text-sm pt-2 border-t border-emerald-200">
                                <span>Total Amount</span>
                                <span className="font-mono text-emerald-700">₹{totalAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-slate-500 text-[11px]">
                                <span>Total Discount</span>
                                <span className="font-mono">₹0.00</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ==================== LIST TABLE VIEW ====================
    return (
        <div className="space-y-6 w-full px-6 py-6 pb-20 font-sans text-slate-900 bg-white min-h-screen">
            
            {/* Top Header matching Swipe style[cite: 3] */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
                <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">Purchase Orders</h1>
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
                        onClick={openCreateMode} 
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer transition"
                    >
                        <Plus size={15} /> Create Purchase Order
                    </button>
                </div>
            </div>

            {/* Navigation Tabs[cite: 3] */}
            <div className="flex items-center gap-8 border-b border-slate-200/80 pb-3 overflow-x-auto text-xs font-semibold">
                {['All', 'Open', 'Closed', 'Partial', 'Cancelled', 'Drafts'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
                        className={`pb-1 transition relative cursor-pointer whitespace-nowrap ${
                            activeTab === tab ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        {tab}
                        {activeTab === tab && (
                            <span className="absolute bottom-[-13px] left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                        )}
                    </button>
                ))}
            </div>

            {/* Filter & Search Bar Row[cite: 3] */}
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

            {/* Table Header Columns[cite: 3] */}
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
                <div className="grid grid-cols-12 px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200/60">
                    <div className="col-span-2 flex items-center gap-1">Amount ↕</div>
                    <div className="col-span-2 flex items-center gap-1">Status ↕</div>
                    <div className="col-span-2 flex items-center gap-1">Bill # ↕</div>
                    <div className="col-span-3">Vendor</div>
                    <div className="col-span-3 flex items-center justify-between">
                        <span>Date ↕</span>
                        <span className="text-[10px] text-slate-400 font-normal">Created time</span>
                    </div>
                </div>

                {loading ? (
                    <div className="p-16 text-center text-xs text-slate-400">Loading purchase orders...</div>
                ) : purchaseOrders.length === 0 ? (
                    <div className="py-20 px-6 text-center space-y-3 bg-white">
                        <p className="text-sm font-medium text-slate-600">
                            Oops 😳 ! No purchase orders found.
                        </p>
                        <p className="text-xs text-slate-400">
                            Please select different <span className="text-blue-600 font-semibold cursor-pointer">dates</span> or create a new <span onClick={openCreateMode} className="text-blue-600 font-semibold cursor-pointer underline">Purchase Order</span>
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 bg-white text-xs">
                        {purchaseOrders.map((po) => (
                            <div key={po.id} className="grid grid-cols-12 items-center px-6 py-4 hover:bg-slate-50/80 transition group">
                                <div className="col-span-2 font-mono font-bold text-slate-900">₹{po.totalAmount.toFixed(2)}</div>
                                <div className="col-span-2">
                                    <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-emerald-50 text-emerald-700">
                                        {po.status}
                                    </span>
                                </div>
                                <div className="col-span-2 font-mono text-blue-600 font-semibold">{po.poNumber}</div>
                                <div className="col-span-3 font-bold text-slate-900 truncate">{po.vendorName}</div>
                                <div className="col-span-3 flex items-center justify-between text-slate-500">
                                    <span>{po.orderDate?.split('T')[0]}</span>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                                        <button onClick={() => { setSelectedPo(po); setIsViewModalOpen(true); }} className="p-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 cursor-pointer" title="View"><Eye size={13} /></button>
                                        <button onClick={() => openEditMode(po)} className="p-1 bg-blue-50 hover:bg-blue-100 rounded text-blue-600 cursor-pointer" title="Edit"><Edit3 size={13} /></button>
                                        <button onClick={() => handleDelete(po.id)} className="p-1 bg-rose-50 hover:bg-rose-100 rounded text-rose-600 cursor-pointer" title="Delete"><Trash2 size={13} /></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Bottom Footer Summaries & Pagination[cite: 3] */}
            <div className="flex flex-col sm:flex-row items-center justify-between pt-2 gap-4">
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 shadow-2xs flex items-center gap-2">
                        <span className="text-slate-400 font-normal">Total</span>
                        <span className="font-mono text-slate-900">₹{totalAmountSum.toFixed(2)}</span>
                    </div>
                    <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 shadow-2xs flex items-center gap-2">
                        <span className="text-slate-400 font-normal">Closed</span>
                        <span className="font-mono text-slate-900">₹{closedAmountSum.toFixed(2)}</span>
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
            {isViewModalOpen && selectedPo && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-6 shadow-xl">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <h2 className="text-base font-bold text-slate-900">PO Details ({selectedPo.poNumber})</h2>
                            <button onClick={() => setIsViewModalOpen(false)} className="p-1.5 text-slate-400 rounded-xl cursor-pointer"><X size={18} /></button>
                        </div>
                        <div className="space-y-4 text-xs">
                            <div className="flex justify-between py-1 border-b border-slate-100"><span className="text-slate-400">Vendor:</span><span className="font-bold text-slate-900">{selectedPo.vendorName}</span></div>
                            <div className="flex justify-between py-1 border-b border-slate-100"><span className="text-slate-400">Status / Payment:</span><span className="font-semibold">{selectedPo.status} / {selectedPo.paymentStatus}</span></div>
                            <div>
                                <p className="font-bold text-slate-700 mb-2">Ordered Line Items:</p>
                                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-50 text-[10px] text-slate-400 uppercase"><th className="p-2.5">Product</th><th className="p-2.5 text-center">Qty</th><th className="p-2.5 text-right">Price</th><th className="p-2.5 text-right">Total</th></tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 font-mono">
                                            {selectedPo.items?.map((item, i) => (
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
                            <div className="flex justify-between py-2 text-sm font-bold border-t border-slate-100"><span className="text-slate-500">Total Order Amount:</span><span className="font-mono text-emerald-700">₹{selectedPo.totalAmount.toFixed(2)}</span></div>
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

export default PurchaseOrders;