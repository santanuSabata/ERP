import { useState, useEffect } from 'react';
import { X, Search, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/axios.js';

const AddDesignation = ({ editId, onClose, activeCompanyId }) => {
    const [submitting, setSubmitting] = useState(false);
    const [departmentsList, setDepartmentsList] = useState([]);
    const [deptSearch, setDeptSearch] = useState('');
    const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        departmentId: '',
        departmentName: '',
        description: '',
        status: 'Active'
    });

    const isEditMode = Boolean(editId);

    // Fetch departments for searchable dropdown
    useEffect(() => {
        const fetchDepts = async () => {
            try {
                const targetCompId = activeCompanyId || 2;
                const res = await api.get(`/departments?companyId=${targetCompId}&limit=100`);
                if (res.data?.success) {
                    setDepartmentsList(res.data.data || []);
                }
            } catch (err) {
                console.error('❌ Failed to load departments:', err);
            }
        };
        fetchDepts();
    }, [activeCompanyId]);

    useEffect(() => {
        if (isEditMode) {
            api.get(`/designations/${editId}`)
                .then(res => {
                    const found = res.data?.data;
                    if (found) {
                        setFormData({
                            name: found.name || '',
                            code: found.code || '',
                            departmentId: found.department_id || '',
                            departmentName: found.department_name || '',
                            description: found.description || '',
                            status: found.status || 'Active'
                        });
                        setDeptSearch(found.department_name || '');
                    }
                })
                .catch(err => {
                    console.error('Failed to load designation for edit:', err);
                    toast.error('Could not load designation details.');
                });
        }
    }, [editId, isEditMode]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectDepartment = (dept) => {
        setFormData(prev => ({
            ...prev,
            departmentId: dept.id,
            departmentName: dept.name
        }));
        setDeptSearch(dept.name);
        setIsDeptDropdownOpen(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.code.trim() || !formData.departmentId) {
            toast.error('Designation Name, Code, and Department are required.');
            return;
        }

        try {
            setSubmitting(true);
            const payload = { ...formData, companyId: activeCompanyId || 2 };

            if (isEditMode) {
                await api.put(`/designations/${editId}`, payload);
                toast.success('Designation updated successfully!');
            } else {
                await api.post('/designations', payload);
                toast.success('Designation created successfully!');
            }
            onClose();
        } catch (err) {
            console.error('Failed to save designation:', err);
            toast.error('Failed to save designation.');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredDepts = departmentsList.filter(d => d.name.toLowerCase().includes(deptSearch.toLowerCase()));

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
                        {isEditMode ? 'Edit Designation' : 'Add Designation'}
                    </h1>
                </div>
                <button 
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition shadow-sm shadow-blue-500/20 cursor-pointer"
                >
                    {submitting ? 'Saving...' : isEditMode ? 'Update Designation' : 'Save Designation'}
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-6">
                    {/* Searchable Department Dropdown */}
                    <div className="space-y-1.5 relative">
                        <label className="block text-xs font-bold text-slate-700">
                            <span className="text-rose-500">*</span>Department
                        </label>
                        <div className="relative">
                            <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
                            <input 
                                type="text"
                                placeholder="Search & select department..."
                                value={deptSearch}
                                onChange={(e) => {
                                    setDeptSearch(e.target.value);
                                    setIsDeptDropdownOpen(true);
                                }}
                                onFocus={() => setIsDeptDropdownOpen(true)}
                                className="w-full pl-9 pr-8 py-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-blue-500"
                            />
                            <ChevronDown size={14} className="absolute right-3.5 top-3.5 text-slate-400 pointer-events-none" />

                            {isDeptDropdownOpen && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-48 overflow-y-auto z-50 divide-y divide-slate-50">
                                    {filteredDepts.length === 0 ? (
                                        <div className="p-3 text-xs text-slate-400 text-center">No departments found</div>
                                    ) : (
                                        filteredDepts.map(dept => (
                                            <div 
                                                key={dept.id} 
                                                onClick={() => handleSelectDepartment(dept)} 
                                                className="p-3 hover:bg-blue-50 cursor-pointer text-xs flex justify-between items-center"
                                            >
                                                <span className="font-bold text-slate-800">{dept.name}</span>
                                                <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{dept.code}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700">
                            <span className="text-rose-500">*</span>Designation Name
                        </label>
                        <input 
                            type="text" required name="name"
                            placeholder="e.g. Senior Software Engineer"
                            value={formData.name} onChange={handleChange}
                            className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700">
                                <span className="text-rose-500">*</span>Designation Code
                            </label>
                            <input 
                                type="text" required name="code"
                                placeholder="e.g. DES-ENG-01"
                                value={formData.code} onChange={handleChange}
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
                            placeholder="Enter designation role profile and responsibilities..."
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
                        {submitting ? 'Saving...' : isEditMode ? 'Update Designation' : 'Save Designation'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddDesignation;