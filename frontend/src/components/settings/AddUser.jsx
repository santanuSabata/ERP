import { useState, useEffect } from 'react';
import { X, Search, ChevronDown, Lock, KeyRound, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/axios.js';

const AddUserModal = ({ editId, onClose, activeCompanyId }) => {
    const [submitting, setSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    
    // Searchable Employee Dropdown States
    const [employees, setEmployees] = useState([]);
    const [empSearch, setEmpSearch] = useState('');
    const [isEmpOpen, setIsEmpOpen] = useState(false);

    const [formData, setFormData] = useState({
        employeeId: '',
        departmentId: '',
        designationId: '',
        username: '',
        fullName: '',
        email: '',
        mobile: '',
        password: '',
        pin: '',
        role: 'Staff',
        status: 'Active',
        createdBy: 'System Admin'
    });

    const isEditMode = Boolean(editId);

    const ROLE_OPTIONS = [
        { value: 'Admin', label: 'Admin' },
        { value: 'HR Manager', label: 'HR Manager' },
        { value: 'Teacher', label: 'Teacher' },
        { value: 'Staff', label: 'Staff' },
        { value: 'Accountant', label: 'Accountant' },
        { value: 'Agent', label: 'Agents' },
    ];

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const targetCompId = activeCompanyId || 2;
                const res = await api.get(`/employees?companyId=${targetCompId}&limit=100`);
                if (res.data?.success) {
                    setEmployees(res.data.data || []);
                }
            } catch (err) {
                console.error('Failed to load employees', err);
            }
        };
        fetchEmployees();
    }, [activeCompanyId]);

    useEffect(() => {
        if (isEditMode) {
            api.get(`/users/${editId}`)
                .then(res => {
                    const found = res.data?.data;
                    if (found) {
                        setFormData({
                            employeeId: found.employee_id || '',
                            departmentId: found.department_id || '',
                            designationId: found.designation_id || '',
                            username: found.username || '',
                            fullName: found.full_name || found.name || '',
                            email: found.email || '',
                            mobile: found.mobile || '',
                            password: '', // leave blank for security on edit
                            pin: found.secure_pin || found.pin || '',
                            role: found.role || 'Staff',
                            status: found.status || 'Active',
                            createdBy: found.created_by || 'System Admin'
                        });
                        setEmpSearch(found.full_name || found.name || '');
                    }
                })
                .catch(err => {
                    console.error('Failed to load user details', err);
                    toast.error('Could not load user details.');
                });
        }
    }, [editId, isEditMode]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectEmployee = (emp) => {
        const fullNameVal = emp.name || `${emp.first_name} ${emp.last_name}`;
        const emailVal = emp.email_address || emp.email || '';
        const mobileVal = emp.mobile_number || emp.mobile || '';
        const usernameVal = emailVal ? emailVal.split('@')[0] : fullNameVal.toLowerCase().replace(/\s+/g, '_');

        setFormData(prev => ({
            ...prev,
            employeeId: emp.id,
            departmentId: emp.department_id || '',
            designationId: emp.designation_id || '',
            fullName: fullNameVal,
            email: emailVal,
            mobile: mobileVal,
            username: usernameVal
        }));
        setEmpSearch(fullNameVal);
        setIsEmpOpen(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.employeeId || !formData.username || !formData.email) {
            toast.error('Employee, Username, and Email are required.');
            return;
        }

        try {
            setSubmitting(true);
            const payload = { ...formData, companyId: activeCompanyId || 2 };

            if (isEditMode) {
                await api.put(`/users/${editId}`, payload);
                toast.success('User updated successfully!');
            } else {
                // Fixed endpoint to target /users instead of /users-management
                await api.post('/users', payload);
                toast.success('User created successfully!');
            }
            onClose();
        } catch (err) {
            console.error('Failed to save user:', err);
            toast.error(err.response?.data?.error || 'Failed to save user.');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredEmployees = employees.filter(e => (e.name || `${e.first_name} ${e.last_name}`).toLowerCase().includes(empSearch.toLowerCase()));

    return (
        <div className="space-y-6 w-full px-4 sm:px-6 lg:px-8 pb-20 font-sans text-slate-900">
            <div className="flex items-center justify-between bg-white px-6 py-4 rounded-2xl border border-slate-200/80 shadow-2xs sticky top-0 z-30">
                <div className="flex items-center gap-3">
                    <button type="button" onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl transition cursor-pointer">
                        <X size={20} />
                    </button>
                    <h1 className="text-base font-bold text-slate-900 tracking-tight">
                        {isEditMode ? 'Edit User Account' : 'Add New User'}
                    </h1>
                </div>
                <button 
                    type="button" onClick={handleSubmit} disabled={submitting}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition shadow-sm cursor-pointer"
                >
                    {submitting ? 'Saving...' : isEditMode ? 'Update User' : 'Save User'}
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-6">
                    
                    {/* Searchable Employee Dropdown */}
                    <div className="space-y-1.5 relative">
                        <label className="block text-xs font-bold text-slate-700">Select Employee <span className="text-rose-500">*</span></label>
                        <div className="relative">
                            <Search size={14} className="absolute left-3.5 top-3.5 text-slate-400" />
                            <input 
                                type="text" placeholder="Search employee to link user account..." value={empSearch}
                                onChange={(e) => { setEmpSearch(e.target.value); setIsEmpOpen(true); }}
                                onFocus={() => setIsEmpOpen(true)}
                                className="w-full pl-9 pr-8 py-3 rounded-xl border border-slate-200 text-xs font-semibold"
                            />
                            <ChevronDown size={14} className="absolute right-3.5 top-3.5 text-slate-400 pointer-events-none" />

                            {isEmpOpen && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto z-50 divide-y divide-slate-50">
                                    {filteredEmployees.map(emp => (
                                        <div key={emp.id} onClick={() => handleSelectEmployee(emp)} className="p-3 hover:bg-blue-50 text-xs cursor-pointer flex justify-between">
                                            <div>
                                                <span className="font-bold">{emp.name || `${emp.first_name} ${emp.last_name}`}</span>
                                                <span className="block text-[11px] text-slate-400">{emp.email_address || emp.email}</span>
                                            </div>
                                            <span className="text-[10px] font-mono text-blue-600">{emp.employee_id}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700">Full Name <span className="text-rose-500">*</span></label>
                            <input type="text" required name="fullName" value={formData.fullName} onChange={handleChange} className="w-full p-3 rounded-xl border border-slate-200 text-xs" placeholder="Aarav Sharma" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700">Username <span className="text-rose-500">*</span></label>
                            <input type="text" required name="username" value={formData.username} onChange={handleChange} className="w-full p-3 rounded-xl border border-slate-200 text-xs font-mono" placeholder="aarav.sharma" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700">Email Address <span className="text-rose-500">*</span></label>
                            <input type="email" required name="email" value={formData.email} onChange={handleChange} className="w-full p-3 rounded-xl border border-slate-200 text-xs" placeholder="aarav.sharma@school.edu" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700">Mobile Number <span className="text-rose-500">*</span></label>
                            <input type="text" required name="mobile" value={formData.mobile} onChange={handleChange} className="w-full p-3 rounded-xl border border-slate-200 text-xs font-mono" placeholder="9876543210" />
                        </div>
                    </div>

                    {/* Password & PIN Fields with View Password Toggle */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-slate-100">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                <Lock size={13} className="text-blue-600" /> {isEditMode ? 'New Password (Leave blank to keep current)' : 'Password'}
                            </label>
                            <div className="relative flex items-center">
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    name="password" 
                                    value={formData.password} 
                                    onChange={handleChange} 
                                    className="w-full p-3 pr-10 rounded-xl border border-slate-200 text-xs font-mono" 
                                    placeholder="••••••••" 
                                />
                                <button 
                                    type="button" 
                                    onClick={() => setShowPassword(prev => !prev)} 
                                    className="absolute right-3 text-slate-400 hover:text-slate-700 cursor-pointer"
                                    title={showPassword ? "Hide password" : "View password"}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                <KeyRound size={13} className="text-violet-600" /> Secure PIN (4-6 digits)
                            </label>
                            <input type="text" maxLength={6} name="pin" value={formData.pin} onChange={handleChange} className="w-full p-3 rounded-xl border border-slate-200 text-xs font-mono" placeholder="1234" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700">User Role</label>
                            <select 
                                name="role"
                                value={formData.role} 
                                onChange={handleChange} 
                                className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-white font-semibold cursor-pointer"
                            >
                                {ROLE_OPTIONS.map((role) => (
                                    <option key={role.value} value={role.value}>
                                        {role.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700">Status</label>
                            <select name="status" value={formData.status} onChange={handleChange} className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-white font-semibold cursor-pointer">
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                                <option value="Suspended">Suspended</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700">Created By</label>
                            <input type="text" name="createdBy" value={formData.createdBy} onChange={handleChange} className="w-full p-3 rounded-xl border border-slate-200 text-xs" />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button type="submit" disabled={submitting} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-2xl shadow-md transition cursor-pointer">
                        {submitting ? 'Saving...' : isEditMode ? 'Update User' : 'Save User'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddUserModal;