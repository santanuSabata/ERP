import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Phone, KeyRound, ShieldCheck, ArrowLeft, Lock, ShieldAlert, Terminal, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/axios.js';

const AgentLogin = () => {
    const [mobile, setMobile] = useState('9898815579');
    const [pin, setPin] = useState(['', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [attempts, setAttempts] = useState(3);
    const [isLocked, setIsLocked] = useState(false);
    const navigate = useNavigate();
    
    // References for the 4 individual input elements
    const pinRefs = useRef([]);

    // 🔒 Auto-redirect if already logged in
    useEffect(() => {
        const storedAgent = localStorage.getItem('agentUser');
        if (storedAgent) {
            navigate('/agent/dashboard', { replace: true });
        }
    }, [navigate]);

    const handlePinChange = (value, index) => {
        if (isLocked) return;
        if (isNaN(value)) return;

        const newPin = [...pin];
        newPin[index] = value;
        setPin(newPin);

        if (value && index < 3) {
            pinRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (isLocked) return;
        if (e.key === 'Backspace' && !pin[index] && index > 0) {
            pinRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        if (isLocked) return;
        e.preventDefault();
        const pasteData = e.clipboardData.getData('text').trim();
        if (/^\d{4}$/.test(pasteData)) {
            const digits = pasteData.split('');
            setPin(digits);
            pinRefs.current[3]?.focus();
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        if (isLocked) return;

        const fullPin = pin.join('');
        
        if (fullPin.length < 4) {
            toast.error('Authentication Error: Complete 4-digit security PIN required.');
            return;
        }

        try {
            setLoading(true);
            const res = await api.post('/agent/login', { mobile, pin: fullPin });
            if (res.data?.success) {
                localStorage.setItem('agentUser', JSON.stringify(res.data.user));
                toast.success('Secure authentication established.');
                navigate('/agent/dashboard', { replace: true });
            }
        } catch (err) {
            console.error('Login failed:', err);
            const remaining = attempts - 1;
            setAttempts(remaining);

            if (remaining <= 0) {
                setIsLocked(true);
                toast.error('Maximum security attempts exceeded. Terminal locked.');
            } else {
                toast.error(err.response?.data?.error || `Authentication failed. ${remaining} attempts remaining.`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 font-sans text-slate-100 relative overflow-hidden">
            
            {/* Background Security Grid Lines Effect */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none"></div>

            <div className="max-w-md w-full bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6 relative z-10">
                
                {/* Security Header */}
                <div className="text-center space-y-3">
                    <div className="inline-flex p-3.5 bg-violet-950/80 text-violet-400 rounded-2xl border border-violet-800/50 shadow-inner">
                        <ShieldCheck size={30} />
                    </div>
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-950/60 border border-emerald-800/50 text-emerald-400 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase mb-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> SECURE 256-BIT SSL ENCRYPTED
                        </div>
                        <h1 className="text-xl font-black text-white tracking-tight">Manager Terminal Authorization</h1>
                        <p className="text-xs text-slate-400 mt-1">Restricted corporate personnel access only.</p>
                    </div>
                </div>

                {isLocked ? (
                    <div className="p-6 bg-rose-950/40 border border-rose-900/60 rounded-2xl text-center space-y-3">
                        <ShieldAlert size={32} className="text-rose-500 mx-auto" />
                        <h3 className="text-xs font-bold text-rose-200 uppercase tracking-wider">Terminal Locked</h3>
                        <p className="text-[11px] text-rose-400">Security protocol engaged due to multiple failed verification attempts. Contact system administrator.</p>
                    </div>
                ) : (
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Registered Mobile</label>
                            <div className="relative">
                                <Phone size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
                                <input 
                                    type="text" required value={mobile} onChange={(e) => setMobile(e.target.value)}
                                    placeholder="9876543210" 
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-700 bg-slate-950 text-xs text-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-hidden font-mono tracking-wider"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                    <KeyRound size={13} className="text-violet-400" /> Secure 4-Digit PIN
                                </label>
                                <span className="text-[10px] font-mono text-slate-500">Attempts: {attempts}/3</span>
                            </div>
                            <div className="flex items-center justify-between gap-3" onPaste={handlePaste}>
                                {pin.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={(el) => (pinRefs.current[index] = el)}
                                        type="password"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handlePinChange(e.target.value, index)}
                                        onKeyDown={(e) => handleKeyDown(e, index)}
                                        className="w-14 h-14 text-center text-xl font-bold font-mono rounded-2xl border border-slate-700 bg-slate-950 text-white focus:bg-slate-900 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-hidden transition shadow-inner"
                                    />
                                ))}
                            </div>
                        </div>

                        <button 
                            type="submit" disabled={loading}
                            className="w-full py-3.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-black uppercase tracking-widest rounded-xl transition shadow-lg shadow-violet-600/30 cursor-pointer mt-2 disabled:opacity-50"
                        >
                            {loading ? 'Verifying Credentials...' : 'Authorize Access'}
                        </button>
                    </form>
                )}

                {/* Simulated Terminal Status Footer */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3 flex items-center gap-2.5 font-mono text-[10px] text-slate-400">
                    <Terminal size={14} className="text-violet-400 shrink-0" />
                    <span className="truncate">AUTH_NODE: IN-AHM-04 // IP_LOGGED</span>
                </div>

                {/* Switch back to Admin / Enterprise Login Portal */}
                <div className="pt-2 border-t border-slate-800/85 text-center">
                    <Link 
                        to="/login"
                        className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition"
                    >
                        <ArrowLeft size={14} /> Back to Enterprise / Admin Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default AgentLogin;