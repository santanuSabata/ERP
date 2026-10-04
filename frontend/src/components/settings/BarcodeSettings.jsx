import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/axios.js';

const BarcodeSettings = () => {
    const [activeCompanyId, setActiveCompanyId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        packageDate: true,
        priceWithTax: true,
        mrpLabelEnabled: true,
        mrpLabelText: 'MRP',
        mrpFontSize: 16,
        productNameFontSize: 16,
        barcodeLength: 10,
    });

    useEffect(() => {
        const init = async () => {
            try {
                const companyRes = await api.get('/company');
                const compId = companyRes.data?.id || 1;
                setActiveCompanyId(compId);

                const response = await api.get(`/barcode-settings?companyId=${compId}`);
                if (response.data) {
                    setForm({
                        packageDate: response.data.packageDate ?? true,
                        priceWithTax: response.data.priceWithTax ?? true,
                        mrpLabelEnabled: response.data.mrpLabelEnabled ?? true,
                        mrpLabelText: response.data.mrpLabelText || 'MRP',
                        mrpFontSize: response.data.mrpFontSize || 16,
                        productNameFontSize: response.data.productNameFontSize || 16,
                        barcodeLength: response.data.barcodeLength || 10,
                    });
                }
            } catch (err) {
                console.error('❌ Failed to fetch barcode settings:', err);
                toast.error('Failed to load barcode settings.');
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const payload = {
                ...form,
                companyId: activeCompanyId || 1
            };
            await api.put('/barcode-settings', payload);
            toast.success('Barcode settings saved successfully!');
        } catch (err) {
            console.error('❌ Failed to save barcode settings:', err);
            toast.error('Failed to save barcode settings.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to reset barcode settings to default?')) return;

        try {
            await api.delete(`/barcode-settings?companyId=${activeCompanyId || 1}`);
            setForm({
                packageDate: true,
                priceWithTax: true,
                mrpLabelEnabled: true,
                mrpLabelText: 'MRP',
                mrpFontSize: 16,
                productNameFontSize: 16,
                barcodeLength: 10,
            });
            toast.success('Barcode settings reset successfully.');
        } catch (err) {
            console.error('❌ Failed to reset settings:', err);
            toast.error('Failed to reset settings.');
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center text-xs text-slate-500 shadow-2xs">
                Loading Barcode Settings...
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-2xs max-w-4xl mx-auto space-y-8">
            {/* Header & Reset Action */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                    Barcode Settings
                </h1>
                <button
                    type="button"
                    onClick={handleDelete}
                    className="px-3 py-1.5 border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-slate-600 hover:text-rose-600 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                    <Trash2 size={13} /> Reset Settings
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Display Options Section */}
                <div className="space-y-4">
                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Display Options
                    </h2>

                    <div className="space-y-6 divide-y divide-slate-50">
                        {/* Package Date Toggle */}
                        <div className="flex items-center justify-between pt-4 first:pt-0">
                            <div>
                                <p className="text-xs font-bold text-slate-900">Package Date</p>
                                <p className="text-[11px] text-slate-500">Enable this to show the package date on the barcode.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleChange('packageDate', !form.packageDate)}
                                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                                    form.packageDate ? 'bg-blue-600' : 'bg-slate-300'
                                }`}
                            >
                                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                                    form.packageDate ? 'translate-x-5' : 'translate-x-0'
                                }`} />
                            </button>
                        </div>

                        {/* Price with Tax Toggle */}
                        <div className="flex items-center justify-between pt-4">
                            <div>
                                <p className="text-xs font-bold text-slate-900">Price with Tax</p>
                                <p className="text-[11px] text-slate-500">Enable this to display the price with tax on the barcode.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleChange('priceWithTax', !form.priceWithTax)}
                                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                                    form.priceWithTax ? 'bg-blue-600' : 'bg-slate-300'
                                }`}
                            >
                                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                                    form.priceWithTax ? 'translate-x-5' : 'translate-x-0'
                                }`} />
                            </button>
                        </div>
                    </div>
                </div>

                <hr className="border-slate-100" />

                {/* Label & Barcode Customization Section */}
                <div className="space-y-6">
                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Label & Barcode Customization
                    </h2>

                    {/* MRP Label Toggle & Custom Text Input */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-slate-900">MRP Label</p>
                                <p className="text-[11px] text-slate-500">Turn this on to set a custom MRP label.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleChange('mrpLabelEnabled', !form.mrpLabelEnabled)}
                                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                                    form.mrpLabelEnabled ? 'bg-blue-600' : 'bg-slate-300'
                                }`}
                            >
                                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                                    form.mrpLabelEnabled ? 'translate-x-5' : 'translate-x-0'
                                }`} />
                            </button>
                        </div>

                        {form.mrpLabelEnabled && (
                            <input
                                type="text"
                                value={form.mrpLabelText}
                                onChange={(e) => handleChange('mrpLabelText', e.target.value)}
                                placeholder="MRP"
                                className="w-full bg-white border border-slate-200 focus:border-violet-500 rounded-xl px-4 py-3 text-xs text-slate-900 focus:outline-hidden transition"
                            />
                        )}
                    </div>

                    {/* MRP Font Size */}
                    <div className="flex items-center justify-between pt-2">
                        <div>
                            <p className="text-xs font-bold text-slate-900">MRP Font Size</p>
                            <p className="text-[11px] text-slate-500">Set the font size for the MRP.</p>
                        </div>
                        <input
                            type="number"
                            value={form.mrpFontSize}
                            onChange={(e) => handleChange('mrpFontSize', parseInt(e.target.value) || 0)}
                            className="w-24 bg-white border border-slate-200 focus:border-violet-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 text-center focus:outline-hidden transition"
                        />
                    </div>

                    {/* Product Name Font Size */}
                    <div className="flex items-center justify-between pt-2">
                        <div>
                            <p className="text-xs font-bold text-slate-900">Product Name Font Size</p>
                            <p className="text-[11px] text-slate-500">Set the font size for the product name.</p>
                        </div>
                        <input
                            type="number"
                            value={form.productNameFontSize}
                            onChange={(e) => handleChange('productNameFontSize', parseInt(e.target.value) || 0)}
                            className="w-24 bg-white border border-slate-200 focus:border-violet-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 text-center focus:outline-hidden transition"
                        />
                    </div>

                    {/* Barcode Length */}
                    <div className="flex items-center justify-between pt-2">
                        <div>
                            <p className="text-xs font-bold text-slate-900">Barcode Length</p>
                            <p className="text-[11px] text-slate-500">Set the length of the barcode text (between 4 and 10).</p>
                        </div>
                        <input
                            type="number"
                            min="4"
                            max="10"
                            value={form.barcodeLength}
                            onChange={(e) => handleChange('barcodeLength', parseInt(e.target.value) || 4)}
                            className="w-24 bg-white border border-slate-200 focus:border-violet-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 text-center focus:outline-hidden transition"
                        />
                    </div>
                </div>

                {/* Save Changes Button */}
                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs px-6 py-3 rounded-xl transition shadow-md shadow-blue-500/20 cursor-pointer"
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default BarcodeSettings;