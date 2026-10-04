import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X, Sparkles, Upload, ChevronDown, Wand2, Plus, Images, Trash2, Image as ImageIcon, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/axios.js';
import AddCategorySlideOver from '../../components/inventory/AddCategorySlideOver.jsx';

const AddProduct = ({ editId, onClose }) => {
    const navigate = useNavigate();
    const { id } = useParams();
    
    const currentId = editId || id;
    const isEditMode = Boolean(currentId);
    const [submitting, setSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState('details'); // 'details' | 'images'

    const [categoriesList, setCategoriesList] = useState([]);
    const [activeCompanyId, setActiveCompanyId] = useState(() => {
        return localStorage.getItem('activeCompanyId') || 2;
    });

    // Slide-over & Category Creation States
    const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
    const [categoryType, setCategoryType] = useState('Parent Category');
    const [categoryName, setCategoryName] = useState('');
    const [categoryDesc, setCategoryDesc] = useState('');
    const [showInOnlineStore, setShowInOnlineStore] = useState(true);

    // Product Images State (supports id, image_url, is_primary, file)
    const [productImages, setProductImages] = useState([]);

    const [formData, setFormData] = useState({
        name: '',
        itemType: 'Product',
        sellingPrice: '',
        sellingPriceType: 'with Tax',
        taxPercentage: '0',
        primaryUnit: 'BOX',
        hsnSac: '',
        purchasePrice: '',
        purchasePriceType: 'with Tax',
        barcode: '',
        category: '',
        categoryId: '',
        description: '',
        quantity: '',
        openingPurchasePrice: '',
        openingStockValue: ''
    });

    const handleClose = () => {
        if (onClose) {
            onClose();
        } else {
            navigate('/products');
        }
    };

    const fetchCategories = async () => {
        try {
            const targetCompId = activeCompanyId || 2;
            const res = await api.get(`/categories?companyId=${targetCompId}`);
            if (res.data?.success) {
                setCategoriesList(res.data.data || []);
            }
        } catch (err) {
            console.error('❌ Failed to fetch categories:', err);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, [activeCompanyId]);

    useEffect(() => {
        if (isEditMode) {
            api.get(`/products/${currentId}`)
                .then(res => {
                    const found = res.data?.data;
                    if (found) {
                        const rawTax = found.taxPercentage ?? found.tax_percentage ?? 0;
                        const sanitizedTax = String(Number(rawTax));

                        setFormData({
                            name: found.name || '',
                            itemType: found.itemType || found.item_type || 'Product',
                            sellingPrice: found.sellingPrice || found.selling_price || '',
                            sellingPriceType: found.sellingPriceType || found.selling_price_type || 'with Tax',
                            taxPercentage: sanitizedTax,
                            primaryUnit: found.primaryUnit || found.primary_unit || 'BOX',
                            hsnSac: found.hsnSac || found.hsn_sac || '',
                            purchasePrice: found.purchasePrice || found.purchase_price || '',
                            purchasePriceType: found.purchasePriceType || found.purchase_price_type || 'with Tax',
                            barcode: found.barcode || '',
                            category: found.category || '',
                            categoryId: found.categoryId || found.category_id || '',
                            description: found.description || '',
                            quantity: found.quantity ?? '',
                            openingPurchasePrice: found.openingPurchasePrice ?? '',
                            openingStockValue: found.openingStockValue ?? ''
                        });
                    } else {
                        toast.error('Product not found.');
                    }
                })
                .catch(err => {
                    console.error('Failed to load product for edit', err);
                    toast.error('Could not load product details.');
                });

            // Fetch product images
            api.get(`/products/${currentId}/images`)
                .then(res => {
                    if (res.data?.success) {
                        const formattedImages = (res.data.images || []).map(img => ({
                            ...img,
                            image_url: img.image_url.startsWith('http') || img.image_url.startsWith('blob:')
                                ? img.image_url 
                                : `http://localhost:8000${img.image_url.startsWith('/') ? '' : '/'}${img.image_url}`
                        }));
                        setProductImages(formattedImages);
                    }
                })
                .catch(err => {
                    console.error('Failed to load product images', err);
                });
        }
    }, [currentId, isEditMode]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'category' && value === 'NEW_CATEGORY_ACTION') {
            setIsAddCategoryOpen(true);
            return;
        }

        if (name === 'category') {
            const selectedCatObj = categoriesList.find(c => c.name === value);
            setFormData(prev => ({ 
                ...prev, 
                category: value,
                categoryId: selectedCatObj ? selectedCatObj.id : ''
            }));
            return;
        }

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageSelection = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const newImages = files.map((file, index) => ({
            id: null,
            image_url: URL.createObjectURL(file),
            is_primary: productImages.length === 0 && index === 0, // Set first image as primary by default if none exist
            file: file
        }));

        setProductImages(prev => [...prev, ...newImages]);
    };

    // Set an image as primary
    const handleSetPrimary = async (index, imageId) => {
        if (imageId && isEditMode) {
            try {
                await api.put(`/products/${currentId}/images/${imageId}/primary`);
                toast.success('Primary image updated!');
            } catch (err) {
                toast.error('Failed to set primary image.');
                return;
            }
        }

        // Update local state flag
        setProductImages(prev => prev.map((img, i) => ({
            ...img,
            is_primary: i === index
        })));
    };

    const handleRemoveImage = async (index, imageId) => {
        if (imageId) {
            try {
                await api.delete(`/products/images/${imageId}`);
                toast.success('Image deleted from database.');
            } catch (err) {
                toast.error('Failed to delete image.');
                return;
            }
        }
        setProductImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleAddCategorySubmit = async (e) => {
        e?.preventDefault();
        if (!categoryName.trim()) {
            toast.error('Please enter category name');
            return;
        }

        try {
            const payload = {
                companyId: activeCompanyId || 2,
                categoryType,
                name: categoryName,
                description: categoryDesc,
                showInOnlineStore
            };

            const res = await api.post('/categories', payload);
            if (res.data?.success) {
                toast.success('Category created successfully!');
                setIsAddCategoryOpen(false);
                
                const newCat = res.data.data;
                await fetchCategories();
                setFormData(prev => ({ 
                    ...prev, 
                    category: newCat.name,
                    categoryId: newCat.id 
                }));

                setCategoryName('');
                setCategoryDesc('');
                setCategoryType('Parent Category');
                setShowInOnlineStore(true);
            }
        } catch (err) {
            console.error('❌ Failed to add category:', err);
            toast.error('Failed to add category');
        }
    };

    const handleAutoGenerateBarcode = () => {
        const randomBarcode = Math.floor(100000000000 + Math.random() * 900000000000).toString();
        setFormData(prev => ({ ...prev, barcode: randomBarcode }));
        toast.success('Barcode auto-generated!');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            toast.error('Product name is required.');
            return;
        }

        try {
            setSubmitting(true);
            
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                data.append(key, formData[key]);
            });
            data.append('companyId', activeCompanyId);

            productImages.forEach((img) => {
                if (img.file) {
                    data.append('images', img.file);
                }
            });

            if (isEditMode) {
                await api.put(`/products/${currentId}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Product updated successfully!');
            } else {
                await api.post('/products', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Product created successfully!');
            }

            handleClose();
        } catch (err) {
            console.error('Failed to save product:', err);
            toast.error('Failed to save product.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 w-full px-4 sm:px-6 lg:px-8 pb-20 font-sans text-slate-900">
            
            {/* Top Navigation & Header Bar */}
            <div className="flex items-center justify-between bg-white px-6 py-4 rounded-2xl border border-slate-200/80 shadow-2xs sticky top-0 z-30">
                <div className="flex items-center gap-3">
                    <button 
                        type="button"
                        onClick={handleClose}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl transition cursor-pointer"
                    >
                        <X size={20} />
                    </button>
                    <h1 className="text-base font-bold text-slate-900 tracking-tight">
                        {isEditMode ? 'Edit Item' : 'Add Item'}
                    </h1>
                </div>
                {activeTab === 'details' && (
                    <button 
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition shadow-sm shadow-blue-500/20 cursor-pointer"
                    >
                        {submitting ? 'Saving...' : isEditMode ? 'Update Item' : 'Add Item'}
                    </button>
                )}
            </div>

            {/* Sub-Tabs Bar */}
            <div className="flex items-center justify-between border-b border-slate-200/80 px-2 text-xs font-semibold text-slate-500">
                <div className="flex items-center gap-8">
                    <button 
                        type="button" 
                        onClick={() => setActiveTab('details')}
                        className={`pb-2.5 cursor-pointer transition ${activeTab === 'details' ? 'text-blue-600 border-b-2 border-blue-600' : 'hover:text-slate-800'}`}
                    >
                        Details Form
                    </button>
                    <button 
                        type="button" 
                        onClick={() => setActiveTab('images')}
                        className={`pb-2.5 flex items-center gap-1.5 cursor-pointer transition ${activeTab === 'images' ? 'text-violet-600 border-b-2 border-violet-600' : 'hover:text-slate-800'}`}
                    >
                        <Images size={14} />
                        <span>Product Images ({productImages.length})</span>
                    </button>
                    <button type="button" onClick={() => toast('Price Lists locked/premium')} className="pb-2.5 hover:text-slate-800 flex items-center gap-1 cursor-pointer">Price Lists 🔒</button>
                </div>
                <button type="button" onClick={() => toast('Variants locked')} className="pb-2.5 hover:text-slate-800 flex items-center gap-1 text-slate-700 cursor-pointer">➕ Variants 🔒</button>
            </div>

            {/* TAB CONTENT: IMAGES MANAGEMENT */}
            {activeTab === 'images' ? (
                <div className="space-y-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <div>
                            <h2 className="text-sm font-bold text-slate-900">Product Images Gallery</h2>
                            <p className="text-xs text-slate-400">Click the star badge to select the primary thumbnail image.</p>
                        </div>
                        <label className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer">
                            <Upload size={14} />
                            <span>Upload Images</span>
                            <input 
                                type="file" 
                                multiple 
                                accept="image/*" 
                                className="hidden" 
                                onChange={handleImageSelection}
                            />
                        </label>
                    </div>

                    {productImages.length === 0 ? (
                        <div className="p-16 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 space-y-3">
                            <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto text-slate-400">
                                <ImageIcon size={22} />
                            </div>
                            <p className="text-xs font-bold text-slate-700">No images uploaded for this product yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {productImages.map((img, idx) => (
                                <div key={idx} className={`relative group rounded-2xl border overflow-hidden bg-slate-100 aspect-square shadow-2xs ${img.is_primary ? 'border-amber-500 ring-2 ring-amber-400/50' : 'border-slate-200'}`}>
                                    <img src={img.image_url} alt="Product view" className="w-full h-full object-cover" />
                                    
                                    {/* Primary Star Badge Button */}
                                    <button 
                                        type="button"
                                        onClick={() => handleSetPrimary(idx, img.id)}
                                        className={`absolute top-2 left-2 p-1.5 rounded-xl shadow-md transition cursor-pointer ${img.is_primary ? 'bg-amber-500 text-white' : 'bg-white/80 backdrop-blur-xs text-slate-600 hover:bg-amber-500 hover:text-white'}`}
                                        title={img.is_primary ? 'Primary Image' : 'Set as Primary Image'}
                                    >
                                        <Star size={14} fill={img.is_primary ? 'currentColor' : 'none'} />
                                    </button>

                                    {/* Delete Button */}
                                    <button 
                                        type="button"
                                        onClick={() => handleRemoveImage(idx, img.id)}
                                        className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-xl shadow-md opacity-0 group-hover:opacity-100 transition cursor-pointer"
                                        title="Delete image"
                                    >
                                        <Trash2 size={13} />
                                    </button>

                                    {img.is_primary && (
                                        <span className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                            Primary
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                /* TAB CONTENT: DETAILS FORM */
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Section 1: Basic Details Card */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-6">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Basic Details</span>
                        </div>

                        {/* Product / Service Switcher */}
                        <div className="inline-flex bg-slate-100 p-1 rounded-xl">
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, itemType: 'Product' }))}
                                className={`px-6 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${formData.itemType === 'Product' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                            >
                                Product
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, itemType: 'Service' }))}
                                className={`px-6 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${formData.itemType === 'Service' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                            >
                                Service
                            </button>
                        </div>

                        {/* Product Name */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700">
                                <span className="text-rose-500">*</span>Product Name
                            </label>
                            <input 
                                type="text" required name="name"
                                placeholder="Enter Item Name"
                                value={formData.name} onChange={handleChange}
                                className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-violet-500"
                            />
                        </div>

                        {/* Selling Price & Tax % Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700">Selling Price</label>
                                <div className="flex rounded-xl border border-slate-200 overflow-hidden focus-within:border-violet-500 bg-white">
                                    <span className="px-3.5 bg-slate-50 flex items-center text-slate-400 text-xs font-bold border-r border-slate-200">₹</span>
                                    <input 
                                        type="number" step="0.01" name="sellingPrice"
                                        placeholder="Enter Selling Price"
                                        value={formData.sellingPrice} onChange={handleChange}
                                        className="w-full p-3 text-xs focus:outline-hidden font-mono"
                                    />
                                    <select 
                                        name="sellingPriceType" value={formData.sellingPriceType} onChange={handleChange}
                                        className="bg-slate-50 px-3 text-xs font-semibold text-slate-700 border-l border-slate-200 focus:outline-hidden cursor-pointer"
                                    >
                                        <option value="with Tax">with Tax</option>
                                        <option value="without Tax">without Tax</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700">
                                    <span className="text-rose-500">*</span>Tax %
                                </label>
                                <div className="relative">
                                    <select 
                                        name="taxPercentage" 
                                        value={formData.taxPercentage} 
                                        onChange={handleChange}
                                        className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-white focus:outline-hidden cursor-pointer font-semibold text-slate-700 appearance-none pr-8"
                                    >
                                        <option value="0">0 (0% CGST & 0% SGST, 0% IGST)</option>
                                        <option value="5">5% (2.5% CGST & 2.5% SGST, 5% IGST)</option>
                                        <option value="12">12% (6% CGST & 6% SGST, 12% IGST)</option>
                                        <option value="18">18% (9% CGST & 9% SGST, 18% IGST)</option>
                                        <option value="28">28% (14% CGST & 14% SGST, 28% IGST)</option>
                                    </select>
                                    <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {/* Primary Unit */}
                        <div className="space-y-1.5 max-w-sm">
                            <label className="block text-xs font-bold text-slate-700">Primary Unit</label>
                            <select 
                                name="primaryUnit" value={formData.primaryUnit} onChange={handleChange}
                                className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-white focus:outline-hidden cursor-pointer font-semibold"
                            >
                                <option value="BOX">BOX</option>
                                <option value="PCS">PCS</option>
                                <option value="KG">KG</option>
                                <option value="LTR">LTR</option>
                                <option value="MTR">MTR</option>
                            </select>
                        </div>
                    </div>

                    {/* Section 2: Additional Information */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Additional Information</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Optional</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700">HSN/SAC</label>
                                <input 
                                    type="text" name="hsnSac"
                                    placeholder="HSN/SAC"
                                    value={formData.hsnSac} onChange={handleChange}
                                    className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-hidden font-mono"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700">Purchase Price</label>
                                <div className="flex rounded-xl border border-slate-200 overflow-hidden bg-white">
                                    <input 
                                        type="number" step="0.01" name="purchasePrice"
                                        placeholder="Purchase Price"
                                        value={formData.purchasePrice} onChange={handleChange}
                                        className="w-full p-3 text-xs focus:outline-hidden font-mono"
                                    />
                                    <select 
                                        name="purchasePriceType" value={formData.purchasePriceType} onChange={handleChange}
                                        className="bg-slate-50 px-3 text-xs font-semibold text-slate-700 border-l border-slate-200 focus:outline-hidden cursor-pointer"
                                    >
                                        <option value="with Tax">with Tax</option>
                                        <option value="without Tax">without Tax</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700">Barcode</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" name="barcode"
                                        placeholder="Barcode"
                                        value={formData.barcode} onChange={handleChange}
                                        className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-hidden font-mono"
                                    />
                                    <button 
                                        type="button" 
                                        onClick={handleAutoGenerateBarcode}
                                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                                    >
                                        <Wand2 size={14} /> Auto Generate
                                    </button>
                                </div>
                            </div>

                            {/* Category Dropdown */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700">Category</label>
                                <select 
                                    name="category" value={formData.category} onChange={handleChange}
                                    className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-white focus:outline-hidden cursor-pointer font-semibold text-slate-700"
                                >
                                    <option value="">Select Category</option>
                                    {categoriesList.map((cat) => (
                                        <option key={cat.id} value={cat.name}>
                                            {cat.name}
                                        </option>
                                    ))}
                                    <option value="NEW_CATEGORY_ACTION" className="text-blue-600 font-bold">
                                        + New Category
                                    </option>
                                </select>
                            </div>
                        </div>

                        {/* Description Editor */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700">Description</label>
                            <textarea 
                                rows={3} name="description"
                                placeholder="Add product description here..."
                                value={formData.description} onChange={handleChange}
                                className="w-full p-4 text-xs border border-slate-200 rounded-2xl focus:outline-hidden"
                            />
                        </div>
                    </div>

                    {/* Section 3: Inventory & Stock Details */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Inventory & Stock Details</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Optional</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700">Opening Quantity</label>
                                <input 
                                    type="number" step="0.01" name="quantity"
                                    placeholder="0.00"
                                    value={formData.quantity} onChange={handleChange}
                                    className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-hidden font-mono"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700">Opening Purchase Price</label>
                                <input 
                                    type="number" step="0.01" name="openingPurchasePrice"
                                    placeholder="0.00"
                                    value={formData.openingPurchasePrice} onChange={handleChange}
                                    className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-hidden font-mono"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700">Opening Stock Value</label>
                                <input 
                                    type="number" step="0.01" name="openingStockValue"
                                    placeholder="0.00"
                                    value={formData.openingStockValue} onChange={handleChange}
                                    className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-hidden font-mono"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Bottom Action Button */}
                    <div className="flex justify-end pt-4">
                        <button 
                            type="submit" 
                            disabled={submitting}
                            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-2xl shadow-md transition cursor-pointer"
                        >
                            {submitting ? 'Saving...' : isEditMode ? 'Update Item' : 'Add Item'}
                        </button>
                    </div>
                </form>
            )}

            {/* Reusable Slide-Over Component for Adding Categories */}
            <AddCategorySlideOver 
                isOpen={isAddCategoryOpen}
                onClose={() => setIsAddCategoryOpen(false)}
                activeCompanyId={activeCompanyId}
                categoryType={categoryType}
                setCategoryType={setCategoryType}
                categoryName={categoryName}
                setCategoryName={setCategoryName}
                categoryDesc={categoryDesc}
                setCategoryDesc={setCategoryDesc}
                showInOnlineStore={showInOnlineStore}
                setShowInOnlineStore={setShowInOnlineStore}
                onSubmit={handleAddCategorySubmit}
            />
             
        </div>
    );
};

export default AddProduct;