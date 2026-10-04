import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
    Users, 
    Briefcase, 
    FileText, 
    Receipt, 
    IndianRupee, 
    ArrowRight, 
    UserPlus, 
    PlusCircle, 
    FolderPlus, 
    BarChart3, 
    Leaf,
    Calendar,
    ArrowUpRight
} from 'lucide-react';
import api from '../lib/axios.js';
import { API_PATHS } from '../utils/apiPaths.js';
import { useAuth } from '../context/AuthContext.jsx';
import Spinner from '../components/Spinner.jsx';

const Dashboard = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false); // Set to true when connected to live APIs

    // Fallback/Demo data matching your exact layout screenshot
    const stats = {
        totalCustomers: { count: 248, delta: '+12%' },
        totalProjects: { count: 186, delta: '+8%' },
        totalQuotations: { count: 142, delta: '+15%' },
        totalInvoices: { count: 98, delta: '+10%' },
        totalRevenue: { amount: '₹ 48,75,000', delta: '+20%' },
        installedCapacity: '2.48 MW',
    };

    const recentCustomers = [
        { id: 1, name: 'Ravi Kumar', mobile: '9876543210', location: 'Bhubaneswar, Odisha', status: 'Active', initials: 'RK', color: 'bg-blue-100 text-blue-600' },
        { id: 2, name: 'Priya Singh', mobile: '9123456780', location: 'Cuttack, Odisha', status: 'Active', initials: 'PS', color: 'bg-purple-100 text-purple-600' },
        { id: 3, name: 'Amit Verma', mobile: '8765432109', location: 'Sambalpur, Odisha', status: 'Pending', initials: 'AV', color: 'bg-amber-100 text-amber-600' },
        { id: 4, name: 'Neha Patel', mobile: '7654321098', location: 'Rourkela, Odisha', status: 'Active', initials: 'NP', color: 'bg-emerald-100 text-emerald-600' },
        { id: 5, name: 'Suresh Yadav', mobile: '6543210987', location: 'Puri, Odisha', status: 'In Progress', initials: 'SY', color: 'bg-sky-100 text-sky-600' },
    ];

    const topProducts = [
        { name: 'Solar Panel (550W)', qty: 48, revenue: '₹ 28,80,000' },
        { name: 'Inverter (5kW)', qty: 32, revenue: '₹ 12,80,000' },
        { name: 'Battery (Lithium)', qty: 21, revenue: '₹ 10,50,000' },
        { name: 'Mounting Structure', qty: 18, revenue: '₹ 5,40,000' },
        { name: 'Cables & Accessories', qty: 45, revenue: '₹ 3,15,000' },
    ];

    const recentActivities = [
        { title: 'New customer added', desc: 'Ravi Kumar (2 kW)', time: '2 hours ago', icon: Users, color: 'text-emerald-500 bg-emerald-50' },
        { title: 'Quotation approved', desc: '#QT-2025-089', time: '4 hours ago', icon: FileText, color: 'text-blue-500 bg-blue-50' },
        { title: 'Project completed', desc: 'Sunil Sharma (5 kW)', time: '6 hours ago', icon: Briefcase, color: 'text-purple-500 bg-purple-50' },
        { title: 'Payment received', desc: '₹ 1,50,000 - INV-2025-042', time: '7 hours ago', icon: IndianRupee, color: 'text-amber-500 bg-amber-50' },
        { title: 'New invoice generated', desc: '#INV-2025-098', time: '8 hours ago', icon: Receipt, color: 'text-violet-500 bg-violet-50' },
    ];

    const projectStatusCounts = [
        { label: 'Completed', count: 68, color: 'bg-emerald-500' },
        { label: 'In Progress', count: 52, color: 'bg-blue-500' },
        { label: 'Pending', count: 15, color: 'bg-amber-400' },
        { label: 'On Hold', count: 7, color: 'bg-orange-500' },
        { label: 'Cancelled', count: 4, color: 'bg-slate-400' },
    ];

    if (loading) {
        return (
            <div className="flex justify-center py-16">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-10">
            {/* 1. Welcome Hero Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-50 via-white to-sky-50/40 border border-slate-100 p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xs">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                        Welcome, {user?.name || 'Santanu Kumar Sabata'} 👋
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Here&apos;s what&apos;s happening with your solar business today.
                    </p>
                </div>
                <div className="flex items-center gap-4 bg-white/80 backdrop-blur-md px-4 py-3 rounded-2xl border border-slate-100 shadow-2xs">
                    <div className="flex items-center gap-2 text-xs text-slate-600 font-medium border-r border-slate-200 pr-4">
                        <Calendar size={15} className="text-slate-400" />
                        <div>
                            <div className="font-bold text-slate-900">25 Sep 2025</div>
                            <div className="text-[10px] text-slate-400">Thursday</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 pl-1">
                        <div className="h-8 w-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <Leaf size={16} />
                        </div>
                        <div>
                            <div className="text-[10px] text-slate-400 leading-tight">Total Installed Capacity</div>
                            <div className="text-sm font-bold text-emerald-600">{stats.installedCapacity}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Top KPI Metric Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Total Customers */}
                <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-2xs flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-3">
                        <div className="h-10 w-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Users size={20} />
                        </div>
                        <span className="inline-flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            <ArrowUpRight size={12} className="mr-0.5" /> {stats.totalCustomers.delta}
                        </span>
                    </div>
                    <div>
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Customers</div>
                        <div className="text-2xl font-bold text-slate-900 mt-1">{stats.totalCustomers.count}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">vs. last month</div>
                    </div>
                </div>

                {/* Total Projects */}
                <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-2xs flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-3">
                        <div className="h-10 w-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <Briefcase size={20} />
                        </div>
                        <span className="inline-flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            <ArrowUpRight size={12} className="mr-0.5" /> {stats.totalProjects.delta}
                        </span>
                    </div>
                    <div>
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Projects</div>
                        <div className="text-2xl font-bold text-slate-900 mt-1">{stats.totalProjects.count}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">vs. last month</div>
                    </div>
                </div>

                {/* Total Quotations */}
                <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-2xs flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-3">
                        <div className="h-10 w-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                            <FileText size={20} />
                        </div>
                        <span className="inline-flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            <ArrowUpRight size={12} className="mr-0.5" /> {stats.totalQuotations.delta}
                        </span>
                    </div>
                    <div>
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Quotations</div>
                        <div className="text-2xl font-bold text-slate-900 mt-1">{stats.totalQuotations.count}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">vs. last month</div>
                    </div>
                </div>

                {/* Total Invoices */}
                <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-2xs flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-3">
                        <div className="h-10 w-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                            <Receipt size={20} />
                        </div>
                        <span className="inline-flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            <ArrowUpRight size={12} className="mr-0.5" /> {stats.totalInvoices.delta}
                        </span>
                    </div>
                    <div>
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Invoices</div>
                        <div className="text-2xl font-bold text-slate-900 mt-1">{stats.totalInvoices.count}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">vs. last month</div>
                    </div>
                </div>

                {/* Total Revenue */}
                <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-2xs flex flex-col justify-between sm:col-span-2 lg:col-span-1">
                    <div className="flex items-center justify-between mb-3">
                        <div className="h-10 w-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
                            <IndianRupee size={20} />
                        </div>
                        <span className="inline-flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            <ArrowUpRight size={12} className="mr-0.5" /> {stats.totalRevenue.delta}
                        </span>
                    </div>
                    <div>
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Revenue</div>
                        <div className="text-xl font-bold text-slate-900 mt-1">{stats.totalRevenue.amount}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">vs. last month</div>
                    </div>
                </div>
            </div>

            {/* 3. Middle Grid: Sales & Revenue Overview, Project Status, Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Sales & Revenue Chart Area */}
                <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-100 p-6 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-base font-bold text-slate-900 tracking-tight">Sales & Revenue Overview</h2>
                            <p className="text-xs text-slate-400 mt-0.5">Monthly breakdown</p>
                        </div>
                        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl text-xs font-medium">
                            <button className="px-3 py-1 bg-violet-600 text-white rounded-lg shadow-2xs">Revenue</button>
                            <button className="px-3 py-1 text-slate-600 hover:text-slate-900">Projects</button>
                            <button className="px-3 py-1 text-slate-600 hover:text-slate-900">Customers</button>
                        </div>
                    </div>
                    {/* Simulated Chart Container */}
                    <div className="h-56 flex items-end justify-between gap-3 pt-6 px-2 border-b border-slate-100">
                        {['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'].map((m, i) => {
                            const heights = ['35%', '45%', '50%', '55%', '70%', '95%'];
                            const isSep = m === 'Sep';
                            return (
                                <div key={m} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group relative">
                                    {isSep && (
                                        <div className="absolute -top-10 bg-slate-900 text-white text-[11px] font-bold px-2.5 py-1 rounded-xl shadow-md whitespace-nowrap z-10">
                                            Sep ₹ 48,75,000
                                        </div>
                                    )}
                                    <div 
                                        className={`w-full rounded-t-xl transition-all duration-300 ${isSep ? 'bg-violet-600' : 'bg-violet-500/80 hover:bg-violet-600'}`}
                                        style={{ height: heights[i] }}
                                    />
                                    <span className="text-xs font-medium text-slate-500">{m}</span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex items-center justify-center gap-6 mt-4 text-xs font-medium text-slate-600">
                        <div className="flex items-center gap-2">
                            <span className="h-3 w-3 rounded-full bg-violet-600" />
                            <span>Revenue (₹)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="h-3 w-3 rounded-full bg-emerald-500" />
                            <span>Projects</span>
                        </div>
                    </div>
                </div>

                {/* Project Status Donut Breakdown */}
                <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-100 p-6 flex flex-col justify-between">
                    <div>
                        <h2 className="text-base font-bold text-slate-900 tracking-tight">Project Status</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Current operational breakdown</p>
                    </div>

                    <div className="relative my-4 flex items-center justify-center">
                        <div className="h-36 w-36 rounded-full border-8 border-slate-100 flex flex-col items-center justify-center relative">
                            <div className="absolute inset-0 rounded-full border-8 border-emerald-500 border-t-transparent border-r-transparent -rotate-45" />
                            <span className="text-2xl font-extrabold text-slate-900">186</span>
                            <span className="text-[10px] uppercase font-bold text-slate-400">Total Projects</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {projectStatusCounts.map((item) => (
                            <div key={item.label} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                    <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                                    <span className="text-slate-600 font-medium">{item.label}</span>
                                </div>
                                <span className="font-bold text-slate-900">{item.count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions Grid */}
                <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-100 p-6 flex flex-col justify-between">
                    <div>
                        <h2 className="text-base font-bold text-slate-900 tracking-tight">Quick Actions</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Frequently used shortcuts</p>
                    </div>

                    <div className="grid grid-cols-3 gap-3 my-4">
                        <button className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 hover:bg-violet-50 hover:text-violet-600 text-slate-700 transition border border-slate-100 group">
                            <div className="h-10 w-10 rounded-xl bg-white shadow-2xs flex items-center justify-center text-violet-600 mb-2 group-hover:scale-105 transition">
                                <UserPlus size={18} />
                            </div>
                            <span className="text-xs font-semibold text-center leading-tight">Add Customer</span>
                        </button>

                        <button className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 hover:bg-violet-50 hover:text-violet-600 text-slate-700 transition border border-slate-100 group">
                            <div className="h-10 w-10 rounded-xl bg-white shadow-2xs flex items-center justify-center text-blue-600 mb-2 group-hover:scale-105 transition">
                                <FileText size={18} />
                            </div>
                            <span className="text-xs font-semibold text-center leading-tight">Create Quotation</span>
                        </button>

                        <button className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 hover:bg-violet-50 hover:text-violet-600 text-slate-700 transition border border-slate-100 group">
                            <div className="h-10 w-10 rounded-xl bg-white shadow-2xs flex items-center justify-center text-emerald-600 mb-2 group-hover:scale-105 transition">
                                <FolderPlus size={18} />
                            </div>
                            <span className="text-xs font-semibold text-center leading-tight">New Project</span>
                        </button>

                        <button className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 hover:bg-violet-50 hover:text-violet-600 text-slate-700 transition border border-slate-100 group">
                            <div className="h-10 w-10 rounded-xl bg-white shadow-2xs flex items-center justify-center text-purple-600 mb-2 group-hover:scale-105 transition">
                                <Receipt size={18} />
                            </div>
                            <span className="text-xs font-semibold text-center leading-tight">Generate Invoice</span>
                        </button>

                        <button className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 hover:bg-violet-50 hover:text-violet-600 text-slate-700 transition border border-slate-100 group">
                            <div className="h-10 w-10 rounded-xl bg-white shadow-2xs flex items-center justify-center text-teal-600 mb-2 group-hover:scale-105 transition">
                                <PlusCircle size={18} />
                            </div>
                            <span className="text-xs font-semibold text-center leading-tight">Record Payment</span>
                        </button>

                        <button className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 hover:bg-violet-50 hover:text-violet-600 text-slate-700 transition border border-slate-100 group">
                            <div className="h-10 w-10 rounded-xl bg-white shadow-2xs flex items-center justify-center text-amber-600 mb-2 group-hover:scale-105 transition">
                                <BarChart3 size={18} />
                            </div>
                            <span className="text-xs font-semibold text-center leading-tight">View Reports</span>
                        </button>
                    </div>

                    <div className="text-[11px] text-slate-400 text-center">
                        Securely encrypted & backed up real-time.
                    </div>
                </div>
            </div>

            {/* 4. Bottom Grid: Recent Customers, Top Products, Recent Activities */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Recent Customers Table */}
                <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-100 p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-base font-bold text-slate-900 tracking-tight">Recent Customers</h2>
                        <Link to="/customers" className="text-xs font-semibold text-violet-600 hover:text-violet-700 transition">
                            View All
                        </Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                                    <th className="pb-3 pl-1">Name</th>
                                    <th className="pb-3">Mobile</th>
                                    <th className="pb-3">Location</th>
                                    <th className="pb-3">Status</th>
                                    <th className="pb-3 text-right pr-1">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {recentCustomers.map((c) => (
                                    <tr key={c.id} className="hover:bg-slate-50/50 transition">
                                        <td className="py-3 pl-1">
                                            <div className="flex items-center gap-2">
                                                <div className={`h-7 w-7 rounded-lg font-bold text-[10px] flex items-center justify-center shrink-0 ${c.color}`}>
                                                    {c.initials}
                                                </div>
                                                <span className="font-semibold text-slate-900 truncate max-w-[100px]">{c.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 text-slate-600">{c.mobile}</td>
                                        <td className="py-3 text-slate-500 truncate max-w-[120px]">{c.location}</td>
                                        <td className="py-3">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                                c.status === 'Active' ? 'bg-emerald-50 text-emerald-600' :
                                                c.status === 'Pending' ? 'bg-amber-50 text-amber-600' : 'bg-sky-50 text-sky-600'
                                            }`}>
                                                {c.status}
                                            </span>
                                        </td>
                                        <td className="py-3 text-right pr-1">
                                            <button className="text-violet-600 hover:underline font-semibold">View</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Top Products */}
                <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-100 p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-base font-bold text-slate-900 tracking-tight">Top Products</h2>
                        <Link to="/products" className="text-xs font-semibold text-violet-600 hover:text-violet-700 transition">
                            View All
                        </Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                                    <th className="pb-3 pl-1">Product</th>
                                    <th className="pb-3 text-center">Qty Sold</th>
                                    <th className="pb-3 text-right pr-1">Revenue</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {topProducts.map((p, index) => (
                                    <tr key={index} className="hover:bg-slate-50/50 transition">
                                        <td className="py-3 pl-1 font-semibold text-slate-900 truncate max-w-[140px]">{p.name}</td>
                                        <td className="py-3 text-center text-slate-600 font-medium">{p.qty}</td>
                                        <td className="py-3 text-right pr-1 font-bold text-slate-900">{p.revenue}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Activities Log */}
                <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-100 p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-base font-bold text-slate-900 tracking-tight">Recent Activities</h2>
                        <span className="text-xs font-semibold text-violet-600 cursor-pointer hover:underline">View All</span>
                    </div>
                    <div className="space-y-3.5">
                        {recentActivities.map((act, index) => {
                            const IconComponent = act.icon;
                            return (
                                <div key={index} className="flex items-start gap-3">
                                    <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${act.color}`}>
                                        <IconComponent size={15} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-slate-900 truncate">{act.title}</p>
                                        <p className="text-[11px] text-slate-500 truncate">{act.desc}</p>
                                    </div>
                                    <span className="text-[10px] text-slate-400 shrink-0 pt-0.5">{act.time}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;