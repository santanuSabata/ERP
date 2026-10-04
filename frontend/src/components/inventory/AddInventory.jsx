import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Search, ChevronDown, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/axios.js';

const AddInventory = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = Boolean(id);
    const [submitting, setSubmitting] = useState(false);
    const [activeCompanyId, setActiveCompanyId] = useState(null);
    const [products, setProducts] = useState([]);
    const [warehouses, setWarehouses] = useState([]);

    // Searchable Product Dropdown States
    const [productSearchQuery, setProductSearchQuery] = useState('');
    const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
    const productDropdownRef = useRef(null);

    // Searchable Warehouse Dropdown States
    const [warehouseSearchQuery, setWarehouseSearchQuery] = useState('');
    const [isWarehouseDropdownOpen, setIsWarehouseDropdownOpen] = useState(false);
    const warehouseDropdownRef = useRef(null);

    const [formData, setFormData] = useState({
        productId: '',
        warehouseId: '',
        transactionType: 'Stock In',
        quantity: '',
        unitPrice: '',
        referenceNo: '',
        notes: ''
    });

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (productDropdownRef.current && !productDropdownRef.current.contains(event.target)) {
                setIsProductDropdownOpen(false);
            }
            if (warehouseDropdownRef.current && !warehouseDropdownRef.current.contains(event.target)) {
                setIsWarehouseDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // 1. Fetch active company ID on mount
    useEffect(() => {
        const fetchCompany = async () => {
            try {
                const companyRes = await api.get('/company');
                const compId = companyRes.data?.id || companyRes.data?.data?.id || 1;
                setActiveCompanyId(compId);
            } catch (err) {
                console.error('❌ Failed to fetch company ID, falling back to 1:', err);
                setActiveCompanyId(1);
            }
        };
        fetchCompany();
    }, []);

    // 2. Fetch products, warehouses, and log details once activeCompanyId is available
    useEffect(() => {
        if (!activeCompanyId) return;

        const loadMasterDataAndEditItem = async () => {
            try {
                // Fetch products and warehouses concurrently
                const [prodRes, whRes] = await Promise.all([
                    api.get(`/products?companyId=${activeCompanyId}`),
                    api.get(`/warehouses?companyId=${activeCompanyId}`)
                ]);

                const prodList = prodRes.data?.data || prodRes.data?.products || prodRes.data || [];
                const whList = whRes.data?.data || whRes.data?.warehouses || whRes.data || [];

                setProducts(prodList);
                setWarehouses(whList);

                // If edit mode, fetch the specific inventory record and map fields properly
                if (isEditMode) {
                    const invRes = await api.get(`/inventory/${id}`);
                    const found = invRes.data?.data;
                    
                    if (found) {
                        const pId = found.productId || found.product_id || '';
                        const wId = found.warehouseId || found.warehouse_id || '';
                        const tType = found.transactionType || found.transaction_type || 'Stock In';
                        const qty = found.quantity !== undefined ? found.quantity : '';
                        const uPrice = found.unitPrice !== undefined ? found.unitPrice : (found.unit_price !== undefined ? found.unit_price : '');
                        const refNo = found.referenceNo || found.reference_no || '';
                        const notesVal = found.notes || '';

                        setFormData({
                            productId: pId,
                            warehouseId: wId,
                            transactionType: tType,
                            quantity: qty,
                            unitPrice: uPrice,
                            referenceNo: refNo,
                            notes: notesVal
                        });

                        // Immediately resolve search text values from loaded master lists
                        if (pId) {
                            const matchedProd = prodList.find(p => String(p.id) === String(pId));
                            if (matchedProd) setProductSearchQuery(matchedProd.name);
                        }
                        if (wId) {
                            const matchedWh = whList.find(w => String(w.id) === String(wId));
                            if (matchedWh) setWarehouseSearchQuery(matchedWh.name);
                        }
                    }
                }
            } catch (err) {
                console.error('Failed to load inventory form dependencies', err);
                toast.error('Could not load transaction details.');
            }
        };

        loadMasterDataAndEditItem();
    }, [activeCompanyId, id, isEditMode]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(productSearchQuery.toLowerCase()))
    );

    const filteredWarehouses = warehouses.filter(w => 
        w.name.toLowerCase().includes(warehouseSearchQuery.toLowerCase()) ||
        (w.city && w.city.toLowerCase().includes(warehouseSearchQuery.toLowerCase())) ||
        (w.code && w.code.toLowerCase().includes(warehouseSearchQuery.toLowerCase()))
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.productId || !formData.quantity) {
            toast.error('Please select a product and enter a quantity.');
            return;
        }

        try {
            setSubmitting(true);
            const payload = { ...formData, companyId: activeCompanyId };
            if (isEditMode) {
                await api.put(`/inventory/${id}`, payload);
                toast.success('Stock log updated successfully!');
            } else {
                await api.post('/inventory', payload);
                toast.success('Stock adjustment recorded successfully!');
            }
            navigate('/inventory');
        } catch (err) {
            console.error('Failed to save stock adjustment:', err);
            toast.error('Failed to save transaction.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 max-w-3xl mx-auto pb-16 font-sans text-slate-900">
            <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-100 shadow-2xs">
                <div className="flex items-center gap-3">
                    <button 
                        type="button"
                        onClick={() => navigate('/inventory')}
                        className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
                            {isEditMode ? 'Edit Stock Adjustment' : 'New Stock Adjustment'}
                        </h1>
                        <p className="text-xs text-slate-400">Record inventory Stock In or Stock Out movements.</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-2xs space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700">Transaction Type *</label>
                        <select 
                            name="transactionType" value={formData.transactionType} onChange={handleChange} disabled={isEditMode}
                            className="w-full p-3 rounded-2xl border border-slate-200 text-xs bg-white font-bold text-slate-800 focus:outline-hidden cursor-pointer disabled:bg-slate-100"
                        >
                            <option value="Stock In">Stock In (Addition)</option>
                            <option value="Stock Out">Stock Out (Deduction)</option>
                        </select>
                    </div>

                    {/* Searchable Product Dropdown */}
                    <div className="space-y-1.5 relative" ref={productDropdownRef}>
                        <label className="block text-xs font-bold text-slate-700">Select Product *</label>
                        <div 
                            onClick={() => !isEditMode && setIsProductDropdownOpen(true)}
                            className={`w-full p-3 rounded-2xl border border-slate-200 text-xs bg-white flex items-center justify-between ${isEditMode ? 'bg-slate-100 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                            <input 
                                type="text"
                                placeholder="Search & select product..."
                                value={productSearchQuery}
                                onChange={(e) => {
                                    if (isEditMode) return;
                                    setProductSearchQuery(e.target.value);
                                    setIsProductDropdownOpen(true);
                                    if (!e.target.value) setFormData(prev => ({ ...prev, productId: '' }));
                                }}
                                disabled={isEditMode}
                                className="w-full bg-transparent focus:outline-hidden text-xs text-slate-800 cursor-pointer disabled:cursor-not-allowed"
                            />
                            {!isEditMode && <ChevronDown size={14} className="text-slate-400 shrink-0 ml-2" />}
                        </div>

                        {isProductDropdownOpen && !isEditMode && (
                            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto z-50 divide-y divide-slate-50">
                                {filteredProducts.length === 0 ? (
                                    <div className="p-3 text-xs text-slate-400 text-center">No products found</div>
                                ) : (
                                    filteredProducts.map(p => (
                                        <div 
                                            key={p.id}
                                            onClick={() => {
                                                setFormData(prev => ({ ...prev, productId: p.id }));
                                                setProductSearchQuery(p.name);
                                                setIsProductDropdownOpen(false);
                                            }}
                                            className="p-3 hover:bg-blue-50/60 transition cursor-pointer text-xs flex items-center justify-between"
                                        >
                                            <span className="font-bold text-slate-800">{p.name}</span>
                                            <span className="text-[10px] text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded-md font-mono">{p.category || 'General'}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700">Quantity *</label>
                        <input 
                            type="number" step="0.01" required name="quantity" disabled={isEditMode}
                            placeholder="e.g., 50"
                            value={formData.quantity} onChange={handleChange}
                            className="w-full p-3 rounded-2xl border border-slate-200 text-xs focus:outline-hidden font-mono disabled:bg-slate-100"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700">Unit Price (₹)</label>
                        <input 
                            type="number" step="0.01" name="unitPrice" disabled={isEditMode}
                            placeholder="e.g., 150.00"
                            value={formData.unitPrice} onChange={handleChange}
                            className="w-full p-3 rounded-2xl border border-slate-200 text-xs focus:outline-hidden font-mono disabled:bg-slate-100"
                        />
                    </div>

                    {/* Searchable Warehouse Dropdown */}
                    <div className="space-y-1.5 relative" ref={warehouseDropdownRef}>
                        <label className="block text-xs font-bold text-slate-700">Warehouse</label>
                        <div 
                            onClick={() => setIsWarehouseDropdownOpen(true)}
                            className="w-full p-3 rounded-2xl border border-slate-200 text-xs bg-white flex items-center justify-between cursor-pointer"
                        >
                            <input 
                                type="text"
                                placeholder="Search & select warehouse..."
                                value={warehouseSearchQuery}
                                onChange={(e) => {
                                    setWarehouseSearchQuery(e.target.value);
                                    setIsWarehouseDropdownOpen(true);
                                    if (!e.target.value) setFormData(prev => ({ ...prev, warehouseId: '' }));
                                }}
                                className="w-full bg-transparent focus:outline-hidden text-xs text-slate-800 cursor-pointer"
                            />
                            <ChevronDown size={14} className="text-slate-400 shrink-0 ml-2" />
                        </div>

                        {isWarehouseDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto z-50 divide-y divide-slate-50">
                                <div 
                                    onClick={() => {
                                        setFormData(prev => ({ ...prev, warehouseId: '' }));
                                        setWarehouseSearchQuery('');
                                        setIsWarehouseDropdownOpen(false);
                                    }}
                                    className="p-3 hover:bg-slate-50 transition cursor-pointer text-xs text-slate-400 italic"
                                >
                                    -- No Warehouse (Default) --
                                </div>
                                {filteredWarehouses.length === 0 ? (
                                    <div className="p-3 text-xs text-slate-400 text-center">No warehouses found</div>
                                ) : (
                                    filteredWarehouses.map(w => (
                                        <div 
                                            key={w.id}
                                            onClick={() => {
                                                setFormData(prev => ({ ...prev, warehouseId: w.id }));
                                                setWarehouseSearchQuery(w.name);
                                                setIsWarehouseDropdownOpen(false);
                                            }}
                                            className="p-3 hover:bg-blue-50/60 transition cursor-pointer text-xs flex items-center justify-between"
                                        >
                                            <span className="font-bold text-slate-800">{w.name}</span>
                                            <span className="text-[10px] text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded-md font-mono">{w.city || 'HQ'}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">Reference No / Invoice #</label>
                    <input 
                        type="text" name="referenceNo"
                        placeholder="e.g., REF-2026-001"
                        value={formData.referenceNo} onChange={handleChange}
                        className="w-full p-3 rounded-2xl border border-slate-200 text-xs focus:outline-hidden font-mono"
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">Notes / Remarks</label>
                    <textarea 
                        rows={2} name="notes"
                        placeholder="Reason for stock adjustment..."
                        value={formData.notes} onChange={handleChange}
                        className="w-full p-3 rounded-2xl border border-slate-200 text-xs focus:outline-hidden"
                    />
                </div>

                <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
                    <button 
                        type="button" 
                        onClick={() => navigate('/inventory')}
                        className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        disabled={submitting}
                        className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                        <Save size={14} /> {submitting ? 'Saving...' : isEditMode ? 'Update Log' : 'Save Stock Log'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddInventory;