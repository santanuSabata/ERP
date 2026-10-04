import { useState, useRef, useEffect } from 'react';
import { 
    Search, 
    Bell, 
    Zap, 
    Megaphone, 
    Shuffle, 
    Sparkles, 
    LogOut, 
    Building2,
    User,
    Settings,
    CheckCircle2,
    Plus,
    Edit3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../lib/axios.js';
import toast from 'react-hot-toast';

const Topbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    
    // Dropdown states
    const [profileOpen, setProfileOpen] = useState(false);
    const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
    const [companies, setCompanies] = useState([]);
    const [activeCompany, setActiveCompany] = useState(null);

    const profileRef = useRef(null);
    const companyDropdownRef = useRef(null);

    // Helper to resolve clean absolute image URLs from relative DB paths
    const resolveImageUrl = (dbPath) => {
        if (!dbPath) return null;
        if (dbPath.startsWith('http')) return dbPath;

        const baseURL = api.defaults.baseURL || 'http://localhost:8000/api';
        const serverRoot = baseURL.replace(/\/api\/?$/, ''); // e.g., 'http://localhost:8000'
        
        const cleanPath = dbPath.startsWith('/') ? dbPath : `/${dbPath}`;
        return `${serverRoot}${cleanPath}`;
    };

    // Fetch companies list when company switcher dropdown opens
    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const response = await api.get('/company/all');
                if (response.data) {
                    const mappedCompanies = response.data.map(comp => ({
                        ...comp,
                        logoUrl: resolveImageUrl(comp.logoUrl || comp.logo_url)
                    }));

                    setCompanies(mappedCompanies);
                    
                    const storedCompId = localStorage.getItem('activeCompanyId');
                    const currentActive = mappedCompanies.find(c => String(c.id) === String(storedCompId)) 
                        || mappedCompanies.find(c => c.isDefault) 
                        || mappedCompanies[0];

                    if (currentActive && !activeCompany) {
                        setActiveCompany(currentActive);
                        localStorage.setItem('activeCompanyId', currentActive.id);
                    }
                }
            } catch (err) {
                console.error('❌ Failed to fetch companies list:', err);
            }
        };
        fetchCompanies();
    }, [companyDropdownOpen]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setProfileOpen(false);
            }
            if (companyDropdownRef.current && !companyDropdownRef.current.contains(event.target)) {
                setCompanyDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const companyName = activeCompany?.brandName || user?.company_name || 'Sahana Beverages';
    const activeCompanyId = activeCompany?.id || localStorage.getItem('activeCompanyId') || '1';

    return (
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 shrink-0 gap-4 relative">
            {/* Left: Company Switcher Dropdown */}
            <div className="relative" ref={companyDropdownRef}>
                <div 
                    onClick={() => setCompanyDropdownOpen((prev) => !prev)}
                    className="flex items-center gap-3 shrink-0 cursor-pointer select-none group"
                >
                    <div className="h-10 w-10 rounded-full bg-slate-900 border border-slate-200 flex items-center justify-center text-teal-400 font-semibold text-sm shadow-xs overflow-hidden">
                        {activeCompany?.logoUrl ? (
                            <img src={activeCompany.logoUrl} alt={companyName} className="h-full w-full object-cover" />
                        ) : (
                            <Building2 size={20} className="text-teal-400" />
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 leading-tight group-hover:text-violet-600 transition">
                            {companyName} ({activeCompanyId})
                        </span>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                            <Shuffle size={11} className="text-slate-400" />
                            <span>Change Company</span>
                        </div>
                    </div>
                </div>

                {/* Company Switcher Popup Menu */}
                {companyDropdownOpen && (
                    <div className="absolute left-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 overflow-hidden">
                        <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
                            {companies.map((comp, index) => {
                                const isSelected = String(activeCompany?.id) === String(comp.id);
                                return (
                                    <div 
                                        key={comp.id || index}
                                        onClick={async () => {
                                            try {
                                                await api.patch(`/company/${comp.id}/default`);
                                                
                                                localStorage.setItem('activeCompanyId', comp.id);
                                                
                                                setActiveCompany(comp);
                                                setCompanyDropdownOpen(false);
                                                toast.success(`Switched to ${comp.brandName}`);
                                                
                                                window.location.reload();
                                            } catch (err) {
                                                console.error('Failed to switch company:', err);
                                                toast.error('Failed to update default company.');
                                            }
                                        }}
                                        className={`px-4 py-3 hover:bg-slate-50 transition cursor-pointer flex items-center justify-between ${
                                            isSelected ? 'bg-slate-50/80' : ''
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="relative h-10 w-10 rounded-full bg-slate-900 border border-slate-200 flex items-center justify-center text-teal-400 font-semibold text-xs overflow-hidden shrink-0">
                                                {comp.logoUrl ? (
                                                    <img src={comp.logoUrl} alt={comp.brandName} className="h-full w-full object-cover" />
                                                ) : (
                                                    <Building2 size={18} className="text-teal-400" />
                                                )}
                                                {isSelected && (
                                                    <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                                                        <CheckCircle2 size={10} className="text-white" />
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex flex-col truncate">
                                                <span className="text-xs font-bold text-slate-900 truncate">
                                                    {comp.brandName}
                                                </span>
                                                <span className="text-[11px] text-slate-500 uppercase truncate">
                                                    {comp.companyName}
                                                </span>
                                            </div>
                                        </div>

                                        {isSelected ? (
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    title="Edit Company"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setCompanyDropdownOpen(false);
                                                        navigate('/company');
                                                    }}
                                                    className="text-[11px] font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 rounded-lg shadow-2xs"
                                                >
                                                    <Edit3 size={12} /> Edit
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                                CTRL + {index + 1}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Add New Company Footer Option */}
                        <div className="p-2 border-t border-slate-100 bg-slate-50/50">
                            <button
                                onClick={() => {
                                    setCompanyDropdownOpen(false);
                                    navigate('/company');
                                }}
                                className="w-full py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center justify-between transition shadow-2xs group cursor-pointer"
                            >
                                <span className="flex items-center gap-2">
                                    <span className="h-5 w-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-violet-100 group-hover:text-violet-600 transition">
                                        <Plus size={12} />
                                    </span>
                                    Add new Company
                                </span>
                                <span className="text-slate-400 group-hover:translate-x-0.5 transition">&rarr;</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Center: Search Bar with ctrl+k */}
            <div className="flex-1 max-w-xl mx-4">
                <div className="relative flex items-center">
                    <Search size={16} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search invoices, customers, items..."
                        className="w-full bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-violet-500 rounded-xl pl-10 pr-16 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden transition"
                    />
                    <kbd className="absolute right-3 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 rounded shadow-2xs pointer-events-none">
                        ctrl+k
                    </kbd>
                </div>
            </div>

            {/* Right: Actions, Profile & SwipeAI */}
            <div className="flex items-center gap-2 shrink-0">
                <button
                    title="Quick Actions"
                    className="h-9 w-9 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900 flex items-center justify-center transition cursor-pointer"
                >
                    <Zap size={18} />
                </button>

                <button
                    title="Notifications"
                    className="relative h-9 w-9 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900 flex items-center justify-center transition cursor-pointer"
                >
                    <Bell size={18} />
                    <span className="absolute top-2 right-2 h-2 w-2 bg-rose-500 rounded-full ring-2 ring-white" />
                </button>

                <button
                    title="Announcements"
                    className="h-9 w-9 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900 flex items-center justify-center transition cursor-pointer"
                >
                    <Megaphone size={18} />
                </button>

                {/* User Profile Dropdown Menu */}
                <div className="relative" ref={profileRef}>
                    <button
                        onClick={() => setProfileOpen((prev) => !prev)}
                        title="Account Menu"
                        className="h-9 w-9 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 flex items-center justify-center transition cursor-pointer"
                    >
                        <User size={18} />
                    </button>

                    {profileOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-50">
                            <div className="px-4 py-2 border-b border-slate-100">
                                <p className="text-xs font-semibold text-slate-900 truncate">
                                    {user?.name || 'User'}
                                </p>
                                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                            </div>

                            <button
                                onClick={() => {
                                    setProfileOpen(false);
                                    navigate('/company');
                                }}
                                className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition cursor-pointer"
                            >
                                <Settings size={14} className="text-slate-400" />
                                Settings
                            </button>

                            <button
                                onClick={() => {
                                    setProfileOpen(false);
                                    logout();
                                }}
                                className="w-full px-4 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition cursor-pointer"
                            >
                                <LogOut size={14} className="text-rose-500" />
                                Logout
                            </button>
                        </div>
                    )}
                </div>

                {/* Far Right: Ask Erp AI Button */}
                <button
                    onClick={() => navigate('/swipe-ai')}
                    className="ml-2 flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:border-violet-300 hover:bg-violet-50/50 hover:text-violet-700 text-xs font-medium transition shadow-2xs cursor-pointer"
                >
                    <Sparkles size={15} className="text-violet-500" />
                    <span>Ask Erp AI</span>
                </button>
            </div>
        </header>
    );
};

export default Topbar;