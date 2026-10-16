import React, { useState, useEffect } from 'react';
import { Search, Users, PhoneCall, CheckCircle, Clock, LogOut, RefreshCw, LayoutDashboard, UserCheck, Briefcase, CalendarCheck, FileText, BarChart3, Building2, Eye, X, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/axios.js';
import { useNavigate } from 'react-router-dom';
import LeadViewRm from '../../components/crm/ViewLeadRm.jsx';

const RmDashboard = () => {
    const navigate = useNavigate();
    const [agent, setAgent] = useState(null);
    const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'leads' | 'followups' | 'policies' | 'reports' | 'profile'
    const [viewingLeadId, setViewingLeadId] = useState(null);

    const [leads, setLeads] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    const [activeLead, setActiveLead] = useState(null);
    const [newStatus, setNewStatus] = useState('New');
    const [newLeadStageId, setNewLeadStageId] = useState('');
    const [leadStages, setLeadStages] = useState([]);
    const [newRemarks, setNewRemarks] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Attendance Clock State
    const [isClockedIn, setIsClockedIn] = useState(false);

    // Calendar View State
    const [calendarView, setCalendarView] = useState('Month'); // 'Day' | 'Week' | 'Month'

    // 🔒 Protect Dashboard: Check session on mount
    useEffect(() => {
        const storedAgent = localStorage.getItem('agentUser');
        if (!storedAgent) {
            toast.error('Session expired. Please log in.');
            navigate('/rm', { replace: true });
            return;
        }
        try {
            const parsedAgent = JSON.parse(storedAgent);
            setAgent(parsedAgent);
        } catch (e) {
            localStorage.removeItem('agentUser');
            navigate('/rm', { replace: true });
        }
    }, [navigate]);

    // 👈 Fetch CRM Lead Stages for the dropdown
    const fetchLeadStages = async () => {
        const defaultStages = [
            { id: 1, name: 'New' },
            { id: 2, name: 'Contacted' },
            { id: 3, name: 'Interested' },
            { id: 4, name: 'Converted' },
            { id: 5, name: 'Closed' }
        ];

        try {
            const res = await api.get('/crm-settings/meta/lead-stages').catch(async () => {
                return await api.get('/lead-stages');
            });

            const stagesData = res.data?.data || res.data?.stages || res.data || [];
            if (Array.isArray(stagesData) && stagesData.length > 0) {
                setLeadStages(stagesData);
            } else {
                setLeadStages(defaultStages);
            }
        } catch (e) {
            setLeadStages(defaultStages);
        }
    };

    useEffect(() => {
        fetchLeadStages();
    }, []);

    const fetchAgentLeads = async () => {
        try {
            const currentAgent = agent || JSON.parse(localStorage.getItem('agentUser') || '{}');
            const rmId = currentAgent.id || currentAgent.employeeId;
            if (!rmId) return;

            setLoading(true);
            const res = await api.get('/rm/leads', {
                params: { rmId, status: statusFilter, search: searchQuery }
            });

            if (res.data?.success) {
                const fetchedLeads = res.data.leads || [];
                const fetchedStats = res.data.stats || {};
                
                setLeads(fetchedLeads);
                setStats(fetchedStats);

                // Auto-assign up to 10 unassigned leads if current assigned leads < 10
                if (fetchedLeads.length < 10) {
                    try {
                        const unassignedRes = await api.get('/leads', { params: { assignmentStatus: 'Unassigned', limit: 10 - fetchedLeads.length } });
                        const unassignedLeads = unassignedRes.data?.leads || [];

                        if (unassignedLeads.length > 0) {
                            const assignPromises = unassignedLeads.map(lead => 
                                api.put(`/leads/${lead.id}`, { agentId: rmId, agent_id: rmId })
                            );
                            await Promise.all(assignPromises);
                            
                            const refetchRes = await api.get('/rm/leads', { params: { rmId, status: statusFilter, search: searchQuery } });
                            if (refetchRes.data?.success) {
                                setLeads(refetchRes.data.leads || []);
                                setStats(refetchRes.data.stats || {});
                            }
                            toast.success(`Automatically assigned ${unassignedLeads.length} new leads to your portfolio!`);
                        }
                    } catch (autoAssignErr) {
                        console.warn('Auto-assignment background check skipped:', autoAssignErr);
                    }
                }
            }
        } catch (err) {
            console.error('Failed to load agent leads:', err);
            toast.error('Could not load assigned leads.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (agent) {
            fetchAgentLeads();
        }
    }, [statusFilter, searchQuery, agent]);

    const handleAttendanceAction = async (actionType) => {
        try {
            const rmId = agent?.id;
            if (!rmId) return;

            const res = await api.post('/attendance/clock', {
                agent_id: rmId,
                user_id: rmId,
                action: actionType // 'IN' or 'OUT'
            });

            if (res.status === 200 || res.data?.success) {
                if (actionType === 'IN') {
                    setIsClockedIn(true);
                    toast.success('Clocked In successfully and recorded in attendance!');
                } else {
                    setIsClockedIn(false);
                    toast.success('Clocked Out successfully and recorded!');
                }
            } else {
                toast.error(res.data?.error || 'Failed to record attendance.');
            }
        } catch (err) {
            console.error('Attendance error:', err);
            toast.error(err.response?.data?.error || 'Failed to communicate with attendance server.');
        }
    };

    const handleUpdateStatusSubmit = async (e) => {
        e.preventDefault();
        if (!activeLead) return;

        try {
            const res = await api.put(`/rm/leads/${activeLead.id}`, {
                leadStatus: newStatus,
                lead_stage_id: newLeadStageId ? parseInt(newLeadStageId, 10) : null,
                remarks: newRemarks
            });

            if (res.data?.success) {
                toast.success('Lead status and stage updated successfully!');
                setIsModalOpen(false);
                fetchAgentLeads();
            }
        } catch (err) {
            toast.error('Failed to update status.');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('agentUser');
        toast.success('Logged out successfully.');
        navigate('/rm', { replace: true });
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Converted': return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-lg text-[11px]">Converted</span>;
            case 'Interested': return <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-bold rounded-lg text-[11px]">Interested</span>;
            case 'Contacted': return <span className="px-2.5 py-1 bg-amber-50 text-amber-700 font-bold rounded-lg text-[11px]">Contacted</span>;
            default: return <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-bold rounded-lg text-[11px]">New</span>;
        }
    };

    if (!agent) return null;

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 space-y-6 pb-20 font-sans text-slate-900 bg-slate-50 min-h-screen relative">
            
            {/* Header Navigation Bar */}
            <div className="bg-white px-6 py-4 rounded-3xl border border-slate-200/80 shadow-2xs mt-4 flex flex-col lg:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-6 w-full lg:w-auto justify-between lg:justify-start">
                    <div>
                        <h1 className="text-sm font-extrabold text-slate-900">RM Portal</h1>
                        <p className="text-[11px] text-slate-500 font-medium">
                            Welcome back, <strong className="text-slate-900">{agent.name || agent.full_name || 'Agent'}</strong>{' '}
                            <span className="text-violet-600 font-mono font-bold">(ID: #{agent.id})</span>
                        </p>
                    </div>

                    {/* Navigation Menu Tabs */}
                    <div className="flex flex-wrap bg-slate-100 p-1.5 rounded-2xl gap-1">
                        <button 
                            onClick={() => setActiveTab('dashboard')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${activeTab === 'dashboard' ? 'bg-white text-violet-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                            <LayoutDashboard size={14} /> Dashboard
                        </button>
                        <button 
                            onClick={() => setActiveTab('leads')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${activeTab === 'leads' ? 'bg-white text-violet-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                            <Briefcase size={14} /> Assigned Leads ({leads.length})
                        </button>
                        <button 
                            onClick={() => setActiveTab('followups')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${activeTab === 'followups' ? 'bg-white text-violet-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                            <CalendarCheck size={14} /> Follow-ups
                        </button>
                        <button 
                            onClick={() => setActiveTab('policies')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${activeTab === 'policies' ? 'bg-white text-violet-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                            <FileText size={14} /> Converted Policies
                        </button>
                        <button 
                            onClick={() => setActiveTab('reports')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${activeTab === 'reports' ? 'bg-white text-violet-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                            <BarChart3 size={14} /> Reports
                        </button>
                        <button 
                            onClick={() => setActiveTab('profile')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${activeTab === 'profile' ? 'bg-white text-violet-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                            <UserCheck size={14} /> Profile
                        </button>
                    </div>
                </div>

                <button onClick={handleLogout} className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer transition">
                    <LogOut size={14} /> Logout
                </button>
            </div>

            {/* TAB 1: DASHBOARD OVERVIEW */}
            {activeTab === 'dashboard' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
                            <div>
                                <span className="text-slate-400 text-xs block font-semibold">Total Assigned</span>
                                <h3 className="text-xl font-extrabold text-slate-900 mt-1">{stats.total_leads || 0}</h3>
                            </div>
                            <div className="p-3 bg-violet-50 text-violet-600 rounded-2xl"><Users size={20} /></div>
                        </div>
                        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
                            <div>
                                <span className="text-slate-400 text-xs block font-semibold">New Leads</span>
                                <h3 className="text-xl font-extrabold text-blue-600 mt-1">{stats.new_leads || 0}</h3>
                            </div>
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Clock size={20} /></div>
                        </div>
                        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
                            <div>
                                <span className="text-slate-400 text-xs block font-semibold">Interested</span>
                                <h3 className="text-xl font-extrabold text-amber-600 mt-1">{stats.interested_leads || 0}</h3>
                            </div>
                            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><PhoneCall size={20} /></div>
                        </div>
                        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
                            <div>
                                <span className="text-slate-400 text-xs block font-semibold">Converted</span>
                                <h3 className="text-xl font-extrabold text-emerald-600 mt-1">{stats.converted_leads || 0}</h3>
                            </div>
                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><CheckCircle size={20} /></div>
                        </div>
                    </div>

                    {/* Attendance & Announcement Cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
                            <h3 className="text-sm font-extrabold text-slate-900">Mark Attendance</h3>
                            <div className="flex items-center justify-between pt-2">
                                <p className="text-xs text-slate-400 font-medium">My Office Time: 09:00 to 18:00</p>
                                <div className="flex items-center gap-3">
                                    <button 
                                        type="button"
                                        onClick={() => handleAttendanceAction('IN')}
                                        disabled={isClockedIn}
                                        className={`px-6 py-2.5 rounded-xl text-xs font-bold tracking-wider transition shadow-sm cursor-pointer ${
                                            isClockedIn 
                                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' 
                                                : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                                        }`}
                                    >
                                        CLOCK IN
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => handleAttendanceAction('OUT')}
                                        disabled={!isClockedIn}
                                        className={`px-6 py-2.5 rounded-xl text-xs font-bold tracking-wider transition shadow-sm cursor-pointer ${
                                            !isClockedIn 
                                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' 
                                                : 'bg-rose-400 hover:bg-rose-500 text-white'
                                        }`}
                                    >
                                        CLOCK OUT
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
                            <h3 className="text-sm font-extrabold text-slate-900">Announcement List</h3>
                            <div className="border-t border-slate-100 pt-3 text-center py-6 text-xs text-slate-400">
                                There is no Announcement List
                            </div>
                        </div>
                    </div>

                    {/* EVENT CALENDAR & MEETING LIST SECTION */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
                            <h3 className="text-sm font-extrabold text-slate-900">Event</h3>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                                <div className="flex items-center gap-1.5">
                                    <button className="p-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl transition cursor-pointer"><ChevronLeft size={14} /></button>
                                    <button className="p-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl transition cursor-pointer"><ChevronRight size={14} /></button>
                                    <button className="px-3 py-1.5 bg-teal-600/80 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition cursor-pointer">Today</button>
                                </div>
                                <h4 className="text-sm font-black text-slate-800 tracking-wide">OCTOBER 2026</h4>
                                <div className="flex bg-slate-100 p-1 rounded-xl gap-1 text-xs font-bold">
                                    {['Day', 'Week', 'Month'].map(v => (
                                        <button 
                                            key={v}
                                            onClick={() => setCalendarView(v)}
                                            className={`px-3 py-1 rounded-lg transition cursor-pointer ${calendarView === v ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                                        >
                                            {v}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="border border-slate-100 rounded-2xl overflow-hidden text-xs">
                                <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-100 text-center font-bold text-slate-500 py-2 text-[10px] uppercase">
                                    <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
                                </div>
                                <div className="grid grid-cols-7 text-center divide-x divide-y divide-slate-100 text-slate-700 font-medium">
                                    <div className="p-3 text-slate-300">27</div><div className="p-3 text-slate-300">28</div><div className="p-3 text-slate-300">29</div><div className="p-3 text-slate-300">30</div><div className="p-3">1</div><div className="p-3">2</div><div className="p-3">3</div>
                                    <div className="p-3">4</div><div className="p-3">5</div><div className="p-3">6</div><div className="p-3">7</div><div className="p-3">8</div><div className="p-3">9</div><div className="p-3">10</div>
                                    <div className="p-3 bg-amber-50 font-bold text-amber-800">11</div><div className="p-3">12</div><div className="p-3">13</div><div className="p-3">14</div><div className="p-3">15</div><div className="p-3">16</div><div className="p-3">17</div>
                                    <div className="p-3">18</div><div className="p-3">19</div><div className="p-3">20</div><div className="p-3">21</div><div className="p-3">22</div><div className="p-3">23</div><div className="p-3">24</div>
                                    <div className="p-3">25</div><div className="p-3">26</div><div className="p-3">27</div><div className="p-3">28</div><div className="p-3">29</div><div className="p-3">30</div><div className="p-3">31</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4 flex flex-col justify-between">
                            <h3 className="text-sm font-extrabold text-slate-900">Meeting List</h3>
                            <div className="border-t border-slate-100 pt-6 text-center py-20 text-xs text-slate-400">
                                No meeting scheduled yet.
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
                        <h2 className="text-sm font-bold text-slate-900">Corporate Insurance Performance Summary</h2>
                        <p className="text-xs text-slate-400">Track your assigned corporate leads, policy values, and follow-up schedules using the navigation tabs above.</p>
                    </div>
                </div>
            )}

            {/* TAB 2: ASSIGNED LEADS MANAGEMENT */}
            {activeTab === 'leads' && (
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                        <div className="relative flex-1 w-full max-w-md">
                            <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
                            <input 
                                type="text" placeholder="Search by company, contact person, phone..." 
                                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs w-full focus:outline-hidden" 
                            />
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <select 
                                value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                                className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
                            >
                                <option value="All">All Status</option>
                                <option value="New">New</option>
                                <option value="Contacted">Contacted</option>
                                <option value="Interested">Interested</option>
                                <option value="Converted">Converted</option>
                            </select>
                            <button onClick={fetchAgentLeads} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer" title="Refresh">
                                <RefreshCw size={16} className="text-slate-600" />
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="bg-white p-16 rounded-3xl border border-slate-200 text-center text-xs text-slate-400">Loading assigned corporate leads...</div>
                    ) : leads.length === 0 ? (
                        <div className="bg-white p-16 rounded-3xl border border-slate-200 text-center text-xs text-slate-400">No corporate leads assigned to you.</div>
                    ) : (
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
                            <div className="grid grid-cols-12 bg-slate-50 border-b border-slate-100 px-6 py-3 text-[11px] font-bold text-slate-500 uppercase">
                                {/* 👈 Added Lead ID Column Header */}
                                <div className="col-span-2">Lead ID</div>
                                <div className="col-span-3">Company & Contact</div>
                                <div className="col-span-2">Insurance Type</div>
                                <div className="col-span-2">Lead Stage</div>
                                <div className="col-span-1">Status</div>
                                <div className="col-span-2 text-right">Actions</div>
                            </div>
                            <div className="divide-y divide-slate-100 text-xs">
                                {leads.map(lead => (
                                    <div key={lead.id} className="grid grid-cols-12 items-center px-6 py-4 hover:bg-slate-50">
                                        {/* 👈 Added Lead ID / Transaction ID Column Value */}
                                        <div className="col-span-2">
                                            <strong className="text-slate-900 font-mono block">{lead.transaction_id || `LEAD-${lead.id}`}</strong>
                                            <span className="text-[10px] text-slate-400 font-mono">ID: #{lead.id}</span>
                                        </div>
                                        <div className="col-span-3">
                                            <strong className="text-slate-900 block flex items-center gap-1.5"><Building2 size={13} className="text-blue-600" />{lead.company_name}</strong>
                                            <span className="text-[11px] text-slate-500">{lead.contact_person} | {lead.phone}</span>
                                        </div>
                                        <div className="col-span-2 font-semibold text-slate-700">{lead.insurance_type}</div>
                                        <div className="col-span-2">
                                            <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-semibold rounded-lg text-[11px]">
                                                {lead.lead_stage_name || '-'}
                                            </span>
                                        </div>
                                        <div className="col-span-1">{getStatusBadge(lead.status || lead.lead_status)}</div>
                                        <div className="col-span-2 text-right flex items-center justify-end gap-1.5">
                                            <button 
                                                onClick={() => setViewingLeadId(lead.id)}
                                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
                                                title="View Lead Details"
                                            >
                                                <Eye size={14} />
                                            </button>
                                            <button 
                                                onClick={() => { 
                                                    setActiveLead(lead); 
                                                    setNewStatus(lead.status || lead.lead_status || 'New'); 
                                                    setNewLeadStageId(lead.lead_stage_id ? String(lead.lead_stage_id) : ''); 
                                                    setNewRemarks(lead.remarks || ''); 
                                                    setIsModalOpen(true); 
                                                }}
                                                className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl text-xs transition cursor-pointer shadow-xs"
                                            >
                                                Update Status
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 3: FOLLOW-UPS */}
            {activeTab === 'followups' && (
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
                    <h2 className="text-sm font-bold text-slate-900">Scheduled Client Follow-ups</h2>
                    <p className="text-xs text-slate-400">Manage callbacks and corporate insurance inquiries marked as 'Contacted' or 'Interested'.</p>
                    <div className="divide-y divide-slate-100">
                        {leads.filter(l => (l.status || l.lead_status) === 'Contacted' || (l.status || l.lead_status) === 'Interested').map(lead => (
                            <div key={lead.id} className="py-3 flex justify-between items-center text-xs">
                                <div>
                                    <strong className="text-slate-900 cursor-pointer hover:underline" onClick={() => setViewingLeadId(lead.id)}>{lead.company_name}</strong> ({lead.contact_person} | {lead.phone})
                                    <p className="text-[11px] text-slate-400 mt-0.5">Remarks: {lead.remarks || 'No remarks added.'}</p>
                                </div>
                                <span className="px-2.5 py-1 bg-amber-50 text-amber-700 font-bold rounded-lg text-[10px]">{lead.status || lead.lead_status}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB 4: CONVERTED POLICIES */}
            {activeTab === 'policies' && (
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
                    <h2 className="text-sm font-bold text-slate-900">Successfully Converted Policies</h2>
                    <p className="text-xs text-slate-400">List of corporate insurance leads successfully converted and bound.</p>
                    <div className="divide-y divide-slate-100">
                        {leads.filter(l => (l.status || l.lead_status) === 'Converted').map(lead => (
                            <div key={lead.id} className="py-3 flex justify-between items-center text-xs">
                                <div>
                                    <strong className="text-slate-900 cursor-pointer hover:underline" onClick={() => setViewingLeadId(lead.id)}>{lead.company_name}</strong> | {lead.insurance_type}
                                    <p className="text-[11px] text-slate-400 font-mono">Value: ₹{parseFloat(lead.policy_value || 0).toLocaleString()} | Phone: {lead.phone}</p>
                                </div>
                                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-lg text-[10px]">Converted</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB 5: REPORTS */}
            {activeTab === 'reports' && (
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
                    <h2 className="text-sm font-bold text-slate-900">Performance Analytics & Conversion Rate</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <span className="text-xs text-slate-400 font-semibold">Total Leads Assigned</span>
                            <h4 className="text-lg font-bold text-slate-900 mt-1">{stats.total_leads || 0}</h4>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <span className="text-xs text-slate-400 font-semibold">Policies Converted</span>
                            <h4 className="text-lg font-bold text-emerald-600 mt-1">{stats.converted_leads || 0}</h4>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <span className="text-xs text-slate-400 font-semibold">Conversion Success Rate</span>
                            <h4 className="text-lg font-bold text-violet-600 mt-1">
                                {stats.total_leads ? Math.round((stats.converted_leads / stats.total_leads) * 100) : 0}%
                            </h4>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 6: AGENT PROFILE */}
            {activeTab === 'profile' && (
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-2xs max-w-xl mx-auto space-y-6">
                    <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                        <div className="w-16 h-16 bg-violet-100 text-violet-600 rounded-2xl flex items-center justify-center text-xl font-bold">
                            {(agent.name || agent.full_name || 'A').charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-900">{agent.name || agent.full_name}</h2>
                            <span className="text-xs text-violet-600 font-semibold">{agent.role || 'Agent'}</span>
                        </div>
                    </div>
                    <div className="space-y-4 text-xs text-slate-600">
                        <div className="flex justify-between py-2 border-b border-slate-50">
                            <span className="text-slate-400">Agent ID</span>
                            <span className="font-mono font-bold text-slate-900">{agent.id}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-50">
                            <span className="text-slate-400">Mobile Number</span>
                            <span className="font-mono font-bold text-slate-900">{agent.mobile || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between py-2">
                            <span className="text-slate-400">Account Status</span>
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-md">Active</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Update Status Modal */}
            {isModalOpen && activeLead && (
                <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md p-6 rounded-3xl shadow-2xl space-y-4">
                        <h2 className="text-sm font-bold text-slate-900">Update Lead: {activeLead.company_name}</h2>
                        
                        <form onSubmit={handleUpdateStatusSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700">Lead Status</label>
                                <select 
                                    value={newStatus} onChange={(e) => setNewStatus(e.target.value)}
                                    className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-white font-semibold cursor-pointer"
                                >
                                    <option value="New">New</option>
                                    <option value="Contacted">Contacted</option>
                                    <option value="Interested">Interested</option>
                                    <option value="Converted">Converted</option>
                                    <option value="Closed">Closed</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700">Lead Stage</label>
                                <select 
                                    value={newLeadStageId} 
                                    onChange={(e) => setNewLeadStageId(e.target.value)}
                                    className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-white font-semibold cursor-pointer"
                                >
                                    <option value="">-- Select Lead Stage --</option>
                                    {leadStages.map(stage => (
                                        <option key={stage.id} value={stage.id}>{stage.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700">Remarks / Follow-up Notes</label>
                                <textarea 
                                    rows={3} value={newRemarks} onChange={(e) => setNewRemarks(e.target.value)}
                                    placeholder="Enter conversation notes..."
                                    className="w-full p-3 text-xs border border-slate-200 rounded-xl"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer">Cancel</button>
                                <button type="submit" className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* SLIDE DRAWER FOR LEAD DETAILS (75% Width) */}
            {viewingLeadId && (
                <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
                    <div className="w-full lg:w-3/4 bg-white h-full shadow-2xl flex flex-col overflow-y-auto animate-in slide-in-from-right duration-300">
                        {/* Drawer Header Bar */}
                        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-2xs">
                            <h2 className="text-xs font-black uppercase text-slate-800 tracking-wider">Lead Details Preview</h2>
                            <button 
                                onClick={() => setViewingLeadId(null)}
                                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                                title="Close Drawer"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Drawer Body Content */}
                        <div className="flex-1 p-4 sm:p-6 bg-slate-50">
                            <LeadViewRm leadId={viewingLeadId} />
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default RmDashboard;