import { 
    Building2, 
    User, 
    Users, 
    Settings as SettingsIcon, 
    Printer, 
    Barcode, 
    PenTool, 
    FileCheck, 
    BellRing, 
    Landmark, 
    WalletCards, 
    Receipt, 
    Sparkles, 
    CreditCard, 
    Network, 
    Webhook, 
    Star, 
    Share2, 
    Gift, 
    HelpCircle,
    Lock
} from 'lucide-react';

export const settingsNavSections = [
    {
        title: 'Profile',
        items: [
            { id: 'company', label: 'Company Details', icon: Building2 },
            { id: 'profile', label: 'User Profile', icon: User },
            { id: 'users', label: 'All Users / Roles', icon: Users },
        ],
    },
    {
        title: 'General Settings',
        items: [
            { id: 'preferences', label: 'Preferences', icon: SettingsIcon },
            { id: 'thermal-print', label: 'Thermal Print Settings', icon: Printer, locked: true },
            { id: 'barcode', label: 'Barcode Settings', icon: Barcode },
            { id: 'signatures', label: 'Signatures', icon: PenTool },
            { id: 'notes-terms', label: 'Notes & Terms', icon: FileCheck, locked: true },
            { id: 'auto-reminders', label: 'Auto Reminders', icon: BellRing, locked: true },
            { id: 'prefix', label: 'Document Prefix/Suffixes', icon: BellRing, locked: true },

        ],
    },
    {
        title: 'Banks and Payments',
        items: [
            { id: 'banks', label: 'Banks', icon: Landmark },
            { id: 'wallet', label: 'Swipe Wallet', icon: WalletCards },
            { id: 'billing', label: 'Billing', icon: Receipt },
        ],
    },
    {
        title: 'Integrations & Apps',
        items: [
            { id: 'swipe-ai', label: 'SwipeAI', icon: Sparkles },
            { id: 'payment-gateway', label: 'Payment Gateway', icon: CreditCard, locked: true },
            { id: 'tally', label: 'Tally Integration', icon: Network, locked: true },
            { id: 'webhooks', label: 'API & Webhooks', icon: Webhook },
        ],
    },
    {
        title: 'Others',
        items: [
            { id: 'advanced', label: 'Advanced Features', icon: Star },
            { id: 'social-links', label: 'Social Links', icon: Share2 },
            { id: 'referral', label: 'Referral', icon: Gift },
            { id: 'support', label: 'Support', icon: HelpCircle },
        ],
    },
];

const SettingsSidebar = ({ activeTab, setActiveTab }) => {
    return (
        <div className="w-64 shrink-0 hidden md:block space-y-6">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3">
                Settings Menu
            </div>
            <div className="space-y-6">
                {settingsNavSections.map((section) => (
                    <div key={section.title} className="space-y-1">
                        <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            {section.title}
                        </p>
                        <div className="space-y-0.5 mt-1">
                            {section.items.map((item) => {
                                const Icon = item.icon;
                                const isActive = activeTab === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveTab(item.id)}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                                            isActive
                                                ? 'bg-slate-100 text-slate-900 font-bold'
                                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <Icon size={16} className="text-slate-500" />
                                            <span>{item.label}</span>
                                        </div>
                                        {item.locked && <Lock size={13} className="text-slate-400" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SettingsSidebar;