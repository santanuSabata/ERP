import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Upload, FileSpreadsheet, Trash2, Edit3, Eye, LayoutGrid, List, Building2, User, Calendar, ChevronLeft, ChevronRight, UserCheck, ChevronDown, Download, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/axios.js';
import AddLead from '../../components/crm/AddLead.jsx';
import ViewLead from '../../components/crm/ViewLead.jsx';

const Leads = () => {
    const navigate = useNavigate();
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState('table');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [insuranceFilter, setInsuranceFilter] = useState('All');
    const [agentFilter, setAgentFilter] = useState('All'); // 👈 Agent-wise filter state
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20); // Rows per page state (20, 50, 100, All)
    const [totalPages, setTotalPages] = useState(1);
    const [totalLeads, setTotalLeads] = useState(0);

    // Dropdown toggle state for Import/Export
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Bulk Selection & Assignment States
    const [selectedLeadIds, setSelectedLeadIds] = useState([]);
    const [bulkAgentId, setBulkAgentId] = useState('');
    const [agentUsers, setAgentUsers] = useState([]);

    // Modal & Drawer States
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [currentLeadId, setCurrentLeadId] = useState(null);
    const [employees, setEmployees] = useState([]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchLeads = async () => {
        try {
            setLoading(true);
            const queryLimit = limit === 'All' ? 10000 : limit;

            const res = await api.get('/leads', {
                params: { 
                    search, 
                    status: statusFilter, 
                    insuranceType: insuranceFilter, 
                    agentId: agentFilter === 'All' ? undefined : agentFilter, // 👈 Send agentId filter to backend
                    fromDate: fromDate || undefined, 
                    toDate: toDate || undefined, 
                    page, 
                    limit: queryLimit 
                }
            });
            if (res.data?.success) {
                setLeads(res.data.leads || []);
                setTotalPages(res.data.pagination?.totalPages || 1);
                setTotalLeads(res.data.pagination?.totalLeads || 0);
                setSelectedLeadIds([]); 
            }
        } catch (err) {
            console.error('Failed to fetch leads:', err);
            toast.error('Could not load leads data.');
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const res = await api.get('/employees').catch(async () => {
                try {
                    return await api.get('/hr/employees');
                } catch {
                    return await api.get('/users');
                }
            });

            const empData = res.data?.employees || res.data?.users || res.data?.data || res.data || [];
            const list = Array.isArray(empData) ? empData : [];
            setEmployees(list);

            const agents = list.filter(emp => {
                const roleName = emp.role || emp.designation || emp.role_name || '';
                return roleName.toLowerCase() === 'agent';
            });
            setAgentUsers(agents);
        } catch (e) {
            console.warn('⚠️ Employees endpoint returned an error. Defaulting to empty list.');
            setEmployees([]);
            setAgentUsers([]);
        }
    };

    useEffect(() => {
        fetchLeads();
        fetchEmployees();
    }, [search, statusFilter, insuranceFilter, agentFilter, fromDate, toDate, page, limit]);

    const getAgentName = (agentId) => {
        if (!agentId) return 'Unassigned';
        const emp = employees.find(e => e.id === agentId);
        return emp ? (emp.name || emp.full_name) : 'Assigned Agent';
    };

    const handleDeleteLead = async (id) => {
        if (!window.confirm('Are you sure you want to delete this lead?')) return;
        try {
            await api.delete(`/leads/${id}`);
            toast.success('Lead deleted successfully!');
            fetchLeads();
        } catch (err) {
            toast.error('Failed to delete lead.');
        }
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedLeadIds(leads.map(l => l.id));
        } else {
            setSelectedLeadIds([]);
        }
    };

    const handleSelectLead = (id) => {
        setSelectedLeadIds(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleBulkAssign = async () => {
        if (!bulkAgentId) {
            toast.error('Please select an Agent to assign.');
            return;
        }
        if (selectedLeadIds.length === 0) {
            toast.error('No leads selected.');
            return;
        }

        try {
            console.log(`🚀 Starting bulk assignment of ${selectedLeadIds.length} leads to Agent ID: ${bulkAgentId}`);

            const updatePromises = selectedLeadIds.map(async (id) => {
                try {
                    return await api.put(`/leads/${id}`, { 
                        agentId: bulkAgentId, 
                        agent_id: bulkAgentId 
                    });
                } catch (innerErr) {
                    console.error(`❌ Failed to update lead ID ${id}:`, innerErr);
                    throw innerErr;
                }
            });

            await Promise.all(updatePromises);

            toast.success(`Successfully assigned ${selectedLeadIds.length} leads to agent!`);
            setSelectedLeadIds([]);
            setBulkAgentId('');
            fetchLeads();
        } catch (err) {
            console.error('❌ Bulk assignment error:', err);
            toast.error('Failed to assign leads. Check server logs.');
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            const text = evt.target.result;
            const lines = text.split('\n');
            const parsedLeads = [];
            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue;
                const values = lines[i].split(',').map(v => v.trim());
                parsedLeads.push({
                    transaction_id: values[0] || `TXN-${Date.now()}-${i}`,
                    transaction_date: values[1] || new Date().toISOString().split('T')[0],
                    expiry_date: values[2] || null,
                    company_name: values[3] || 'Corporate Client',
                    contact_person: values[4] || 'Contact Person',
                    email: values[5] || '',
                    phone: values[6] || '9876543210',
                    insurance_type: values[7] || 'General Insurance',
                    policy_value: parseFloat(values[8]) || 100000,
                    transaction_type: values[9] || 'New Policy',
                    status: values[10] || 'New',
                    remarks: values[11] || ''
                });
            }

            try {
                const res = await api.post('/leads/bulk-upload', { leads: parsedLeads });
                if (res.data?.success) {
                    toast.success(res.data.message);
                    setIsUploadModalOpen(false);
                    fetchLeads();
                }
            } catch (err) {
                toast.error('CSV upload failed.');
            }
        };
        reader.readAsText(file);
    };

    const exportCSV = () => {
        let csvContent = "data:text/csv;charset=utf-8,Transaction ID,Date,Expiry Date,Company Name,Contact Person,Email,Phone,Insurance Type,Policy Value,Type,Status\n";
        leads.forEach(l => {
            csvContent += `"${l.transaction_id}","${l.transaction_date?.split('T')[0] || ''}","${l.expiry_date?.split('T')[0] || ''}","${l.company_name}","${l.contact_person}","${l.email}","${l.phone}","${l.insurance_type}",${l.policy_value},"${l.transaction_type}","${l.status}"\n`;
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "corporate_insurance_leads.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('CSV Exported successfully!');
    };

    const downloadSampleCSV = () => {
        const sampleContent = "Transaction ID,Date,Expiry Date,Company Name,Contact Person,Email,Phone,Insurance Type,Policy Value,Type,Status,Remarks\nTXN-1001,2026-06-01,2027-06-01,Apex Logistics,Rajesh Sharma,rajesh@apex.com,9898815579,Group Health Insurance,450000,Fresh,New,Sample corporate lead remarks";
        const encodedUri = encodeURI("data:text/csv;charset=utf-8," + sampleContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "sample_leads_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Sample CSV template downloaded!');
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Converted': return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-lg text-[11px]">Converted</span>;
            case 'Interested': return <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-bold rounded-lg text-[11px]">Interested</span>;
            case 'Contacted': return <span className="px-2.5 py-1 bg-amber-50 text-amber-700 font-bold rounded-lg text-[11px]">Contacted</span>;
            default: return <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-bold rounded-lg text-[11px]">New</span>;
        }
    };

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 space-y-6 pb-20 font-sans text-slate-900">
            {/* Header Title & Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs mt-4">
                <div>
                    <h1 className="text-lg font-black text-slate-900 tracking-tight">Corporate Insurance Leads</h1>
                    <p className="text-xs text-slate-400">Manage corporate insurance transactions, policy allocations, and agent assignments.</p>
                </div>
                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    
                    {/* Import / Export Dropdown Menu */}
                    <div className="relative" ref={dropdownRef}>
                        <button 
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                        >
                            <FileSpreadsheet size={14} /> Import / Export <ChevronDown size={13} />
                        </button>
                        
                        {isDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 py-2 text-xs space-y-0.5">
                                <button 
                                    onClick={() => { setIsUploadModalOpen(true); setIsDropdownOpen(false); }}
                                    className="w-full text-left px-4 py-2.5 text-slate-700 hover:bg-slate-50 font-semibold flex items-center gap-2 cursor-pointer"
                                >
                                    <Upload size={14} className="text-blue-600" /> Upload CSV
                                </button>
                                <button 
                                    onClick={() => { exportCSV(); setIsDropdownOpen(false); }}
                                    className="w-full text-left px-4 py-2.5 text-slate-700 hover:bg-slate-50 font-semibold flex items-center gap-2 cursor-pointer"
                                >
                                    <FileSpreadsheet size={14} className="text-emerald-600" /> Export CSV
                                </button>
                                <button 
                                    onClick={() => { downloadSampleCSV(); setIsDropdownOpen(false); }}
                                    className="w-full text-left px-4 py-2.5 text-slate-700 hover:bg-slate-50 font-semibold flex items-center gap-2 cursor-pointer border-t border-slate-100"
                                >
                                    <Download size={14} className="text-violet-600" /> Sample CSV Template
                                </button>
                            </div>
                        )}
                    </div>

                    <button 
                        onClick={() => { setCurrentLeadId(null); setIsDrawerOpen(true); }}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition cursor-pointer"
                    >
                        <Plus size={15} /> Add Lead
                    </button>
                </div>
            </div>

            {/* Search, Filters, Date Range Filter & View Toggle */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="relative flex-1 w-full max-w-sm">
                    <Search size={15} className="absolute left-3.5 top-3 text-slate-400" />
                    <input 
                        type="text" placeholder="Search by company, contact, phone, txn ID..." 
                        value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs w-full focus:outline-hidden" 
                    />
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
                    {/* From Date & To Date Range Inputs */}
                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
                        <Calendar size={13} className="text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase">From:</span>
                        <input 
                            type="date" 
                            value={fromDate} 
                            onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
                            className="bg-transparent font-semibold text-slate-700 cursor-pointer focus:outline-hidden" 
                        />
                        <span className="text-[10px] font-bold text-slate-500 uppercase ml-2">To:</span>
                        <input 
                            type="date" 
                            value={toDate} 
                            onChange={(e) => { setToDate(e.target.value); setPage(1); }}
                            className="bg-transparent font-semibold text-slate-700 cursor-pointer focus:outline-hidden" 
                        />
                        {(fromDate || toDate) && (
                            <button onClick={() => { setFromDate(''); setToDate(''); setPage(1); }} className="ml-1 text-[10px] text-rose-600 font-bold hover:underline cursor-pointer">Clear</button>
                        )}
                    </div>

                    {/* 👈 Agent-wise Filter Dropdown */}
                    <select 
                        value={agentFilter} 
                        onChange={(e) => { setAgentFilter(e.target.value); setPage(1); }}
                        className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                        <option value="All">All Agents</option>
                        {agentUsers.map(agent => (
                            <option key={agent.id} value={agent.id}>
                                {agent.name || agent.full_name}
                            </option>
                        ))}
                    </select>

                    <select 
                        value={insuranceFilter} onChange={(e) => { setInsuranceFilter(e.target.value); setPage(1); }}
                        className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                        <option value="All">All Insurance Types</option>
                        <option value="Group Health Insurance">Group Health Insurance</option>
                        <option value="Cyber Security Insurance">Cyber Security Insurance</option>
                        <option value="Commercial Liability">Commercial Liability</option>
                        <option value="Marine Cargo Insurance">Marine Cargo Insurance</option>
                        <option value="Directors & Officers Liability">Directors & Officers Liability</option>
                    </select>

                    <select 
                        value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                        className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                        <option value="All">All Status</option>
                        <option value="New">New</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Interested">Interested</option>
                        <option value="Converted">Converted</option>
                    </select>

                    {/* View Mode Toggle */}
                    <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                        <button onClick={() => setViewMode('table')} className={`p-2 rounded-lg text-xs transition cursor-pointer ${viewMode === 'table' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'}`} title="Table View">
                            <List size={14} />
                        </button>
                        <button onClick={() => setViewMode('card')} className={`p-2 rounded-lg text-xs transition cursor-pointer ${viewMode === 'card' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'}`} title="Card View">
                            <LayoutGrid size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Total Leads Count, Rows Per Page Selector & Bulk Assignment Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
                <div className="flex items-center gap-3 pl-2">
                    <span className="font-bold text-slate-600">
                        Total Leads Found: <strong className="text-slate-900 font-mono">{totalLeads}</strong> | Selected: <strong className="text-blue-600 font-mono">{selectedLeadIds.length}</strong>
                    </span>

                    {/* Rows Per Page Selector (20, 50, 100, All) */}
                    <div className="flex items-center gap-1.5 pl-4 border-l border-slate-300">
                        <span className="text-slate-500 font-semibold">Rows:</span>
                        <select 
                            value={limit} 
                            onChange={(e) => { setLimit(e.target.value === 'All' ? 'All' : Number(e.target.value)); setPage(1); }}
                            className="p-1.5 bg-white border border-slate-300 rounded-lg font-semibold cursor-pointer text-xs"
                        >
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                            <option value="All">All</option>
                        </select>
                    </div>
                </div>

                {/* Bulk Agent Assignment Widget */}
                {selectedLeadIds.length > 0 && (
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <select 
                            value={bulkAgentId} 
                            onChange={(e) => setBulkAgentId(e.target.value)}
                            className="p-2 bg-white border border-slate-300 rounded-xl font-semibold cursor-pointer text-xs"
                        >
                            <option value="">-- Assign to Agent (Role: Agent) --</option>
                            {agentUsers.map(agent => (
                                <option key={agent.id} value={agent.id}>
                                    {agent.name || agent.full_name} ({agent.email || 'Agent'})
                                </option>
                            ))}
                        </select>
                        <button 
                            onClick={handleBulkAssign}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                        >
                            <UserCheck size={14} /> Assign Selected
                        </button>
                    </div>
                )}
            </div>

            {/* Main Content View */}
            {loading ? (
                <div className="bg-white p-16 rounded-3xl border border-slate-200 text-center text-xs text-slate-400">Loading leads database...</div>
            ) : leads.length === 0 ? (
                <div className="bg-white p-16 rounded-3xl border border-slate-200 text-center text-xs text-slate-400">No corporate leads found for the selected filters.</div>
            ) : viewMode === 'table' ? (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
                    <div className="grid grid-cols-12 bg-slate-50 border-b border-slate-100 px-6 py-3.5 text-[11px] font-bold text-slate-500 uppercase items-center">
                        <div className="col-span-1 flex items-center gap-2">
                            <input 
                                type="checkbox" 
                                onChange={handleSelectAll} 
                                checked={leads.length > 0 && selectedLeadIds.length === leads.length} 
                                className="w-4 h-4 rounded border-slate-300 text-blue-600 cursor-pointer" 
                            />
                            <span>Select</span>
                        </div>
                        <div className="col-span-2">Txn ID & Date</div>
                        <div className="col-span-3">Company & Contact</div>
                        <div className="col-span-2">Insurance Type</div>
                        <div className="col-span-1">Status</div>
                        <div className="col-span-3 text-right">Actions</div>
                    </div>
                    <div className="divide-y divide-slate-100 text-xs">
                        {leads.map(lead => (
                            <div key={lead.id} className={`grid grid-cols-12 items-center px-6 py-4 hover:bg-slate-50 ${selectedLeadIds.includes(lead.id) ? 'bg-blue-50/40' : ''}`}>
                                <div className="col-span-1">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedLeadIds.includes(lead.id)} 
                                        onChange={() => handleSelectLead(lead.id)} 
                                        className="w-4 h-4 rounded border-slate-300 text-blue-600 cursor-pointer" 
                                    />
                                </div>
                                <div className="col-span-2">
                                    <strong className="text-slate-900 font-mono block">{lead.transaction_id}</strong>
                                    <span className="text-[11px] text-slate-400">{lead.transaction_date?.split('T')[0]}</span>
                                </div>
                                <div className="col-span-3">
                                    <strong className="text-slate-900 block flex items-center gap-1.5"><Building2 size={13} className="text-blue-600" />{lead.company_name}</strong>
                                    <span className="text-[11px] text-slate-500">{lead.contact_person} • {lead.phone}</span>
                                </div>
                                <div className="col-span-2">
                                    <div className="font-semibold text-slate-700">{lead.insurance_type}</div>
                                    <span className="text-[10px] text-violet-600 font-bold flex items-center gap-1 mt-0.5"><User size={11} /> {getAgentName(lead.agent_id)}</span>
                                </div>
                                <div className="col-span-1">{getStatusBadge(lead.status)}</div>
                                <div className="col-span-3 text-right flex items-center justify-end gap-1.5">
                                    <button onClick={() => { setCurrentLeadId(lead.id); setIsViewModalOpen(true); }} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer" title="View Details">
                                        <Eye size={14} />
                                    </button>
                                    <button onClick={() => { setCurrentLeadId(lead.id); setIsDrawerOpen(true); }} className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl cursor-pointer" title="Edit">
                                        <Edit3 size={14} />
                                    </button>
                                    <button onClick={() => handleDeleteLead(lead.id)} className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl cursor-pointer" title="Delete">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                /* Card View */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {leads.map(lead => (
                        <div key={lead.id} className={`bg-white p-6 rounded-3xl border shadow-2xs space-y-4 transition ${selectedLeadIds.includes(lead.id) ? 'border-blue-500 bg-blue-50/20' : 'border-slate-200 hover:border-blue-300'}`}>
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedLeadIds.includes(lead.id)} 
                                        onChange={() => handleSelectLead(lead.id)} 
                                        className="w-4 h-4 rounded border-slate-300 text-blue-600 cursor-pointer" 
                                    />
                                    <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">{lead.transaction_id}</span>
                                </div>
                                {getStatusBadge(lead.status)}
                            </div>
                            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5"><Building2 size={15} className="text-blue-600" />{lead.company_name}</h3>
                            <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                                <div className="flex justify-between"><span className="text-slate-400">Contact Person:</span> <strong className="text-slate-800">{lead.contact_person}</strong></div>
                                <div className="flex justify-between"><span className="text-slate-400">Phone:</span> <span className="font-mono">{lead.phone}</span></div>
                                <div className="flex justify-between"><span className="text-slate-400">Insurance Type:</span> <strong className="text-slate-800">{lead.insurance_type}</strong></div>
                                <div className="flex justify-between"><span className="text-slate-400">Assigned Agent:</span> <strong className="text-violet-600 flex items-center gap-1"><User size={12} /> {getAgentName(lead.agent_id)}</strong></div>
                                <div className="flex justify-between"><span className="text-slate-400">Policy Value:</span> <strong className="font-mono text-slate-900">₹{parseFloat(lead.policy_value || 0).toLocaleString()}</strong></div>
                                <div className="flex justify-between"><span className="text-slate-400">Expiry Date:</span> <span className="font-mono text-slate-700">{lead.expiry_date ? lead.expiry_date.split('T')[0] : 'N/A'}</span></div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                                <button onClick={() => { setCurrentLeadId(lead.id); setIsViewModalOpen(true); }} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs cursor-pointer">View</button>
                                <button onClick={() => { setCurrentLeadId(lead.id); setIsDrawerOpen(true); }} className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-xl text-xs cursor-pointer">Edit</button>
                                <button onClick={() => handleDeleteLead(lead.id)} className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-xl text-xs cursor-pointer">Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination Controls (Hidden when limit is 'All') */}
            {limit !== 'All' && totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                    <button 
                        onClick={() => setPage(prev => Math.max(prev - 1, 1))} 
                        disabled={page === 1}
                        className="px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer flex items-center gap-1"
                    >
                        <ChevronLeft size={14} /> Prev
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <button 
                            key={p} 
                            onClick={() => setPage(p)} 
                            className={`w-9 h-9 rounded-xl font-bold text-xs cursor-pointer transition ${page === p ? 'bg-blue-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                        >
                            {p}
                        </button>
                    ))}

                    <button 
                        onClick={() => setPage(prev => Math.min(prev + 1, totalPages))} 
                        disabled={page === totalPages}
                        className="px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer flex items-center gap-1"
                    >
                        Next <ChevronRight size={14} />
                    </button>
                </div>
            )}

            {/* Slide-over Drawer Component (Add/Edit) */}
            {isDrawerOpen && (
                <AddLead 
                    leadId={currentLeadId} 
                    onClose={() => setIsDrawerOpen(false)} 
                    onSuccess={() => { setIsDrawerOpen(false); fetchLeads(); }} 
                />
            )}

            {/* View Lead Modal */}
            {isViewModalOpen && currentLeadId && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-2xs flex justify-end">
                    <div className="w-screen md:w-[65vw] min-w-[700px] bg-white shadow-2xl min-h-screen flex flex-col relative animate-in slide-in-from-right duration-300">
                        <button 
                            onClick={() => setIsViewModalOpen(false)}
                            className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full z-10 transition cursor-pointer"
                        >
                            ✕
                        </button>
                        <div className="flex-1 overflow-y-auto">
                            <ViewLead leadId={currentLeadId} />
                        </div>
                    </div>
                </div>
            )}

            {/* CSV Upload Modal */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md p-6 rounded-3xl shadow-2xl space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-bold text-slate-900">Upload Leads CSV File</h2>
                            <button 
                                onClick={downloadSampleCSV}
                                className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                                <Download size={13} /> Sample CSV Template
                            </button>
                        </div>
                        <p className="text-xs text-slate-500">Upload a CSV file containing columns: Transaction ID, Date, Expiry Date, Company Name, Contact Person, Email, Phone, Insurance Type, Policy Value, Type, Status, Remarks.</p>
                        
                        <input type="file" accept=".csv" onChange={handleFileUpload} className="w-full p-3 border border-slate-200 rounded-xl text-xs bg-slate-50 cursor-pointer" />

                        <div className="flex justify-end gap-2 pt-2">
                            <button onClick={() => setIsUploadModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl cursor-pointer">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Leads;