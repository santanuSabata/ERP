import { useState, useEffect } from 'react';
import { Upload, ChevronDown, Plus, ArrowLeft, Copy, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/axios.js';

const CompanyDetailsForm = () => {
    const navigate = useNavigate();
    const [companyId, setCompanyId] = useState(null);
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    
    const initialFormState = {
        brandName: '', 
        companyName: '',
        phone: '',
        email: '',
        gstin: '',
        businessType: 'Manufacturing',
        altPhone: '',
        website: '',
        pan: '',
        // Billing Address Fields
        billingAddress1: '',
        billingAddress2: '',
        billingPincode: '',
        billingCity: '',
        billingState: '',
        billingCountry: 'India',
        // Shipping Address Fields
        shippingAddress1: '',
        shippingAddress2: '',
        shippingPincode: '',
        shippingCity: '',
        shippingState: '',
        shippingCountry: 'India',
        isDefault: false,
    };

    const [form, setForm] = useState(initialFormState);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Helper to resolve clean absolute image URLs
    const resolveImageUrl = (dbPath) => {
        if (!dbPath) return null;
        if (dbPath.startsWith('http')) return dbPath;
        const baseURL = api.defaults.baseURL || 'http://localhost:8000/api';
        const serverRoot = baseURL.replace(/\/api\/?$/, '');
        const cleanPath = dbPath.startsWith('/') ? dbPath : `/${dbPath}`;
        return `${serverRoot}${cleanPath}`;
    };

    // Fetch active company details on mount
    useEffect(() => {
        if (isCreatingNew) return;
        
        const fetchCompanyDetails = async () => {
            setLoading(true);
            try {
                // Retrieve active company ID from localStorage to sync with the rest of the app
                const activeCompId = localStorage.getItem('activeCompanyId');
                const endpoint = activeCompId ? `/company?companyId=${activeCompId}` : '/company';
                
                //console.log('🔍 [CompanyForm] Fetching from endpoint:', endpoint);
                //console.log('🔍 [CompanyForm] activeCompanyId from localStorage:', activeCompId);

                const response = await api.get(endpoint);
                //console.log('📦 [CompanyForm] Raw API Response:', response);
                //console.log('📦 [CompanyForm] Response Data:', response.data);
                
                // Handle different response structures safely (array vs object wrapper)
                let data = response.data;
                if (data && data.data) {
                    data = data.data;
                    //console.log('📦 [CompanyForm] Unwrapped via .data property:', data);
                }
                if (Array.isArray(data)) {
                    //console.log('📦 [CompanyForm] Data is an array. Searching for ID:', activeCompId);
                    data = data.find(c => String(c.id) === String(activeCompId)) || data[0];
                }

                //console.log('🎯 [CompanyForm] Final Resolved Company Object to Map:', data);

                if (data && !data.error) {
                    setCompanyId(data.id);
                    if (data.logoUrl || data.logo_url) {
                        setLogoPreview(resolveImageUrl(data.logoUrl || data.logo_url));
                    }
                    
                    const mappedForm = {
                        brandName: data.brandName || data.brand_name || '',
                        companyName: data.companyName || data.company_name || '',
                        phone: data.phone || '',
                        email: data.email || '',
                        gstin: data.gstin || '',
                        businessType: data.businessType || data.business_type || 'Manufacturing',
                        altPhone: data.altPhone || data.alt_phone || '',
                        website: data.website || '',
                        pan: data.pan || '',
                        // Mapping billing fields
                        billingAddress1: data.billingAddress1 || data.address_line1 || '',
                        billingAddress2: data.billingAddress2 || data.address_line2 || '',
                        billingPincode: data.billingPincode || data.pincode || '',
                        billingCity: data.billingCity || data.city || '',
                        billingState: data.billingState || data.state || '',
                        billingCountry: data.billingCountry || data.country || 'India',
                        // Mapping shipping fields
                        shippingAddress1: data.shippingAddress1 || data.shipping_address_line1 || '',
                        shippingAddress2: data.shippingAddress2 || data.shipping_address_line2 || '',
                        shippingPincode: data.shippingPincode || data.shipping_pincode || '',
                        shippingCity: data.shippingCity || data.shipping_city || '',
                        shippingState: data.shippingState || data.shipping_state || '',
                        shippingCountry: data.shippingCountry || data.shipping_country || 'India',
                        isDefault: data.isDefault ?? data.is_default ?? true,
                    };

                    console.log('📝 [CompanyForm] Mapped Form State Values:', mappedForm);
                    setForm(mappedForm);
                } else {
                    console.warn('⚠️ [CompanyForm] Data object was null, undefined, or contained an error:', data);
                }
            } catch (err) {
                console.error('❌ [CompanyForm] GET failed with error:', err);
                toast.error('Could not load company details.');
            } finally {
                setLoading(false);
            }
        };
        fetchCompanyDetails();
    }, [isCreatingNew]);

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    // Copy Billing to Shipping helper
    const handleCopyToShipping = () => {
        setForm(prev => ({
            ...prev,
            shippingAddress1: prev.billingAddress1,
            shippingAddress2: prev.billingAddress2,
            shippingPincode: prev.billingPincode,
            shippingCity: prev.billingCity,
            shippingState: prev.billingState,
            shippingCountry: prev.billingCountry,
        }));
        toast.success('Billing address copied to shipping!');
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleAddNewMode = () => {
        setIsCreatingNew(true);
        setCompanyId(null);
        setForm({ ...initialFormState, isDefault: false });
        setLogoFile(null);
        setLogoPreview(null);
        setLoading(false);
    };

    const handleCancelAdd = () => {
        setIsCreatingNew(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const formData = new FormData();
            Object.keys(form).forEach((key) => {
                formData.append(key, form[key]);
            });

            if (logoFile) {
                formData.append('company_logo', logoFile);
            }

            if (isCreatingNew) {
                const response = await api.post('/company', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                toast.success('New company added successfully!');
                setIsCreatingNew(false);
                const newComp = response.data.data || response.data;
                if (newComp?.id) {
                    setCompanyId(newComp.id);
                    localStorage.setItem('activeCompanyId', newComp.id);
                }
                window.location.reload();
            } else {
                const targetId = companyId || localStorage.getItem('activeCompanyId') || 1;
                await api.put(`/company/${targetId}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                toast.success('Company details updated successfully!');
            }
        } catch (err) {
            console.error('❌ Operation failed:', err);
            toast.error(err.response?.data?.error || 'Failed to save company details.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center text-xs text-slate-500 shadow-2xs">
                Loading company details...
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-2xs">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                    {isCreatingNew ? 'Add New Company' : 'Company Details'}
                </h1>
                
                {!isCreatingNew ? (
                    <button
                        type="button"
                        onClick={handleAddNewMode}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition flex items-center gap-2 shadow-sm"
                    >
                        <Plus size={14} /> Add Another Company
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={handleCancelAdd}
                        className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-2"
                    >
                        <ArrowLeft size={14} /> Back to Existing Company
                    </button>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl">
                {/* Company Logo Upload */}
                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                    <label className="text-xs font-semibold text-slate-600">Company Logo :</label>
                    <div className="md:col-span-2 flex items-center gap-4">
                        <div className="h-20 w-20 rounded-2xl bg-slate-900 border border-slate-200 flex items-center justify-center p-2 shadow-inner overflow-hidden">
                            {logoPreview ? (
                                <img src={logoPreview} alt="Logo Preview" className="h-full w-full object-cover rounded-xl" />
                            ) : (
                                <div className="text-teal-400 font-bold text-center text-[10px] tracking-tighter truncate">
                                    {form.brandName || 'ERP LOGO'}
                                </div>
                            )}
                        </div>
                        <label className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-2 shadow-2xs cursor-pointer">
                            <Upload size={14} className="text-slate-500" />
                            Upload Logo
                            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                        </label>
                    </div>
                </div>

                {/* Brand Name */}
                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                    <label className="text-xs font-semibold text-slate-600">
                        <span className="text-rose-500 mr-1">*</span>Brand Name :
                    </label>
                    <div className="md:col-span-2">
                        <input
                            type="text"
                            value={form.brandName}
                            onChange={(e) => handleChange('brandName', e.target.value)}
                            required
                            className="w-full bg-white border border-slate-200 focus:border-violet-500 rounded-xl px-4 py-3 text-xs text-slate-900 focus:outline-hidden transition"
                        />
                    </div>
                </div>

                {/* Company Name */}
                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                    <label className="text-xs font-semibold text-slate-600">
                        <span className="text-rose-500 mr-1">*</span>Company Name :
                    </label>
                    <div className="md:col-span-2">
                        <input
                            type="text"
                            value={form.companyName}
                            onChange={(e) => handleChange('companyName', e.target.value)}
                            required
                            className="w-full bg-white border border-slate-200 focus:border-violet-500 rounded-xl px-4 py-3 text-xs text-slate-900 focus:outline-hidden transition uppercase"
                        />
                    </div>
                </div>

                {/* 📍 Billing Details / Address Section */}
                <div className="pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <Lock size={14} className="text-rose-500" /> Billing Details
                        </h2>
                        <button
                            type="button"
                            onClick={handleCopyToShipping}
                            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 transition"
                        >
                            <Copy size={12} /> Copy to Shipping
                        </button>
                    </div>

                    <div className="space-y-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <input
                                type="text"
                                placeholder="Billing Address Line 1"
                                value={form.billingAddress1}
                                onChange={(e) => handleChange('billingAddress1', e.target.value)}
                                className="w-full bg-white border border-slate-200 focus:border-violet-500 rounded-xl px-4 py-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden transition"
                            />
                            <input
                                type="text"
                                placeholder="Billing Address Line 2"
                                value={form.billingAddress2}
                                onChange={(e) => handleChange('billingAddress2', e.target.value)}
                                className="w-full bg-white border border-slate-200 focus:border-violet-500 rounded-xl px-4 py-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden transition"
                            />
                            <input
                                type="text"
                                placeholder="Pincode"
                                value={form.billingPincode}
                                onChange={(e) => handleChange('billingPincode', e.target.value)}
                                className="w-full bg-white border border-slate-200 focus:border-violet-500 rounded-xl px-4 py-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden transition"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <input
                                type="text"
                                placeholder="City"
                                value={form.billingCity}
                                onChange={(e) => handleChange('billingCity', e.target.value)}
                                className="w-full bg-white border border-slate-200 focus:border-violet-500 rounded-xl px-4 py-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden transition"
                            />
                            <input
                                type="text"
                                placeholder="State"
                                value={form.billingState}
                                onChange={(e) => handleChange('billingState', e.target.value)}
                                className="w-full bg-white border border-slate-200 focus:border-violet-500 rounded-xl px-4 py-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden transition"
                            />
                            <select
                                value={form.billingCountry}
                                onChange={(e) => handleChange('billingCountry', e.target.value)}
                                className="w-full bg-white border border-slate-200 focus:border-violet-500 rounded-xl px-4 py-3 text-xs text-slate-900 focus:outline-hidden transition"
                            >
                                <option value="India">India</option>
                                <option value="USA">USA</option>
                                <option value="UK">UK</option>
                                <option value="Canada">Canada</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* 📍 Shipping Details / Address Section */}
                <div className="pt-2">
                    <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Plus size={14} className="text-rose-500" /> Shipping Details
                    </h2>

                    <div className="space-y-3 bg-indigo-50/30 p-4 rounded-2xl border border-indigo-50">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <input
                                type="text"
                                placeholder="Shipping Address Line 1"
                                value={form.shippingAddress1}
                                onChange={(e) => handleChange('shippingAddress1', e.target.value)}
                                className="w-full bg-white border border-slate-200 focus:border-violet-500 rounded-xl px-4 py-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden transition"
                            />
                            <input
                                type="text"
                                placeholder="Shipping Address Line 2"
                                value={form.shippingAddress2}
                                onChange={(e) => handleChange('shippingAddress2', e.target.value)}
                                className="w-full bg-white border border-slate-200 focus:border-violet-500 rounded-xl px-4 py-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden transition"
                            />
                            <input
                                type="text"
                                placeholder="Pincode"
                                value={form.shippingPincode}
                                onChange={(e) => handleChange('shippingPincode', e.target.value)}
                                className="w-full bg-white border border-slate-200 focus:border-violet-500 rounded-xl px-4 py-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden transition"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <input
                                type="text"
                                placeholder="City"
                                value={form.shippingCity}
                                onChange={(e) => handleChange('shippingCity', e.target.value)}
                                className="w-full bg-white border border-slate-200 focus:border-violet-500 rounded-xl px-4 py-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden transition"
                            />
                            <input
                                type="text"
                                placeholder="State"
                                value={form.shippingState}
                                onChange={(e) => handleChange('shippingState', e.target.value)}
                                className="w-full bg-white border border-slate-200 focus:border-violet-500 rounded-xl px-4 py-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden transition"
                            />
                            <select
                                value={form.shippingCountry}
                                onChange={(e) => handleChange('shippingCountry', e.target.value)}
                                className="w-full bg-white border border-slate-200 focus:border-violet-500 rounded-xl px-4 py-3 text-xs text-slate-900 focus:outline-hidden transition"
                            >
                                <option value="India">India</option>
                                <option value="USA">USA</option>
                                <option value="UK">UK</option>
                                <option value="Canada">Canada</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Company Phone */}
                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 pt-2">
                    <label className="text-xs font-semibold text-slate-600">Company Phone :</label>
                    <div className="md:col-span-2 flex gap-2">
                        <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-xs font-medium text-slate-700">
                            <span>+91</span>
                            <ChevronDown size={13} className="text-slate-400" />
                        </div>
                        <input
                            type="text"
                            value={form.phone}
                            onChange={(e) => handleChange('phone', e.target.value)}
                            className="flex-1 bg-white border border-slate-200 focus:border-violet-500 rounded-xl px-4 py-3 text-xs text-slate-900 focus:outline-hidden transition"
                        />
                    </div>
                </div>

                {/* Company Email */}
                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                    <label className="text-xs font-semibold text-slate-600">Company Email :</label>
                    <div className="md:col-span-2">
                        <input
                            type="email"
                            value={form.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            className="w-full bg-white border border-slate-200 focus:border-violet-500 rounded-xl px-4 py-3 text-xs text-slate-900 focus:outline-hidden transition"
                        />
                    </div>
                </div>

                {/* GSTIN */}
                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                    <label className="text-xs font-semibold text-slate-600">GSTIN :</label>
                    <div className="md:col-span-2">
                        <input
                            type="text"
                            value={form.gstin}
                            onChange={(e) => handleChange('gstin', e.target.value)}
                            className="w-full bg-white border border-slate-200 focus:border-violet-500 rounded-xl px-4 py-3 text-xs text-slate-900 focus:outline-hidden transition uppercase"
                        />
                    </div>
                </div>

                {/* Business Type */}
                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                    <label className="text-xs font-semibold text-slate-600">Business Type :</label>
                    <div className="md:col-span-2 relative">
                        <select
                            value={form.businessType}
                            onChange={(e) => handleChange('businessType', e.target.value)}
                            className="w-full bg-white border border-slate-200 focus:border-violet-500 rounded-xl px-4 py-3 text-xs text-slate-900 focus:outline-hidden transition appearance-none"
                        >
                            <option value="Manufacturing">Manufacturing</option>
                            <option value="Services">Services</option>
                            <option value="Retail">Retail</option>
                            <option value="Wholesale">Wholesale</option>
                        </select>
                        <ChevronDown size={15} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                </div>

                {/* Alternative Contact Number */}
                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                    <label className="text-xs font-semibold text-slate-600">Alternative Contact Number :</label>
                    <div className="md:col-span-2">
                        <input
                            type="text"
                            value={form.altPhone}
                            onChange={(e) => handleChange('altPhone', e.target.value)}
                            className="w-full bg-white border border-slate-200 focus:border-violet-500 rounded-xl px-4 py-3 text-xs text-slate-900 focus:outline-hidden transition"
                        />
                    </div>
                </div>

                {/* Website */}
                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                    <label className="text-xs font-semibold text-slate-600">Website :</label>
                    <div className="md:col-span-2">
                        <input
                            type="text"
                            value={form.website}
                            onChange={(e) => handleChange('website', e.target.value)}
                            className="w-full bg-white border border-slate-200 focus:border-violet-500 rounded-xl px-4 py-3 text-xs text-slate-900 focus:outline-hidden transition"
                        />
                    </div>
                </div>

                {/* PAN Number */}
                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                    <label className="text-xs font-semibold text-slate-600">PAN Number :</label>
                    <div className="md:col-span-2">
                        <input
                            type="text"
                            value={form.pan}
                            onChange={(e) => handleChange('pan', e.target.value)}
                            className="w-full bg-white border border-slate-200 focus:border-violet-500 rounded-xl px-4 py-3 text-xs text-slate-900 focus:outline-hidden transition uppercase"
                        />
                    </div>
                </div>

                {/* Make Default Company Toggle */}
                <div className="grid grid-cols-1 md:grid-cols-3 items-start gap-4 pt-2">
                    <label className="text-xs font-semibold text-slate-600 pt-1">Make Default Company :</label>
                    <div className="md:col-span-2 space-y-1">
                        <div className="flex items-center">
                            <button
                                type="button"
                                onClick={() => handleChange('isDefault', !form.isDefault)}
                                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out ${
                                    form.isDefault ? 'bg-blue-600' : 'bg-slate-300'
                                }`}
                            >
                                <div
                                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                                        form.isDefault ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                                />
                            </button>
                        </div>
                        <p className="text-[11px] text-slate-400">
                            By switching it ON, this company will be selected by default while logging in
                        </p>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4 flex items-center gap-3">
                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs px-6 py-3 rounded-xl transition shadow-md shadow-blue-500/20"
                    >
                        {saving ? 'Saving...' : isCreatingNew ? 'Save New Company' : 'Save & Update'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CompanyDetailsForm;