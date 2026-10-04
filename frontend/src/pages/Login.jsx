import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Building2, Eye, EyeOff, ShieldCheck, Zap, BarChart3, ArrowRight, CheckCircle2, PhoneCall } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import Spinner from '../components/Spinner.jsx';

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const onSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(form.email, form.password);
            toast.success('Welcome back!');
            navigate('/');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-slate-50 font-sans text-slate-900 overflow-hidden">
            
            {/* Left Column: Form Section */}
            <div className="flex-1 flex flex-col justify-between px-6 sm:px-12 lg:px-20 py-10 bg-white order-1 lg:max-w-xl xl:max-w-2xl shadow-2xl z-10 relative">
                
                {/* Brand Logo Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 group cursor-pointer">
                        <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-blue-700 to-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-105 transition duration-300">
                            <Building2 size={22} className="text-white" />
                        </div>
                        <div>
                            <span className="font-black text-lg text-slate-900 tracking-tight block">ERP Cloud</span>
                            <span className="text-[10px] uppercase font-bold text-blue-600 tracking-widest block">Enterprise Suite</span>
                        </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        System Online
                    </div>
                </div>

                {/* Form Body */}
                <div className="w-full max-w-md mx-auto py-4">
                    <div className="mb-6 space-y-1.5">
                        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Sign in to workspace</h2>
                        <p className="text-xs text-slate-500 font-medium">Enter your credentials to manage inventory, warehouses, and orders.</p>
                    </div>

                    <form onSubmit={onSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 tracking-wide">Work Email</label>
                            <input
                                type="email"
                                required
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                className="w-full bg-slate-50/80 hover:bg-slate-100/60 focus:bg-white border border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 rounded-2xl px-4 py-3.5 text-slate-900 text-xs font-medium focus:outline-hidden transition-all duration-200"
                                placeholder="e.g. raj@company.com"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-700 tracking-wide">Password</label>
                                <a 
                                    href="#forgot" 
                                    onClick={(e) => { e.preventDefault(); toast('Password reset link sent to registered email.'); }} 
                                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700 transition"
                                >
                                    Forgot password?
                                </a>
                            </div>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    className="w-full bg-slate-50/80 hover:bg-slate-100/60 focus:bg-white border border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 rounded-2xl px-4 py-3.5 pr-12 text-slate-900 text-xs font-medium focus:outline-hidden transition-all duration-200"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full group inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.99] text-white font-bold text-xs py-4 rounded-2xl transition-all duration-200 shadow-xl shadow-blue-600/25 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer mt-2"
                        >
                            {loading ? (
                                <>
                                    <Spinner size="sm" />
                                    <span>Authenticating...</span>
                                </>
                            ) : (
                                <>
                                    <span>Access Enterprise Workspace</span>
                                    <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* 🚀 Dedicated Agent Portal Login Quick Action */}
                    <div className="mt-4">
                        <Link 
                            to="/agent"
                            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-violet-50 hover:bg-violet-100/70 border border-violet-100 transition group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-violet-600 text-white rounded-xl shadow-md group-hover:scale-105 transition">
                                    <PhoneCall size={16} />
                                </div>
                                <div className="text-left">
                                    <span className="block text-xs font-bold text-slate-900">Field Agent & Sales Portal</span>
                                    <span className="block text-[11px] text-violet-700 font-semibold">Login via Mobile & 4-Digit PIN</span>
                                </div>
                            </div>
                            <ArrowRight size={16} className="text-violet-600 group-hover:translate-x-1 transition-transform mr-1" />
                        </Link>
                    </div>

                    <div className="mt-6 text-center bg-slate-50 border border-slate-100 p-3.5 rounded-2xl">
                        <p className="text-xs text-slate-500 font-medium">
                            Looking to scale your supply chain?{' '}
                            <Link to="/register" className="text-blue-600 font-bold hover:underline transition ml-0.5">
                                Register Company Free
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Footer Links */}
                <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 font-medium pt-4 border-t border-slate-100 gap-2">
                    <span>© 2026 ERP Cloud Systems. Secure Enterprise Gateway.</span>
                    <div className="flex gap-4">
                        <a className="hover:text-slate-700 transition cursor-pointer">Privacy Policy</a>
                        <a className="hover:text-slate-700 transition cursor-pointer">Terms of Service</a>
                    </div>
                </div>
            </div>

            {/* Right Column: High-Impact Visual SaaS Experience Banner */}
            <div className="hidden lg:flex lg:flex-1 bg-slate-950 order-2 p-12 lg:p-20 flex-col justify-between text-white relative overflow-hidden">
                
                {/* Immersive Background Gradients & Grid Patterns */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.18),transparent_50%)] pointer-events-none" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.15),transparent_50%)] pointer-events-none" />
                <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]" />

                {/* Top Badge */}
                <div className="z-10">
                    <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 text-blue-400 text-[11px] font-bold tracking-wider uppercase border border-blue-500/20 backdrop-blur-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping"></span>
                        Next-Gen Cloud ERP Platform
                    </span>
                    <h1 className="text-4xl xl:text-5xl font-black tracking-tight mt-6 leading-[1.15] bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                        Orchestrate inventory, warehouses & ledger intelligence.
                    </h1>
                    <p className="text-slate-400 text-xs xl:text-sm mt-4 leading-relaxed font-normal max-w-lg">
                        Empowering high-growth distribution enterprises with real-time Stock In/Out auditing, automated reconciliation, and multi-location warehouse management.
                    </p>
                </div>

                {/* Interactive Floating Proof Card */}
                <div className="my-auto z-10 space-y-4 max-w-md">
                    <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
                        
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                                    <BarChart3 size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-xs text-white">Warehouse Sync Active</h4>
                                    <span className="text-[10px] text-slate-400 font-mono">10 Hubs Connected</span>
                                </div>
                            </div>
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                                Realtime
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800">
                            <div>
                                <span className="text-[10px] text-slate-400 block font-medium">Stock Adjustments</span>
                                <span className="text-sm font-black text-white font-mono">1,420 Items</span>
                            </div>
                            <div>
                                <span className="text-[10px] text-slate-400 block font-medium">Uptime Guarantee</span>
                                <span className="text-sm font-black text-emerald-400 font-mono">99.99%</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/50 backdrop-blur-md flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                                <Zap size={14} />
                            </div>
                            <span className="text-[11px] font-semibold text-slate-300">Lightning Fast POS</span>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/50 backdrop-blur-md flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                                <CheckCircle2 size={14} />
                            </div>
                            <span className="text-[11px] font-semibold text-slate-300">Automated Audit Logs</span>
                        </div>
                    </div>
                </div>

                {/* Trust Badge Footer */}
                <div className="flex items-center gap-3 text-xs text-slate-400 z-10 pt-6 border-t border-slate-800/80">
                    <ShieldCheck size={18} className="text-emerald-400 shrink-0" />
                    <span className="text-[11px]">Bank-grade 256-bit SSL security with automated hourly database backups.</span>
                </div>
            </div>
        </div>
    );
};

export default Login;