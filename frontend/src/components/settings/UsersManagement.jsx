import { useState, useEffect } from 'react';
import { Search, Plus, ChevronLeft, ChevronRight, Edit3, Trash2, LayoutGrid, Table as TableIcon, Download, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/axios.js';
import AddUserModal from '../../components/settings/AddUser.jsx';

const UsersManagement = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');
    const [users, setUsers] = useState([]);
    const [activeCompanyId, setActiveCompanyId] = useState(() => localStorage.getItem('activeCompanyId') || 2);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('table');

    const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
    const [editingUserId, setEditingUserId] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);

    const ROLE_OPTIONS = [
        { value: 'All', label: 'All Roles' },
        { value: 'Admin', label: 'Admin' },
        { value: 'HR Manager', label: 'HR Manager' },
        { value: 'Teacher', label: 'Teacher' },
        { value: 'Staff', label: 'Staff' },
        { value: 'Accountant', label: 'Accountant' },
        { value: 'Agent', label: 'Agents' },
    ];

    const fetchUsers = async (search, role, page, limit) => {
        try {
            setLoading(true);
            // Updated to match standard /users endpoint
            const res = await api.get(`/users`, {
                params: {
                    companyId: activeCompanyId,
                    search: search || '',
                    role: role || 'All',
                    page,
                    limit
                }
            });
            if (res.data) {
                setUsers(res.data.data || res.data.users || []);
                setTotalCount(res.data.totalCount || 0);
            }
        } catch (err) {
            console.error('Failed to load users:', err);
            toast.error('Could not load users data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers(searchQuery, roleFilter, currentPage, perPage);
    }, [currentPage, perPage, roleFilter, activeCompanyId]);

    const handleSearchChange = (e) => {
        const val = e.target.value;
        setSearchQuery(val);
        setCurrentPage(1);
        fetchUsers(val, roleFilter, 1, perPage);
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete user "${name}"?`)) return;
        try {
            // Updated endpoint to match backend delete route
            await api.delete(`/users/${id}`);
            toast.success('User deleted successfully.');
            fetchUsers(searchQuery, roleFilter, currentPage, perPage);
        } catch (err) {
            console.error('Failed to delete user:', err);
            toast.error('Failed to delete user.');
        }
    };

    const handleExportCSV = () => {
        if (users.length === 0) return toast.error('No data to export.');
        const headers = ['ID', 'Full Name', 'Username', 'Email', 'Mobile', 'Role', 'Department', 'Status'];
        const rows = users.map(u => [u.id, `"${u.full_name || u.name}"`, u.username, u.email, u.mobile, u.role, `"${u.department_name || 'N/A'}"`, u.status]);
        const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const link = document.createElement('a');
        link.setAttribute('href', encodeURI(csv));
        link.setAttribute('download', 'users_export.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('CSV exported successfully!');
    };

    const totalPages = Math.ceil(totalCount / perPage) || 1;

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 space-y-6 pb-16 font-sans text-slate-900">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">Users & Roles Management</h1>
                    <p className="text-xs text-slate-400 mt-0.5">Manage system user accounts linked with employees and access roles.</p>
                </div>
                <button 
                    type="button" 
                    onClick={() => { setEditingUserId(null); setIsAddDrawerOpen(true); }} 
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition flex items-center gap-2 cursor-pointer shadow-sm"
                >
                    <Plus size={14} /> New User Account
                </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center gap-3 flex-1">
                    <div className="relative flex-1 max-w-md">
                        <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
                        <input type="text" placeholder="Search by name, username, email..." value={searchQuery} onChange={handleSearchChange} className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs w-full focus:outline-hidden" />
                    </div>
                    <select 
                        value={roleFilter} 
                        onChange={(e) => { 
                            setRoleFilter(e.target.value); 
                            setCurrentPage(1); 
                        }} 
                        className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                        {ROLE_OPTIONS.map((role) => (
                            <option key={role.value} value={role.value}>
                                {role.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button type="button" onClick={() => setViewMode('table')} className={`p-1.5 rounded-lg text-xs ${viewMode === 'table' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'}`}><TableIcon size={16} /></button>
                        <button type="button" onClick={() => setViewMode('card')} className={`p-1.5 rounded-lg text-xs ${viewMode === 'card' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'}`}><LayoutGrid size={16} /></button>
                    </div>
                    <button type="button" onClick={handleExportCSV} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer"><Download size={14} /> Export CSV</button>
                </div>
            </div>

            {loading ? (
                <div className="bg-white p-16 rounded-3xl border border-slate-200 text-center text-xs text-slate-400">Loading users...</div>
            ) : users.length === 0 ? (
                <div className="bg-white p-16 rounded-3xl border border-slate-200 text-center text-xs text-slate-400">No users found.</div>
            ) : viewMode === 'table' ? (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
                    <div className="grid grid-cols-12 bg-slate-50 border-b border-slate-100 px-6 py-3 text-[11px] font-bold text-slate-500 uppercase">
                        <div className="col-span-3">Full Name</div>
                        <div className="col-span-2">Username</div>
                        <div className="col-span-3">Department / Role</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-2 text-right">Actions</div>
                    </div>
                    <div className="divide-y divide-slate-100 text-xs">
                        {users.map(u => {
                            const isActive = u.status === 1 || u.status === '1' || u.status === 'Active' || u.status === true;
                            return (
                                <div key={u.id} className="grid grid-cols-12 items-center px-6 py-4 hover:bg-slate-50">
                                    <div className="col-span-3 font-bold text-slate-900">{u.full_name || u.name} <span className="block text-[11px] font-normal text-slate-400">{u.email}</span></div>
                                    <div className="col-span-2 font-mono font-bold text-blue-600">{u.username}</div>
                                    <div className="col-span-3 text-slate-600">{u.department_name || 'N/A'} <span className="block text-[11px] font-bold text-violet-600">{u.role}</span></div>
                                    <div className="col-span-2">
                                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                            {isActive ? 'Active' : 'Deactive'}
                                        </span>
                                    </div>
                                    <div className="col-span-2 text-right flex justify-end gap-2">
                                        <button type="button" onClick={() => { setEditingUserId(u.id); setIsAddDrawerOpen(true); }} className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg cursor-pointer" title="Edit User"><Edit3 size={14} /></button>
                                        <button type="button" onClick={() => handleDelete(u.id, u.full_name || u.name)} className="p-1.5 bg-slate-50 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer" title="Delete User"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {users.map(u => {
                        const isActive = u.status === 1 || u.status === '1' || u.status === 'Active' || u.status === true;
                        return (
                            <div key={u.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-xs font-bold text-slate-900">{u.full_name || u.name}</h3>
                                        <span className="text-[11px] font-mono font-bold text-blue-600">@{u.username}</span>
                                    </div>
                                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                        {isActive ? 'Active' : 'Deactive'}
                                    </span>
                                </div>
                                <div className="text-xs text-slate-600 space-y-1">
                                    <p>Email: <strong>{u.email}</strong></p>
                                    <p>Role: <strong className="text-violet-600">{u.role}</strong></p>
                                    <p>Dept: <strong>{u.department_name || 'N/A'}</strong></p>
                                </div>
                                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                                    <button type="button" onClick={() => { setEditingUserId(u.id); setIsAddDrawerOpen(true); }} className="px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-semibold rounded-xl flex items-center gap-1 cursor-pointer"><Edit3 size={13} /> Edit</button>
                                    <button type="button" onClick={() => handleDelete(u.id, u.full_name || u.name)} className="px-3 py-1.5 bg-rose-50 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-1 cursor-pointer"><Trash2 size={13} /> Delete</button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Slide-over Drawer */}
            {isAddDrawerOpen && (
                <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-2xs flex justify-end">
                    <div className="w-full md:w-1/2 bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden">
                        <div className="p-6 overflow-y-auto flex-1">
                            <AddUserModal 
                                editId={editingUserId} 
                                activeCompanyId={activeCompanyId}
                                onClose={() => { setIsAddDrawerOpen(false); setEditingUserId(null); fetchUsers(searchQuery, roleFilter, currentPage, perPage); }} 
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsersManagement;