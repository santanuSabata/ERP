import { useState, useEffect } from 'react';
import { Search, Plus, ChevronLeft, ChevronRight, Edit3, Trash2, LayoutGrid, Table as TableIcon, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/axios.js';
import AddEmployee from '../../components/hr/AddEmployee.jsx';

const Employees = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [employees, setEmployees] = useState([]);
    const [activeCompanyId, setActiveCompanyId] = useState(() => localStorage.getItem('activeCompanyId') || 2);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('table');

    const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
    const [editingEmpId, setEditingEmpId] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);

    const fetchEmployees = async (search, page, limit) => {
        try {
            setLoading(true);
            const res = await api.get(`/employees?search=${search || ''}&page=${page}&limit=${limit}`);
            if (res.data) {
                setEmployees(res.data.data || []);
                setTotalCount(res.data.totalCount || 0);
            }
        } catch (err) {
            console.error('Failed to load employees:', err);
            toast.error('Could not load employees data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees(searchQuery, currentPage, perPage);
    }, [currentPage, perPage]);

    const handleSearchChange = (e) => {
        const val = e.target.value;
        setSearchQuery(val);
        setCurrentPage(1);
        fetchEmployees(val, 1, perPage);
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete employee "${name}"?`)) return;
        try {
            await api.delete(`/employees/${id}`);
            toast.success('Employee deleted successfully.');
            fetchEmployees(searchQuery, currentPage, perPage);
        } catch (err) {
            toast.error('Failed to delete employee.');
        }
    };

    const handleExportCSV = () => {
        if (employees.length === 0) return toast.error('No data to export.');
        const headers = ['ID', 'Employee ID', 'Full Name', 'Email', 'Mobile', 'Department', 'Designation', 'Net Salary', 'Status'];
        const rows = employees.map(e => [e.id, e.employee_id, `"${e.name}"`, e.email_address, e.mobile_number, `"${e.department_name || 'N/A'}"`, `"${e.designation_name || 'N/A'}"`, e.net_salary, e.employee_status]);
        const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const link = document.createElement('a');
        link.setAttribute('href', encodeURI(csv));
        link.setAttribute('download', 'employees_export.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('CSV exported successfully!');
    };

    const totalPages = Math.ceil(totalCount / perPage) || 1;

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 space-y-6 pb-16 font-sans text-slate-900">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Employees Directory</h1>
                <button onClick={() => { setEditingEmpId(null); setIsAddDrawerOpen(true); }} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition flex items-center gap-2 cursor-pointer shadow-sm">
                    <Plus size={14} /> New Employee
                </button>
            </div>

            <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="relative flex-1 max-w-md">
                    <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
                    <input type="text" placeholder="Search by name, employee ID, email..." value={searchQuery} onChange={handleSearchChange} className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs w-full focus:outline-hidden" />
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-lg text-xs ${viewMode === 'table' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'}`}><TableIcon size={16} /></button>
                        <button onClick={() => setViewMode('card')} className={`p-1.5 rounded-lg text-xs ${viewMode === 'card' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'}`}><LayoutGrid size={16} /></button>
                    </div>
                    <button onClick={handleExportCSV} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer"><Download size={14} /> Export CSV</button>
                </div>
            </div>

            {loading ? (
                <div className="bg-white p-16 rounded-3xl border border-slate-200 text-center text-xs text-slate-400">Loading employees...</div>
            ) : employees.length === 0 ? (
                <div className="bg-white p-16 rounded-3xl border border-slate-200 text-center text-xs text-slate-400">No employees found.</div>
            ) : viewMode === 'table' ? (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
                    <div className="grid grid-cols-12 bg-slate-50 border-b border-slate-100 px-6 py-3 text-[11px] font-bold text-slate-500 uppercase">
                        <div className="col-span-3">Employee Name</div>
                        <div className="col-span-2">ID / Code</div>
                        <div className="col-span-3">Department / Desig</div>
                        <div className="col-span-2">Net Salary</div>
                        <div className="col-span-2 text-right">Actions</div>
                    </div>
                    <div className="divide-y divide-slate-100 text-xs">
                        {employees.map(emp => (
                            <div key={emp.id} className="grid grid-cols-12 items-center px-6 py-4 hover:bg-slate-50">
                                <div className="col-span-3 font-bold text-slate-900">{emp.name} <span className="block text-[11px] font-normal text-slate-400">{emp.email_address}</span></div>
                                <div className="col-span-2 font-mono font-bold text-blue-600">{emp.employee_id}</div>
                                <div className="col-span-3 text-slate-600">{emp.department_name || 'N/A'} <span className="block text-[11px] text-slate-400">{emp.designation_name || 'N/A'}</span></div>
                                <div className="col-span-2 font-mono font-bold text-emerald-600">₹{parseFloat(emp.net_salary || 0).toLocaleString('en-IN')}</div>
                                <div className="col-span-2 text-right flex justify-end gap-2">
                                    <button onClick={() => { setEditingEmpId(emp.id); setIsAddDrawerOpen(true); }} className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg cursor-pointer"><Edit3 size={14} /></button>
                                    <button onClick={() => handleDelete(emp.id, emp.name)} className="p-1.5 bg-slate-50 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"><Trash2 size={14} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {employees.map(emp => (
                        <div key={emp.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
                            <div>
                                <h3 className="text-xs font-bold text-slate-900">{emp.name}</h3>
                                <span className="text-[11px] font-mono font-bold text-blue-600">{emp.employee_id}</span>
                            </div>
                            <div className="text-xs text-slate-600 space-y-1">
                                <p>Email: <strong>{emp.email_address}</strong></p>
                                <p>Dept: <strong>{emp.department_name || 'N/A'}</strong></p>
                                <p>Net Salary: <strong className="font-mono text-emerald-600">₹{parseFloat(emp.net_salary || 0).toLocaleString('en-IN')}</strong></p>
                            </div>
                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                                <button onClick={() => { setEditingEmpId(emp.id); setIsAddDrawerOpen(true); }} className="px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-semibold rounded-xl flex items-center gap-1"><Edit3 size={13} /> Edit</button>
                                <button onClick={() => handleDelete(emp.id, emp.name)} className="px-3 py-1.5 bg-rose-50 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-1"><Trash2 size={13} /> Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Slide-over Drawer */}
            {isAddDrawerOpen && (
                <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-2xs flex justify-end">
                    <div className="w-full md:w-3/4 bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden">
                        <div className="p-6 overflow-y-auto flex-1">
                            <AddEmployee 
                                editId={editingEmpId} 
                                activeCompanyId={activeCompanyId}
                                onClose={() => { setIsAddDrawerOpen(false); setEditingEmpId(null); fetchEmployees(searchQuery, currentPage, perPage); }} 
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Employees;