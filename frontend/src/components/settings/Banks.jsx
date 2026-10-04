import { useState, useEffect } from 'react';
import { Plus, Send, Zap, Building2, Wallet, Edit3, Trash2, X, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/axios.js';

const Banks = () => {
    const [banks, setBanks] = useState([]);
    const [activeCompanyId, setActiveCompanyId] = useState(null);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({
        bankName: '',
        accountNumber: '',
        branch: '',
        ifscCode: '',
        upiId: '',
        isDefault: false,
    });
    const [saving, setSaving] = useState(false);

    // Fetch active company first to know the current company_id
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // 1. Get current default/active company details
                const companyRes = await api.get('/company');
                const compId = companyRes.data?.id || 1;
                setActiveCompanyId(compId);

                // 2. Fetch banks filtered by this company ID
                const banksRes = await api.get(`/banks?companyId=${compId}`);
                if (banksRes.data) {
                    setBanks(banksRes.data);
                }
            } catch (err) {
                console.error('❌ Failed to fetch initial data:', err);
                // Fallback mock data
                setBanks([
                    { id: 1, bankName: 'Cash', accountNumber: '', branch: '', ifscCode: '', upiId: '', isDefault: false, isCash: true },
                    { id: 2, bankName: 'Union Bank of India', accountNumber: '333122010001976', branch: 'CHATRAPUR', ifscCode: 'UBIN0933317', upiId: 'abantimayee1@ybl', isDefault: true, isCash: false },
                ]);
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    const fetchBanks = async (compId) => {
        try {
            const targetId = compId || activeCompanyId || 1;
            const response = await api.get(`/banks?companyId=${targetId}`);
            if (response.data) {
                setBanks(response.data);
            }
        } catch (err) {
            console.error('❌ Failed to fetch banks:', err);
        }
    };

    const handleOpenAdd = () => {
        setEditingId(null);
        setForm({ bankName: '', accountNumber: '', branch: '', ifscCode: '', upiId: '', isDefault: false });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (bank) => {
        if (bank.isCash) {
            toast.error('Cash account cannot be edited.');
            return;
        }
        setEditingId(bank.id);
        setForm({
            bankName: bank.bankName,
            accountNumber: bank.accountNumber,
            branch: bank.branch,
            ifscCode: bank.ifscCode,
            upiId: bank.upiId,
            isDefault: bank.isDefault,
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id, isCash) => {
        if (isCash) {
            toast.error('Cash account cannot be deleted.');
            return;
        }
        if (!window.confirm('Deleting the bank account from here will remove the bank details from all existing invoices and it is irreversible.')) return;

        try {
            await api.delete(`/banks/${id}`);
            toast.success('Bank account deleted successfully.');
            fetchBanks(activeCompanyId);
        } catch (err) {
            console.error('❌ Delete failed:', err);
            toast.error('Failed to delete bank account.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const payload = {
                ...form,
                companyId: activeCompanyId || 1
            };

            if (editingId) {
                await api.put(`/banks/${editingId}`, payload);
                toast.success('Bank account updated successfully!');
            } else {
                await api.post('/banks', payload);
                toast.success('New bank account added successfully!');
            }
            setIsModalOpen(false);
            fetchBanks(activeCompanyId);
        } catch (err) {
            console.error('❌ Save failed:', err);
            toast.error('Failed to save bank account.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center text-xs text-slate-500 shadow-2xs">
                Loading bank accounts...
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Header Title */}
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Banks
            </h1>

            {/* Top Promo Banner */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-6 relative overflow-hidden">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 mb-1">
                    <Zap size={16} className="text-amber-500 fill-amber-500" />
                    Create dynamic QR codes on Invoices at <span className="text-emerald-600 font-extrabold">ZERO</span> Transaction charge!
                </div>
                <p className="text-xs text-slate-600 mb-2">
                    Link your UPI ID with the Bank Account now to generate dynamic QR codes on Invoices and Bills.
                </p>
                <p className="text-[11px] text-slate-400">
                    Payments will be settled to your bank account linked with UPI ID instantly.
                </p>
            </div>

            {/* Action Buttons Toolbar[cite: 7] */}
            <div className="flex flex-wrap items-center gap-3">
                <button
                    onClick={handleOpenAdd}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition flex items-center gap-2 shadow-sm shadow-blue-500/20 cursor-pointer"
                >
                    <Plus size={14} /> New Bank Details
                </button>
                <button
                    onClick={() => toast('Transfer Funds feature coming soon')}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition flex items-center gap-2 shadow-sm shadow-blue-500/20 cursor-pointer"
                >
                    <Send size={14} /> Transfer Funds
                </button>
                <button
                    onClick={() => toast('Connect to Axis integration clicked')}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition flex items-center gap-2 shadow-sm shadow-blue-500/20 cursor-pointer"
                >
                    <Building2 size={14} /> Connect to Axis
                </button>
            </div>

            {/* Bank Accounts List Container[cite: 7] */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs divide-y divide-slate-100">
                {banks.map((bank) => (
                    <div key={bank.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                                {bank.isCash ? <Wallet size={20} /> : <Building2 size={20} />}
                            </div>
                            <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-900">{bank.bankName}</span>
                                    {bank.isDefault && (
                                        <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-800 text-[10px] font-bold rounded-md">
                                            Default
                                        </span>
                                    )}
                                </div>
                                {!bank.isCash && (
                                    <p className="text-xs text-slate-500 font-mono">
                                        {bank.accountNumber} &bull; {bank.branch} &bull; {bank.ifscCode}
                                    </p>
                                )}
                                {bank.upiId && (
                                    <p className="text-[11px] text-slate-500">
                                        UPI: <span className="font-semibold text-slate-700">{bank.upiId}</span>
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Row Actions */}
                        <div className="flex items-center gap-2">
                            {!bank.isCash && (
                                <button
                                    onClick={() => handleOpenEdit(bank)}
                                    className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1 shadow-2xs cursor-pointer"
                                >
                                    <Edit3 size={12} /> Edit
                                </button>
                            )}
                            {!bank.isCash && (
                                <button
                                    onClick={() => handleDelete(bank.id, bank.isCash)}
                                    className="p-2 border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-500 rounded-xl transition shadow-2xs cursor-pointer"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer Footnote Box[cite: 7] */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-6 space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Please Note</h3>
                <ul className="space-y-2 text-xs text-slate-600">
                    <li className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                        <span><strong>UPI ID</strong> like swipe9@icici can be added while adding the bank to show QR code on invoices along with the bank details. <a href="#" className="text-blue-600 hover:underline">Learn more</a></span>
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                        <span><strong>Beneficiary Name, Swift Code etc..</strong> can be added in the notes section while adding the bank details.</span>
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                        <span>If your payment gateway is active then you will not be able to edit the Account number, IFSC code of the bank details.</span>
                    </li>
                    <li className="flex items-center gap-2 text-rose-600">
                        <AlertTriangle size={14} className="shrink-0" />
                        <span><strong>Deleting the bank account from here</strong> will remove the bank details from all existing invoices and it is irreversible.</span>
                    </li>
                </ul>
            </div>

            {/* Add/Edit Bank Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-xl overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
                            <h2 className="text-sm font-bold text-slate-900">
                                {editingId ? 'Edit Bank Details' : 'Add Bank Details'}
                            </h2>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 transition cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-700">Bank Name *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. HDFC Bank, SBI"
                                    value={form.bankName}
                                    onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                                    className="w-full bg-white border border-slate-200 focus:border-violet-500 rounded-xl px-4 py-3 text-xs text-slate-900 focus:outline-hidden"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-700">Account Number</label>
                                <input
                                    type="text"
                                    placeholder="Account Number"
                                    value={form.accountNumber}
                                    onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                                    className="w-full bg-white border border-slate-200 focus:border-violet-500 rounded-xl px-4 py-3 text-xs text-slate-900 focus:outline-hidden"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-700">Branch Name</label>
                                    <input
                                        type="text"
                                        placeholder="Branch Name"
                                        value={form.branch}
                                        onChange={(e) => setForm({ ...form, branch: e.target.value })}
                                        className="w-full bg-white border border-slate-200 focus:border-violet-500 rounded-xl px-4 py-3 text-xs text-slate-900 focus:outline-hidden"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-700">IFSC Code</label>
                                    <input
                                        type="text"
                                        placeholder="IFSC Code"
                                        value={form.ifscCode}
                                        onChange={(e) => setForm({ ...form, ifscCode: e.target.value.toUpperCase() })}
                                        className="w-full bg-white border border-slate-200 focus:border-violet-500 rounded-xl px-4 py-3 text-xs text-slate-900 uppercase focus:outline-hidden"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-700">UPI ID (for QR Code)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. yourname@icici"
                                    value={form.upiId}
                                    onChange={(e) => setForm({ ...form, upiId: e.target.value })}
                                    className="w-full bg-white border border-slate-200 focus:border-violet-500 rounded-xl px-4 py-3 text-xs text-slate-900 focus:outline-hidden"
                                />
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <input
                                    type="checkbox"
                                    id="isDefault"
                                    checked={form.isDefault}
                                    onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="isDefault" className="text-xs font-semibold text-slate-700 select-none">
                                    Set as default bank account
                                </label>
                            </div>

                            <div className="pt-4 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition shadow-sm"
                                >
                                    {saving ? 'Saving...' : 'Save Bank Details'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Banks;