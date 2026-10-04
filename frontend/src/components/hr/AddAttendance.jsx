import { useState, useEffect } from 'react';
import { X, Search, ChevronDown, Calendar, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/axios.js';

const AddAttendanceModal = ({ editId, onClose, activeCompanyId }) => {
    const [submitting, setSubmitting] = useState(false);
    
    // Searchable Employee Dropdown States
    const [employees, setEmployees] = useState([]);
    const [empSearch, setEmpSearch] = useState('');
    const [isEmpOpen, setIsEmpOpen] = useState(false);

    const [formData, setFormData] = useState({
        employeeId: '',
        departmentId: '',
        designationId: '',
        firstName: '',
        lastName: '',
        email: '',
        mobile: '',
        attendanceDate: new Date().toISOString().split('T')[0],
        checkInTime: '09:00',
        checkOutTime: '18:00',
        attendanceStatus: 'Present',
        remarks: '',
        createdBy: 'System Admin'
    });

    const isEditMode = Boolean(editId);

    const STATUS_OPTIONS = [
        { value: 'Present', label: 'Present' },
        { value: 'Absent', label: 'Absent' },
        { value: 'Late', label: 'Late' },
        { value: 'Half-Day', label: 'Half-Day' },
        { value: 'On Leave', label: 'On Leave' },
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
            api.get(`/employee-attendance/${editId}`)
                .then(res => {
                    const found = res.data?.data;
                    if (found) {
                        setFormData({
                            employeeId: found.employee_id || '',
                            departmentId: found.department_id || '',
                            designationId: found.designation_id || '',
                            firstName: found.first_name || '',
                            lastName: found.last_name || '',
                            email: found.email || '',
                            mobile: found.mobile || '',
                            attendanceDate: found.attendance_date?.split('T')[0] || '',
                            checkInTime: found.check_in_time || '09:00',
                            checkOutTime: found.check_out_time || '18:00',
                            attendanceStatus: found.attendance_status || 'Present',
                            remarks: found.remarks || '',
                            createdBy: found.created_by || 'System Admin'
                        });
                        setEmpSearch(found.employee_name || `${found.first_name || ''} ${found.last_name || ''}`);
                    }
                })
                .catch(err => {
                    console.error('Failed to load attendance record', err);
                    toast.error('Could not load attendance details.');
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
            departmentId: emp.department_id || '',
            designationId: emp.designation_id || '',
            firstName: emp.first_name || '',
            lastName: emp.last_name || '',
            email: emp.email_address || emp.email || '',
            mobile: emp.mobile_number || emp.mobile || ''
        }));
        setEmpSearch(emp.name || `${emp.first_name} ${emp.last_name}`);
        setIsEmpOpen(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.employeeId || !formData.attendanceDate) {
            toast.error('Employee and Attendance Date are required.');
            return;
        }

        try {
            setSubmitting(true);
            const payload = { ...formData, companyId: activeCompanyId || 2 };

            if (isEditMode) {
                await api.put(`/employee-attendance/${editId}`, payload);
                toast.success('Attendance updated successfully!');
            } else {
                await api.post('/employee-attendance', payload);
                toast.success('Attendance recorded successfully!');
            }
            onClose();
        } catch (err) {
            console.error('Failed to save attendance:', err);
            toast.error(err.response?.data?.error || 'Failed to save attendance.');
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
                        {isEditMode ? 'Edit Attendance Record' : 'Record Employee Attendance'}
                    </h1>
                </div>
                <button 
                    type="button" onClick={handleSubmit} disabled={submitting}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition shadow-sm cursor-pointer"
                >
                    {submitting ? 'Saving...' : isEditMode ? 'Update Record' : 'Save Record'}
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
                            <ChevronDown size={14} className="absolute right-3.5 top-3.5 text-slate-400 pointer-events-none" />

                            {isEmpOpen && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto z-50 divide-y divide-slate-50">
                                    {filteredEmployees.map(emp => (
                                        <div key={emp.id} onClick={() => handleSelectEmployee(emp)} className="p-3 hover:bg-blue-50 text-xs cursor-pointer flex justify-between">
                                            <div>
                                                <span className="font-bold">{emp.name || `${emp.first_name} ${emp.last_name}`}</span>
                                                <span className="block text-[11px] text-slate-400">{emp.email_address || emp.email} • {emp.mobile_number || emp.mobile}</span>
                                            </div>
                                            <span className="text-[10px] font-mono text-blue-600">{emp.employee_id}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Auto-filled Employee Details Preview */}
                    {formData.employeeId && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
                            <div><span className="text-slate-400 block">First Name:</span> <strong className="text-slate-800">{formData.firstName}</strong></div>
                            <div><span className="text-slate-400 block">Email:</span> <strong className="text-slate-800">{formData.email}</strong></div>
                            <div><span className="text-slate-400 block">Mobile:</span> <strong className="text-slate-800 font-mono">{formData.mobile}</strong></div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700">Attendance Date <span className="text-rose-500">*</span></label>
                            <input type="date" required name="attendanceDate" value={formData.attendanceDate} onChange={handleChange} className="w-full p-3 rounded-xl border border-slate-200 text-xs font-mono" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700">Check-In Time</label>
                            <input type="time" name="checkInTime" value={formData.checkInTime} onChange={handleChange} className="w-full p-3 rounded-xl border border-slate-200 text-xs font-mono" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700">Check-Out Time</label>
                            <input type="time" name="checkOutTime" value={formData.checkOutTime} onChange={handleChange} className="w-full p-3 rounded-xl border border-slate-200 text-xs font-mono" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700">Attendance Status</label>
                            <select 
                                name="attendanceStatus"
                                value={formData.attendanceStatus} 
                                onChange={handleChange} 
                                className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-white font-semibold cursor-pointer"
                            >
                                {STATUS_OPTIONS.map((status) => (
                                    <option key={status.value} value={status.value}>
                                        {status.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700">Recorded By</label>
                            <input type="text" name="createdBy" value={formData.createdBy} onChange={handleChange} className="w-full p-3 rounded-xl border border-slate-200 text-xs" />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700">Remarks</label>
                        <textarea rows={3} name="remarks" value={formData.remarks} onChange={handleChange} className="w-full p-4 text-xs border border-slate-200 rounded-2xl" placeholder="Add attendance notes or reasons for late/absence..." />
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button type="submit" disabled={submitting} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-2xl shadow-md transition cursor-pointer">
                        {submitting ? 'Saving...' : isEditMode ? 'Update Record' : 'Save Record'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddAttendanceModal;