import { useState, useEffect } from 'react';
import { Search, Users, PhoneCall, CheckCircle, Clock, LogOut, RefreshCw, LayoutDashboard, UserCheck, Briefcase, CalendarCheck, FileText, BarChart3, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/axios.js';
import { useNavigate } from 'react-router-dom';

const AgentDashboard = () => {
    const navigate = useNavigate();
    const [agent, setAgent] = useState(null);
    const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'leads' | 'followups' | 'policies' | 'reports' | 'profile'

    const [leads, setLeads] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    const [activeLead, setActiveLead] = useState(null);
    const [newStatus, setNewStatus] = useState('New');
    const [newRemarks, setNewRemarks] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // 🔒 Protect Dashboard: Check session on mount
    useEffect(() => {
        const storedAgent = localStorage.getItem('agentUser');
        if (!storedAgent) {
            toast.error('Session expired. Please log in.');
            navigate('/agent', { replace: true });
            return;
        }
        try {
            const parsedAgent = JSON.parse(storedAgent);
            setAgent(parsedAgent);
        } catch (e) {
            localStorage.removeItem('agentUser');
            navigate('/agent', { replace: true });
        }
    }, [navigate]);

    const fetchAgentLeads = async () => {
        try {
            const currentAgent = agent || JSON.parse(localStorage.getItem('agentUser') || '{}');
            const agentId = currentAgent.employeeId || currentAgent.id;
            if (!agentId) return;

            setLoading(true);
            const res = await api.get('/agent/leads', {
                params: { agentId, status: statusFilter, search: searchQuery }
            });

            if (res.data?.success) {
                setLeads(res.data.leads || []);
                setStats(res.data.stats || {});
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

    const handleUpdateStatusSubmit = async (e) => {
        e.preventDefault();
        if (!activeLead) return;

        try {
            const res = await api.put(`/agent/leads/${activeLead.id}`, {
                leadStatus: newStatus,
                remarks: newRemarks
            });

            if (res.data?.success) {
                toast.success('Lead status updated successfully!');
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
        navigate('/agent', { replace: true });
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
        <div className="w-full px-4 sm:px-6 lg:px-8 space-y-6 pb-20 font-sans text-slate-900 bg-slate-50 min-h-screen">
            
            {/* Header Navigation Bar */}
            <div className="bg-white px-6 py-4 rounded-3xl border border-slate-200/80 shadow-2xs mt-4 flex flex-col lg:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-6 w-full lg:w-auto justify-between lg:justify-start">
                    <div>
                        <h1 className="text-sm font-extrabold text-slate-900">Agent Insurance Portal</h1>
                        <p className="text-[11px] text-slate-400">Welcome back, {agent.name || 'Agent'}</p>
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
                                <div className="col-span-3">Company & Contact</div>
                                <div className="col-span-3">Insurance Type</div>
                                <div className="col-span-2">Policy Value</div>
                                <div className="col-span-2">Status</div>
                                <div className="col-span-2 text-right">Actions</div>
                            </div>
                            <div className="divide-y divide-slate-100 text-xs">
                                {leads.map(lead => (
                                    <div key={lead.id} className="grid grid-cols-12 items-center px-6 py-4 hover:bg-slate-50">
                                        <div className="col-span-3">
                                            <strong className="text-slate-900 block flex items-center gap-1.5"><Building2 size={13} className="text-blue-600" />{lead.company_name}</strong>
                                            <span className="text-[11px] text-slate-500">{lead.contact_person} • {lead.phone}</span>
                                        </div>
                                        <div className="col-span-3 font-semibold text-slate-700">{lead.insurance_type}</div>
                                        <div className="col-span-2 font-mono font-bold text-slate-900">₹{parseFloat(lead.policy_value || 0).toLocaleString()}</div>
                                        <div className="col-span-2">{getStatusBadge(lead.status || lead.lead_status)}</div>
                                        <div className="col-span-2 text-right">
                                            <button 
                                                onClick={() => { setActiveLead(lead); setNewStatus(lead.status || lead.lead_status); setNewRemarks(lead.remarks || ''); setIsModalOpen(true); }}
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
                                    <strong className="text-slate-900">{lead.company_name}</strong> ({lead.contact_person} - {lead.phone})
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
                                    <strong className="text-slate-900">{lead.company_name}</strong> - {lead.insurance_type}
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
                            {agent.name ? agent.name.charAt(0).toUpperCase() : 'A'}
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-900">{agent.name}</h2>
                            <span className="text-xs text-violet-600 font-semibold">{agent.role || 'Agent'}</span>
                        </div>
                    </div>
                    <div className="space-y-4 text-xs text-slate-600">
                        <div className="flex justify-between py-2 border-b border-slate-50">
                            <span className="text-slate-400">Agent ID / Employee ID</span>
                            <span className="font-mono font-bold text-slate-900">{agent.employeeId || agent.id}</span>
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
        </div>
    );
};

export default AgentDashboard;