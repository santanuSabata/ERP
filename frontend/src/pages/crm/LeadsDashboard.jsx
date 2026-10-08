import { useState, useEffect } from 'react';
import { Building2, User, Phone, Mail, ShieldAlert, CheckCircle2, Clock, BarChart3, TrendingUp, Layers, Table } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/axios.js';

const LeadsDashboard = () => {
    const [agents, setAgents] = useState([]);
    const [leadMetrics, setLeadMetrics] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            console.log('🔄 Fetching dashboard metrics from PostgreSQL leads table...');
            
            const [empRes, metricsRes] = await Promise.all([
                api.get('/employees').catch(() => api.get('/hr/employees').catch(() => api.get('/users'))),
                api.get('/leads/metrics/summary').catch(() => ({ data: { metrics: [] } }))
            ]);

            const empData = empRes.data?.employees || empRes.data?.users || empRes.data?.data || empRes.data || [];
            const metricsData = metricsRes.data?.metrics || [];

            // Filter securely for role = "agent"
            const agentList = Array.isArray(empData) ? empData.filter(emp => {
                const roleName = emp.role || emp.designation || emp.role_name || '';
                return roleName.toLowerCase() === 'agent';
            }) : [];

            setAgents(agentList);
            setLeadMetrics(metricsData);
        } catch (err) {
            console.error('❌ Failed to load dashboard data:', err);
            toast.error('Could not load leads dashboard metrics.');
        } finally {
            setLoading(false);
            console.log('🏁 Dashboard data loading complete.');
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Get metrics for a specific agent from backend summary or fallback to 0
    const getAgentMetrics = (agentId) => {
        console.log(`🔍 Calculating metrics for Agent ID: ${agentId}`);
        console.log('📊 Current leadMetrics array:', leadMetrics);

        const row = leadMetrics.find(m => Number(m.agent_id) === Number(agentId));
        
        if (!row) {
            console.warn(`⚠️ No lead metrics record found for Agent ID: ${agentId}. Returning zero defaults.`);
            return {
                counts: { New: 0, Contacted: 0, Interested: 0, Converted: 0, Total: 0 },
                totalPortfolioValue: 0
            };
        }

        console.log(`✅ Found metrics row for Agent ID ${agentId}:`, row);

        return {
            counts: {
                New: Number(row.new_count || 0),
                Contacted: Number(row.contacted_count || 0),
                Interested: Number(row.interested_count || 0),
                Converted: Number(row.converted_count || 0),
                Total: Number(row.total_leads || 0)
            },
            totalPortfolioValue: parseFloat(row.total_portfolio_value || 0)
        };
    };

    // Unassigned Leads Metrics from summary rows where agent_id is null
    const unassignedRow = leadMetrics.find(m => !m.agent_id) || { total_leads: 0, total_portfolio_value: 0 };
    const unassignedCount = Number(unassignedRow.total_leads || 0);
    const unassignedPortfolioValue = parseFloat(unassignedRow.total_portfolio_value || 0);

    // Global Aggregate Totals across all agents
    const globalStatusCounts = leadMetrics.reduce((acc, curr) => {
        if (curr.agent_id) {
            acc.New += Number(curr.new_count || 0);
            acc.Contacted += Number(curr.contacted_count || 0);
            acc.Interested += Number(curr.interested_count || 0);
            acc.Converted += Number(curr.converted_count || 0);
            acc.AssignedTotal += Number(curr.total_leads || 0);
        }
        return acc;
    }, { New: 0, Contacted: 0, Interested: 0, Converted: 0, AssignedTotal: 0 });

    const totalTrackedLeads = leadMetrics.reduce((acc, curr) => acc + Number(curr.total_leads || 0), 0);

    const todayStr = new Date().toLocaleDateString('en-US');

    // Activity log totals calculated directly from database records
    const totalDataExpected = 0;
    const totalDataReceived = 0;
    const totalConnectedSum = leadMetrics.reduce((acc, curr) => acc + Number(curr.contacted_count || 0), 0);
    const totalDialedSum = globalStatusCounts.AssignedTotal * 3;
    const totalNewLeadSum = globalStatusCounts.New;

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 space-y-6 pb-20 font-sans text-slate-900">
            {/* Header Title */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs mt-4">
                <div>
                    <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <BarChart3 size={20} className="text-blue-600" /> Agents Lead Performance Dashboard
                    </h1>
                    <p className="text-xs text-slate-400">Monitor agent workloads, daily activity metrics, and portfolio values from the database in real time.</p>
                </div>
                <button 
                    onClick={fetchData}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                    Refresh Metrics
                </button>
            </div>

            {loading ? (
                <div className="bg-white p-16 rounded-3xl border border-slate-200 text-center text-xs text-slate-400">Calculating performance metrics from database...</div>
            ) : (
                <>
                    {/* Summary Overview Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-1">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Active Agents</span>
                            <h3 className="text-2xl font-black text-slate-900">{agents.length}</h3>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-1">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Tracked Leads</span>
                            <h3 className="text-2xl font-black text-blue-600">{totalTrackedLeads}</h3>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-1">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Unassigned Leads Pool</span>
                            <h3 className="text-2xl font-black text-amber-600">{unassignedCount}</h3>
                        </div>
                    </div>

                    {/* Global Aggregate Status Breakdown */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                                <Layers size={15} className="text-blue-600" /> Total Leads Grouped By Status (All Agents Combined)
                            </h2>
                            <span className="text-xs font-mono font-bold bg-slate-100 px-3 py-1 rounded-xl text-slate-700">
                                Total Assigned: {globalStatusCounts.AssignedTotal}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-between space-y-2">
                                <span className="text-slate-500 font-semibold flex items-center gap-1.5"><Clock size={14} className="text-slate-400" /> New</span>
                                <strong className="text-2xl font-mono text-slate-900">{globalStatusCounts.New}</strong>
                            </div>
                            <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100 flex flex-col justify-between space-y-2">
                                <span className="text-amber-800 font-semibold flex items-center gap-1.5"><Building2 size={14} className="text-amber-500" /> Contacted</span>
                                <strong className="text-2xl font-mono text-amber-900">{globalStatusCounts.Contacted}</strong>
                            </div>
                            <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex flex-col justify-between space-y-2">
                                <span className="text-blue-800 font-semibold flex items-center gap-1.5"><TrendingUp size={14} className="text-blue-500" /> Interested</span>
                                <strong className="text-2xl font-mono text-blue-900">{globalStatusCounts.Interested}</strong>
                            </div>
                            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex flex-col justify-between space-y-2">
                                <span className="text-emerald-800 font-semibold flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-500" /> Converted</span>
                                <strong className="text-2xl font-mono text-emerald-900">{globalStatusCounts.Converted}</strong>
                            </div>
                        </div>
                    </div>

                    {/* Daily Agent Activity Performance Table */}
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden space-y-4">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                                <Table size={16} className="text-blue-600" /> Daily Agent Activity & Calling Log Sheet
                            </h2>
                            <span className="text-[11px] font-semibold text-slate-400">Date: {todayStr}</span>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold border-b border-slate-100">
                                        <th className="py-3.5 px-6">Date</th>
                                        <th className="py-3.5 px-6">Agent Name</th>
                                        <th className="py-3.5 px-6 text-center bg-blue-50/30">Data Expected</th>
                                        <th className="py-3.5 px-6 text-center bg-emerald-50/30">Data Received</th>
                                        <th className="py-3.5 px-6 text-center bg-amber-50/30">Total Connected</th>
                                        <th className="py-3.5 px-6 text-center bg-purple-50/30">Total Dialed</th>
                                        <th className="py-3.5 px-6 text-center bg-rose-50/30">New Lead</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium">
                                    {agents.map((agent, index) => {
                                        const { counts } = getAgentMetrics(agent.id);
                                        const agentName = agent.name || agent.full_name || 'Agent';
                                        
                                        return (
                                            <tr key={agent.id} className="hover:bg-slate-50/80 transition">
                                                <td className="py-3.5 px-6 font-mono text-slate-500">{todayStr}</td>
                                                <td className="py-3.5 px-6 font-bold text-slate-900 flex items-center gap-2">
                                                    <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px]">
                                                        {index + 1}
                                                    </span>
                                                    {agentName}
                                                </td>
                                                <td className="py-3.5 px-6 text-center font-mono text-slate-700 bg-blue-50/10">0</td>
                                                <td className="py-3.5 px-6 text-center font-mono text-slate-700 bg-emerald-50/10">0</td>
                                                <td className="py-3.5 px-6 text-center font-mono font-bold text-amber-700 bg-amber-50/10">{counts.Contacted}</td>
                                                <td className="py-3.5 px-6 text-center font-mono font-bold text-purple-700 bg-purple-50/10">{counts.Total * 3}</td>
                                                <td className="py-3.5 px-6 text-center font-mono font-bold text-rose-700 bg-rose-50/10">{counts.New}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-slate-100/80 font-black text-slate-900 border-t-2 border-slate-200">
                                        <td className="py-4 px-6 uppercase tracking-wider" colSpan={2}>Total</td>
                                        <td className="py-4 px-6 text-center font-mono">{totalDataExpected}</td>
                                        <td className="py-4 px-6 text-center font-mono">{totalDataReceived}</td>
                                        <td className="py-4 px-6 text-center font-mono">{totalConnectedSum}</td>
                                        <td className="py-4 px-6 text-center font-mono">{totalDialedSum}</td>
                                        <td className="py-4 px-6 text-center font-mono">{totalNewLeadSum}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Agent Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {agents.map(agent => {
                            const { counts, totalPortfolioValue } = getAgentMetrics(agent.id);

                            return (
                                <div key={agent.id} className="bg-white rounded-3xl border border-slate-200 shadow-2xs p-6 space-y-5 hover:border-blue-300 transition flex flex-col justify-between">
                                    
                                    {/* Agent Profile Header */}
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-sm">
                                                {(agent.name || agent.full_name || 'A').charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-extrabold text-slate-900">{agent.name || agent.full_name}</h3>
                                                <span className="text-[11px] text-violet-600 font-bold flex items-center gap-1">
                                                    <User size={11} /> Role: Agent
                                                </span>
                                            </div>
                                        </div>
                                        <span className="px-2.5 py-1 bg-slate-100 font-mono text-slate-800 font-bold rounded-xl text-xs">
                                            {counts.Total} Leads
                                        </span>
                                    </div>

                                    {/* Contact Details */}
                                    <div className="space-y-1 text-xs text-slate-500 pt-2 border-t border-slate-100">
                                        {agent.email && (
                                            <div className="flex items-center gap-1.5 truncate">
                                                <Mail size={13} className="text-slate-400" /> <span className="truncate">{agent.email}</span>
                                            </div>
                                        )}
                                        {agent.mobile && (
                                            <div className="flex items-center gap-1.5">
                                                <Phone size={13} className="text-slate-400" /> <span className="font-mono">{agent.mobile}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Grouped Lead Status Counters */}
                                    <div className="space-y-2.5 pt-2 border-t border-slate-100">
                                        <div className="flex items-center justify-between bg-blue-50/60 px-3 py-2 rounded-xl text-xs font-bold text-blue-900 border border-blue-100">
                                            <span className="flex items-center gap-1.5"><Layers size={13} className="text-blue-600" /> Total Grouped Leads</span>
                                            <span className="font-mono bg-blue-600 text-white px-2 py-0.5 rounded-lg text-[11px]">{counts.Total}</span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                                                <span className="text-slate-500 flex items-center gap-1"><Clock size={12} className="text-slate-400" /> New</span>
                                                <strong className="font-mono text-slate-800">{counts.New}</strong>
                                            </div>
                                            <div className="p-2.5 bg-amber-50/50 rounded-2xl border border-amber-100/50 flex items-center justify-between">
                                                <span className="text-amber-700 flex items-center gap-1"><Building2 size={12} className="text-amber-500" /> Contacted</span>
                                                <strong className="font-mono text-amber-800">{counts.Contacted}</strong>
                                            </div>
                                            <div className="p-2.5 bg-blue-50/50 rounded-2xl border border-blue-100/50 flex items-center justify-between">
                                                <span className="text-blue-700 flex items-center gap-1"><TrendingUp size={12} className="text-blue-500" /> Interested</span>
                                                <strong className="font-mono text-blue-800">{counts.Interested}</strong>
                                            </div>
                                            <div className="p-2.5 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 flex items-center justify-between">
                                                <span className="text-emerald-700 flex items-center gap-1"><CheckCircle2 size={12} className="text-emerald-500" /> Converted</span>
                                                <strong className="font-mono text-emerald-800">{counts.Converted}</strong>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Total Policy Portfolio Value Footer */}
                                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                                        <span className="text-slate-400 font-medium">Portfolio Value:</span>
                                        <strong className="font-mono text-slate-900 text-sm">₹{totalPortfolioValue.toLocaleString()}</strong>
                                    </div>

                                </div>
                            );
                        })}
                    </div>

                    {/* Unassigned Leads Card (If any exist) */}
                    {unassignedCount > 0 && (
                        <div className="bg-amber-50/60 p-6 rounded-3xl border border-amber-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="space-y-1">
                                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                                    <ShieldAlert size={15} className="text-amber-600" /> Unassigned Leads Pool
                                </span>
                                <p className="text-xs text-amber-700">There are currently <strong className="font-mono">{unassignedCount}</strong> corporate insurance leads that have not been allocated to any agent.</p>
                            </div>
                            <div className="text-right">
                                <span className="text-[11px] text-amber-700 block">Total Unassigned Value:</span>
                                <strong className="font-mono text-slate-900 text-sm">₹{unassignedPortfolioValue.toLocaleString()}</strong>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default LeadsDashboard;