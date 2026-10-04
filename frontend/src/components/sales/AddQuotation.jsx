import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Search, Trash2, Plus, ChevronDown, Sparkles, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/axios.js';

const AddQuotation = ({ editId, onClose }) => {
    const navigate = useNavigate();
    const { id } = useParams();
    
    // Support either prop-based editId (slide-over mode) or URL param id (page mode)
    const currentId = editId || id;
    const isEditMode = Boolean(currentId);
    const [submitting, setSubmitting] = useState(false);
    const [activeCompanyId, setActiveCompanyId] = useState(null);
    const [companyDetails, setCompanyDetails] = useState(null);

    // Master Catalogs
    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [banks, setBanks] = useState([]);
    const [signatures, setSignatures] = useState([]);

    // Form Main State
    const [formData, setFormData] = useState({
        quotationNo: 'QOT-1',
        quotetype: 'Regular',
        dispatchFrom: '',
        customerName: '',
        customerId: '',
        billingAddress: '',
        shippingAddress: '',
        quotationDate: new Date().toISOString().split('T')[0],
        validityDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
        referenceNo: '',
        vehicleNo: '',
        salesPerson: '',
        dlNo: '',
        notes: '',
        termsConditions: '1. Goods once sold will not be taken back.\n2. Payment terms as agreed.',
        status: 'open',
        selectedBank: '',
        selectedSignature: '',
        applyDiscountAll: '',
        extraDiscountType: '%',
        extraDiscountVal: 0,
        roundOff: true,
        tcs: false
    });

    // Items array in bill
    const [items, setItems] = useState([]);

    // Product Search Input for adding items
    const [productSearch, setProductSearch] = useState('');
    const [isProdDropdownOpen, setIsProdDropdownOpen] = useState(false);
    const prodDropdownRef = useRef(null);

    // Customer Search Dropdown
    const [customerSearch, setCustomerSearch] = useState('');
    const [isCustDropdownOpen, setIsCustDropdownOpen] = useState(false);
    const custDropdownRef = useRef(null);

    // Handle close action (slide-over or navigation)
    const handleClose = () => {
        if (onClose) {
            onClose();
        } else {
            navigate('/quotations');
        }
    };

    useEffect(() => {
        const init = async () => {
            try {
                const compRes = await api.get('/company');
                const comp = compRes.data?.data || compRes.data || { id: 1 };
                const compId = comp.id || 1;
                setActiveCompanyId(compId);
                setCompanyDetails(comp);

                const prodRes = await api.get(`/products?companyId=${compId}`);
                setProducts(prodRes.data?.data || prodRes.data || []);
 
                const custRes = await api.get(`/customers?companyId=${compId}`);
                setCustomers(custRes.data?.data || custRes.data || []);

                // Fetching from bank_accounts table endpoint
                const bankRes = await api.get(`/banks?companyId=${compId}`).catch(() => ({ data: [] }));
                setBanks(bankRes.data?.data || bankRes.data || []);

                 
                const sigRes = await api.get(`/signatures?companyId=${compId}`).catch(() => ({ data: [] }));
                setSignatures(sigRes.data?.data || sigRes.data || [{ id: 1, name: 'Abanti-Mayee-Rath' }]);

                if (isEditMode) {
                    const qRes = await api.get(`/quotations/${currentId}`);
                    const found = qRes.data?.data;
                    if (found) {
                        setFormData(prev => ({
                            ...prev,
                            quotationNo: found.quotation_no || '',
                            customerName: found.customer_name || '',
                            billingAddress: found.billing_address || '',
                            shippingAddress: found.shipping_address || '',
                            quotationDate: found.quotation_date?.split('T')[0] || '',
                            validityDate: found.validity_date?.split('T')[0] || '',
                            referenceNo: found.reference_no || '',
                            vehicleNo: found.vehicle_no || '',
                            salesPerson: found.sales_person || '',
                            dlNo: found.dl_no || '',
                            notes: found.notes || '',
                            termsConditions: found.terms_conditions || '',
                            status: found.status || 'open'
                        }));
                        setItems((found.items || []).map(i => ({
                            productId: i.product_id,
                            productName: i.product_name,
                            description: i.product_desc || i.description || '',
                            showDescription: Boolean(i.product_desc || i.description),
                            quantity: parseFloat(i.quantity),
                            unitPrice: parseFloat(i.unit_price),
                            discountPercent: parseFloat(i.discount_percent || 0),
                            total: parseFloat(i.total)
                        })));
                    }
                } else {
                    const listRes = await api.get(`/quotations?companyId=${compId}`);
                    const count = (listRes.data?.totalCount || 0) + 1;

                    let prefixValue = 'QOT-';
                    try {
                        const prefixRes = await api.get(`/prefix?companyId=${compId}&documentType=Quotation&entryType=prefix`);
                        const prefixes = prefixRes.data?.data || [];
                        const defaultPrefix = prefixes.find(p => p.is_default) || prefixes[0];
                        if (defaultPrefix && defaultPrefix.prefix_value) {
                            prefixValue = defaultPrefix.prefix_value;
                        }
                    } catch (prefixErr) {
                        console.warn('Using default QOT-', prefixErr);
                    }

                    setFormData(prev => ({ ...prev, quotationNo: `${prefixValue}${count}` }));
                }
            } catch (err) {
                console.error('Init error:', err);
            }
        };
        init();
    }, [currentId, isEditMode]);

    const handleHeaderChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSelectCustomer = (cust) => {
        setFormData(prev => ({
            ...prev,
            customerName: cust.name,
            customerId: cust.id,
            billingAddress: `${cust.billingAddress1 || cust.address || ''}, ${cust.billingCity || ''}`.trim(),
            shippingAddress: `${cust.shippingAddress1 || cust.address || ''}, ${cust.shippingCity || ''}`.trim()
        }));
        setIsCustDropdownOpen(false);
        setCustomerSearch('');
    };

    const handleAddProductToBill = (product) => {
        const newItem = {
            productId: product.id,
            productName: product.name,
            description: '',
            showDescription: false,
            quantity: 1,
            unitPrice: parseFloat(product.selling_price || product.price || 100),
            discountPercent: 0,
            total: parseFloat(product.selling_price || product.price || 100)
        };
        setItems(prev => [...prev, newItem]);
        setProductSearch('');
        setIsProdDropdownOpen(false);
    };

    const handleItemChange = (index, field, value) => {
        const updated = [...items];
        updated[index][field] = value;

        const qty = parseFloat(updated[index].quantity) || 0;
        const price = parseFloat(updated[index].unitPrice) || 0;
        const disc = parseFloat(updated[index].discountPercent) || 0;

        const base = qty * price;
        updated[index].total = base - (base * disc / 100);

        setItems(updated);
    };

    const toggleDescription = (index) => {
        const updated = [...items];
        updated[index].showDescription = !updated[index].showDescription;
        setItems(updated);
    };

    const handleRemoveItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    const totalDiscount = items.reduce((acc, item) => acc + ((item.quantity * item.unitPrice) * (item.discountPercent / 100)), 0);
    
    let totalAmount = subtotal - totalDiscount;
    if (formData.extraDiscountVal > 0) {
        if (formData.extraDiscountType === '%') {
            totalAmount -= (totalAmount * formData.extraDiscountVal) / 100;
        } else {
            totalAmount -= parseFloat(formData.extraDiscountVal) || 0;
        }
    }
    const finalRoundedAmount = formData.roundOff ? Math.round(totalAmount) : totalAmount;

    const handleSubmit = async (statusOverride) => {
        if (!formData.customerName) {
            toast.error('Please enter a customer name.');
            return;
        }
        if (items.length === 0) {
            toast.error('Please add at least one product item.');
            return;
        }

        try {
            setSubmitting(true);
            
            const formattedItems = items.map(i => ({
                productId: i.productId,
                productName: i.productName,
                product_desc: i.description || '',
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                discountPercent: i.discountPercent,
                total: i.total
            }));

            const payload = {
                ...formData,
                companyId: activeCompanyId,
                subtotal,
                totalDiscount,
                totalAmount: finalRoundedAmount,
                status: statusOverride || formData.status,
                items: formattedItems
            };

            if (isEditMode) {
                await api.put(`/quotations/${currentId}`, payload);
                toast.success('Quotation updated successfully!');
            } else {
                await api.post('/quotations', payload);
                toast.success('Quotation created successfully!');
            }
            handleClose();
        } catch (err) {
            console.error('Save failed:', err);
            toast.error('Failed to save quotation.');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()));
    const filteredCustomers = customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()));

    return (
        <div className="space-y-6 w-full px-6 py-6 pb-24 font-sans text-slate-900 bg-slate-50/50 min-h-screen">
            
            {/* Top Bar with Close Button */}
            <div className="flex items-center justify-between bg-white px-6 py-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                <div className="flex items-center gap-4">
                    {/* 👈 Close Button */}
                    <button onClick={handleClose} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer" title="Close">
                        <X size={18} />
                    </button>
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-slate-800">
                            {isEditMode ? 'Update Quotation' : 'Create Quotation'}
                        </span>
                        <ChevronDown size={14} className="text-slate-400" />
                        <input 
                            type="text" name="quotationNo" value={formData.quotationNo} onChange={handleHeaderChange}
                            className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-xs w-28 text-blue-600"
                        />
                        <span className="text-xs text-slate-500">{companyDetails?.company_name || 'Sahana Beverage'}</span>
                    </div>
                </div>

                <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-2">
                        <span className="text-slate-500">Type</span>
                        <select name="quotetype" value={formData.quotetype} onChange={handleHeaderChange} className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-hidden">
                            <option value="Regular">Regular</option>
                            <option value="Composition">Composition</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-slate-500">Dispatch From</span>
                        <input type="text" name="dispatchFrom" placeholder="Warehouse / Address" value={formData.dispatchFrom} onChange={handleHeaderChange} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 w-64 text-xs" />
                    </div>
                    <button onClick={() => toast('Custom headers configured')} className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-semibold cursor-pointer">
                        <span>Custom Headers</span> <span className="text-slate-400">⚙</span>
                    </button>
                    <button onClick={() => toast('Settings opened')} className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-semibold cursor-pointer">
                        <span>Settings</span> ⚙
                    </button>
                    <button 
                        onClick={() => handleSubmit('open')}
                        disabled={submitting}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition cursor-pointer"
                    >
                        Save →
                    </button>
                </div>
            </div>

            {/* Main Metadata & Customer Header Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-6">
                
                {/* Customer Select Row */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                    <div className="md:col-span-4 relative" ref={custDropdownRef}>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Select Customer</label>
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                            <input 
                                type="text" placeholder="Search customer by name or phone..."
                                value={formData.customerName || customerSearch}
                                onChange={(e) => { setCustomerSearch(e.target.value); setFormData(prev => ({ ...prev, customerName: e.target.value })); setIsCustDropdownOpen(true); }}
                                onFocus={() => setIsCustDropdownOpen(true)}
                                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
                            />
                            {isCustDropdownOpen && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-48 overflow-y-auto z-50 divide-y divide-slate-50">
                                    <div 
                                        onClick={() => { navigate('/customers/add'); setIsCustDropdownOpen(false); }}
                                        className="p-2.5 text-xs text-blue-600 font-bold hover:bg-blue-50 cursor-pointer flex items-center gap-1.5"
                                    >
                                        <Plus size={14} /> Create Customer
                                    </div>
                                    {filteredCustomers.map(c => (
                                        <div key={c.id} onClick={() => handleSelectCustomer(c)} className="p-2.5 hover:bg-slate-50 cursor-pointer text-xs flex justify-between">
                                            <span className="font-bold text-slate-800">{c.name}</span>
                                            <span className="text-slate-400">{c.phone}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Quotation Date</label>
                        <input type="date" name="quotationDate" value={formData.quotationDate} onChange={handleHeaderChange} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono" />
                    </div>

                    <div className="md:col-span-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Validity</label>
                        <input type="date" name="validityDate" value={formData.validityDate} onChange={handleHeaderChange} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono" />
                    </div>

                    <div className="md:col-span-4">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Reference</label>
                        <input type="text" name="referenceNo" placeholder="Reference, e.g. PO Number, Sales Person..." value={formData.referenceNo} onChange={handleHeaderChange} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
                    </div>
                </div>

                {/* Addresses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
                    <div><strong className="text-slate-400">Billing Address:</strong> {formData.billingAddress || 'N/A'}</div>
                    <div><strong className="text-slate-400">Shipping Address:</strong> {formData.shippingAddress || 'N/A'}</div>
                </div>

                {/* Custom Headers Row */}
                <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 grid grid-cols-3 gap-4">
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Vehicle No</label>
                        <input type="text" name="vehicleNo" placeholder="Vehicle No" value={formData.vehicleNo} onChange={handleHeaderChange} className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-xl text-xs font-mono" />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Sales Person</label>
                        <input type="text" name="salesPerson" placeholder="Sales Person" value={formData.salesPerson} onChange={handleHeaderChange} className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-xl text-xs" />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">DL NO</label>
                        <input type="text" name="dlNo" placeholder="DL NO" value={formData.dlNo} onChange={handleHeaderChange} className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-xl text-xs font-mono" />
                    </div>
                </div>

                {/* Products & Services Header */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <h3 className="text-xs font-extrabold text-slate-900 uppercase">Products & Services</h3>
                            <button onClick={() => navigate('/products/add')} className="text-xs text-blue-600 font-bold hover:underline cursor-pointer">+ Add new Product?</button>
                        </div>
                    </div>

                    {/* Product Search & Barcode scanner toolbar */}
                    <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                        <select className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium">
                            <option>Filter Category</option>
                        </select>
                        <div className="relative flex-1" ref={prodDropdownRef}>
                            <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
                            <input 
                                type="text" placeholder="Search or scan barcode for existing products"
                                value={productSearch}
                                onChange={(e) => { setProductSearch(e.target.value); setIsProdDropdownOpen(true); }}
                                onFocus={() => setIsProdDropdownOpen(true)}
                                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                            />
                            {isProdDropdownOpen && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-56 overflow-y-auto z-50 divide-y divide-slate-50">
                                    {filteredProducts.map(p => (
                                        <div key={p.id} onClick={() => handleAddProductToBill(p)} className="p-3 hover:bg-blue-50 cursor-pointer text-xs flex justify-between">
                                            <span className="font-bold text-slate-800">{p.name}</span>
                                            <span className="font-mono text-blue-600 font-bold">₹{p.selling_price || p.price || 0}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <input type="number" placeholder="Qty" defaultValue={1} className="w-20 p-2 bg-white border border-slate-200 rounded-xl text-xs text-center font-bold" />
                        <button onClick={() => filteredProducts[0] && handleAddProductToBill(filteredProducts[0])} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm">
                            + Add to Bill
                        </button>
                    </div>

                    {/* Items Table matching swipe layout */}
                    <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-slate-50 text-slate-400 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                                    <th className="py-3 px-4">Product Name</th>
                                    <th className="py-3 px-4 w-28">Quantity</th>
                                    <th className="py-3 px-4 w-32">Unit Price</th>
                                    <th className="py-3 px-4 w-32">Price with Tax</th>
                                    <th className="py-3 px-4 w-28">Discount on</th>
                                    <th className="py-3 px-4 w-32 text-right">Total Amount + Tax</th>
                                    <th className="py-3 px-4 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-slate-400 italic">No items added to bill yet.</td>
                                    </tr>
                                ) : (
                                    items.map((item, index) => (
                                        <tr key={index} className="hover:bg-slate-50/50">
                                            <td className="py-3.5 px-4 font-bold text-slate-900">
                                                <p>{item.productName}</p>
                                                <button 
                                                    type="button"
                                                    onClick={() => toggleDescription(index)} 
                                                    className="text-[10px] text-blue-600 font-normal hover:underline cursor-pointer mt-0.5 block"
                                                >
                                                    {item.showDescription ? '- Hide Description' : '+ Add Description'}
                                                </button>
                                                {item.showDescription && (
                                                    <textarea 
                                                        rows={2}
                                                        placeholder="Enter product description or notes..."
                                                        value={item.description || ''}
                                                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                                        className="mt-2 w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-normal text-slate-700"
                                                    />
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 flex gap-1 items-center">
                                                <input 
                                                    type="number" step="0.01" value={item.quantity}
                                                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                    className="w-16 p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-center font-bold"
                                                />
                                                <span className="text-[11px] text-slate-400">BOX</span>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <input 
                                                    type="number" step="0.01" value={item.unitPrice}
                                                    onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                                                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-center"
                                                />
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <input type="number" disabled value={item.unitPrice} className="w-full p-2 bg-slate-100 border border-slate-200 rounded-xl font-mono text-xs text-center text-slate-500" />
                                            </td>
                                            <td className="py-3.5 px-4 flex gap-1 items-center">
                                                <input 
                                                    type="number" step="0.01" value={item.discountPercent}
                                                    onChange={(e) => handleItemChange(index, 'discountPercent', e.target.value)}
                                                    className="w-12 p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-center"
                                                />
                                                <span className="text-[11px] font-bold text-slate-600">%</span>
                                            </td>
                                            <td className="py-3.5 px-4 font-mono font-bold text-right text-slate-900">
                                                ₹{item.total.toFixed(2)}
                                                <p className="text-[10px] text-slate-400 font-normal">{item.total.toFixed(2)} + 0.00 (0%)</p>
                                            </td>
                                            <td className="py-3.5 px-4 text-center">
                                                <button onClick={() => handleRemoveItem(index)} className="text-slate-400 hover:text-rose-600 cursor-pointer">
                                                    <Trash2 size={15} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Bottom Split Section: Notes/Terms on left, Calculations/Signatures on right */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-100">
                    
                    {/* Left Column: Notes & Terms */}
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-700">Notes</span>
                                <button onClick={() => toast('New note template')} className="text-xs text-blue-600 font-bold cursor-pointer">+ New Notes</button>
                            </div>
                            <textarea rows={3} name="notes" value={formData.notes} onChange={handleHeaderChange} placeholder="Enter your notes, say thanks, or anything else" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
                            <button onClick={() => toast('AI Assistant clicked')} className="flex items-center gap-1.5 text-xs text-violet-600 font-bold bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-lg transition cursor-pointer">
                                <Sparkles size={14} /> AI
                            </button>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-700">Terms & Conditions</span>
                                <button onClick={() => toast('New term template')} className="text-xs text-blue-600 font-bold cursor-pointer">+ New Terms</button>
                            </div>
                            <textarea rows={3} name="termsConditions" value={formData.termsConditions} onChange={handleHeaderChange} placeholder="Enter your business Terms and Conditions" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
                            <button onClick={() => toast('AI Assistant clicked')} className="flex items-center gap-1.5 text-xs text-violet-600 font-bold bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-lg transition cursor-pointer">
                                <Sparkles size={14} /> AI
                            </button>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                            <input type="checkbox" id="eway" className="rounded border-slate-300" />
                            <label htmlFor="eway" className="text-xs font-bold text-slate-700">Create E-Waybill</label>
                        </div>

                        <div className="space-y-1">
                            <span className="text-xs font-bold text-slate-700">Attach files</span>
                            <div className="p-4 border-2 border-dashed border-slate-200 rounded-2xl text-center text-xs text-slate-400 bg-slate-50 cursor-pointer hover:border-blue-400">
                                ↑ Attach Files (Max: 5)
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Totals, Bank, Signature */}
                    <div className="bg-slate-50/80 p-6 rounded-3xl border border-slate-200/80 space-y-6">
                        
                        {/* Extra Discount & Totals */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-slate-600">Extra Discount</span>
                                <div className="flex gap-2 items-center">
                                    <select name="extraDiscountType" value={formData.extraDiscountType} onChange={handleHeaderChange} className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs">
                                        <option value="%">%</option>
                                        <option value="₹">₹</option>
                                    </select>
                                    <input type="number" name="extraDiscountVal" value={formData.extraDiscountVal} onChange={handleHeaderChange} className="w-20 p-1 bg-white border border-slate-200 rounded-lg text-xs font-mono text-right" />
                                </div>
                            </div>

                            <div className="flex justify-between text-xs text-slate-600 pt-2 border-t border-slate-200">
                                <span>Taxable Amount</span>
                                <span className="font-mono font-bold">₹ {subtotal.toFixed(2)}</span>
                            </div>

                            <div className="flex justify-between text-xs text-slate-600">
                                <span>SGST + CGST</span>
                                <span className="font-mono font-bold">₹ 0.00</span>
                            </div>

                            <div className="flex justify-between items-center text-xs pt-1">
                                <span className="font-semibold text-slate-600">Round Off</span>
                                <input type="checkbox" name="roundOff" checked={formData.roundOff} onChange={handleHeaderChange} className="rounded" />
                            </div>

                            <div className="flex justify-between text-base font-black text-slate-900 pt-3 border-t border-slate-300">
                                <div>
                                    <p>Total Amount</p>
                                    <p className="text-[10px] text-slate-400 font-normal">Total Discount ₹ {totalDiscount.toFixed(2)}</p>
                                </div>
                                <span className="font-mono text-xl text-blue-600">₹ {finalRoundedAmount.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Select Bank */}
                        <div className="space-y-1.5 pt-2">
                            <label className="text-xs font-bold text-slate-700 flex justify-between">
                                Select Bank
                                <span className="text-blue-600 cursor-pointer">+ Add New Bank</span>
                            </label>
                            <select 
                                name="selectedBank" 
                                value={formData.selectedBank} 
                                onChange={handleHeaderChange} 
                                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                            >
                                {banks.map(b => {
                                    const bankName = b.bank_name || b.bankName || b.name || `Bank #${b.id}`;
                                    const branchName = b.branch || b.branch_name ? ` - ${b.branch || b.branch_name}` : '';
                                    const accNumber = b.account_no || b.accountNumber ? ` (${b.account_no || b.accountNumber})` : '';
                                    
                                    return (
                                        <option key={b.id} value={`${bankName}${branchName}${accNumber}`}>
                                            {bankName}{branchName}{accNumber}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        {/* Select Signature */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 flex justify-between">
                                Select Signature
                                <span className="text-blue-600 cursor-pointer">+ Add New Signature</span>
                            </label>
                            <select name="selectedSignature" value={formData.selectedSignature} onChange={handleHeaderChange} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800">
                                {signatures.map(s => (
                                    <option key={s.id} value={s.name}>{s.name}</option>
                                ))}
                            </select>
                            <div className="pt-2 text-right">
                                <p className="text-[10px] text-slate-400">Signature on the document</p>
                                <p className="font-serif italic text-lg font-bold text-slate-800">Abanti Mayee Rath</p>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer Bar */}
                <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-sm font-black text-slate-900">
                        TOTAL <span className="font-mono text-blue-600 ml-4">₹ {finalRoundedAmount.toFixed(2)}</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <button onClick={() => toast('Save and Print clicked')} className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-xs transition cursor-pointer">
                            Save and Print ∨
                        </button>
                        <button onClick={() => handleSubmit('open')} disabled={submitting} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer">
                            Save →
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AddQuotation;