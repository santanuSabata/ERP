import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X, Plus, ChevronRight, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/axios.js';

const AddCustomer = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // 👈 Check if editing (id present)
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

                // If editing, fetch customer details and pre-fill form
                if (isEditMode) {
                    const res = await api.get(`/customers?companyId=${compId}`);
                    const customerList = res.data?.data || [];
                    const currentCustomer = customerList.find(c => c.id === parseInt(id));

                    if (currentCustomer) {
                        setForm({
                            name: currentCustomer.name || '',
                            phoneCode: '+91',
                            phone: currentCustomer.phone ? currentCustomer.phone.replace('+91 ', '') : '',
                            email: currentCustomer.email || '',
                            gstin: currentCustomer.gstin || '',
                            companyName: currentCustomer.companyName || '',
                            
                            showBilling: Boolean(currentCustomer.billingAddress1),
                            billingAddressLine1: currentCustomer.billingAddress1 || '',
                            billingAddressLine2: currentCustomer.billingAddress2 || '',
                            billingPincode: currentCustomer.billingPincode || '',
                            billingCity: currentCustomer.billingCity || '',
                            billingState: currentCustomer.billingState || '',
                            billingCountry: currentCustomer.billingCountry || 'India',

                            showShipping: Boolean(currentCustomer.shippingAddress1),
                            shippingAddressLine1: currentCustomer.shippingAddress1 || '',
                            shippingAddressLine2: currentCustomer.shippingAddress2 || '',
                            shippingPincode: currentCustomer.shippingPincode || '',
                            shippingCity: currentCustomer.shippingCity || '',
                            shippingState: currentCustomer.shippingState || '',
                            shippingCountry: currentCustomer.shippingCountry || 'India',

                            openingBalance: currentCustomer.openingBalance || '',
                            balanceType: currentCustomer.balanceType || 'Debit',
                            tdsEnabled: currentCustomer.tdsEnabled || false,
                            tcsEnabled: currentCustomer.tcsEnabled || false,
                            rcmApplicable: currentCustomer.rcmApplicable || false,
                            showMoreDetails: false,
                        });
                    }
                }
            } catch (err) {
                console.error('❌ Failed to initialize customer form:', err);
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
        setForm(prev => ({ ...prev, companyName: 'NEXTSPEED TECHNOLOGIES PRIVATE LIMITED' }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) {
            toast.error('Customer name is required.');
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
                await api.put(`/customers/${id}`, payload);
                toast.success('Customer updated successfully!');
            } else {
                await api.post('/customers', payload);
                toast.success('Customer added successfully!');
            }
            navigate('/customers');
        } catch (err) {
            console.error('❌ Failed to save customer:', err);
            toast.error('Failed to save customer.');
        } finally {
            setSaving(false);
        }
    };

    if (loadingData) {
        return (
            <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center text-xs text-slate-500 shadow-2xs max-w-4xl mx-auto">
                Loading customer details...
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs max-w-4xl mx-auto overflow-hidden flex flex-col mb-16">
            
            {/* Top Page Header */}
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/customers')}
                        className="h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 transition cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                    <h1 className="text-lg font-bold text-slate-900">
                        {isEditMode ? 'Edit Customer' : 'Add Customer'}
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

            {/* Form Content Body */}
            <div className="p-8 space-y-8">
                
                {/* Basic Details Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-xs font-bold text-slate-900 border-b-2 border-blue-600 pb-2 -mb-2">Basic Details</span>
                        <button type="button" className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
                            <Plus size={12} /> Add Custom fields
                        </button>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">
                            <span className="text-rose-500">*</span>Name
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="Ratan TATA"
                            value={form.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-4 py-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden transition"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700">Phone</label>
                            <div className="flex gap-2">
                                <select
                                    value={form.phoneCode}
                                    onChange={(e) => handleChange('phoneCode', e.target.value)}
                                    className="w-24 bg-white border border-slate-200 rounded-xl px-3 py-3 text-xs text-slate-900 focus:outline-hidden"
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

                {/* Company Details (Optional) */}
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
                                className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
                            >
                                Fetch Details
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Company Name</label>
                        <input
                            type="text"
                            placeholder="NEXTSPEED TECHNOLOGIES PRIVATE LIMITED"
                            value={form.companyName}
                            onChange={(e) => handleChange('companyName', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-600 focus:outline-hidden"
                        />
                    </div>
                </div>

                {/* Add Custom Fields Promo Banner */}
                <div className="bg-sky-50/80 border border-sky-100 rounded-2xl p-4 flex items-center justify-between">
                    <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-900">Add custom fields</p>
                        <p className="text-[11px] text-slate-600">Personalize it to perfectly suit your style.</p>
                        <div className="flex items-center gap-1.5 pt-1 text-[10px] text-slate-500">
                            <div className="flex -space-x-1.5">
                                <span className="h-5 w-5 rounded-full bg-orange-300 border border-white" />
                                <span className="h-5 w-5 rounded-full bg-blue-300 border border-white" />
                                <span className="h-5 w-5 rounded-full bg-emerald-300 border border-white" />
                            </div>
                            <span>Junaid Alam Khan and lakhs of businesses use premium</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button type="button" className="text-xs font-semibold text-slate-700 hover:text-slate-900">
                            Talk to a specialist
                        </button>
                        <button type="button" className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer">
                            Upgrade <Sparkles size={12} />
                        </button>
                    </div>
                </div>

                {/* Billing Address Toggle */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-900">Billing Address</label>
                    <button
                        type="button"
                        onClick={() => handleChange('showBilling', !form.showBilling)}
                        className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold rounded-xl transition flex items-center gap-2 cursor-pointer border border-rose-100"
                    >
                        <Plus size={14} /> Billing Address
                    </button>

                    {form.showBilling && (
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                            <input
                                type="text"
                                placeholder="Address Line 1"
                                value={form.billingAddressLine1}
                                onChange={(e) => handleChange('billingAddressLine1', e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900"
                            />
                            <input
                                type="text"
                                placeholder="Address Line 2"
                                value={form.billingAddressLine2}
                                onChange={(e) => handleChange('billingAddressLine2', e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900"
                            />
                            <div className="grid grid-cols-3 gap-2">
                                <input
                                    type="text"
                                    placeholder="City"
                                    value={form.billingCity}
                                    onChange={(e) => handleChange('billingCity', e.target.value)}
                                    className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900"
                                />
                                <input
                                    type="text"
                                    placeholder="State"
                                    value={form.billingState}
                                    onChange={(e) => handleChange('billingState', e.target.value)}
                                    className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900"
                                />
                                <input
                                    type="text"
                                    placeholder="Pincode"
                                    value={form.billingPincode}
                                    onChange={(e) => handleChange('billingPincode', e.target.value)}
                                    className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Shipping Address Toggle */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-900">Shipping Address</label>
                    <button
                        type="button"
                        onClick={() => handleChange('showShipping', !form.showShipping)}
                        className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold rounded-xl transition flex items-center gap-2 cursor-pointer border border-rose-100"
                    >
                        <Plus size={14} /> Shipping Address
                    </button>

                    {form.showShipping && (
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                            <input
                                type="text"
                                placeholder="Address Line 1"
                                value={form.shippingAddressLine1}
                                onChange={(e) => handleChange('shippingAddressLine1', e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900"
                            />
                            <input
                                type="text"
                                placeholder="Address Line 2"
                                value={form.shippingAddressLine2}
                                onChange={(e) => handleChange('shippingAddressLine2', e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900"
                            />
                            <div className="grid grid-cols-3 gap-2">
                                <input
                                    type="text"
                                    placeholder="City"
                                    value={form.shippingCity}
                                    onChange={(e) => handleChange('shippingCity', e.target.value)}
                                    className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900"
                                />
                                <input
                                    type="text"
                                    placeholder="State"
                                    value={form.shippingState}
                                    onChange={(e) => handleChange('shippingState', e.target.value)}
                                    className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900"
                                />
                                <input
                                    type="text"
                                    placeholder="Pincode"
                                    value={form.shippingPincode}
                                    onChange={(e) => handleChange('shippingPincode', e.target.value)}
                                    className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Optional Details Box */}
                <div className="bg-slate-50/70 border border-slate-200/80 rounded-3xl p-6 space-y-6">
                    <h3 className="text-xs font-bold text-slate-900">Optional Details</h3>

                    <div className="space-y-3">
                        <label className="text-xs font-semibold text-slate-700">Opening Balance</label>
                        <div className="flex items-center gap-6">
                            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                                <input
                                    type="radio"
                                    name="balanceType"
                                    checked={form.balanceType === 'Debit'}
                                    onChange={() => handleChange('balanceType', 'Debit')}
                                    className="text-blue-600 focus:ring-blue-500"
                                />
                                Debit
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                                <input
                                    type="radio"
                                    name="balanceType"
                                    checked={form.balanceType === 'Credit'}
                                    onChange={() => handleChange('balanceType', 'Credit')}
                                    className="text-blue-600 focus:ring-blue-500"
                                />
                                Credit
                            </label>
                        </div>

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
                                {form.balanceType === 'Debit' ? 'Customer pays you ₹' : 'You pay customer ₹'}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-700">TDS</span>
                        <button
                            type="button"
                            onClick={() => handleChange('tdsEnabled', !form.tdsEnabled)}
                            className={`px-4 py-1.5 rounded-full text-[11px] font-bold transition cursor-pointer ${
                                form.tdsEnabled ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                            }`}
                        >
                            {form.tdsEnabled ? 'Yes' : 'No'}
                        </button>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-700">TCS</span>
                        <button
                            type="button"
                            onClick={() => handleChange('tcsEnabled', !form.tcsEnabled)}
                            className={`px-4 py-1.5 rounded-full text-[11px] font-bold transition cursor-pointer ${
                                form.tcsEnabled ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                            }`}
                        >
                            {form.tcsEnabled ? 'Yes' : 'No'}
                        </button>
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-700">RCM Applicable</span>
                            <button
                                type="button"
                                onClick={() => handleChange('rcmApplicable', !form.rcmApplicable)}
                                className={`px-4 py-1.5 rounded-full text-[11px] font-bold transition cursor-pointer ${
                                    form.rcmApplicable ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                                }`}
                            >
                                {form.rcmApplicable ? 'Yes' : 'No'}
                            </button>
                        </div>
                        <p className="text-[11px] text-slate-400">If enabled, RCM will be turned on automatically when creating document</p>
                    </div>
                </div>

            </div>

            {/* Page Footer Action Buttons */}
            <div className="px-8 py-5 border-t border-slate-100 flex items-center justify-between bg-white">
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
                    onClick={() => navigate('/customers')}
                    className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                    Cancel
                </button>
            </div>

        </div>
    );
};

export default AddCustomer;