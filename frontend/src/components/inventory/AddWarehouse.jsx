import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/axios.js';

const AddWarehouse = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = Boolean(id);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        isPrimary: false
    });

    useEffect(() => {
        if (isEditMode) {
            api.get(`/warehouses/${id}`)
                .then(res => {
                    const found = res.data?.data;
                    if (found) {
                        setFormData({
                            name: found.name || '',
                            code: found.code || '',
                            phone: found.phone || '',
                            email: found.email || '',
                            address: found.address || '',
                            city: found.city || '',
                            state: found.state || '',
                            pincode: found.pincode || '',
                            isPrimary: found.isPrimary || false
                        });
                    }
                })
                .catch(err => {
                    console.error('Failed to load warehouse for edit', err);
                    toast.error('Could not load warehouse details.');
                });
        }
    }, [id, isEditMode]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            toast.error('Warehouse name is required.');
            return;
        }

        try {
            setSubmitting(true);
            if (isEditMode) {
                await api.put(`/warehouses/${id}`, formData);
                toast.success('Warehouse updated successfully!');
            } else {
                await api.post('/warehouses', formData);
                toast.success('Warehouse created successfully!');
            }
            navigate('/warehouses');
        } catch (err) {
            console.error('Failed to save warehouse:', err);
            toast.error('Failed to save warehouse.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 max-w-3xl mx-auto pb-16 font-sans text-slate-900">
            <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-100 shadow-2xs">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => navigate('/warehouses')}
                        className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
                            {isEditMode ? 'Edit Warehouse' : 'Add New Warehouse'}
                        </h1>
                        <p className="text-xs text-slate-400">Configure storage location details and contact info.</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-2xs space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700">Warehouse Name *</label>
                        <input 
                            type="text" required name="name"
                            placeholder="e.g., Central Hub Gurgaon"
                            value={formData.name} onChange={handleChange}
                            className="w-full p-3 rounded-2xl border border-slate-200 text-xs focus:outline-hidden"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700">Warehouse Code</label>
                        <input 
                            type="text" name="code"
                            placeholder="e.g., WH-GUR-01"
                            value={formData.code} onChange={handleChange}
                            className="w-full p-3 rounded-2xl border border-slate-200 text-xs focus:outline-hidden font-mono uppercase"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700">Phone Number</label>
                        <input 
                            type="text" name="phone"
                            placeholder="e.g., +91 9876543210"
                            value={formData.phone} onChange={handleChange}
                            className="w-full p-3 rounded-2xl border border-slate-200 text-xs focus:outline-hidden"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700">Email Address</label>
                        <input 
                            type="email" name="email"
                            placeholder="e.g., gurgaon.wh@company.com"
                            value={formData.email} onChange={handleChange}
                            className="w-full p-3 rounded-2xl border border-slate-200 text-xs focus:outline-hidden"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">Street Address</label>
                    <textarea 
                        rows={2} name="address"
                        placeholder="Plot 45, Industrial Area..."
                        value={formData.address} onChange={handleChange}
                        className="w-full p-3 rounded-2xl border border-slate-200 text-xs focus:outline-hidden"
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700">City</label>
                        <input 
                            type="text" name="city"
                            placeholder="e.g., Gurgaon"
                            value={formData.city} onChange={handleChange}
                            className="w-full p-3 rounded-2xl border border-slate-200 text-xs focus:outline-hidden"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700">State</label>
                        <input 
                            type="text" name="state"
                            placeholder="e.g., Haryana"
                            value={formData.state} onChange={handleChange}
                            className="w-full p-3 rounded-2xl border border-slate-200 text-xs focus:outline-hidden"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700">Pincode</label>
                        <input 
                            type="text" name="pincode"
                            placeholder="e.g., 122001"
                            value={formData.pincode} onChange={handleChange}
                            className="w-full p-3 rounded-2xl border border-slate-200 text-xs focus:outline-hidden font-mono"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                    <input 
                        type="checkbox" id="isPrimary" name="isPrimary"
                        checked={formData.isPrimary} onChange={handleChange}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <label htmlFor="isPrimary" className="text-xs font-bold text-slate-700 cursor-pointer">Set as Primary Warehouse</label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
                    <button 
                        type="button" 
                        onClick={() => navigate('/warehouses')}
                        className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        disabled={submitting}
                        className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                        <Save size={14} /> {submitting ? 'Saving...' : isEditMode ? 'Update Warehouse' : 'Save Warehouse'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddWarehouse;