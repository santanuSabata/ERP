import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, ChevronDown, ChevronLeft, ChevronRight, Edit3, Trash2, MoreHorizontal, Barcode, ArrowDownLeft, ArrowUpRight, Copy, Upload, FileSpreadsheet, FileText, Trash, SlidersHorizontal, Layers, DollarSign, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/axios.js';
import AddCategorySlideOver from '../../components/inventory/AddCategorySlideOver.jsx';
import AddProduct from '../../components/inventory/AddProduct.jsx';

const Products = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('Items'); // 'Items', 'Categories', 'Groups', 'Price Lists', 'Deleted'
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Select Category');
    const [products, setProducts] = useState([]);
    const [activeCompanyId, setActiveCompanyId] = useState(() => {
        return localStorage.getItem('activeCompanyId') || null;
    });
    const [loading, setLoading] = useState(true);

    // Slide-over / Modal States
    const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
    const [isAddProductOpen, setIsAddProductOpen] = useState(false);
    const [editingProductId, setEditingProductId] = useState(null);

    // Category Form States
    const [categoryType, setCategoryType] = useState('Parent Category');
    const [categoryName, setCategoryName] = useState('');
    const [categoryDesc, setCategoryDesc] = useState('');
    const [showInOnlineStore, setShowInOnlineStore] = useState(true);
    const [categoryImage, setCategoryImage] = useState(null);

    // Data States
    const [categoriesList, setCategoriesList] = useState([]);
    const [groupsList, setGroupsList] = useState([]);
    const [priceLists, setPriceLists] = useState([]);

    // Pagination States
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);

    // Dropdown States
    const [isActionsOpen, setIsActionsOpen] = useState(false);
    const [openRowMenuId, setOpenRowMenuId] = useState(null);

    const actionsRef = useRef(null);

    const fetchTabData = async (compId, tab, search, cat, page, limit) => {
        try {
            setLoading(true);
            const targetCompId = compId || activeCompanyId || localStorage.getItem('activeCompanyId') || 1;
            console.log(`📦 Fetching tab data for [${tab}] | Search Query: "${search}" | Selected Company ID: ${targetCompId} | Page: ${page}`);
            
            if (tab === 'Items') {
                const res = await api.get(`/products?companyId=${targetCompId}&search=${search || ''}&category=${cat}&page=${page}&limit=${limit}`);
                if (res.data) {
                    setProducts(res.data.data || []);
                    setTotalCount(res.data.totalCount || 0);
                }
            } else if (tab === 'Categories') {
                const res = await api.get(`/categories?companyId=${targetCompId}`);
                console.log('✅ Categories Tab Response for Company:', targetCompId, res.data);
                if (res.data) {
                    const allCategories = res.data.data || [];
                    // Filter categories client-side based on search query
                    const filteredCategories = search 
                        ? allCategories.filter(c => 
                            c.name.toLowerCase().includes(search.toLowerCase()) || 
                            (c.description && c.description.toLowerCase().includes(search.toLowerCase())) ||
                            (c.category_type && c.category_type.toLowerCase().includes(search.toLowerCase()))
                          )
                        : allCategories;
                    
                    setCategoriesList(filteredCategories);
                    setTotalCount(filteredCategories.length);
                }
            } else if (tab === 'Groups') {
                const mockGroups = [
                    { id: 1, name: 'Electronics & Hardware', code: 'GRP-01', totalItems: 12 },
                    { id: 2, name: 'Office Supplies', code: 'GRP-02', totalItems: 25 }
                ];
                const filteredGroups = search 
                    ? mockGroups.filter(g => g.name.toLowerCase().includes(search.toLowerCase()) || g.code.toLowerCase().includes(search.toLowerCase()))
                    : mockGroups;
                setGroupsList(filteredGroups);
                setTotalCount(filteredGroups.length);
            } else if (tab === 'Price Lists') {
                const mockPrices = [
                    { id: 1, name: 'Standard Selling Price List', type: 'Sales', currency: 'INR', markup: '0%' },
                    { id: 2, name: 'Wholesale Discounted Rate', type: 'Sales', currency: 'INR', markup: '-10%' }
                ];
                const filteredPrices = search 
                    ? mockPrices.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.type.toLowerCase().includes(search.toLowerCase()))
                    : mockPrices;
                setPriceLists(filteredPrices);
                setTotalCount(filteredPrices.length);
            } else if (tab === 'Deleted') {
                setTotalCount(0);
            }
        } catch (err) {
            console.error(`❌ Failed to fetch tab data for [${tab}]:`, err);
            toast.error(`Could not load ${tab} data`);
        } finally {
            setLoading(false);
        }
    };

    // Initialize company check on mount
    useEffect(() => {
        const initCompany = async () => {
            try {
                const companyRes = await api.get('/company');
                const compData = companyRes.data?.data || companyRes.data;
                const compId = compData?.id || localStorage.getItem('activeCompanyId') || 1;
                
                console.log('🏢 Selected Active Company ID resolved as:', compId);
                setActiveCompanyId(compId);
                localStorage.setItem('activeCompanyId', compId);

                await fetchTabData(compId, activeTab, searchQuery, selectedCategory, currentPage, perPage);
            } catch (err) {
                console.error('❌ Failed to resolve company ID:', err);
                const fallbackId = localStorage.getItem('activeCompanyId') || 1;
                setActiveCompanyId(fallbackId);
                await fetchTabData(fallbackId, activeTab, searchQuery, selectedCategory, currentPage, perPage);
                setLoading(false);
            }
        };
        initCompany();
    }, [activeTab, currentPage, perPage, selectedCategory]);

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
        fetchTabData(activeCompanyId, activeTab, val, selectedCategory, 1, perPage);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this item?')) return;
        try {
            await api.delete(`/products/${id}`);
            toast.success('Product deleted successfully.');
            fetchTabData(activeCompanyId, activeTab, searchQuery, selectedCategory, currentPage, perPage);
        } catch (err) {
            console.error('❌ Delete failed:', err);
            toast.error('Failed to delete item.');
        }
    };

    // Handler to Delete Category
    const handleDeleteCategory = async (catId, catName) => {
        if (!window.confirm(`Are you sure you want to delete category "${catName}"?`)) return;
        try {
            console.log(`🗑️ Deleting category ID: ${catId}`);
            const res = await api.delete(`/categories/${catId}`);
            if (res.data?.success) {
                toast.success('Category deleted successfully.');
                fetchTabData(activeCompanyId, 'Categories', searchQuery, selectedCategory, currentPage, perPage);
            }
        } catch (err) {
            console.error('❌ Failed to delete category:', err);
            toast.error(err.response?.data?.error || 'Failed to delete category.');
        }
    };

    const handleAddCategorySubmit = async (e) => {
        e?.preventDefault();
        if (!categoryName.trim()) {
            toast.error('Please enter category name');
            return;
        }

        try {
            const payload = {
                companyId: activeCompanyId || localStorage.getItem('activeCompanyId') || 2,
                categoryType,
                name: categoryName,
                description: categoryDesc,
                showInOnlineStore
            };

            console.log('📤 Submitting new category for selected company:', payload);
            const res = await api.post('/categories', payload);

            if (res.data?.success) {
                toast.success('Category added successfully!');
                setIsAddCategoryOpen(false);
                
                // Reset form
                setCategoryName('');
                setCategoryDesc('');
                setCategoryType('Parent Category');
                setShowInOnlineStore(true);
                setCategoryImage(null);

                // Refresh categories list
                fetchTabData(activeCompanyId, 'Categories', searchQuery, selectedCategory, currentPage, perPage);
            }
        } catch (err) {
            console.error('❌ Failed to add category:', err);
            toast.error('Failed to add category');
        }
    };

    const getInitials = (name) => {
        if (!name) return 'PR';
        const parts = name.split(' ');
        if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        return name.substring(0, 2).toUpperCase();
    };

    const totalPages = Math.ceil(totalCount / perPage) || 1;

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 space-y-6 pb-16 relative font-sans text-slate-900">
            
            {/* Top Title Bar */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">Products & Services</h1>
                    <span className="h-5 w-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">▶</span>
                </div>
                <div className="text-xs bg-slate-100 px-3 py-1.5 rounded-xl font-semibold text-slate-600">
                    Active Company ID: <span className="text-blue-600 font-bold">{activeCompanyId || '2'}</span>
                </div>
            </div>

            {/* Tabs & Top Controls Bar */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-3">
                    <div className="flex items-center gap-8 overflow-x-auto">
                        {[
                            { name: 'Items', count: activeTab === 'Items' ? totalCount : null },
                            { name: 'Categories', count: activeTab === 'Categories' ? totalCount : null },
                            { name: 'Groups', count: activeTab === 'Groups' ? totalCount : null },
                            { name: 'Price Lists', count: activeTab === 'Price Lists' ? totalCount : null },
                            { name: 'Deleted', count: activeTab === 'Deleted' ? totalCount : null }
                        ].map((tab) => (
                            <button
                                key={tab.name}
                                type="button"
                                onClick={() => { 
                                    setActiveTab(tab.name); 
                                    setCurrentPage(1); 
                                    setSearchQuery(''); // Reset search on tab switch if desired, or keep it
                                    fetchTabData(activeCompanyId, tab.name, '', selectedCategory, 1, perPage);
                                }}
                                className={`text-xs font-semibold pb-2.5 transition relative cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                                    activeTab === tab.name 
                                        ? 'text-blue-600' 
                                        : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                {tab.name}
                                {tab.count !== null && (
                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-full">
                                        {tab.count}
                                    </span>
                                )}
                                {activeTab === tab.name && (
                                    <span className="absolute bottom-[-12px] left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        {/* Search Input Field */}
                        <div className="relative">
                            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="text"
                                placeholder={`Search ${activeTab.toLowerCase()}...`}
                                value={searchQuery}
                                onChange={handleSearchChange}
                                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-blue-500 w-full sm:w-64"
                            />
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                if (activeTab === 'Categories') setIsAddCategoryOpen(true);
                                else if (activeTab === 'Groups') toast('Create Group clicked');
                                else if (activeTab === 'Price Lists') toast('Create Price List clicked');
                                else {
                                    setEditingProductId(null);
                                    setIsAddProductOpen(true);
                                }
                            }}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition flex items-center gap-2 shadow-sm shadow-blue-500/20 cursor-pointer"
                        >
                            <Plus size={14} /> New {activeTab === 'Items' ? 'Item' : activeTab.slice(0, -1)}
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Table */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden w-full">
                
                {/* 1. ITEMS TAB */}
                {activeTab === 'Items' && (
                    <>
                        <div className="grid grid-cols-12 bg-slate-50/70 border-b border-slate-100 px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            <div className="col-span-3">Item</div>
                            <div className="col-span-2">Type</div>
                            <div className="col-span-1">Tax %</div>
                            <div className="col-span-1">Qty</div>
                            <div className="col-span-1">Unit</div>
                            <div className="col-span-2">Selling Price</div>
                            <div className="col-span-2 flex items-center justify-end">
                                <span className="text-right">Actions</span>
                            </div>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {products.length === 0 ? (
                                <div className="p-12 text-center text-xs text-slate-400">No products found matching "{searchQuery}".</div>
                            ) : (
                                products.map((item) => (
                                    <div key={item.id} className="grid grid-cols-12 items-center px-6 py-4 hover:bg-slate-50/60 transition group">
                                        
                                        {/* Item Name & Category */}
                                        <div className="col-span-3 flex items-center gap-3 pr-2">
                                            <div className="h-9 w-9 rounded-full bg-sky-100 text-sky-700 font-bold text-xs flex items-center justify-center shrink-0">
                                                {getInitials(item.name)}
                                            </div>
                                            <div className="truncate">
                                                <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                                                <p className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                                                    <span className="text-emerald-600 font-medium">{item.category || 'Uncategorized'}</span>
                                                    <span className="font-mono text-slate-500">{item.sku}</span>
                                                </p>
                                            </div>
                                        </div>

                                        {/* Item Type */}
                                        <div className="col-span-2">
                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-md">
                                                {item.itemType || item.item_type || 'Product'}
                                            </span>
                                        </div>

                                        {/* Tax Percentage */}
                                        <div className="col-span-1">
                                            <span className="text-xs font-semibold text-slate-700">
                                                {item.taxPercentage ?? item.tax_percentage ?? 0}%
                                            </span>
                                        </div>

                                        {/* Quantity */}
                                        <div className="col-span-1">
                                            <span className="text-xs font-bold text-slate-800">
                                                {item.quantity}
                                            </span>
                                        </div>

                                        {/* Primary Unit */}
                                        <div className="col-span-1">
                                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded">
                                                {item.primaryUnit || item.primary_unit || item.unit || 'BOX'}
                                            </span>
                                        </div>

                                        {/* Selling Price */}
                                        <div className="col-span-2">
                                            <p className="text-xs font-bold text-slate-900">₹ {Number(item.sellingPrice || item.selling_price || 0).toFixed(2)}</p>
                                        </div>

                                        {/* Actions */}
                                        <div className="col-span-2 flex items-center justify-end gap-1.5">
                                            <button onClick={() => { setEditingProductId(item.id); setIsAddProductOpen(true); }} className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs rounded-lg transition cursor-pointer" title="Edit Item">
                                                <Edit3 size={14} />
                                            </button>
                                            <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-400 hover:text-rose-600 transition cursor-pointer bg-slate-50 rounded-lg" title="Delete Item">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>

                                    </div>
                                ))
                            )}
                        </div>
                    </>
                )}

                {/* 2. CATEGORIES TAB */}
                {activeTab === 'Categories' && (
                    <>
                        <div className="grid grid-cols-12 bg-slate-50/70 border-b border-slate-100 px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            <div className="col-span-4">Category Name</div>
                            <div className="col-span-3">Type</div>
                            <div className="col-span-3">Description</div>
                            <div className="col-span-2 text-right">Actions</div>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {categoriesList.length === 0 ? (
                                <div className="p-12 text-center text-xs text-slate-400">No categories found matching "{searchQuery}".</div>
                            ) : (
                                categoriesList.map((cat) => (
                                    <div key={cat.id} className="grid grid-cols-12 items-center px-6 py-4 hover:bg-slate-50/60 transition">
                                        <div className="col-span-4 font-bold text-xs text-slate-900">{cat.name}</div>
                                        <div className="col-span-3 text-xs text-slate-600">{cat.category_type || 'Parent Category'}</div>
                                        <div className="col-span-3 text-xs text-slate-500">{cat.description || 'N/A'}</div>
                                        <div className="col-span-2 text-right flex items-center justify-end gap-2">
                                            <span className="px-2 py-0.5 bg-sky-100 text-sky-700 text-[10px] font-bold rounded-full">
                                                {cat.total_items || 0} Items
                                            </span>
                                            <button 
                                                onClick={() => handleDeleteCategory(cat.id, cat.name)}
                                                className="p-1.5 text-slate-400 hover:text-rose-600 transition cursor-pointer bg-slate-50 rounded-lg"
                                                title="Delete Category"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                )}

                {/* 3. GROUPS TAB */}
                {activeTab === 'Groups' && (
                    <div className="divide-y divide-slate-100">
                        {groupsList.length === 0 ? (
                            <div className="p-12 text-center text-xs text-slate-400">No groups found matching "{searchQuery}".</div>
                        ) : (
                            groupsList.map((grp) => (
                                <div key={grp.id} className="grid grid-cols-12 items-center px-6 py-4 hover:bg-slate-50/60 transition">
                                    <div className="col-span-5 font-bold text-xs text-slate-900">{grp.name}</div>
                                    <div className="col-span-4 text-xs font-mono text-slate-500">{grp.code}</div>
                                    <div className="col-span-3 text-right text-xs text-slate-700">{grp.totalItems} Items</div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* 4. PRICE LISTS TAB */}
                {activeTab === 'Price Lists' && (
                    <div className="divide-y divide-slate-100">
                        {priceLists.length === 0 ? (
                            <div className="p-12 text-center text-xs text-slate-400">No price lists found matching "{searchQuery}".</div>
                        ) : (
                            priceLists.map((pl) => (
                                <div key={pl.id} className="grid grid-cols-12 items-center px-6 py-4 hover:bg-slate-50/60 transition">
                                    <div className="col-span-4 font-bold text-xs text-slate-900">{pl.name}</div>
                                    <div className="col-span-3 text-xs text-slate-600">{pl.type}</div>
                                    <div className="col-span-3 text-xs text-slate-600">{pl.currency}</div>
                                    <div className="col-span-2 text-right text-xs font-bold text-slate-800">{pl.markup}</div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* 5. DELETED TAB */}
                {activeTab === 'Deleted' && (
                    <div className="p-12 text-center text-xs text-slate-400">Recycling bin is empty.</div>
                )}
            </div>

            {/* SLIDE-OVER: ADD PRODUCT */}
            {isAddProductOpen && (
                <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-2xs flex justify-end transition-opacity">
                    <div className="w-full md:w-1/2 bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden">
                        <div className="p-6 overflow-y-auto flex-1">
                            <AddProduct 
                                editId={editingProductId} 
                                onClose={() => {
                                    setIsAddProductOpen(false);
                                    setEditingProductId(null);
                                    fetchTabData(activeCompanyId, activeTab, searchQuery, selectedCategory, currentPage, perPage);
                                }} 
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* SLIDE-OVER: ADD CATEGORY */}
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

export default Products;