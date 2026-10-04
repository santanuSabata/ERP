import { useState, useEffect } from 'react';
import { Search, Plus, ChevronLeft, ChevronRight, Edit3, Trash2, LayoutGrid, Table as TableIcon, Download, CheckCircle2, Calendar, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/axios.js';
import AddAttendanceModal from '../../components/hr/AddAttendance.jsx';

const EmployeeAttendance = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [deptFilter, setDeptFilter] = useState('All');
    const [desigFilter, setDesigFilter] = useState('All');
    const [selectedRole, setSelectedRole] = useState('All Staff Roles');
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);

    const [attendanceList, setAttendanceList] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);

    const [activeCompanyId, setActiveCompanyId] = useState(() => localStorage.getItem('activeCompanyId') || 2);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('table');

    const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
    const [editingAttendanceId, setEditingAttendanceId] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);

    const STATUS_OPTIONS = [
        { value: 'All', label: 'All Status' },
        { value: 'Present', label: 'Present' },
        { value: 'Absent', label: 'Absent' },
        { value: 'Late', label: 'Late' },
        { value: 'Half-Day', label: 'Half-Day' },
        { value: 'On Leave', label: 'On Leave' },
    ];

    const ROLE_OPTIONS = [
        'All Staff Roles',
        'Teacher',
        'Librarian',
        'Admin',
        'Accountant',
    ];

    // Fetch filters catalogs (departments & designations)
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

    const fetchAttendance = async (search, status, date, page, limit) => {
        try {
            setLoading(true);
            const res = await api.get(`/employee-attendance`, {
                params: {
                    search: search || '',
                    status: status || 'All',
                    date: date || attendanceDate,
                    page,
                    limit
                }
            });
            if (res.data) {
                setAttendanceList(res.data.data || []);
                setTotalCount(res.data.totalCount || 0);
            }
        } catch (err) {
            console.error('Failed to load attendance:', err);
            toast.error('Could not load attendance data');
        } finally {
            setLoading(false);
        }
    };

    // Re-fetches records automatically when date, search, status, or pagination changes
    useEffect(() => {
        fetchAttendance(searchQuery, statusFilter, attendanceDate, currentPage, perPage);
    }, [currentPage, perPage, statusFilter, attendanceDate]);

    const handleSearchChange = (e) => {
        const val = e.target.value;
        setSearchQuery(val);
        setCurrentPage(1);
        fetchAttendance(val, statusFilter, attendanceDate, 1, perPage);
    };

    // Mark All Employees Present Handler
    const handleMarkAllPresent = async () => {
        if (!window.confirm(`Are you sure you want to mark all employees as Present for ${attendanceDate}?`)) return;
        try {
            const empRes = await api.get(`/employees?companyId=${activeCompanyId || 2}&limit=500`);
            const employees = empRes.data?.data || [];

            if (employees.length === 0) {
                toast.error('No employees found to mark attendance.');
                return;
            }

            await Promise.all(employees.map(emp => 
                api.post('/employee-attendance', {
                    companyId: activeCompanyId || 2,
                    employeeId: emp.id,
                    departmentId: emp.department_id || null,
                    designationId: emp.designation_id || null,
                    attendanceDate: attendanceDate,
                    checkInTime: '09:00',
                    checkOutTime: '18:00',
                    attendanceStatus: 'Present',
                    remarks: 'Marked all present via batch action',
                    createdBy: 'System Admin'
                })
            ));

            toast.success(`All employees successfully marked Present for ${attendanceDate}!`);
            fetchAttendance(searchQuery, statusFilter, attendanceDate, currentPage, perPage);
        } catch (err) {
            console.error('Failed to mark all present:', err);
            toast.error('Failed to batch update attendance.');
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete attendance record for "${name}"?`)) return;
        try {
            await api.delete(`/employee-attendance/${id}`);
            toast.success('Attendance record deleted successfully.');
            fetchAttendance(searchQuery, statusFilter, attendanceDate, currentPage, perPage);
        } catch (err) {
            toast.error('Failed to delete attendance record.');
        }
    };

    const handleExportCSV = () => {
        if (attendanceList.length === 0) return toast.error('No data to export.');
        const headers = ['ID', 'Employee Name', 'Employee Code', 'Email', 'Mobile', 'Department', 'Date', 'Check-In', 'Check-Out', 'Status', 'Remarks'];
        const rows = attendanceList.map(a => [
            a.id, 
            `"${a.employee_name}"`, 
            a.emp_code, 
            a.email, 
            a.mobile, 
            `"${a.department_name || 'N/A'}"`, 
            a.attendance_date?.split('T')[0], 
            a.check_in_time || 'N/A', 
            a.check_out_time || 'N/A', 
            a.attendance_status, 
            `"${a.remarks || ''}"`
        ]);
        const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const link = document.createElement('a');
        link.setAttribute('href', encodeURI(csv));
        link.setAttribute('download', `employee_attendance_${attendanceDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('CSV exported successfully!');
    };

    // Client-side filtering for department, designation & role filters
    const filteredAttendanceList = attendanceList.filter(item => {
        const matchesDept = deptFilter === 'All' || String(item.department_id) === String(deptFilter) || item.department_name === deptFilter;
        const matchesDesig = desigFilter === 'All' || String(item.designation_id) === String(desigFilter) || item.designation_name === desigFilter;
        const matchesRole = selectedRole === 'All Staff Roles' || (item.designation_name && item.designation_name.toLowerCase().includes(selectedRole.toLowerCase()));
        return matchesDept && matchesDesig && matchesRole;
    });

    const presentCount = attendanceList.filter(a => a.attendance_status === 'Present').length;
    const absentCount = attendanceList.filter(a => a.attendance_status === 'Absent').length;
    const lateCount = attendanceList.filter(a => a.attendance_status === 'Late').length;

    const totalPages = Math.ceil(totalCount / perPage) || 1;

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 space-y-6 pb-20 font-sans text-slate-900">
            {/* Top Bar matching reference */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs">
                <div>
                    <h1 className="text-lg font-bold text-slate-900 tracking-tight">Staff Attendance Management</h1>
                    <p className="text-xs text-slate-400 mt-0.5">Track daily attendance, leaves, and arrival status for school staff and teachers[cite: 1].</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        type="button"
                        onClick={handleMarkAllPresent} 
                        className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-2xl transition shadow-sm cursor-pointer"
                    >
                        Mark All Present[cite: 1]
                    </button>
                    <button type="button" onClick={handleExportCSV} className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer ml-auto"><Download size={14} /> Export CSV</button> 
                </div>
                                

            </div> 

            {/* Total Staff & Live Indicators matching reference */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between px-2 text-xs">
                <span className="font-bold text-slate-800">Total Staff: {totalCount}[cite: 1]</span>
                <div className="flex items-center gap-6 font-semibold">
                    <span className="flex items-center gap-1.5 text-emerald-600">
                        <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Present: {presentCount}[cite: 1]
                    </span>
                    <span className="flex items-center gap-1.5 text-rose-600">
                        <span className="h-2 w-2 rounded-full bg-rose-500"></span> Absent: {absentCount}[cite: 1]
                    </span>
                    <span className="flex items-center gap-1.5 text-amber-600">
                        <span className="h-2 w-2 rounded-full bg-amber-500"></span> Late: {lateCount}[cite: 1]
                    </span>
                </div>
            </div>

            {/* Extra search & department filters bar */}
            <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Search by name, email, mobile..." 
                        value={searchQuery} 
                        onChange={handleSearchChange} 
                        className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs w-full focus:outline-hidden" 
                    />
                </div>
                
                <div className="relative min-w-[160px]">
                    <input 
                        type="date"
                        value={attendanceDate}
                        onChange={(e) => setAttendanceDate(e.target.value)}
                        className="w-full p-2.5 pr-8 rounded-xl border border-slate-200 text-xs font-mono font-semibold bg-slate-50 focus:outline-hidden cursor-pointer"
                    />
                    <Calendar size={16} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
                </div>

                <select 
                    value={statusFilter} 
                    onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }} 
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
                >
                    {STATUS_OPTIONS.map((status) => (
                        <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                </select>
                <select 
                    value={deptFilter} 
                    onChange={(e) => setDeptFilter(e.target.value)} 
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
                >
                    <option value="All">All Departments</option>
                    {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                </select>
                <select 
                    value={desigFilter} 
                    onChange={(e) => setDesigFilter(e.target.value)} 
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
                >
                    <option value="All">All Designations</option>
                    {designations.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                </select>
            </div>

            {loading ? (
                <div className="bg-white p-16 rounded-3xl border border-slate-200 text-center text-xs text-slate-400">Loading attendance records for {attendanceDate}...</div>
            ) : filteredAttendanceList.length === 0 ? (
                <div className="bg-white p-16 rounded-3xl border border-slate-200 text-center text-xs text-slate-400">No attendance records found for date: <strong className="font-mono text-slate-700">{attendanceDate}</strong>.</div>
            ) : (
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
                    <div className="grid grid-cols-12 bg-slate-50/80 border-b border-slate-100 px-6 py-3.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <div className="col-span-2">Staff ID[cite: 1]</div>
                        <div className="col-span-3">Staff Name & Role[cite: 1]</div>
                        <div className="col-span-4 text-center">Attendance Status[cite: 1]</div>
                        <div className="col-span-3">Remarks / Note[cite: 1]</div>
                    </div>
                    <div className="divide-y divide-slate-100 text-xs">
                        {filteredAttendanceList.map(a => {
                            const currentStatus = a.attendance_status || 'Present';

                            return (
                                <div key={a.id} className="grid grid-cols-12 items-center px-6 py-4 hover:bg-slate-50/60 transition">
                                    <div className="col-span-2 font-mono font-semibold text-slate-600">
                                        {a.emp_code || `#${a.id}`}
                                    </div>
                                    <div className="col-span-3">
                                        <p className="font-bold text-slate-900">{a.employee_name}</p>
                                        <p className="text-[11px] text-violet-600 font-medium">{a.designation_name || 'Teacher'}</p>
                                    </div>
                                    <div className="col-span-4 flex items-center justify-center gap-1.5">
                                        {['Present', 'Absent', 'Late', 'Half-Day'].map(statusLabel => {
                                            const isActive = currentStatus === statusLabel;
                                            
                                            let activeStyle = 'bg-emerald-600 text-white shadow-xs';
                                            if (statusLabel === 'Absent') activeStyle = 'bg-rose-600 text-white shadow-xs';
                                            if (statusLabel === 'Late') activeStyle = 'bg-amber-500 text-white shadow-xs';
                                            if (statusLabel === 'Half-Day') activeStyle = 'bg-blue-600 text-white shadow-xs';

                                            const inactiveStyle = 'bg-slate-100 text-slate-600 hover:bg-slate-200';

                                            return (
                                                <button
                                                    key={statusLabel}
                                                    type="button"
                                                    onClick={async () => {
                                                        try {
                                                            await api.put(`/employee-attendance/${a.id}`, { attendanceStatus: statusLabel });
                                                            toast.success('Status updated');
                                                            fetchAttendance(searchQuery, statusFilter, attendanceDate, currentPage, perPage);
                                                        } catch (err) {
                                                            toast.error('Failed to update status');
                                                        }
                                                    }}
                                                    className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition cursor-pointer ${isActive ? activeStyle : inactiveStyle}`}
                                                >
                                                    {statusLabel}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <div className="col-span-3 pr-2">
                                        <input 
                                            type="text"
                                            placeholder="Optional note or reason...[cite: 1]"
                                            defaultValue={a.remarks || ''}
                                            onBlur={async (e) => {
                                                try {
                                                    await api.put(`/employee-attendance/${a.id}`, { remarks: e.target.value });
                                                } catch (err) {
                                                    console.error('Failed to update remarks');
                                                }
                                            }}
                                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-violet-500"
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Pagination Footer */}
            <div className="flex items-center justify-between bg-white px-6 py-4 rounded-2xl border border-slate-200/80 shadow-2xs text-xs">
                <span className="font-semibold text-slate-600">Showing page {currentPage} of {totalPages} ({totalCount} total records)</span>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 cursor-pointer"><ChevronLeft size={14} /></button>
                    <span className="font-bold text-slate-700">{currentPage} / {totalPages}</span>
                    <button type="button" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 cursor-pointer"><ChevronRight size={14} /></button>
                </div>
            </div>

            {/* Slide-over Drawer */}
            {isAddDrawerOpen && (
                <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-2xs flex justify-end">
                    <div className="w-full md:w-1/2 bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden">
                        <div className="p-6 overflow-y-auto flex-1">
                            <AddAttendanceModal 
                                editId={editingAttendanceId} 
                                activeCompanyId={activeCompanyId}
                                onClose={() => { setIsAddDrawerOpen(false); setEditingAttendanceId(null); fetchAttendance(searchQuery, statusFilter, attendanceDate, currentPage, perPage); }} 
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeAttendance;