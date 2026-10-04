import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Phone, KeyRound, ShieldCheck, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/axios.js';

const AgentLogin = () => {
    const [mobile, setMobile] = useState('9898815579');
    const [pin, setPin] = useState(['', '', '', '']);
    const [loading, setLoading] = useState(false);
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
        if (isNaN(value)) return;

        const newPin = [...pin];
        newPin[index] = value;
        setPin(newPin);

        if (value && index < 3) {
            pinRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace' && !pin[index] && index > 0) {
            pinRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
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
        const fullPin = pin.join('');
        
        if (fullPin.length < 4) {
            toast.error('Please enter your complete 4-digit PIN.');
            return;
        }

        try {
            setLoading(true);
            const res = await api.post('/agent/login', { mobile, pin: fullPin });
            if (res.data?.success) {
                localStorage.setItem('agentUser', JSON.stringify(res.data.user));
                toast.success('Login successful!');
                navigate('/agent/dashboard', { replace: true });
            }
        } catch (err) {
            console.error('Login failed:', err);
            toast.error(err.response?.data?.error || 'Invalid mobile number or PIN.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 font-sans">
            <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xl space-y-6">
                <div className="text-center space-y-2">
                    <div className="inline-flex p-3 bg-violet-50 text-violet-600 rounded-2xl mb-2">
                        <ShieldCheck size={28} />
                    </div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">Agent Portal Login</h1>
                    <p className="text-xs text-slate-400">Enter your mobile number and 4-digit secure PIN.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700">Mobile Number</label>
                        <div className="relative">
                            <Phone size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                            <input 
                                type="text" required value={mobile} onChange={(e) => setMobile(e.target.value)}
                                placeholder="9876543210" 
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-xs focus:outline-hidden font-mono"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <KeyRound size={13} className="text-violet-600" /> Secure 4-Digit PIN
                        </label>
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
                                    className="w-14 h-14 text-center text-lg font-bold font-mono rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-violet-600 focus:ring-2 focus:ring-violet-100 focus:outline-hidden transition"
                                />
                            ))}
                        </div>
                    </div>

                    <button 
                        type="submit" disabled={loading}
                        className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl transition shadow-md cursor-pointer mt-2"
                    >
                        {loading ? 'Authenticating...' : 'Sign In'}
                    </button>
                </form>

                {/* Switch back to Admin / Enterprise Login Portal */}
                <div className="pt-2 border-t border-slate-100 text-center">
                    <Link 
                        to="/login"
                        className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-600 transition"
                    >
                        <ArrowLeft size={14} /> Back to Enterprise / Admin Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default AgentLogin;