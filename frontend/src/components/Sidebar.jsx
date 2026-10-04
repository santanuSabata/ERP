import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Target,
    Sparkles,
    LogOut,
    ShoppingCart,
    Tag,
    Box,
    Layers,
    CreditCard,
    Users,
    Briefcase,
    BarChart3,
    Cpu,
    UserPlus,
    Settings,
    ChevronDown,
    ChevronUp,
    ChevronLeft,
    Building2,
    User,
    Lock,
    Printer,
    Barcode,
    PenTool,
    FileCheck,
    BellRing,
    Landmark,
    WalletCards,
    Receipt,
    Network,
    Webhook,
    Share2,
    Gift,
    HelpCircle,
    Star,
    PhoneCall,
    Calendar,
    History,
    Mic,
    FileSignature,
    CalendarDays,
    AlertCircle,
    User2Icon,
    Grid,
    ShieldAlert,
    FileText, 
    FileCode, 
    Repeat, 
    FileQuestion,
    FileSpreadsheet,
    ClipboardList,
    UserX,
    Flame,
    Clock,
    CheckCircle2,
    CalendarCheck,
    DollarSign,
    Award,
    Truck,
    PackagePlus,
    FileSpreadsheetIcon,
    Warehouse,
    ArrowDownLeft,
    ArrowUpRight,
    ReceiptText,
    RefreshCw,
    ShieldCheck,
    UserCheck,
    UserMinus,
    Coins
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const mainItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/ERP-ai', label: 'CRM', icon: Sparkles },
];

const menuGroups = [
    {
        label: 'Sales',
        icon: FileText,
        children: [
            { to: '/customers', label: 'Customers', icon: User2Icon },
            { to: '/sales/invoices', label: 'Invoices', icon: Receipt },
            { to: '/sales/credit-notes', label: 'Credit Notes', icon: FileSpreadsheet },
            { to: '/sales/e-invoices', label: 'E-Invoices', icon: FileCode },
            { to: '/sales/subscriptions', label: 'Subscriptions', icon: Repeat },
            { to: '/quotations', label: 'Quotations', icon: FileQuestion },
        ],
    },
    {
        label: 'Purchases',
        icon: ShoppingCart,
        children: [
            { to: '/vendors', label: 'Vendors', icon: User2Icon },
            { to: '/purchase', label: 'Purchases', icon: ReceiptText },
            { to: '/purchases/orders', label: 'Purchase Orders', icon: PackagePlus },
        ],
    },
    {
        label: 'Inventory',
        icon: Layers,
        children: [
            { to: '/products', label: 'Products & Services', icon: Box },
            { to: '/stocks', label: 'Stocks', icon: Layers },
            { to: '/stocks/summary', label: 'Stock Summary', icon: Layers },
            { to: '/warehouses', label: 'Warehouses', icon: Warehouse },
        ]
    },
    {
        label: 'Payments',
        icon: CreditCard,
        children: [
            { to: '/payments/incoming', label: 'Incoming', icon: ArrowDownLeft },
            { to: '/payments/outgoing', label: 'Outgoing', icon: ArrowUpRight },
        ],
    },
    {
        label: 'Expenses+',
        icon: Tag,
        children: [
            { to: '/expenses', label: 'All Expenses', icon: Tag },
            { to: '/expenses/recurring', label: 'Recurring', icon: RefreshCw },
        ],
    },
];

const leadsMasterGroup = {
    label: 'Leads',
    icon: Target,
    children: [
        { to: '/leads/dashboard', label: 'Lead Dashboard', icon: BarChart3 },
        { to: '/leads', label: 'All Leads', icon: ClipboardList },
        { to: '/leads/new', label: 'New Leads', icon: UserPlus },
        { to: '/leads/my', label: 'My Leads', icon: User },
        { to: '/leads/unassigned', label: 'Unassigned Leads', icon: UserX },
        { to: '/leads/hot', label: 'Hot Leads', icon: Flame },
        { to: '/leads/follow-up', label: 'Follow-up Leads', icon: Clock },
        { to: '/leads/converted', label: 'Converted Leads', icon: CheckCircle2 },
        { to: '/leads/lost', label: 'Lost Leads', icon: AlertCircle },
        { to: '/calling/center', label: 'Call Center', icon: PhoneCall },
        { to: '/calling/history', label: 'Call History', icon: History },
        { to: '/calling/recording', label: 'Call Recording', icon: Mic },
        { to: '/calling/disposition', label: 'Call Disposition', icon: FileSignature },
        { to: '/follow-ups/today', label: "Today's Follow-ups", icon: CalendarDays },
        { to: '/follow-ups/upcoming', label: 'Upcoming', icon: Calendar },
        { to: '/follow-ups/overdue', label: 'Overdue', icon: Clock },
        { to: '/follow-ups/completed', label: 'Completed', icon: CheckCircle2 },
    ],
};

const hrMasterGroup = {
    label: 'HR & Payroll',
    icon: Briefcase,
    children: [
        { to: '/hr/dashboard', label: 'HR Dashboard', icon: BarChart3 },
        { to: '/hr/employees', label: 'Employees Directory', icon: Users },
        { to: '/hr/departments', label: 'Departments', icon: Grid },
        { to: '/hr/designations', label: 'Designations', icon: ShieldAlert },
        { to: '/hr/employee-attendance', label: 'Attendance Management', icon: CalendarCheck },
        { to: '/hr/attendance-sheet', label: 'Attendance Sheet', icon: FileSpreadsheetIcon },
        { to: '/hr/leaves', label: 'Leave Requests', icon: Clock },
        { to: '/hr/payroll', label: 'Payroll & Salary', icon: DollarSign },
        { to: '/hr/performance', label: 'Performance & Appraisals', icon: Award },
        { to: '/hr/recruitment', label: 'Recruitment & Jobs', icon: UserPlus },
        { to: '/hr/documents', label: 'Employee Documents', icon: FileText },
    ],
};

const bottomItems = [
    { to: '/settings', label: 'CRM Settings', icon: Settings },
];

const settingsSections = [
    {
        title: 'Profile',
        items: [
            { to: '/company', label: 'Company Details', icon: Building2 },
            { to: '/settings/profile', label: 'User Profile', icon: User },
            { to: '/settings/users', label: 'All Users / Roles', icon: Users },
        ],
    },
    {
        title: 'General Settings',
        items: [
            { to: '/settings/preferences', label: 'Preferences', icon: Settings },
            { to: '/settings/thermal-print', label: 'Thermal Print Settings', icon: Printer, locked: true },
            { to: '/settings/barcode', label: 'Barcode Settings', icon: Barcode },
            { to: '/settings/signatures', label: 'Signatures', icon: PenTool },
            { to: '/settings/notes-terms', label: 'Notes & Terms', icon: FileCheck, locked: true },
            { to: '/settings/auto-reminders', label: 'Auto Reminders', icon: BellRing, locked: true },
        ],
    },
    {
        title: 'Banks and Payments',
        items: [
            { to: '/settings/banks', label: 'Banks', icon: Landmark },
            { to: '/settings/wallet', label: 'Wallet', icon: WalletCards },
            { to: '/settings/billing', label: 'Billing', icon: Receipt },
        ],
    },
    {
        title: 'Integrations & Apps',
        items: [
            { to: '/swipe-ai', label: 'CRMAI', icon: Sparkles },
            { to: '/settings/payment-gateway', label: 'Payment Gateway', icon: CreditCard, locked: true },
            { to: '/settings/tally', label: 'Tally Integration', icon: Network, locked: true },
            { to: '/settings/webhooks', label: 'API & Webhooks', icon: Webhook },
            { to: '/integrations', label: 'Integrations', icon: Cpu },
        ],
    },
    {
        title: 'Others',
        items: [
            { to: '/settings/advanced', label: 'Advanced Features', icon: Star },
            { to: '/settings/social-links', label: 'Social Links', icon: Share2 },
            { to: '/settings/referral', label: 'Referral', icon: Gift },
            { to: '/settings/support', label: 'Support', icon: HelpCircle },
        ],
    },
];

const Sidebar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const initial = user?.name?.[0]?.toUpperCase() || 'U';

    const isSettingsRoute = location.pathname.startsWith('/settings') || location.pathname === '/company';
    const [settingsOpen, setSettingsOpen] = useState(isSettingsRoute);

    // Helper to find which dropdown group contains the current path
    const getActiveGroupLabel = (pathname) => {
        if (leadsMasterGroup.children.some(child => pathname.startsWith(child.to))) return leadsMasterGroup.label;
        if (hrMasterGroup.children.some(child => pathname.startsWith(child.to))) return hrMasterGroup.label;
        for (const group of menuGroups) {
            if (group.children.some(child => pathname.startsWith(child.to))) {
                return group.label;
            }
        }
        return null;
    };

    // Accordion State: automatically open the group of the active route
    const [openDropdown, setOpenDropdown] = useState(() => getActiveGroupLabel(location.pathname));

    useEffect(() => {
        setSettingsOpen(isSettingsRoute);
        const activeGroup = getActiveGroupLabel(location.pathname);
        if (activeGroup) {
            setOpenDropdown(activeGroup);
        }
    }, [location.pathname, isSettingsRoute]);

    const toggleDropdown = (label) => {
        setOpenDropdown((prev) => (prev === label ? null : label));
    };

    const renderDropdownGroup = (group) => {
        const isOpen = openDropdown === group.label;
        const Icon = group.icon;

        // Check if any child in this group is currently active
        const hasActiveChild = group.children.some(child => {
            if (child.to === '/') return location.pathname === '/';
            return location.pathname.startsWith(child.to);
        });

        return (
            <div key={group.label} className="space-y-1">
                <button
                    onClick={() => toggleDropdown(group.label)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-medium transition cursor-pointer ${
                        hasActiveChild ? 'bg-slate-50 text-slate-900 font-bold' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <Icon size={20} strokeWidth={1.75} className={hasActiveChild ? 'text-blue-600' : ''} />
                        <span>{group.label}</span>
                    </div>
                    {isOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                </button>

                {isOpen && (
                    <div className="pl-8 pr-2 space-y-1">
                        {group.children.map((child) => {
                            const ChildIcon = child.icon;
                            return (
                                <NavLink
                                    key={child.to}
                                    to={child.to}
                                    className={({ isActive }) =>
                                        `flex items-center gap-2.5 py-2 px-3 rounded-xl text-xs font-medium transition ${
                                            isActive
                                                ? 'bg-blue-50 text-blue-700 font-bold shadow-2xs'
                                                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                                        }`
                                    }
                                >
                                    {ChildIcon && <ChildIcon size={15} strokeWidth={1.75} className="shrink-0" />}
                                    <span>{child.label}</span>
                                </NavLink>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    return (
        <aside className="w-64 bg-white border-r border-slate-100 hidden lg:flex flex-col shrink-0 h-screen sticky top-0 overflow-hidden">
            {/* Header Brand */}
            <div className="h-16 flex items-center gap-2 px-6 border-b border-slate-100 shrink-0 bg-white z-10">
                <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-blue-700 to-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <Building2 size={22} className="text-white" />
                </div>
                <div>
                    <span className="font-black text-lg text-slate-900 tracking-tight block">ERP Cloud</span>
                    <span className="text-[10px] uppercase font-bold text-blue-600 tracking-widest block">Enterprise Suite</span>
                </div>
            </div>

            {/* Sliding Container */}
            <div className="relative flex-1 overflow-hidden">
                {/* Main Navigation Panel */}
                <div 
                    className={`absolute inset-0 w-full h-full overflow-y-auto flex flex-col p-3 space-y-1.5 bg-white transition-all duration-300 ${
                        settingsOpen ? 'pointer-events-none invisible -translate-x-full' : 'visible translate-x-0'
                    }`}
                >
                    {mainItems.map(({ to, label, icon: Icon, end }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={end}
                            className={({ isActive }) =>
                                `relative flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition ${
                                    isActive
                                        ? 'bg-slate-100 text-slate-900 font-bold before:absolute before:left-0 before:top-2.5 before:bottom-2.5 before:w-1 before:rounded-full before:bg-violet-500'
                                        : 'text-slate-700 hover:bg-slate-50'
                                }`
                            }
                        >
                            <Icon size={20} strokeWidth={1.75} />
                            {label}
                        </NavLink>
                    ))}

                    {renderDropdownGroup(leadsMasterGroup)}
                    {renderDropdownGroup(hrMasterGroup)}
                    {menuGroups.map(renderDropdownGroup)}
 
                    <hr className="border-slate-100 my-2" />

                    {bottomItems.map(({ to, label, icon: Icon }) => (
                        <button
                            key={to}
                            onClick={() => {
                                setSettingsOpen(true);
                                navigate('/company');
                            }}
                            className="w-full relative flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition text-left cursor-pointer"
                        >
                            <Icon size={20} strokeWidth={1.75} />
                            {label}
                        </button>
                    ))}

                    <div className="mx-2 mt-4 p-4 rounded-2xl bg-sky-50/70 border border-sky-100 text-center space-y-2">
                        <p className="text-xs font-semibold text-slate-800">
                            Refer a friend & Get <br />
                            <span className="text-violet-600 font-bold">₹2000 🥳</span>
                        </p>
                        <button className="w-full py-2 px-3 bg-white hover:bg-slate-50 text-slate-900 text-xs font-bold rounded-xl shadow-xs transition border border-sky-150 cursor-pointer">
                            Refer Now 🚀
                        </button>
                    </div>
                </div>

                {/* Settings Slide-out Panel */}
                <div 
                    className={`absolute inset-0 w-full h-full overflow-y-auto flex flex-col p-3 space-y-4 bg-white transition-all duration-300 ${
                        settingsOpen ? 'visible translate-x-0' : 'pointer-events-none invisible translate-x-full'
                    }`}
                >
                    <button
                        onClick={() => {
                            setSettingsOpen(false);
                            navigate('/');
                        }}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-slate-900 hover:bg-slate-50 rounded-xl transition cursor-pointer"
                    >
                        <ChevronLeft size={18} className="text-slate-600" />
                        <span>Back to Home</span>
                    </button>

                    <div className="space-y-5 pb-6">
                        {settingsSections.map((section) => (
                            <div key={section.title} className="space-y-1">
                                <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                    {section.title}
                                </p>
                                <div className="space-y-0.5 mt-1">
                                    {section.items.map((item) => {
                                        const Icon = item.icon;
                                        return (
                                            <NavLink
                                                key={item.to}
                                                to={item.to}
                                                className={({ isActive }) =>
                                                    `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                                                        isActive
                                                            ? 'bg-slate-100 text-slate-900 font-bold'
                                                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                                    }`
                                                }
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <Icon size={16} className="text-slate-500" />
                                                    <span>{item.label}</span>
                                                </div>
                                                {item.locked && <Lock size={13} className="text-slate-400" />}
                                            </NavLink>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* User Profile Footer */}
            <div className="p-3 border-t border-slate-100 bg-white shrink-0">
                <div className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-slate-50 transition">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                        {initial}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-900 truncate">
                            {user?.full_name || 'User'}
                        </div>
                        <div className="text-xs text-slate-500 truncate">{user?.mobile}{user?.email}</div>
                    </div>
                    <button
                        onClick={logout}
                        title="Logout"
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition shrink-0 cursor-pointer"
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;