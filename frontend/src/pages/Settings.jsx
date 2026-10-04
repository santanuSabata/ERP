import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import SettingsSidebar from '../components/settings/SettingsSidebar.jsx';
import CompanyDetailsForm from '../components/settings/CompanyDetailsForm.jsx';
import UserProfile from '../components/settings/UserProfile.jsx';
import Preferences from '../components/settings/Preferences.jsx';
import Signatures from '../components/settings/Signatures.jsx';
import Banks from '../components/settings/Banks.jsx';
import DocumentNotesAndTerms from '../components/settings/DocumentNotesAndTerms.jsx';
import BarcodeSettings from '../components/settings/BarcodeSettings.jsx';
import DocumentPrefix from "../components/settings/Prefix.jsx";
import UsersManagement from "../components/settings/UsersManagement.jsx";



const Settings = () => {
    const [activeTab, setActiveTab] = useState('company');

    return (
        <div className="flex gap-8 pb-12">
            {/* Left Sub-sidebar Component */}
            <SettingsSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

            {/* Right Content Area */}
            <div className="flex-1 space-y-6 min-w-0">
                {/* Subscription Expired Alert Banner */}
                <div className="bg-rose-50 border border-rose-100 rounded-2xl px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-2.5 text-xs font-semibold text-rose-700">
                        <AlertTriangle size={16} className="text-rose-500 shrink-0" />
                        <span>Subscription expired. Renew Pro Plan to restore all features and support.</span>
                    </div>
                    <button className="bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold px-4 py-1.5 rounded-full shadow-2xs transition flex items-center gap-1.5 shrink-0">
                        Renew Now 🚀
                    </button>
                </div>

                {/* Company Details View */}
                {activeTab === 'company' && <CompanyDetailsForm />}

                {/* Profile Details View */}
                {activeTab === 'profile' && <UserProfile />}

                {/* Users Management Details View */}
                {activeTab === 'users' && <UsersManagement />}

                {/* Preferences Details View */}
                {activeTab === 'preferences' && <Preferences />}

                {/* Signatures Details View */}
                {activeTab === 'signatures' && <Signatures />}

                {/* Bank Details View */}
                {activeTab === 'banks' && <Banks />}

                {/* DocumentNotesAndTerms Details View */}
                {activeTab === 'notes-terms' && <DocumentNotesAndTerms />}

                {/* DocumentNotesAndTerms Details View */}
                {activeTab === 'barcode' && <BarcodeSettings />}
                
                {/* DocumentPrefix Details View */}
                {activeTab === 'prefix' && <DocumentPrefix />}

                {/* Placeholder for other setting tabs */}
                {activeTab !== 'company' && (
                    <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-2xs">
                        <h2 className="text-lg font-bold text-slate-900 capitalize">
                            {activeTab.replace('-', ' ')} Settings
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">
                            Configure your preferences for {activeTab} here.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Settings;