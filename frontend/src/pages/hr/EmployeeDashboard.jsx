import { useState, useEffect } from 'react';
import { Search, Plus, ChevronLeft, ChevronRight, Edit3, Trash2, LayoutGrid, Table as TableIcon, Download, BarChart3, CheckCircle2, Clock, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/axios.js';
import AddEmployeeDashboardModal from '../../components/hr/AddEmployeeDashboardModal.jsx';

const EmployeeDashboard = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState({ total_logs: 0, completed_count: 0, in_progress_count: 0, avg_performance: 0 });
    const [activeCompanyId, setActiveCompanyId] = useState(() => localStorage.getItem('activeCompanyId') || 2);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('table');

    const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
    const [editingLogId, setEditingLogId] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);

    const fetchDashboardLogs = async (search, status, page, limit) => {
        try {
            setLoading(true);
            const res = await api.get(`/employee-dashboard?search=${search || ''}&status=${status || 'All'}&page=${page}&limit=${limit}`);
            if (res.data) {
                setLogs(res.data.data || []);
                setTotalCount(res.data.totalCount || 0);
                if (res.data.stats) setStats(res.data.stats);
            }
        } catch (err) {
            console.error('Failed to load dashboard logs:', err);
            toast.error('Could not load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardLogs(searchQuery, statusFilter, currentPage, perPage);
    }, [currentPage, perPage, statusFilter]);

    const handleSearchChange = (e) => {
        const val = e.target.value;
        setSearchQuery(val);
        setCurrentPage(1);
        fetchDashboardLogs(val, statusFilter, 1, perPage);
    };

    const handleDelete = async (id, type) => {
        if (!window.confirm(`Are you sure you want to delete log "${type}"?`)) return;
        try {
            await api.delete(`/employee-dashboard/${id}`);
            toast.success('Log entry deleted successfully.');
            fetchDashboardLogs(searchQuery, statusFilter, currentPage, perPage);
        } catch (err) {
            toast.error('Failed to delete log entry.');
        }
    };

    const handleExportCSV = () => {
        if (logs.length === 0) return toast.error('No data to export.');
        const headers = ['ID', 'Employee Name', 'Employee ID', 'Activity Type', 'Department', 'Transaction Date', 'Performance Score', 'Status', 'Remarks'];
        const rows = logs.map(l => [l.id, `"${l.employee_name}"`, l.employee_id, `"${l.activity_type}"`, `"${l.department_name || 'N/A'}"`, l.transaction_date?.split('T')[0], l.performance_score, l.status, `"${l.remarks || ''}"`]);
        const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const link = document.createElement('a');
        link.setAttribute('href', encodeURI(csv));
        link.setAttribute('download', 'employee_dashboard_export.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('CSV exported successfully!');
    };

    const totalPages = Math.ceil(totalCount / perPage) || 1;

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 space-y-6 pb-16 font-sans text-slate-900">
            {/* Top Bar */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">Employee Dashboard & Logs</h1>
                    <p className="text-xs text-slate-400 mt-0.5">Track staff performance, operational reviews, and task activities.</p>
                </div>
                <button onClick={() => { setEditingLogId(null); setIsAddDrawerOpen(true); }} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition flex items-center gap-2 cursor-pointer shadow-sm">
                    <Plus size={14} /> Add Activity Log
                </button>
            </div>

            {/* Metric KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold"><BarChart3 size={24} /></div>
                    <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase">Total Activities</p>
                        <h4 className="text-lg font-black text-slate-900">{stats.total_logs || 0}</h4>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold"><CheckCircle2 size={24} /></div>
                    <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase">Completed</p>
                        <h4 className="text-lg font-black text-slate-900">{stats.completed_count || 0}</h4>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold"><Clock size={24} /></div>
                    <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase">In Progress</p>
                        <h4 className="text-lg font-black text-slate-900">{stats.in_progress_count || 0}</h4>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold"><Award size={24} /></div>
                    <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase">Avg Performance</p>
                        <h4 className="text-lg font-black text-slate-900">{stats.avg_performance || 0}%</h4>
                    </div>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center gap-3 flex-1">
                    <div className="relative flex-1 max-w-md">
                        <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
                        <input type="text" placeholder="Search by employee, activity, remarks..." value={searchQuery} onChange={handleSearchChange} className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs w-full focus:outline-hidden" />
                    </div>
                    <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }} className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold">
                        <option value="All">All Status</option>
                        <option value="Completed">Completed</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Pending">Pending</option>
                    </select>
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
                <div className="bg-white p-16 rounded-3xl border border-slate-200 text-center text-xs text-slate-400">Loading dashboard logs...</div>
            ) : logs.length === 0 ? (
                <div className="bg-white p-16 rounded-3xl border border-slate-200 text-center text-xs text-slate-400">No logs found.</div>
            ) : viewMode === 'table' ? (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
                    <div className="grid grid-cols-12 bg-slate-50 border-b border-slate-100 px-6 py-3 text-[11px] font-bold text-slate-500 uppercase">
                        <div className="col-span-3">Employee Name</div>
                        <div className="col-span-3">Activity Type</div>
                        <div className="col-span-2">Department</div>
                        <div className="col-span-1">Score</div>
                        <div className="col-span-1">Status</div>
                        <div className="col-span-2 text-right">Actions</div>
                    </div>
                    <div className="divide-y divide-slate-100 text-xs">
                        {logs.map(log => (
                            <div key={log.id} className="grid grid-cols-12 items-center px-6 py-4 hover:bg-slate-50">
                                <div className="col-span-3 font-bold text-slate-900">{log.employee_name || 'N/A'} <span className="block text-[11px] font-mono text-blue-600">{log.employee_id}</span></div>
                                <div className="col-span-3 font-semibold text-slate-800">{log.activity_type} <span className="block text-[11px] font-normal text-slate-400">{log.transaction_date?.split('T')[0]}</span></div>
                                <div className="col-span-2 text-slate-600">{log.department_name || 'N/A'}</div>
                                <div className="col-span-1 font-mono font-bold text-violet-600">{log.performance_score}%</div>
                                <div className="col-span-1"><span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${log.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{log.status}</span></div>
                                <div className="col-span-2 text-right flex justify-end gap-2">
                                    <button onClick={() => { setEditingLogId(log.id); setIsAddDrawerOpen(true); }} className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg cursor-pointer"><Edit3 size={14} /></button>
                                    <button onClick={() => handleDelete(log.id, log.activity_type)} className="p-1.5 bg-slate-50 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"><Trash2 size={14} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {logs.map(log => (
                        <div key={log.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-xs font-bold text-slate-900">{log.employee_name}</h3>
                                    <span className="text-[11px] font-mono font-bold text-blue-600">{log.activity_type}</span>
                                </div>
                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${log.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{log.status}</span>
                            </div>
                            <div className="text-xs text-slate-600 space-y-1">
                                <p>Dept: <strong>{log.department_name || 'N/A'}</strong></p>
                                <p>Score: <strong className="font-mono text-violet-600">{log.performance_score}%</strong></p>
                                <p className="text-[11px] text-slate-400 italic">{log.remarks || 'No remarks provided.'}</p>
                            </div>
                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                                <button onClick={() => { setEditingLogId(log.id); setIsAddDrawerOpen(true); }} className="px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-semibold rounded-xl flex items-center gap-1"><Edit3 size={13} /> Edit</button>
                                <button onClick={() => handleDelete(log.id, log.activity_type)} className="px-3 py-1.5 bg-rose-50 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-1"><Trash2 size={13} /> Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Slide-over Drawer */}
            {isAddDrawerOpen && (
                <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-2xs flex justify-end">
                    <div className="w-full md:w-1/2 bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden">
                        <div className="p-6 overflow-y-auto flex-1">
                            <AddEmployeeDashboardModal 
                                editId={editingLogId} 
                                activeCompanyId={activeCompanyId}
                                onClose={() => { setIsAddDrawerOpen(false); setEditingLogId(null); fetchDashboardLogs(searchQuery, statusFilter, currentPage, perPage); }} 
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeDashboard;