import { useState, useEffect } from 'react';
import { Calendar, Printer, Users, UserCheck, FileSpreadsheet, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/axios.js';

const AttendanceSheet = () => {
    const [sheetData, setSheetData] = useState([]);
    const [daysInMonth, setDaysInMonth] = useState(31);
    const [loading, setLoading] = useState(false);

    const [selectedRole, setSelectedRole] = useState('All');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [activeCompanyId, setActiveCompanyId] = useState(() => localStorage.getItem('activeCompanyId') || 2);

    const months = [
        { value: 1, label: 'January' },
        { value: 2, label: 'February' },
        { value: 3, label: 'March' },
        { value: 4, label: 'April' },
        { value: 5, label: 'May' },
        { value: 6, label: 'June' },
        { value: 7, label: 'July' },
        { value: 8, label: 'August' },
        { value: 9, label: 'September' },
        { value: 10, label: 'October' },
        { value: 11, label: 'November' },
        { value: 12, label: 'December' }
    ];

    const fetchMonthlySheet = async () => {
        try {
            setLoading(true);
            console.log('Fetching monthly attendance sheet with params:', {
                companyId: activeCompanyId,
                role: selectedRole,
                month: selectedMonth,
                year: selectedYear
            });

            // Target the monthly aggregate matrix endpoint
            const res = await api.get('/attendance-sheets/monthly', {
                params: {
                    companyId: activeCompanyId,
                    role: selectedRole,
                    month: selectedMonth,
                    year: selectedYear
                }
            });

            console.log('API Response received:', res.data);

            setSheetData(res.data?.attendanceSheet || res.data?.data || []);
            setDaysInMonth(res.data?.daysInMonth || 31);
        } catch (err) {
            console.error('❌ Failed to load staff monthly attendance sheet:', err);
            console.error('Error response details:', err.response?.data);
            setSheetData([]);
            toast.error('Could not load staff monthly attendance report');
        } finally {
            setLoading(false);
        }
    };

    // Automatically re-fetches and updates the table whenever month, year, or role changes
    useEffect(() => {
        fetchMonthlySheet();
    }, [selectedRole, selectedMonth, selectedYear, activeCompanyId]);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Present': return <span className="text-emerald-600 font-bold">P</span>;
            case 'Absent': return <span className="text-rose-600 font-bold">A</span>;
            case 'Late': return <span className="text-amber-600 font-bold">L</span>;
            case 'Half-Day': return <span className="text-purple-600 font-bold">H</span>;
            case 'On Leave': return <span className="text-blue-600 font-bold">OL</span>;
            default: return <span className="text-slate-300">-</span>;
        }
    };

    const handleExportCSV = () => {
        if (sheetData.length === 0) return toast.error('No data to export.');
        const headers = ['Staff ID', 'Staff Name', 'Role', ...Array.from({ length: daysInMonth }, (_, i) => `Day ${i + 1}`), 'Total P', 'Total A', 'Total L'];
        const rows = sheetData.map(staff => [
            staff.employee_id,
            `"${staff.name}"`,
            staff.role,
            ...Array.from({ length: daysInMonth }, (_, i) => staff.days[i + 1] || '-'),
            staff.totalPresent || 0,
            staff.totalAbsent || 0,
            staff.totalLate || 0
        ]);
        const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const link = document.createElement('a');
        link.setAttribute('href', encodeURI(csv));
        link.setAttribute('download', `attendance_sheet_${selectedMonth}_${selectedYear}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('CSV exported successfully!');
    };

    return (
        <div className="space-y-6 w-full px-4 sm:px-6 lg:px-8 pb-16 font-sans text-slate-900">
            
            {/* Header & Filter Controls Box */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                        <h1 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                            <FileSpreadsheet size={18} className="text-violet-600" /> Month-wise Staff Attendance Sheet
                        </h1>
                        <p className="text-xs text-slate-400 mt-0.5">Comprehensive monthly calendar overview of staff and teacher attendance records.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            type="button"
                            onClick={handleExportCSV}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-4 py-2 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5"
                        >
                            <Download size={14} /> Export CSV
                        </button>
                        <button 
                            type="button"
                            onClick={() => window.print()}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-4 py-2 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5"
                        >
                            <Printer size={14} /> Print Sheet
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">Staff Role</label>
                        <select 
                            value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}
                            className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-hidden cursor-pointer"
                        >
                            <option value="All">All Roles</option>
                            <option value="Teacher">Teacher</option>
                            <option value="Admin">Admin</option>
                            <option value="HR Manager">HR Manager</option>
                            <option value="Staff">Staff</option>
                            <option value="Accountant">Accountant</option>
                            <option value="Agent">Agents</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">Month</label>
                        <select 
                            value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}
                            className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-hidden cursor-pointer"
                        >
                            {months.map(m => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">Year</label>
                        <select 
                            value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-hidden font-mono cursor-pointer"
                        >
                            <option value={2026}>2026</option>
                            <option value={2025}>2025</option>
                            <option value={2024}>2024</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Attendance Matrix Grid Table */}
            {loading ? (
                <div className="bg-white p-16 rounded-3xl border border-slate-200 text-center text-xs text-slate-400">Loading monthly attendance matrix...</div>
            ) : sheetData.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400 text-xs shadow-2xs">
                    No staff attendance records found for the selected criteria.
                </div>
            ) : (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
                    <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700">
                        <span>Showing report for {months.find(m => m.value === selectedMonth)?.label} {selectedYear}</span>
                        <div className="flex items-center gap-4 text-[11px]">
                            <span className="flex items-center gap-1 text-emerald-600"><span className="font-bold">P</span>: Present</span>
                            <span className="flex items-center gap-1 text-rose-600"><span className="font-bold">A</span>: Absent</span>
                            <span className="flex items-center gap-1 text-amber-600"><span className="font-bold">L</span>: Late</span>
                            <span className="flex items-center gap-1 text-purple-600"><span className="font-bold">H</span>: Half Day</span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-[11px] whitespace-nowrap">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 uppercase font-extrabold border-b border-slate-100 text-[10px]">
                                    <th className="py-2.5 px-4 sticky left-0 bg-slate-50 z-10 text-left border-r border-slate-200" rowSpan={2}>Staff ID / Name</th>
                                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
                                        <th key={day} className="py-2 px-2 text-center border-r border-slate-100 font-mono w-8 text-slate-700">
                                            {day}
                                        </th>
                                    ))}
                                    <th className="py-2.5 px-3 text-center bg-emerald-50 text-emerald-800 border-l border-slate-200" rowSpan={2}>Total P</th>
                                    <th className="py-2.5 px-3 text-center bg-rose-50 text-rose-800" rowSpan={2}>Total A</th>
                                    <th className="py-2.5 px-3 text-center bg-amber-50 text-amber-800" rowSpan={2}>Total L</th>
                                </tr>
                                <tr className="bg-slate-100/80 text-slate-400 font-bold border-b border-slate-200 text-[9px]">
                                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                                        const dateObj = new Date(selectedYear, selectedMonth - 1, day);
                                        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' })[0];
                                        const isWeekend = dateObj.getDay() === 0;
                                        return (
                                            <th key={day} className={`py-1.5 px-2 text-center border-r border-slate-200 ${isWeekend ? 'text-rose-500 bg-rose-50/50' : 'text-slate-500'}`}>
                                                {dayName}
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                {sheetData.map((staff) => (
                                    <tr key={staff.staff_id || staff.id} className="hover:bg-slate-50/80 transition">
                                        <td className="py-2.5 px-4 sticky left-0 bg-white z-10 border-r border-slate-200">
                                            <div className="font-bold text-slate-900 truncate max-w-[160px]">{staff.name || `${staff.first_name} ${staff.last_name}`}</div>
                                            <div className="text-[10px] font-mono text-violet-600 font-semibold">{staff.employee_id || staff.emp_code} ({staff.role})</div>
                                        </td>
                                        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                                            const dateObj = new Date(selectedYear, selectedMonth - 1, day);
                                            const isWeekend = dateObj.getDay() === 0;
                                            const status = staff.days ? staff.days[day] : null;
                                            return (
                                                <td key={day} className={`py-2.5 px-2 text-center border-r border-slate-100 font-mono ${isWeekend ? 'bg-slate-50/60' : ''}`}>
                                                    {getStatusBadge(status)}
                                                </td>
                                            );
                                        })}
                                        <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-700 bg-emerald-50/30 border-l border-slate-200">
                                            {staff.totalPresent || 0}
                                        </td>
                                        <td className="py-2.5 px-3 text-center font-mono font-bold text-rose-700 bg-rose-50/30">
                                            {staff.totalAbsent || 0}
                                        </td>
                                        <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-700 bg-amber-50/30">
                                            {staff.totalLate || 0}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

        </div>
    );
};

export default AttendanceSheet;