import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/axios.js';

const AddDepartment = ({ editId, onClose, activeCompanyId }) => {
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        headOfDepartment: '',
        status: 'Active',
        totalEmployees: 0
    });

    const isEditMode = Boolean(editId);

    useEffect(() => {
        if (isEditMode) {
            api.get(`/departments/${editId}`)
                .then(res => {
                    const found = res.data?.data;
                    if (found) {
                        setFormData({
                            name: found.name || '',
                            code: found.code || '',
                            description: found.description || '',
                            headOfDepartment: found.head_of_department || '',
                            status: found.status || 'Active',
                            totalEmployees: found.total_employees || 0
                        });
                    }
                })
                .catch(err => {
                    console.error('Failed to load department for edit:', err);
                    toast.error('Could not load department details.');
                });
        }
    }, [editId, isEditMode]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.code.trim()) {
            toast.error('Department Name and Code are required.');
            return;
        }

        try {
            setSubmitting(true);
            const payload = { ...formData, companyId: activeCompanyId || 2 };

            if (isEditMode) {
                await api.put(`/departments/${editId}`, payload);
                toast.success('Department updated successfully!');
            } else {
                await api.post('/departments', payload);
                toast.success('Department created successfully!');
            }
            onClose();
        } catch (err) {
            console.error('Failed to save department:', err);
            toast.error('Failed to save department.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 w-full px-4 sm:px-6 lg:px-8 pb-20 font-sans text-slate-900">
            {/* Top Header Bar */}
            <div className="flex items-center justify-between bg-white px-6 py-4 rounded-2xl border border-slate-200/80 shadow-2xs sticky top-0 z-30">
                <div className="flex items-center gap-3">
                    <button 
                        type="button"
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl transition cursor-pointer"
                    >
                        <X size={20} />
                    </button>
                    <h1 className="text-base font-bold text-slate-900 tracking-tight">
                        {isEditMode ? 'Edit Department' : 'Add Department'}
                    </h1>
                </div>
                <button 
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition shadow-sm shadow-blue-500/20 cursor-pointer"
                >
                    {submitting ? 'Saving...' : isEditMode ? 'Update Department' : 'Save Department'}
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-6">
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700">
                            <span className="text-rose-500">*</span>Department Name
                        </label>
                        <input 
                            type="text" required name="name"
                            placeholder="e.g. Software Engineering"
                            value={formData.name} onChange={handleChange}
                            className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700">
                                <span className="text-rose-500">*</span>Department Code
                            </label>
                            <input 
                                type="text" required name="code"
                                placeholder="e.g. ENG-002"
                                value={formData.code} onChange={handleChange}
                                className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-900 font-mono focus:outline-hidden focus:border-blue-500"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700">Head of Department</label>
                            <input 
                                type="text" name="headOfDepartment"
                                placeholder="Manager / Head Name"
                                value={formData.headOfDepartment} onChange={handleChange}
                                className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700">Total Employees</label>
                            <input 
                                type="number" name="totalEmployees"
                                value={formData.totalEmployees} onChange={handleChange}
                                className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-900 font-mono focus:outline-hidden focus:border-blue-500"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700">Status</label>
                            <select 
                                name="status" value={formData.status} onChange={handleChange}
                                className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-white focus:outline-hidden cursor-pointer font-semibold"
                            >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700">Description</label>
                        <textarea 
                            rows={3} name="description"
                            placeholder="Enter department scope and responsibilities..."
                            value={formData.description} onChange={handleChange}
                            className="w-full p-4 text-xs border border-slate-200 rounded-2xl focus:outline-hidden"
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button 
                        type="submit" 
                        disabled={submitting}
                        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-2xl shadow-md transition cursor-pointer"
                    >
                        {submitting ? 'Saving...' : isEditMode ? 'Update Department' : 'Save Department'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddDepartment;