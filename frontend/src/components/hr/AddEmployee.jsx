import { useState, useEffect } from 'react';
import { X, Search, ChevronDown, Trash2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/axios.js';

const AddEmployee = ({ editId, onClose, activeCompanyId }) => {
    const [submitting, setSubmitting] = useState(false);
    
    // Catalogs & Searchable Dropdowns
    const [departments, setDepartments] = useState([]);
    const [deptSearch, setDeptSearch] = useState('');
    const [isDeptOpen, setIsDeptOpen] = useState(false);

    const [designations, setDesignations] = useState([]);
    const [desigSearch, setDesigSearch] = useState('');
    const [isDesigOpen, setIsDesigOpen] = useState(false);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        employeeId: 'EMP-' + Math.floor(10000 + Math.random() * 90000),
        dateOfJoining: new Date().toISOString().split('T')[0],
        departmentId: '',
        departmentName: '',
        designationId: '',
        designationName: '',
        employmentType: 'Full-Time',
        reportingManager: '',
        gender: 'Male',
        maritalStatus: 'Single',
        bloodGroup: 'B+',
        employeeStatus: 'Active',
        
        emailAddress: '',
        mobileNumber: '',
        alternateNumber: '',
        country: 'India',
        additionalInfo: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        pinCode: '',

        basicSalary: '',
        hra: '',
        conveyance: 1600,
        medical: 1250,
        specialAllowance: '',
        pf: '',
        profTax: 200,
        tds: '',
        otherDeductions: '',
    });

    const [qualifications, setQualifications] = useState([]);

    const isEditMode = Boolean(editId);

    useEffect(() => {
        const fetchCatalogs = async () => {
            try {
                const targetCompId = activeCompanyId || 2;
                const [deptRes, desigRes] = await Promise.all([
                    api.get(`/departments?companyId=${targetCompId}&limit=100`),
                    api.get(`/designations?companyId=${targetCompId}&limit=100`)
                ]);
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
            api.get(`/employees/${editId}`)
                .then(res => {
                    const found = res.data?.data;
                    if (found) {
                        setFormData({
                            firstName: found.first_name || '',
                            lastName: found.last_name || '',
                            employeeId: found.employee_id || '',
                            dateOfJoining: found.date_of_joining?.split('T')[0] || '',
                            departmentId: found.department_id || '',
                            departmentName: found.department_name || '',
                            designationId: found.designation_id || '',
                            designationName: found.designation_name || '',
                            employmentType: found.employment_type || 'Full-Time',
                            reportingManager: found.reporting_manager || '',
                            gender: found.gender || 'Male',
                            maritalStatus: found.marital_status || 'Single',
                            bloodGroup: found.blood_group || 'B+',
                            employeeStatus: found.employee_status || 'Active',
                            emailAddress: found.email_address || '',
                            mobileNumber: found.mobile_number || '',
                            alternateNumber: found.alternate_number || '',
                            country: found.country || 'India',
                            additionalInfo: found.additional_info || '',
                            addressLine1: found.address_line_1 || '',
                            addressLine2: found.address_line_2 || '',
                            city: found.city || '',
                            state: found.state || '',
                            pinCode: found.pin_code || '',
                            basicSalary: found.basic_salary || '',
                            hra: found.hra || '',
                            conveyance: found.conveyance || 1600,
                            medical: found.medical || 1250,
                            specialAllowance: found.special_allowance || '',
                            pf: found.pf || '',
                            profTax: found.prof_tax || 200,
                            tds: found.tds || '',
                            otherDeductions: found.other_deductions || '',
                        });
                        setDeptSearch(found.department_name || '');
                        setDesigSearch(found.designation_name || '');
                        setQualifications(found.qualifications || []);
                    }
                })
                .catch(err => {
                    console.error('Failed to load employee details', err);
                    toast.error('Could not load employee details.');
                });
        }
    }, [editId, isEditMode]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Auto-calculate Salary Breakdowns
    const basic = parseFloat(formData.basicSalary) || 0;
    const hra = parseFloat(formData.hra) || 0;
    const conv = parseFloat(formData.conveyance) || 1600;
    const med = parseFloat(formData.medical) || 1250;
    const spec = parseFloat(formData.specialAllowance) || 0;
    const grossSalary = basic + hra + conv + med + spec;

    const pf = parseFloat(formData.pf) || 0;
    const profTax = parseFloat(formData.profTax) || 200;
    const tds = parseFloat(formData.tds) || 0;
    const otherDed = parseFloat(formData.otherDeductions) || 0;
    const totalDeductions = pf + profTax + tds + otherDed;
    const netSalary = grossSalary - totalDeductions;

    const handleAddQualification = () => {
        setQualifications([...qualifications, { qualification: '', specialization: '', institution: '', passingYear: '', percentage: '' }]);
    };

    const handleQualChange = (index, field, value) => {
        const updated = [...qualifications];
        updated[index][field] = value;
        setQualifications(updated);
    };

    const handleRemoveQual = (index) => {
        setQualifications(qualifications.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.firstName || !formData.lastName || !formData.emailAddress) {
            toast.error('First Name, Last Name, and Email Address are required.');
            return;
        }

        try {
            setSubmitting(true);
            const payload = {
                ...formData,
                grossSalary,
                totalDeductions,
                netSalary,
                qualifications
            };

            if (isEditMode) {
                await api.put(`/employees/${editId}`, payload);
                toast.success('Employee updated successfully!');
            } else {
                await api.post('/employees', payload);
                toast.success('Employee created successfully!');
            }
            onClose();
        } catch (err) {
            console.error('Failed to save employee:', err);
            toast.error(err.response?.data?.error || 'Failed to save employee.');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredDepts = departments.filter(d => d.name.toLowerCase().includes(deptSearch.toLowerCase()));
    const filteredDesigs = designations.filter(d => d.name.toLowerCase().includes(desigSearch.toLowerCase()));

    return (
        <div className="space-y-6 w-full px-4 sm:px-6 lg:px-8 pb-20 font-sans text-slate-900">
            {/* Header */}
            <div className="flex items-center justify-between bg-white px-6 py-4 rounded-2xl border border-slate-200/80 shadow-2xs sticky top-0 z-30">
                <div className="flex items-center gap-3">
                    <button type="button" onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl transition cursor-pointer">
                        <X size={20} />
                    </button>
                    <h1 className="text-base font-bold text-slate-900 tracking-tight">
                        {isEditMode ? 'Edit Employee Profile' : 'Add New Employee'}
                    </h1>
                </div>
                <button 
                    type="button" onClick={handleSubmit} disabled={submitting}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition shadow-sm cursor-pointer"
                >
                    {submitting ? 'Saving...' : isEditMode ? 'Update Employee' : 'Save Employee'}
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Personal Info */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-6">
                    <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Personal & Professional Info</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700">First Name <span className="text-rose-500">*</span></label>
                            <input type="text" required name="firstName" value={formData.firstName} onChange={handleChange} className="w-full p-3 rounded-xl border border-slate-200 text-xs" placeholder="Aarav" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700">Last Name <span className="text-rose-500">*</span></label>
                            <input type="text" required name="lastName" value={formData.lastName} onChange={handleChange} className="w-full p-3 rounded-xl border border-slate-200 text-xs" placeholder="Sharma" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700">Employee ID</label>
                            <input type="text" name="employeeId" value={formData.employeeId} onChange={handleChange} className="w-full p-3 rounded-xl border border-slate-200 text-xs font-mono font-bold" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700">Date of Joining</label>
                            <input type="date" name="dateOfJoining" value={formData.dateOfJoining} onChange={handleChange} className="w-full p-3 rounded-xl border border-slate-200 text-xs font-mono" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700">Employment Type</label>
                            <select name="employmentType" value={formData.employmentType} onChange={handleChange} className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-white font-semibold">
                                <option value="Full-Time">Full-Time</option>
                                <option value="Part-Time">Part-Time</option>
                                <option value="Contract">Contract</option>
                                <option value="Intern">Intern</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700">Reporting Manager</label>
                            <input type="text" name="reportingManager" value={formData.reportingManager} onChange={handleChange} className="w-full p-3 rounded-xl border border-slate-200 text-xs" placeholder="Manager Name" />
                        </div>
                    </div>

                    {/* Searchable Departments & Designations */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-1.5 relative">
                            <label className="block text-xs font-bold text-slate-700">Department</label>
                            <div className="relative">
                                <Search size={14} className="absolute left-3.5 top-3.5 text-slate-400" />
                                <input 
                                    type="text" placeholder="Search department..." value={deptSearch}
                                    onChange={(e) => { setDeptSearch(e.target.value); setIsDeptOpen(true); }}
                                    onFocus={() => setIsDeptOpen(true)}
                                    className="w-full pl-9 pr-8 py-3 rounded-xl border border-slate-200 text-xs font-semibold"
                                />
                                {isDeptOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-40 overflow-y-auto z-50 divide-y divide-slate-50">
                                        {filteredDepts.map(d => (
                                            <div key={d.id} onClick={() => { setFormData(prev => ({ ...prev, departmentId: d.id })); setDeptSearch(d.name); setIsDeptOpen(false); }} className="p-2.5 hover:bg-blue-50 text-xs cursor-pointer">
                                                {d.name} <span className="text-[10px] text-blue-600 font-mono">({d.code})</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-1.5 relative">
                            <label className="block text-xs font-bold text-slate-700">Designation</label>
                            <div className="relative">
                                <Search size={14} className="absolute left-3.5 top-3.5 text-slate-400" />
                                <input 
                                    type="text" placeholder="Search designation..." value={desigSearch}
                                    onChange={(e) => { setDesigSearch(e.target.value); setIsDesigOpen(true); }}
                                    onFocus={() => setIsDesigOpen(true)}
                                    className="w-full pl-9 pr-8 py-3 rounded-xl border border-slate-200 text-xs font-semibold"
                                />
                                {isDesigOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-40 overflow-y-auto z-50 divide-y divide-slate-50">
                                        {filteredDesigs.map(d => (
                                            <div key={d.id} onClick={() => { setFormData(prev => ({ ...prev, designationId: d.id })); setDesigSearch(d.name); setIsDesigOpen(false); }} className="p-2.5 hover:bg-blue-50 text-xs cursor-pointer">
                                                {d.name} <span className="text-[10px] text-violet-600 font-mono">({d.code})</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700">Gender</label>
                            <select name="gender" value={formData.gender} onChange={handleChange} className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-white">
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700">Marital Status</label>
                            <select name="maritalStatus" value={formData.maritalStatus} onChange={handleChange} className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-white">
                                <option value="Single">Single</option>
                                <option value="Married">Married</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700">Blood Group</label>
                            <input type="text" name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className="w-full p-3 rounded-xl border border-slate-200 text-xs" placeholder="B+" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700">Status</label>
                            <select name="employeeStatus" value={formData.employeeStatus} onChange={handleChange} className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-white font-semibold">
                                <option value="Active">Active</option>
                                <option value="On Leave">On Leave</option>
                                <option value="Terminated">Terminated</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Contact & Address Section */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-6">
                    <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Contact & Address Details</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700">Email Address <span className="text-rose-500">*</span></label>
                            <input type="email" required name="emailAddress" value={formData.emailAddress} onChange={handleChange} className="w-full p-3 rounded-xl border border-slate-200 text-xs" placeholder="employee@school.edu" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700">Mobile Number <span className="text-rose-500">*</span></label>
                            <input type="text" required name="mobileNumber" value={formData.mobileNumber} onChange={handleChange} className="w-full p-3 rounded-xl border border-slate-200 text-xs" placeholder="9876543210" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700">Alternate Number</label>
                            <input type="text" name="alternateNumber" value={formData.alternateNumber} onChange={handleChange} className="w-full p-3 rounded-xl border border-slate-200 text-xs" placeholder="Optional" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700">Address Line 1 <span className="text-rose-500">*</span></label>
                            <input type="text" required name="addressLine1" value={formData.addressLine1} onChange={handleChange} className="w-full p-3 rounded-xl border border-slate-200 text-xs" placeholder="Street / Area" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700">Address Line 2</label>
                            <input type="text" name="addressLine2" value={formData.addressLine2} onChange={handleChange} className="w-full p-3 rounded-xl border border-slate-200 text-xs" placeholder="Apartment / Landmark" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700">City <span className="text-rose-500">*</span></label>
                            <input type="text" required name="city" value={formData.city} onChange={handleChange} className="w-full p-3 rounded-xl border border-slate-200 text-xs" placeholder="Jaipur" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700">State <span className="text-rose-500">*</span></label>
                            <input type="text" required name="state" value={formData.state} onChange={handleChange} className="w-full p-3 rounded-xl border border-slate-200 text-xs" placeholder="Rajasthan" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700">Pin Code <span className="text-rose-500">*</span></label>
                            <input type="text" required name="pinCode" value={formData.pinCode} onChange={handleChange} className="w-full p-3 rounded-xl border border-slate-200 text-xs font-mono" placeholder="302001" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700">Country</label>
                            <input type="text" name="country" value={formData.country} onChange={handleChange} className="w-full p-3 rounded-xl border border-slate-200 text-xs" />
                        </div>
                    </div>
                </div>

                {/* Salary Structure Section */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-6">
                    <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Salary Structure (Monthly Breakdown)</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700">Basic Salary (₹)</label>
                            <input type="number" step="0.01" name="basicSalary" value={formData.basicSalary} onChange={handleChange} className="w-full p-3 rounded-xl border border-slate-200 text-xs font-mono" placeholder="45000" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700">HRA (₹)</label>
                            <input type="number" step="0.01" name="hra" value={formData.hra} onChange={handleChange} className="w-full p-3 rounded-xl border border-slate-200 text-xs font-mono" placeholder="18000" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700">Special Allowance (₹)</label>
                            <input type="number" step="0.01" name="specialAllowance" value={formData.specialAllowance} onChange={handleChange} className="w-full p-3 rounded-xl border border-slate-200 text-xs font-mono" placeholder="5000" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
                        <div><span className="text-slate-400 block">Gross Salary:</span> <strong className="font-mono text-blue-600 text-sm">₹{grossSalary.toFixed(2)}</strong></div>
                        <div><span className="text-slate-400 block">Total Deductions:</span> <strong className="font-mono text-rose-600 text-sm">₹{totalDeductions.toFixed(2)}</strong></div>
                        <div className="sm:col-span-2 text-right"><span className="text-slate-400 block">Net Take-Home Salary:</span> <strong className="font-mono text-emerald-600 text-base">₹{netSalary.toFixed(2)}</strong></div>
                    </div>
                </div>

                {/* Qualifications Section */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Educational Qualifications</h3>
                        <button type="button" onClick={handleAddQualification} className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer">
                            <Plus size={14} /> Add Row
                        </button>
                    </div>

                    <div className="space-y-3">
                        {qualifications.map((q, idx) => (
                            <div key={idx} className="flex gap-3 items-center bg-slate-50 p-3 rounded-2xl border border-slate-200">
                                <input type="text" placeholder="Degree/Qualification" value={q.qualification} onChange={(e) => handleQualChange(idx, 'qualification', e.target.value)} className="flex-1 p-2 bg-white border border-slate-200 rounded-xl text-xs" />
                                <input type="text" placeholder="Institution" value={q.institution} onChange={(e) => handleQualChange(idx, 'institution', e.target.value)} className="flex-1 p-2 bg-white border border-slate-200 rounded-xl text-xs" />
                                <input type="text" placeholder="Passing Year" value={q.passingYear} onChange={(e) => handleQualChange(idx, 'passingYear', e.target.value)} className="w-24 p-2 bg-white border border-slate-200 rounded-xl text-xs font-mono" />
                                <button type="button" onClick={() => handleRemoveQual(idx)} className="text-rose-500 hover:text-rose-700 p-2"><Trash2 size={16} /></button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button type="submit" disabled={submitting} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-2xl shadow-md transition cursor-pointer">
                        {submitting ? 'Saving...' : isEditMode ? 'Update Employee' : 'Save Employee'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddEmployee;