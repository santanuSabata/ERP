import { useState, useEffect } from 'react';
import { X, Search, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/axios.js';

const AddEmployeeDashboardModal = ({ editId, onClose, activeCompanyId }) => {
    const [submitting, setSubmitting] = useState(false);
    
    // Searchable Catalogs
    const [employees, setEmployees] = useState([]);
    const [empSearch, setEmpSearch] = useState('');
    const [isEmpOpen, setIsEmpOpen] = useState(false);

    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);

    const [formData, setFormData] = useState({
        employeeId: '',
        employeeName: '',
        departmentId: '',
        designationId: '',
        transactionDate: new Date().toISOString().split('T')[0],
        activityType: 'Performance Review',
        status: 'Completed',
        performanceScore: '90.00',
        remarks: '',
        createdBy: 'System Admin'
    });

    const isEditMode = Boolean(editId);

    useEffect(() => {
        const fetchCatalogs = async () => {
            try {
                const targetCompId = activeCompanyId || 2;
                const [empRes, deptRes, desigRes] = await Promise.all([
                    api.get(`/employees?companyId=${targetCompId}&limit=100`),
                    api.get(`/departments?companyId=${targetCompId}&limit=100`),
                    api.get(`/designations?companyId=${targetCompId}&limit=100`)
                ]);
                if (empRes.data?.success) setEmployees(empRes.data.data || []);
                if (deptRes.data?.success) setDepartments(deptRes.data.data || []);
                if (desigRes.data?.success) setDesignations(desigRes.data.data || []);
            } catch (err) {
                console.error('Failed to load catalogs', err);
            }
        };
        fetchCatalogs();
    }, [activeCompanyId]);

    useEffect(() => {
        if (isEditMode) {
            api.get(`/employee-dashboard/${editId}`)
                .then(res => {
                    const found = res.data?.data;
                    if (found) {
                        setFormData({
                            employeeId: found.employee_id || '',
                            employeeName: found.employee_name || '',
                            departmentId: found.department_id || '',
                            designationId: found.designation_id || '',
                            transactionDate: found.transaction_date?.split('T')[0] || '',
                            activityType: found.activity_type || 'Performance Review',
                            status: found.status || 'Completed',
                            performanceScore: found.performance_score || '0.00',
                            remarks: found.remarks || '',
                            createdBy: found.created_by || 'System Admin'
                        });
                        setEmpSearch(found.employee_name || '');
                    }
                })
                .catch(err => {
                    console.error('Failed to load log details', err);
                    toast.error('Could not load log details.');
                });
        }
    }, [editId, isEditMode]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectEmployee = (emp) => {
        setFormData(prev => ({
            ...prev,
            employeeId: emp.id,
            employeeName: emp.name || `${emp.first_name} ${emp.last_name}`,
            departmentId: emp.department_id || '',
            designationId: emp.designation_id || ''
        }));
        setEmpSearch(emp.name || `${emp.first_name} ${emp.last_name}`);
        setIsEmpOpen(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.employeeId || !formData.activityType) {
            toast.error('Employee and Activity Type are required.');
            return;
        }

        try {
            setSubmitting(true);
            const payload = { ...formData, companyId: activeCompanyId || 2 };

            if (isEditMode) {
                await api.put(`/employee-dashboard/${editId}`, payload);
                toast.success('Log entry updated successfully!');
            } else {
                await api.post('/employee-dashboard', payload);
                toast.success('Log entry created successfully!');
            }
            onClose();
        } catch (err) {
            console.error('Failed to save log entry:', err);
            toast.error('Failed to save log entry.');
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
                        {isEditMode ? 'Edit Dashboard Log' : 'Add Activity Log'}
                    </h1>
                </div>
                <button 
                    type="button" onClick={handleSubmit} disabled={submitting}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition shadow-sm cursor-pointer"
                >
                    {submitting ? 'Saving...' : isEditMode ? 'Update Log' : 'Save Log'}
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
                                type="text" placeholder="Search employee by name..." value={empSearch}
                                onChange={(e) => { setEmpSearch(e.target.value); setIsEmpOpen(true); }}
                                onFocus={() => setIsEmpOpen(true)}
                                className="w-full pl-9 pr-8 py-3 rounded-xl border border-slate-200 text-xs font-semibold"
                            />
                            {isEmpOpen && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto z-50 divide-y divide-slate-50">
                                    {filteredEmployees.map(emp => (
                                        <div key={emp.id} onClick={() => handleSelectEmployee(emp)} className="p-3 hover:bg-blue-50 text-xs cursor-pointer flex justify-between">
                                            <span className="font-bold">{emp.name || `${emp.first_name} ${emp.last_name}`}</span>
                                            <span className="text-[10px] font-mono text-blue-600">{emp.employee_id}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700">Transaction Date</label>
                            <input type="date" name="transactionDate" value={formData.transactionDate} onChange={handleChange} className="w-full p-3 rounded-xl border border-slate-200 text-xs font-mono" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700">Activity Type</label>
                            <select name="activityType" value={formData.activityType} onChange={handleChange} className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-white font-semibold">
                                <option value="Performance Review">Performance Review</option>
                                <option value="Training Assigned">Training Assigned</option>
                                <option value="Code Quality Audit">Code Quality Audit</option>
                                <option value="Security Assessment">Security Assessment</option>
                                <option value="Budget Audit">Budget Audit</option>
                                <option value="Client Pitch">Client Pitch</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700">Status</label>
                            <select name="status" value={formData.status} onChange={handleChange} className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-white font-semibold">
                                <option value="Completed">Completed</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Pending">Pending</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700">Performance Score (%)</label>
                            <input type="number" step="0.01" name="performanceScore" value={formData.performanceScore} onChange={handleChange} className="w-full p-3 rounded-xl border border-slate-200 text-xs font-mono" placeholder="92.50" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700">Created By</label>
                            <input type="text" name="createdBy" value={formData.createdBy} onChange={handleChange} className="w-full p-3 rounded-xl border border-slate-200 text-xs" />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700">Remarks</label>
                        <textarea rows={3} name="remarks" value={formData.remarks} onChange={handleChange} className="w-full p-4 text-xs border border-slate-200 rounded-2xl" placeholder="Add remarks or notes..." />
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button type="submit" disabled={submitting} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-2xl shadow-md transition cursor-pointer">
                        {submitting ? 'Saving...' : isEditMode ? 'Update Log' : 'Save Log'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddEmployeeDashboardModal;