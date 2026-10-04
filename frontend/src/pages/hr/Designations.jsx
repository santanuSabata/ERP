import { useState, useEffect } from 'react';
import { Search, Plus, ChevronLeft, ChevronRight, Edit3, Trash2, LayoutGrid, Table as TableIcon, Download, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/axios.js';
import AddDesignation from '../../components/hr/AddDesignation.jsx';

const Designations = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [designations, setDesignations] = useState([]);
    const [activeCompanyId, setActiveCompanyId] = useState(() => localStorage.getItem('activeCompanyId') || 2);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'

    // Slide-over & Modal States
    const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
    const [editingDesigId, setEditingDesigId] = useState(null);

    // Pagination States
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);

    const fetchDesignations = async (compId, search, page, limit) => {
        try {
            setLoading(true);
            const targetCompId = compId || activeCompanyId || 2;
            const res = await api.get(`/designations?companyId=${targetCompId}&search=${search || ''}&page=${page}&limit=${limit}`);
            if (res.data) {
                setDesignations(res.data.data || []);
                setTotalCount(res.data.totalCount || 0);
            }
        } catch (err) {
            console.error('❌ Failed to fetch designations:', err);
            toast.error('Could not load designations data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDesignations(activeCompanyId, searchQuery, currentPage, perPage);
    }, [activeCompanyId, currentPage, perPage]);

    const handleSearchChange = (e) => {
        const val = e.target.value;
        setSearchQuery(val);
        setCurrentPage(1);
        fetchDesignations(activeCompanyId, val, 1, perPage);
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete designation "${name}"?`)) return;
        try {
            await api.delete(`/designations/${id}`);
            toast.success('Designation deleted successfully.');
            fetchDesignations(activeCompanyId, searchQuery, currentPage, perPage);
        } catch (err) {
            console.error('❌ Delete failed:', err);
            toast.error('Failed to delete designation.');
        }
    };

    const handleExportCSV = () => {
        if (designations.length === 0) {
            toast.error('No data available to export.');
            return;
        }
        const headers = ['ID', 'Designation Name', 'Code', 'Department', 'Status'];
        const rows = designations.map(d => [d.id, `"${d.name}"`, d.code, `"${d.department_name || 'N/A'}"`, d.status]);
        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', 'designations_export.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('CSV exported successfully!');
    };

    const handleExportPDF = () => {
        toast.success('PDF export simulated successfully!');
    };

    const totalPages = Math.ceil(totalCount / perPage) || 1;

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 space-y-6 pb-16 relative font-sans text-slate-900">
            {/* Top Title Bar */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">Designations Management</h1>
                    <span className="h-5 w-5 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center">🛡️</span>
                </div>
                <div className="text-xs bg-slate-100 px-3 py-1.5 rounded-xl font-semibold text-slate-600">
                    Active Company ID: <span className="text-blue-600 font-bold">{activeCompanyId}</span>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                <div className="relative flex-1 max-w-md">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                        type="text"
                        placeholder="Search designations by name, code, or department..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-blue-500 w-full"
                    />
                </div>

                <div className="flex items-center gap-3">
                    {/* View Toggle */}
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${viewMode === 'table' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                            title="Table View"
                        >
                            <TableIcon size={16} />
                        </button>
                        <button
                            onClick={() => setViewMode('card')}
                            className={`p-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${viewMode === 'card' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                            title="Card View"
                        >
                            <LayoutGrid size={16} />
                        </button>
                    </div>

                    {/* Export Dropdown */}
                    <div className="relative group">
                        <button className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer">
                            <Download size={14} /> Export
                        </button>
                        <div className="absolute right-0 mt-1 w-36 bg-white border border-slate-200 rounded-xl shadow-xl py-1 hidden group-hover:block z-20">
                            <button onClick={handleExportCSV} className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50">Export CSV</button>
                            <button onClick={handleExportPDF} className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50">Export PDF</button>
                        </div>
                    </div>

                    {/* New Designation Button */}
                    <button
                        type="button"
                        onClick={() => { setEditingDesigId(null); setIsAddDrawerOpen(true); }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition flex items-center gap-2 shadow-sm shadow-blue-500/20 cursor-pointer"
                    >
                        <Plus size={14} /> New Designation
                    </button>
                </div>
            </div>

            {/* Content Display: Table or Card View */}
            {loading ? (
                <div className="bg-white p-16 rounded-3xl border border-slate-200 text-center text-xs text-slate-400">Loading designations...</div>
            ) : designations.length === 0 ? (
                <div className="bg-white p-16 rounded-3xl border border-slate-200 text-center text-xs text-slate-400">No designations found matching your search.</div>
            ) : viewMode === 'table' ? (
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden w-full">
                    <div className="grid grid-cols-12 bg-slate-50/70 border-b border-slate-100 px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <div className="col-span-3">Designation Name</div>
                        <div className="col-span-2">Code</div>
                        <div className="col-span-4">Department</div>
                        <div className="col-span-1">Status</div>
                        <div className="col-span-2 text-right">Actions</div>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {designations.map((desig) => (
                            <div key={desig.id} className="grid grid-cols-12 items-center px-6 py-4 hover:bg-slate-50/60 transition">
                                <div className="col-span-3 font-bold text-xs text-slate-900 flex items-center gap-2">
                                    <ShieldAlert size={15} className="text-violet-600 shrink-0" />
                                    <span className="truncate">{desig.name}</span>
                                </div>
                                <div className="col-span-2 text-xs font-mono font-bold text-slate-600">{desig.code}</div>
                                <div className="col-span-4 text-xs font-medium text-slate-700">{desig.department_name || 'Unassigned'}</div>
                                <div className="col-span-1">
                                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${desig.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                        {desig.status}
                                    </span>
                                </div>
                                <div className="col-span-2 text-right flex items-center justify-end gap-1.5">
                                    <button onClick={() => { setEditingDesigId(desig.id); setIsAddDrawerOpen(true); }} className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs rounded-lg transition cursor-pointer" title="Edit Designation">
                                        <Edit3 size={14} />
                                    </button>
                                    <button onClick={() => handleDelete(desig.id, desig.name)} className="p-1.5 text-slate-400 hover:text-rose-600 transition cursor-pointer bg-slate-50 rounded-lg" title="Delete Designation">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {designations.map((desig) => (
                        <div key={desig.id} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4 hover:shadow-md transition">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
                                        <ShieldAlert size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-bold text-slate-900">{desig.name}</h3>
                                        <span className="text-[11px] font-mono font-bold text-violet-600">{desig.code}</span>
                                    </div>
                                </div>
                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${desig.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                    {desig.status}
                                </span>
                            </div>

                            <p className="text-xs text-slate-500 line-clamp-2">{desig.description || 'No description provided.'}</p>

                            <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-100">
                                <span className="text-slate-500">Dept: <strong className="text-slate-800">{desig.department_name || 'N/A'}</strong></span>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button onClick={() => { setEditingDesigId(desig.id); setIsAddDrawerOpen(true); }} className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold rounded-xl transition cursor-pointer flex items-center gap-1">
                                    <Edit3 size={13} /> Edit
                                </button>
                                <button onClick={() => handleDelete(desig.id, desig.name)} className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl transition cursor-pointer flex items-center gap-1">
                                    <Trash2 size={13} /> Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination Footer */}
            <div className="flex items-center justify-between bg-white px-6 py-4 rounded-2xl border border-slate-200/80 shadow-2xs text-xs">
                <span className="font-semibold text-slate-600">Showing page {currentPage} of {totalPages} ({totalCount} total designations)</span>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                    >
                        <ChevronLeft size={14} />
                    </button>
                    <span className="font-bold text-slate-700">{currentPage} / {totalPages}</span>
                    <button 
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                    >
                        <ChevronRight size={14} />
                    </button>
                </div>
            </div>

            {/* SLIDE-OVER: ADD / EDIT DESIGNATION */}
            {isAddDrawerOpen && (
                <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-2xs flex justify-end transition-opacity">
                    <div className="w-full md:w-1/2 bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden">
                        <div className="p-6 overflow-y-auto flex-1">
                            <AddDesignation 
                                editId={editingDesigId} 
                                activeCompanyId={activeCompanyId}
                                onClose={() => {
                                    setIsAddDrawerOpen(false);
                                    setEditingDesigId(null);
                                    fetchDesignations(activeCompanyId, searchQuery, currentPage, perPage);
                                }} 
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Designations;