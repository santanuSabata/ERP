import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X, Plus, ChevronRight, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/axios.js';

const AddVendor = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = Boolean(id);

    const [activeCompanyId, setActiveCompanyId] = useState(1);
    const [saving, setSaving] = useState(false);
    const [loadingData, setLoadingData] = useState(isEditMode);

    const [form, setForm] = useState({
        name: '',
        phoneCode: '+91',
        phone: '',
        email: '',
        gstin: '',
        companyName: '',
        
        showBilling: false,
        billingAddressLine1: '',
        billingAddressLine2: '',
        billingPincode: '',
        billingCity: '',
        billingState: '',
        billingCountry: 'India',

        showShipping: false,
        shippingAddressLine1: '',
        shippingAddressLine2: '',
        shippingPincode: '',
        shippingCity: '',
        shippingState: '',
        shippingCountry: 'India',

        openingBalance: '',
        balanceType: 'Debit',
        tdsEnabled: false,
        tcsEnabled: false,
        rcmApplicable: false,

        showMoreDetails: false,
        notes: '',
        tags: '',
        discount: '',
    });

    useEffect(() => {
        const init = async () => {
            try {
                const companyRes = await api.get('/company');
                const compId = companyRes.data?.id || 1;
                setActiveCompanyId(compId);

                if (isEditMode) {
                    const res = await api.get(`/vendors?companyId=${compId}`);
                    const vendorList = res.data?.data || [];
                    const currentVendor = vendorList.find(v => v.id === parseInt(id));

                    if (currentVendor) {
                        setForm({
                            name: currentVendor.name || '',
                            phoneCode: '+91',
                            phone: currentVendor.phone ? currentVendor.phone.replace('+91 ', '') : '',
                            email: currentVendor.email || '',
                            gstin: currentVendor.gstin || '',
                            companyName: currentVendor.companyName || '',
                            
                            showBilling: Boolean(currentVendor.billingAddress1),
                            billingAddressLine1: currentVendor.billingAddress1 || '',
                            billingAddressLine2: currentVendor.billingAddress2 || '',
                            billingPincode: currentVendor.billingPincode || '',
                            billingCity: currentVendor.billingCity || '',
                            billingState: currentVendor.billingState || '',
                            billingCountry: currentVendor.billingCountry || 'India',

                            showShipping: Boolean(currentVendor.shippingAddress1),
                            shippingAddressLine1: currentVendor.shippingAddress1 || '',
                            shippingAddressLine2: currentVendor.shippingAddress2 || '',
                            shippingPincode: currentVendor.shippingPincode || '',
                            shippingCity: currentVendor.shippingCity || '',
                            shippingState: currentVendor.shippingState || '',
                            shippingCountry: currentVendor.shippingCountry || 'India',

                            openingBalance: currentVendor.openingBalance || '',
                            balanceType: currentVendor.balanceType || 'Debit',
                            tdsEnabled: currentVendor.tdsEnabled || false,
                            tcsEnabled: currentVendor.tcsEnabled || false,
                            rcmApplicable: currentVendor.rcmApplicable || false,
                            showMoreDetails: false,
                        });
                    }
                }
            } catch (err) {
                console.error('❌ Failed to initialize vendor form:', err);
            } finally {
                setLoadingData(false);
            }
        };
        init();
    }, [id, isEditMode]);

    const handleChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleFetchGstin = () => {
        if (!form.gstin || form.gstin.length < 15) {
            toast.error('Please enter a valid 15-digit GSTIN');
            return;
        }
        toast.success('Fetching GSTIN details...');
        setForm(prev => ({ ...prev, companyName: 'NEXTSPEED SUPPLIERS PRIVATE LIMITED' }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) {
            toast.error('Vendor name is required.');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                companyId: activeCompanyId,
                name: form.name,
                phone: form.phone ? `${form.phoneCode} ${form.phone}` : '',
                email: form.email,
                gstin: form.gstin,
                companyName: form.companyName,
                billingAddress1: form.billingAddressLine1,
                billingAddress2: form.billingAddressLine2,
                billingPincode: form.billingPincode,
                billingCity: form.billingCity,
                billingState: form.billingState,
                billingCountry: form.billingCountry,
                shippingAddress1: form.shippingAddressLine1,
                shippingAddress2: form.shippingAddressLine2,
                shippingPincode: form.shippingPincode,
                shippingCity: form.shippingCity,
                shippingState: form.shippingState,
                shippingCountry: form.shippingCountry,
                openingBalance: parseFloat(form.openingBalance) || 0,
                balanceType: form.balanceType,
                tdsEnabled: form.tdsEnabled,
                tcsEnabled: form.tcsEnabled,
                rcmApplicable: form.rcmApplicable,
            };

            if (isEditMode) {
                await api.put(`/vendors/${id}`, payload);
                toast.success('Vendor updated successfully!');
            } else {
                await api.post('/vendors', payload);
                toast.success('Vendor added successfully!');
            }
            navigate('/vendors');
        } catch (err) {
            console.error('❌ Failed to save vendor:', err);
            toast.error('Failed to save vendor.');
        } finally {
            setSaving(false);
        }
    };

    if (loadingData) {
        return (
            <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center text-xs text-slate-500 shadow-2xs w-full px-6">
                Loading vendor details...
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs w-full px-6 py-6 overflow-hidden flex flex-col mb-16 font-sans text-slate-900 space-y-6">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white rounded-2xl">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/vendors')}
                        className="h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 transition cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                    <h1 className="text-lg font-bold text-slate-900">
                        {isEditMode ? 'Edit Vendor' : 'Add Vendor'}
                    </h1>
                </div>

                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={saving}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-sm shadow-blue-500/20 cursor-pointer flex items-center gap-1.5"
                >
                    {saving ? 'Saving...' : 'Save'} <span className="text-xs">→</span>
                </button>
            </div>

            <div className="p-8 space-y-8">
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-xs font-bold text-slate-900 border-b-2 border-blue-600 pb-2 -mb-2">Basic Details</span>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">
                            <span className="text-rose-500">*</span>Name
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="Narayan Mandal"
                            value={form.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-4 py-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden transition"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700">Phone</label>
                            <div className="flex gap-2">
                                <select
                                    value={form.phoneCode}
                                    onChange={(e) => handleChange('phoneCode', e.target.value)}
                                    className="w-24 bg-white border border-slate-200 rounded-xl px-3 py-3 text-xs text-slate-900 focus:outline-hidden cursor-pointer"
                                >
                                    <option value="+91">+91</option>
                                    <option value="+1">+1</option>
                                    <option value="+44">+44</option>
                                </select>
                                <input
                                    type="text"
                                    placeholder="Phone number"
                                    value={form.phone}
                                    onChange={(e) => handleChange('phone', e.target.value)}
                                    className="flex-1 bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-4 py-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden transition"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700">Email</label>
                            <input
                                type="email"
                                placeholder="name@example.com"
                                value={form.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-4 py-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden transition"
                            />
                        </div>
                    </div>
                </div>

                {/* Company Details */}
                <div className="space-y-4 pt-2">
                    <h2 className="text-xs font-bold text-slate-900">Company Details (Optional)</h2>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">GSTIN</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="29AABCT1332L000"
                                value={form.gstin}
                                onChange={(e) => handleChange('gstin', e.target.value.toUpperCase())}
                                className="flex-1 bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-4 py-3 text-xs text-slate-900 uppercase placeholder-slate-400 focus:outline-hidden transition"
                            />
                            <button
                                type="button"
                                onClick={handleFetchGstin}
                                className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer whitespace-nowrap"
                            >
                                Fetch Details
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Company Name</label>
                        <input
                            type="text"
                            placeholder="Company Name"
                            value={form.companyName}
                            onChange={(e) => handleChange('companyName', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-600 focus:outline-hidden"
                        />
                    </div>
                </div>

                {/* Optional Details Box */}
                <div className="bg-slate-50/70 border border-slate-200/80 rounded-3xl p-6 space-y-6">
                    <h3 className="text-xs font-bold text-slate-900">Optional Details</h3>

                    <div className="space-y-3">
                        <label className="text-xs font-semibold text-slate-700">Opening Balance</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="Enter Amount"
                                value={form.openingBalance}
                                onChange={(e) => handleChange('openingBalance', e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-32 py-3 text-xs text-slate-900 focus:outline-hidden"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-bold text-rose-600">
                                You Pay ₹
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-8 py-5 border-t border-slate-100 flex items-center justify-between bg-white rounded-2xl">
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={saving}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-sm cursor-pointer"
                >
                    {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                    type="button"
                    onClick={() => navigate('/vendors')}
                    className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default AddVendor;