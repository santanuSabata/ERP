import { useState, useEffect } from 'react';
import { Plus, Ban, CheckCircle2, X, Upload as UploadIcon, PenTool, Edit3, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/axios.js';

const Signatures = () => {
    const [signatures, setSignatures] = useState([]);
    const [activeCompanyId, setActiveCompanyId] = useState(null);
    const [selectedSignatureId, setSelectedSignatureId] = useState(null);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [signatureName, setSignatureName] = useState('');
    const [activeTab, setActiveTab] = useState('Upload');
    const [signatureFile, setSignatureFile] = useState(null);
    const [typedText, setTypedText] = useState('');
    const [saving, setSaving] = useState(false);

    const fetchSignatures = async (compId) => {
        try {
            const targetId = compId || activeCompanyId || 1;
            const response = await api.get(`/signatures?companyId=${targetId}`);
            if (response.data) {
                setSignatures(response.data);
                const defaultSig = response.data.find(s => s.isDefault);
                if (defaultSig) setSelectedSignatureId(defaultSig.id);
            }
        } catch (err) {
            console.error('❌ Failed to fetch signatures:', err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch initial active company ID and corresponding signatures
    useEffect(() => {
        const init = async () => {
            try {
                const companyRes = await api.get('/company');
                const compId = companyRes.data?.id || 1;
                setActiveCompanyId(compId);
                await fetchSignatures(compId);
            } catch (err) {
                console.error('❌ Initialization failed:', err);
                setLoading(false);
            }
        };
        init();
    }, []);

    const handleOpenAddModal = () => {
        setEditingId(null);
        setSignatureName('');
        setSignatureFile(null);
        setTypedText('');
        setActiveTab('Upload');
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (sig, e) => {
        e.stopPropagation();
        setEditingId(sig.id);
        setSignatureName(sig.name);
        setSignatureFile(null);
        setActiveTab('Upload');
        setIsModalOpen(true);
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this signature?')) return;

        try {
            await api.delete(`/signatures/${id}`);
            toast.success('Signature deleted successfully.');
            fetchSignatures(activeCompanyId);
        } catch (err) {
            console.error('❌ Delete failed:', err);
            toast.error('Failed to delete signature.');
        }
    };

    const handleSaveSignature = async (e) => {
        e.preventDefault();
        if (!signatureName.trim()) {
            toast.error('Please enter a signature name.');
            return;
        }

        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('companyId', activeCompanyId || 1);
            formData.append('name', signatureName);
            if (activeTab === 'Upload' && signatureFile) {
                formData.append('signature_file', signatureFile);
            }

            if (editingId) {
                await api.put(`/signatures/${editingId}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Signature updated successfully!');
            } else {
                await api.post('/signatures', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('New signature added successfully!');
            }

            setIsModalOpen(false);
            fetchSignatures(activeCompanyId);
        } catch (err) {
            console.error('❌ Save failed:', err);
            toast.error('Failed to save signature.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center text-xs text-slate-500 shadow-2xs">
                Loading signatures...
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-2xs max-w-6xl mx-auto relative">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                    Signatures
                </h1>
                <button
                    type="button"
                    onClick={handleOpenAddModal}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition flex items-center gap-2 shadow-sm shadow-blue-500/25 cursor-pointer"
                >
                    <Plus size={14} /> Add New Signature
                </button>
            </div>

            <div className="border border-slate-200/80 rounded-3xl p-6 bg-white min-h-[220px] flex flex-wrap gap-6 items-center">
                
                {/* No Signature Option */}
                <div
                    onClick={() => setSelectedSignatureId('no-signature')}
                    className={`w-60 h-36 rounded-2xl border transition cursor-pointer flex flex-col justify-between overflow-hidden shadow-2xs ${
                        selectedSignatureId === 'no-signature' 
                            ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/10' 
                            : 'border-slate-200 hover:border-slate-300 bg-slate-50/30'
                    }`}
                >
                    <div className="flex-1 flex items-center justify-center text-slate-400">
                        <Ban size={24} className="stroke-[1.5]" />
                    </div>
                    <div className="py-2.5 px-4 bg-white border-t border-slate-100 text-center text-xs font-semibold text-slate-700">
                        No Signature
                    </div>
                </div>

                {/* Signature Cards */}
                {signatures.map((sig) => {
                    const isSelected = selectedSignatureId === sig.id;
                    return (
                        <div
                            key={sig.id}
                            onClick={() => setSelectedSignatureId(sig.id)}
                            className={`relative w-60 h-36 rounded-2xl border transition cursor-pointer flex flex-col justify-between overflow-hidden shadow-2xs group ${
                                isSelected 
                                    ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/10' 
                                    : 'border-slate-200 hover:border-slate-300 bg-white'
                            }`}
                        >
                            {sig.isDefault && (
                                <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-slate-100 text-slate-800 text-[10px] font-bold rounded-md shadow-2xs border border-slate-200 z-10">
                                    Default
                                </span>
                            )}

                            {/* Action Buttons (Edit / Delete) on Hover */}
                            <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
                                <button
                                    onClick={(e) => handleOpenEditModal(sig, e)}
                                    title="Edit Signature"
                                    className="h-7 w-7 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center text-slate-600 shadow-2xs transition"
                                >
                                    <Edit3 size={13} />
                                </button>
                                <button
                                    onClick={(e) => handleDelete(sig.id, e)}
                                    title="Delete Signature"
                                    className="h-7 w-7 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg flex items-center justify-center text-rose-500 shadow-2xs transition"
                                >
                                    <Trash2 size={13} />
                                </button>
                            </div>

                            <div className="flex-1 flex items-center justify-center p-4">
                                {sig.url ? (
                                    <img src={sig.url} alt={sig.name} className="max-h-full object-contain" />
                                ) : (
                                    <div className="font-serif italic text-lg tracking-wider text-slate-900 font-semibold select-none">
                                        {sig.name}
                                    </div>
                                )}
                            </div>

                            <div className="py-2.5 px-4 bg-white border-t border-slate-100 text-center text-xs font-semibold text-slate-800 truncate">
                                {sig.name}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal for Add / Edit */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden flex flex-col">
                        
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
                            <h2 className="text-sm font-bold text-slate-900">
                                {editingId ? 'Edit Signature' : 'Add signature'}
                            </h2>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 transition cursor-pointer"
                                >
                                    <X size={18} />
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSaveSignature}
                                    disabled={saving}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition shadow-sm shadow-blue-500/25 cursor-pointer"
                                >
                                    {saving ? 'Saving...' : 'Save & Update'}
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-start gap-3">
                                <div className="p-2 bg-white rounded-xl border border-slate-200 text-slate-700 shadow-2xs shrink-0">
                                    <PenTool size={16} />
                                </div>
                                <div className="text-xs text-slate-600 space-y-0.5">
                                    <p className="font-bold text-slate-900">Your Signature. Your Authority.</p>
                                    <p>Create your signature once, then apply it to invoices, estimates, and other documents.</p>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-700">Signature name</label>
                                <input
                                    type="text"
                                    placeholder="Signature Name"
                                    value={signatureName}
                                    onChange={(e) => setSignatureName(e.target.value)}
                                    className="w-full bg-white border border-slate-200 focus:border-violet-500 rounded-xl px-4 py-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden transition"
                                />
                            </div>

                            <div className="border-b border-slate-100 flex items-center gap-6">
                                {['Upload', 'Type', 'Draw'].map((tab) => (
                                    <button
                                        key={tab}
                                        type="button"
                                        onClick={() => setActiveTab(tab)}
                                        className={`text-xs font-semibold pb-3 transition relative cursor-pointer ${
                                            activeTab === tab ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
                                        }`}
                                    >
                                        {tab}
                                        {activeTab === tab && (
                                            <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                                        )}
                                    </button>
                                ))}
                            </div>

                            {activeTab === 'Upload' && (
                                <div className="space-y-2">
                                    <label className="border-2 border-dashed border-blue-200/80 hover:border-blue-400 bg-blue-50/10 hover:bg-blue-50/30 rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition text-center">
                                        <div className="h-10 w-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 shadow-2xs mb-3">
                                            <UploadIcon size={18} />
                                        </div>
                                        <p className="text-xs font-semibold text-slate-700">
                                            {signatureFile ? signatureFile.name : 'Upload image'}
                                        </p>
                                        <input
                                            type="file"
                                            accept="image/png, image/jpeg"
                                            onChange={(e) => setSignatureFile(e.target.files[0])}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                            )}

                            {activeTab === 'Type' && (
                                <input
                                    type="text"
                                    placeholder="Type your signature here..."
                                    value={typedText}
                                    onChange={(e) => setTypedText(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-4 text-xl font-serif italic text-slate-900 focus:outline-hidden"
                                />
                            )}

                            {activeTab === 'Draw' && (
                                <div className="border border-slate-200 rounded-2xl h-40 bg-slate-50 flex items-center justify-center text-slate-400 text-xs font-medium">
                                    [ Signature Drawing Canvas Area ]
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Signatures;