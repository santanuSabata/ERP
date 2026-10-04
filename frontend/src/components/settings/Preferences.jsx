import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/axios.js';

const Preferences = () => {
    const tabs = ['Document', 'Products & Inventory', 'Subscriptions', 'POS', 'Customise Links', 'Notifications', 'Email', 'AI'];
    const subFilters = ['All', 'Sales', 'Purchases', 'Ledger', 'Conversions'];
    
    const [activeTab, setActiveTab] = useState('Document');
    const [activeFilter, setActiveFilter] = useState('All');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        roundOff: true,
        extraDiscountType: 'Percent',
        showSuggestions: true,
        defaultDueDate: 'Same Day',
        discountType: 'Total Amount',
        sortTransactionsBy: 'Created Date',
        sendSmsToCustomer: false,
        mandatoryRemarksOnCancellation: false,
        addQuantityManuallyOnBarcode: false,
        documentPdfFilename: '{document_title}_{serial_number}',
        ledgerPdfFilename: '{ledger_type}_Ledger_{party_name}',
    });

    useEffect(() => {
        const fetchPreferences = async () => {
            try {
                const response = await api.get('/preferences');
                if (response.data) {
                    setForm(response.data);
                }
            } catch (err) {
                console.error('❌ Failed to load preferences:', err);
                toast.error('Failed to load preferences.');
            } finally {
                setLoading(false);
            }
        };
        fetchPreferences();
    }, []);

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleTagClick = (field, tag) => {
        setForm((prev) => ({
            ...prev,
            [field]: prev[field] ? `${prev[field]}_${tag}` : tag
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put('/preferences', form);
            toast.success('Preferences saved successfully!');
        } catch (err) {
            console.error('❌ Failed to save preferences:', err);
            toast.error('Failed to save preferences.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center text-xs text-slate-500 shadow-2xs">
                Loading preferences...
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-2xs max-w-6xl mx-auto">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight mb-6">
                Preferences
            </h1>

            {/* Main Category Tabs */}
            <div className="flex items-center gap-6 border-b border-slate-100 pb-3 mb-6 overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveTab(tab)}
                        className={`text-xs font-semibold pb-3 transition relative shrink-0 ${
                            activeTab === tab ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        {tab}
                        {activeTab === tab && (
                            <span className="absolute bottom-[-13px] left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                        )}
                    </button>
                ))}
            </div>

            {/* Sub Filter Chips */}
            {activeTab === 'Document' && (
                <div className="flex items-center gap-2 mb-8 bg-slate-50 p-1.5 rounded-2xl w-fit border border-slate-100">
                    {subFilters.map((filter) => (
                        <button
                            key={filter}
                            type="button"
                            onClick={() => setActiveFilter(filter)}
                            className={`px-4 py-1.5 text-xs font-semibold rounded-xl transition ${
                                activeFilter === filter 
                                    ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/60' 
                                    : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Document Defaults Section */}
                <div>
                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                        Document Defaults
                    </h2>

                    <div className="space-y-6 divide-y divide-slate-50">
                        {/* Round Off */}
                        <div className="flex items-center justify-between pt-4 first:pt-0">
                            <div>
                                <p className="text-xs font-bold text-slate-900">Round Off</p>
                                <p className="text-[11px] text-slate-500">Auto round off amounts for accurate calculations across documents.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleChange('roundOff', !form.roundOff)}
                                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${
                                    form.roundOff ? 'bg-blue-600' : 'bg-slate-300'
                                }`}
                            >
                                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                                    form.roundOff ? 'translate-x-5' : 'translate-x-0'
                                }`} />
                            </button>
                        </div>

                        {/* Extra Discount Type */}
                        <div className="flex items-center justify-between pt-4">
                            <div>
                                <p className="text-xs font-bold text-slate-900">Extra Discount Type</p>
                                <p className="text-[11px] text-slate-500">Choose the default type of extra discount applied when creating documents.</p>
                            </div>
                            <div className="relative w-64">
                                <select
                                    value={form.extraDiscountType}
                                    onChange={(e) => handleChange('extraDiscountType', e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 appearance-none focus:outline-hidden"
                                >
                                    <option value="Percent">Percent</option>
                                    <option value="Fixed">Fixed Amount</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Show Suggestions */}
                        <div className="flex items-center justify-between pt-4">
                            <div>
                                <p className="text-xs font-bold text-slate-900">Show Suggestions</p>
                                <p className="text-[11px] text-slate-500">Enable to see suggestions for document custom headers while creating documents.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleChange('showSuggestions', !form.showSuggestions)}
                                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${
                                    form.showSuggestions ? 'bg-blue-600' : 'bg-slate-300'
                                }`}
                            >
                                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                                    form.showSuggestions ? 'translate-x-5' : 'translate-x-0'
                                }`} />
                            </button>
                        </div>

                        {/* Default Due Date */}
                        <div className="flex items-center justify-between pt-4">
                            <div>
                                <p className="text-xs font-bold text-slate-900">Default Due Date</p>
                                <p className="text-[11px] text-slate-500">Set a default due date while creating documents.</p>
                            </div>
                            <div className="relative w-64">
                                <select
                                    value={form.defaultDueDate}
                                    onChange={(e) => handleChange('defaultDueDate', e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 appearance-none focus:outline-hidden"
                                >
                                    <option value="Same Day">Same Day</option>
                                    <option value="Net 15">Net 15</option>
                                    <option value="Net 30">Net 30</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </div>

                <hr className="border-slate-100" />

                {/* Discount Section */}
                <div>
                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                        Discount
                    </h2>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-900">Discount Type</p>
                            <p className="text-[11px] text-slate-500">Select how discounts apply: on unit price, price with tax, net amount, or total amount.</p>
                        </div>
                        <div className="relative w-64">
                            <select
                                value={form.discountType}
                                onChange={(e) => handleChange('discountType', e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 appearance-none focus:outline-hidden"
                            >
                                <option value="Total Amount">Total Amount</option>
                                <option value="Unit Price">Unit Price</option>
                                <option value="Net Amount">Net Amount</option>
                            </select>
                            <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                <hr className="border-slate-100" />

                {/* Configurations Section */}
                <div>
                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                        Configurations
                    </h2>
                    <div className="space-y-6 divide-y divide-slate-50">
                        {/* Sort Transactions */}
                        <div className="flex items-center justify-between pt-4 first:pt-0">
                            <div>
                                <p className="text-xs font-bold text-slate-900">Sort Transactions By</p>
                                <p className="text-[11px] text-slate-500">Transactions will be shown in the order selected here.</p>
                            </div>
                            <div className="relative w-64">
                                <select
                                    value={form.sortTransactionsBy}
                                    onChange={(e) => handleChange('sortTransactionsBy', e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 appearance-none focus:outline-hidden"
                                >
                                    <option value="Created Date">Created Date</option>
                                    <option value="Document Number">Document Number</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Send SMS */}
                        <div className="flex items-center justify-between pt-4">
                            <div>
                                <p className="text-xs font-bold text-slate-900">Send SMS To Customer</p>
                                <p className="text-[11px] text-slate-500">If enabled, send SMS option will be ON by default, while creating a payment.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleChange('sendSmsToCustomer', !form.sendSmsToCustomer)}
                                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${
                                    form.sendSmsToCustomer ? 'bg-blue-600' : 'bg-slate-300'
                                }`}
                            >
                                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                                    form.sendSmsToCustomer ? 'translate-x-5' : 'translate-x-0'
                                }`} />
                            </button>
                        </div>

                        {/* Mandatory Remarks */}
                        <div className="flex items-center justify-between pt-4">
                            <div>
                                <p className="text-xs font-bold text-slate-900">Mandatory Remarks on document cancellation</p>
                                <p className="text-[11px] text-slate-500">If enabled, remarks will be required when canceling documents like invoices, purchases, quotations, etc.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleChange('mandatoryRemarksOnCancellation', !form.mandatoryRemarksOnCancellation)}
                                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${
                                    form.mandatoryRemarksOnCancellation ? 'bg-blue-600' : 'bg-slate-300'
                                }`}
                            >
                                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                                    form.mandatoryRemarksOnCancellation ? 'translate-x-5' : 'translate-x-0'
                                }`} />
                            </button>
                        </div>

                        {/* Add Quantity Manually */}
                        <div className="flex items-center justify-between pt-4">
                            <div>
                                <p className="text-xs font-bold text-slate-900">Add Quantity Manually on Barcode Scan</p>
                                <p className="text-[11px] text-slate-500">By default, scanned items are set to quantity 1. Enable this to enter quantity manually while creating documents.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleChange('addQuantityManuallyOnBarcode', !form.addQuantityManuallyOnBarcode)}
                                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${
                                    form.addQuantityManuallyOnBarcode ? 'bg-blue-600' : 'bg-slate-300'
                                }`}
                            >
                                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                                    form.addQuantityManuallyOnBarcode ? 'translate-x-5' : 'translate-x-0'
                                }`} />
                            </button>
                        </div>
                    </div>
                </div>

                <hr className="border-slate-100" />

                {/* File Naming Convention Section */}
                <div>
                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                        File Naming Convention
                    </h2>

                    {/* Document PDF File Name */}
                    <div className="space-y-3 mb-6">
                        <p className="text-xs font-bold text-slate-900">Document PDF File Name</p>
                        <p className="text-[11px] text-slate-500">Customize the filenames for downloaded invoice and other document PDFs using dynamic placeholder tags.</p>
                        
                        <input
                            type="text"
                            value={form.documentPdfFilename}
                            onChange={(e) => handleChange('documentPdfFilename', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-900 focus:outline-hidden"
                        />

                        {/* Tag Pills */}
                        <div className="flex flex-wrap gap-2 pt-1">
                            {['{document_title}', '{serial_number}', '{party_name}', '{company_name}', '{document_date}', '{financial_year}', '{generated_date}'].map((tag) => (
                                <button
                                    key={tag}
                                    type="button"
                                    onClick={() => handleTagClick('documentPdfFilename', tag)}
                                    className="px-3 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 text-[11px] font-semibold rounded-lg border border-blue-100 transition"
                                >
                                    + {tag.replace(/[{}]/g, '').replace(/_/g, ' ')}
                                </button>
                            ))}
                        </div>

                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-emerald-600 font-mono">
                            Live Preview: <span className="font-semibold">Invoice_INV-0001_Raj_Traders.pdf</span>
                        </div>
                    </div>

                    {/* Ledger PDF File Name */}
                    <div className="space-y-3">
                        <p className="text-xs font-bold text-slate-900">Ledger PDF File Name</p>
                        <p className="text-[11px] text-slate-500">Customize the filenames for downloaded customer, vendor, and party ledger PDFs.</p>
                        
                        <input
                            type="text"
                            value={form.ledgerPdfFilename}
                            onChange={(e) => handleChange('ledgerPdfFilename', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-900 focus:outline-hidden"
                        />

                        {/* Tag Pills */}
                        <div className="flex flex-wrap gap-2 pt-1">
                            {['{ledger_type}', '{party_name}', '{from_date}', '{to_date}', '{generated_date}', '{company_name}', '{financial_year}'].map((tag) => (
                                <button
                                    key={tag}
                                    type="button"
                                    onClick={() => handleTagClick('ledgerPdfFilename', tag)}
                                    className="px-3 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 text-[11px] font-semibold rounded-lg border border-blue-100 transition"
                                >
                                    + {tag.replace(/[{}]/g, '').replace(/_/g, ' ')}
                                </button>
                            ))}
                        </div>

                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-emerald-600 font-mono">
                            Live Preview: <span className="font-semibold">Customer_Ledger_Raj_Traders.pdf</span>
                        </div>
                    </div>
                </div>

                {/* Save Changes Button */}
                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs px-6 py-3 rounded-xl transition shadow-md shadow-blue-500/20"
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Preferences;