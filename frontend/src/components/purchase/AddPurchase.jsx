import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
    Search, ArrowLeft, Settings, Sparkles, Paperclip, Trash, ShoppingCart, Plus 
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/axios.js';

const AddPurchase = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // Check if editing
    const isEditMode = Boolean(id);

    const [vendorsList, setVendorsList] = useState([]);
    const [productsList, setProductsList] = useState([]);
    const [activeCompanyId] = useState(() => localStorage.getItem('activeCompanyId') || 1);

    const [formData, setFormData] = useState({
        billNumber: `PINV-${Math.floor(1000 + Math.random() * 9000)}`,
        poNumber: '',
        purchaseType: 'Regular',
        dispatchTo: 'SAHANA BEVERAGE, PLOT NO-101/1586/2684, K...',
        vendorId: '',
        vendorSearchName: '',
        supplierInvoiceDate: new Date().toISOString().split('T')[0],
        paymentDate: new Date().toISOString().split('T')[0],
        reference: '',
        supplierInvoiceSerial: '',
        vehicleNo: '',
        salesPerson: '',
        dlNo: '',
        notes: '',
        terms: '',
        paymentMode: 'UPI',
        paidAmount: 0,
        extraDiscount: 0,
        roundOff: true,
        reverseCharge: false,
        createEWaybill: false,
        signatureName: 'Abanti-Mayee-Rath',
        items: [],
        attachments: []
    });

    const [productSearchInput, setProductSearchInput] = useState('');
    const [productQtyInput, setProductQtyInput] = useState(1);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchDropdownsAndData = async () => {
            try {
                const vRes = await api.get(`/vendors?companyId=${activeCompanyId}&limit=100`);
                if (vRes.data?.success) setVendorsList(vRes.data.data || []);
                const pRes = await api.get(`/products?companyId=${activeCompanyId}&limit=100`);
                if (pRes.data?.success) setProductsList(pRes.data.data || []);

                // If editing, fetch existing bill data
                if (isEditMode) {
                    const billRes = await api.get(`/purchases?companyId=${activeCompanyId}&limit=100`);
                    if (billRes.data?.success) {
                        const bill = billRes.data.data.find(b => b.id === Number(id));
                        if (bill) {
                            setFormData({
                                billNumber: bill.billNumber || '',
                                poNumber: bill.poNumber || '',
                                purchaseType: bill.purchaseType || 'Regular',
                                dispatchTo: bill.dispatchTo || '',
                                vendorId: bill.vendorId || '',
                                vendorSearchName: bill.vendorName || '',
                                supplierInvoiceDate: bill.supplierInvoiceDate?.split('T')[0] || new Date().toISOString().split('T')[0],
                                paymentDate: bill.paymentDate?.split('T')[0] || new Date().toISOString().split('T')[0],
                                reference: bill.reference || '',
                                supplierInvoiceSerial: bill.supplierInvoiceSerial || '',
                                vehicleNo: bill.vehicleNo || '',
                                salesPerson: bill.salesPerson || '',
                                dlNo: bill.dlNo || '',
                                notes: bill.notes || '',
                                terms: bill.terms || '',
                                paymentMode: bill.paymentMode || 'UPI',
                                paidAmount: bill.paidAmount || 0,
                                extraDiscount: 0,
                                roundOff: true,
                                reverseCharge: false,
                                createEWaybill: false,
                                signatureName: bill.signatureName || 'Abanti-Mayee-Rath',
                                items: (bill.items || []).map(item => ({
                                    productId: item.productId,
                                    productSearchName: item.productName,
                                    quantity: Number(item.quantity) || 1,
                                    unitPrice: Number(item.unitPrice) || 0,
                                    lineTotal: Number(item.lineTotal) || 0
                                })),
                                attachments: []
                            });
                        }
                    }
                }
            } catch (err) { console.error(err); }
        };
        fetchDropdownsAndData();
    }, [activeCompanyId, id, isEditMode]);

    const handlePoLookup = async (poNo) => {
        setFormData(prev => ({ ...prev, poNumber: poNo }));
        if (!poNo || poNo.trim() === '') return;

        try {
            const checkRes = await api.get(`/purchases?companyId=${activeCompanyId}&search=${poNo.trim()}`);
            if (checkRes.data?.success && checkRes.data.data.length > 0) {
                const existingBill = checkRes.data.data.find(b => b.poNumber.toLowerCase() === poNo.trim().toLowerCase() && (!isEditMode || b.id !== Number(id)));
                if (existingBill) {
                    toast.error(`PO already applied in bill ${existingBill.billNumber}!`);
                    return;
                }
            }

            const res = await api.get(`/purchases/po/${poNo.trim()}`);
            if (res.data?.success) {
                const data = res.data.data;
                const formattedItems = (data.items || []).map(item => ({
                    productId: item.productId,
                    productSearchName: item.productSearchName,
                    quantity: Number(item.quantity) || 1,
                    unitPrice: Number(item.unitPrice) || 0,
                    lineTotal: Number(item.lineTotal) || (Number(item.quantity) * Number(item.unitPrice))
                }));
                setFormData(prev => ({
                    ...prev,
                    vendorId: data.vendorId || '',
                    vendorSearchName: data.vendorSearchName || '',
                    items: formattedItems
                }));
                toast.success(`Loaded items from PO: ${poNo}`);
            }
        } catch (err) {
            // Silent catch
        }
    };

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

        const qty = Number(productQtyInput) || 1;
        const price = Number(found.purchasePrice || found.price || 100);

        const newItem = {
            productId: found.id,
            productSearchName: found.name,
            quantity: qty,
            unitPrice: price,
            lineTotal: qty * price
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
            const qty = Number(newItems[index].quantity) || 0;
            const price = Number(newItems[index].unitPrice) || 0;
            newItems[index].lineTotal = qty * price;
        }
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const removeItemRow = (index) => {
        setFormData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
    };

    const handleSavePurchase = async (statusOverride = null) => {
        if (!formData.vendorId && !formData.vendorSearchName) return toast.error('Please select a vendor.');
        if (formData.items.length === 0) return toast.error('Please add at least one product.');

        try {
            setSubmitting(true);
            const payload = { ...formData, status: statusOverride || 'pending', companyId: activeCompanyId };
            
            if (isEditMode) {
                await api.put(`/purchases/${id}`, payload);
                toast.success('Purchase Bill updated successfully!');
            } else {
                await api.post('/purchases', payload);
                toast.success('Purchase Bill created successfully!');
            }
            navigate('/purchase');
        } catch (err) {
            toast.error('Failed to save purchase bill.');
        } finally {
            setSubmitting(false);
        }
    };

    const taxableAmount = formData.items.reduce((acc, item) => acc + (Number(item.quantity || 0) * Number(item.unitPrice || 0)), 0);
    const totalTax = taxableAmount * 0.18;
    const totalAmount = taxableAmount + totalTax - Number(formData.extraDiscount || 0);

    return (
        <div className="w-full min-h-screen bg-slate-50/50 pb-24 font-sans text-slate-900">
            {/* Top Sticky Bar */}
            <div className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/purchase')} className="p-1.5 hover:bg-slate-100 rounded-xl cursor-pointer text-slate-600">
                        <ArrowLeft size={18} />
                    </button>
                    <h1 className="text-sm font-bold text-slate-900">{isEditMode ? 'Edit Purchase Bill' : 'Create Purchase'}</h1>
                    <div className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-xl text-xs font-mono font-bold text-slate-700">
                        <input type="text" name="billNumber" value={formData.billNumber} onChange={handleFormChange} className="w-20 bg-transparent focus:outline-hidden" />
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => handleSavePurchase('drafts')} className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl cursor-pointer shadow-2xs">Save as Draft</button>
                    <button onClick={() => { handleSavePurchase(); window.print(); }} className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl cursor-pointer shadow-2xs">Save and Print v</button>
                    <button onClick={() => handleSavePurchase('pending')} disabled={submitting} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1">
                        {isEditMode ? 'Update →' : 'Save →'}
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
                {/* Secondary Bar */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-4">
                        <div>
                            <span className="text-slate-400 block text-[10px]">Type</span>
                            <select name="purchaseType" value={formData.purchaseType} onChange={handleFormChange} className="font-bold text-slate-800 bg-transparent focus:outline-hidden cursor-pointer">
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
                    <div className="flex items-center gap-4 text-slate-500 font-semibold">
                        <span>Custom Headers</span>
                        <Settings size={13} className="cursor-pointer" />
                    </div>
                </div>

                {/* Vendor, Invoice Dates & Reference Grid */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="space-y-1 md:col-span-1">
                            <label className="text-slate-500 text-xs font-semibold">Select Vendor *</label>
                            <input type="text" name="vendorSearchName" required list="vendors-add-dropdown" value={formData.vendorSearchName} onChange={handleFormChange} placeholder="Search vendors by name, company, GSTIN..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-blue-500" />
                            <datalist id="vendors-add-dropdown">{vendorsList.map(v => <option key={v.id} value={v.name} />)}</datalist>
                        </div>

                        <div className="space-y-1">
                            <label className="text-slate-500 text-xs font-semibold">Supplier Invoice Date</label>
                            <input type="date" name="supplierInvoiceDate" value={formData.supplierInvoiceDate} onChange={handleFormChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden" />
                        </div>

                        <div className="space-y-1">
                            <label className="text-slate-500 text-xs font-semibold">Payment by</label>
                            <input type="date" name="paymentDate" value={formData.paymentDate} onChange={handleFormChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden" />
                        </div>

                        <div className="space-y-1">
                            <label className="text-slate-500 text-xs font-semibold">Reference (PO Number)</label>
                            <input type="text" name="poNumber" value={formData.poNumber} onChange={(e) => handlePoLookup(e.target.value)} placeholder="Reference, e.g. PO Number..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-hidden" />
                        </div>
                    </div>

                    <div className="max-w-md space-y-1">
                        <label className="text-slate-500 text-xs font-semibold">Supplier Invoice Serial No.</label>
                        <input type="text" name="supplierInvoiceSerial" value={formData.supplierInvoiceSerial} onChange={handleFormChange} placeholder="(Optional)" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
                    </div>

                    {/* Custom Headers */}
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

                {/* Products & Services Section */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-900">Products & Services</p>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                        <div className="relative flex-1 w-full">
                            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="text" list="products-add-autocomplete" value={productSearchInput} onChange={(e) => setProductSearchInput(e.target.value)} placeholder="Search or scan barcode for existing products" className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-hidden" />
                            <datalist id="products-add-autocomplete">{productsList.map(p => <option key={p.id} value={p.name} />)}</datalist>
                        </div>
                        <div className="w-full md:w-28">
                            <input type="number" step="0.01" value={productQtyInput} onChange={(e) => setProductQtyInput(e.target.value)} placeholder="Qty" className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono" />
                        </div>
                        <button type="button" onClick={handleAddProductToBill} className="w-full md:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer whitespace-nowrap">
                            + Add to Bill
                        </button>
                    </div>

                    {formData.items.length === 0 ? (
                        <div className="py-20 text-center space-y-3 bg-slate-50/40 rounded-2xl border border-dashed border-slate-200">
                            <ShoppingCart size={32} className="mx-auto text-slate-300" />
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
                                    {formData.items.map((item, idx) => {
                                        const lineTotalNum = Number(item.lineTotal) || 0;
                                        return (
                                            <tr key={idx} className="hover:bg-slate-50">
                                                <td className="p-3 font-sans font-bold text-slate-900">{item.productSearchName}</td>
                                                <td className="p-3 text-center">
                                                    <input type="number" step="0.01" value={item.quantity} onChange={(e) => handleItemTableChange(idx, 'quantity', e.target.value)} className="w-20 p-1.5 border border-slate-200 rounded-lg text-center" />
                                                </td>
                                                <td className="p-3 text-right">
                                                    <input type="number" step="0.01" value={item.unitPrice} onChange={(e) => handleItemTableChange(idx, 'unitPrice', e.target.value)} className="w-24 p-1.5 border border-slate-200 rounded-lg text-right" />
                                                </td>
                                                <td className="p-3 text-right font-bold text-emerald-700">₹{lineTotalNum.toFixed(2)}</td>
                                                <td className="p-3 text-center">
                                                    <button type="button" onClick={() => removeItemRow(idx)} className="text-rose-500 hover:text-rose-700 cursor-pointer"><Trash size={14} /></button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Bottom Section: Notes, Totals */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    <div className="lg:col-span-7 space-y-4">
                        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-800">Notes</span>
                                <button className="text-violet-600 bg-violet-50 hover:bg-violet-100 px-3 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"><Sparkles size={12} /> AI</button>
                            </div>
                            <textarea name="notes" rows={3} value={formData.notes} onChange={handleFormChange} placeholder="Enter your notes..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden" />
                        </div>
                    </div>

                    <div className="lg:col-span-5 space-y-4">
                        <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100 shadow-2xs space-y-4 text-xs font-medium">
                            <div className="flex justify-between text-slate-600">
                                <span>Taxable Amount</span>
                                <span className="font-mono font-bold">₹{taxableAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                                <span>Total Tax</span>
                                <span className="font-mono font-bold">₹{totalTax.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-900 font-bold text-sm pt-2 border-t border-emerald-200">
                                <span>Total Amount</span>
                                <span className="font-mono text-emerald-700">₹{totalAmount.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddPurchase;