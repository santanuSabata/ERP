import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Building2, User, Mail, Phone, Calendar, ArrowLeft, 
    FileText, Plus, Trash2, Download, Upload, Clock, CheckCircle, Shield, Save, 
    Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List, Link as LinkIcon, Image as ImageIcon, MapPin, RefreshCw, DollarSign, Layers, ArrowRight, X, MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/axios.js';

const LeadView = ({ leadId: propLeadId }) => {
    const { id: paramId } = useParams();
    const id = propLeadId || paramId; // 👈 Fallback to prop if opened inside a modal
    const navigate = useNavigate();
    const [lead, setLead] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAgent, setSelectedAgent] = useState('');
    const [noteContent, setNoteContent] = useState('');
    const [savingNote, setSavingNote] = useState(false);

    // Modal States
    const [showPhoneModal, setShowPhoneModal] = useState(false);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [showDiscussionModal, setShowDiscussionModal] = useState(false);

    const [newPhone, setNewPhone] = useState({ label: 'Work', number: '', name: '', description: '' });
    const [newEmail, setNewEmail] = useState({ label: 'Work', address: '', name: '', description: '' });
    const [newDiscussion, setNewDiscussion] = useState({ subject: '', text: '' });
    const [submittingContact, setSubmittingContact] = useState(false);

    const fetchLeadDetails = async () => {
        if (!id) return;
        try {
            setLoading(true);
            const res = await api.get(`/leads/${id}`);
            if (res.data?.success) {
                const leadData = res.data.lead || res.data.data;
                setLead(leadData);
                setSelectedAgent(leadData.agent_id || '');
                setNoteContent(leadData.remarks || '');
            }
        } catch (err) {
            console.error('Failed to load lead details:', err);
            toast.error('Could not fetch lead details.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const empRes = await api.get('/employees').catch(() => api.get('/hr/employees'));
                const empData = empRes.data?.employees || empRes.data?.data || empRes.data || [];
                setEmployees(Array.isArray(empData) ? empData : []);
            } catch (e) {
                console.warn('Could not load employees list');
            }
        };
        fetchEmployees();
        fetchLeadDetails();
    }, [id]);

    const handleReassignAgent = async () => {
        try {
            const assignedEmp = employees.find(e => String(e.id) === String(selectedAgent));
            const changedByName = assignedEmp ? (assignedEmp.name || assignedEmp.full_name) : 'Admin';

            await api.put(`/leads/${id}`, { 
                agentId: selectedAgent ? parseInt(selectedAgent, 10) : null,
                changedBy: changedByName
            });
            toast.success('Agent reassigned successfully!');
            fetchLeadDetails();
        } catch (err) {
            console.error('Reassign error:', err);
            toast.error('Failed to reassign agent.');
        }
    };

    const handleSaveNotes = async () => {
        try {
            setSavingNote(true);
            await api.put(`/leads/${id}`, { remarks: noteContent });
            toast.success('Notes updated successfully!');
        } catch (err) {
            console.error('Save notes error:', err);
            toast.error('Failed to save notes.');
        } finally {
            setSavingNote(false);
        }
    };

    const handleAddPhoneSubmit = async (e) => {
        e.preventDefault();
        if (!newPhone.number.trim()) return;
        try {
            setSubmittingContact(true);
            const updatedPhones = [...(lead.phones || []), { phone_label: newPhone.label, phone_number: newPhone.number, name: newPhone.name, description: newPhone.description }];
            await api.put(`/leads/${id}`, { phones: updatedPhones.map(p => ({ label: p.phone_label || p.label, number: p.phone_number || p.number, name: p.name || '', description: p.description || '' })) });
            toast.success('Phone number added successfully!');
            setNewPhone({ label: 'Work', number: '', name: '', description: '' });
            setShowPhoneModal(false);
            fetchLeadDetails();
        } catch (err) {
            toast.error('Failed to add phone number.');
        } finally {
            setSubmittingContact(false);
        }
    };

    const handleAddEmailSubmit = async (e) => {
        e.preventDefault();
        if (!newEmail.address.trim()) return;
        try {
            setSubmittingContact(true);
            const updatedEmails = [...(lead.emails || []), { email_label: newEmail.label, email_address: newEmail.address, name: newEmail.name, description: newEmail.description }];
            await api.put(`/leads/${id}`, { emails: updatedEmails.map(em => ({ label: em.email_label || em.label, address: em.email_address || em.address, name: em.name || '', description: em.description || '' })) });
            toast.success('Email address added successfully!');
            setNewEmail({ label: 'Work', address: '', name: '', description: '' });
            setShowEmailModal(false);
            fetchLeadDetails();
        } catch (err) {
            toast.error('Failed to add email address.');
        } finally {
            setSubmittingContact(false);
        }
    };

    const handleAddDiscussionSubmit = async (e) => {
        e.preventDefault();
        if (!newDiscussion.text.trim()) return;
        try {
            setSubmittingContact(true);
            const updatedDiscussions = [...(lead.discussions || []), { subject: newDiscussion.subject || 'General Discussion', discussion_text: newDiscussion.text }];
            await api.put(`/leads/${id}`, { discussions: updatedDiscussions.map(d => ({ subject: d.subject, text: d.discussion_text || d.text })) });
            toast.success('Discussion added successfully!');
            setNewDiscussion({ subject: '', text: '' });
            setShowDiscussionModal(false);
            fetchLeadDetails();
        } catch (err) {
            toast.error('Failed to add discussion.');
        } finally {
            setSubmittingContact(false);
        }
    };

    const handleDeletePhone = async (phoneId) => {
        try {
            const updatedPhones = (lead.phones || []).filter(p => p.id !== phoneId);
            await api.put(`/leads/${id}`, { phones: updatedPhones.map(p => ({ label: p.phone_label, number: p.phone_number, name: p.name, description: p.description })) });
            toast.success('Phone removed successfully!');
            fetchLeadDetails();
        } catch (err) {
            toast.error('Failed to remove phone.');
        }
    };

    const handleDeleteEmail = async (emailId) => {
        try {
            const updatedEmails = (lead.emails || []).filter(em => em.id !== emailId);
            await api.put(`/leads/${id}`, { emails: updatedEmails.map(em => ({ label: em.email_label, address: em.email_address, name: em.name, description: em.description })) });
            toast.success('Email removed successfully!');
            fetchLeadDetails();
        } catch (err) {
            toast.error('Failed to remove email.');
        }
    };

    const handleDeleteDiscussion = async (discId) => {
        try {
            const updatedDiscussions = (lead.discussions || []).filter(d => d.id !== discId);
            await api.put(`/leads/${id}`, { discussions: updatedDiscussions.map(d => ({ subject: d.subject, text: d.discussion_text })) });
            toast.success('Discussion deleted successfully!');
            fetchLeadDetails();
        } catch (err) {
            toast.error('Failed to delete discussion.');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <p className="text-xs font-bold text-slate-500 animate-pulse">Loading lead details...</p>
            </div>
        );
    }

    if (!lead) {
        return (
            <div className="p-6 text-center">
                <p className="text-sm font-bold text-slate-700">Lead not found.</p>
                <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl">Go Back</button>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 w-full space-y-6 font-sans text-slate-900">
            
            {/* Breadcrumb & Top Header Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white p-5 rounded-2xl shadow-md">
                <div className="flex items-center gap-3">
                    {propLeadId ? null : (
                        <button onClick={() => navigate(-1)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition cursor-pointer text-slate-300">
                            <ArrowLeft size={16} />
                        </button>
                    )}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-500 text-white font-black text-sm flex items-center justify-center shadow-inner">
                            {lead.company_name?.charAt(0) || 'T'}
                        </div>
                        <div>
                            <h1 className="text-base font-black tracking-wide">{lead.company_name}</h1>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                                Lead ID: {lead.id} | {lead.insurance_type}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 text-[11px]">
                    <span className="px-3 py-1.5 bg-slate-800 rounded-xl text-slate-300 font-semibold border border-slate-700">
                        Deal Stage: <strong className="text-white">{lead.deal_stage_name || 'Qualified'}</strong>
                    </span>
                    <span className="px-3 py-1.5 bg-slate-800 rounded-xl text-slate-300 font-semibold border border-slate-700">
                        Pipeline Type: <strong className="text-white">Fresh</strong>
                    </span>
                    <span className="px-3 py-1.5 bg-slate-800 rounded-xl text-slate-300 font-semibold border border-slate-700">
                        Policy Type: <strong className="text-white">{lead.transaction_type || 'Fresh'}</strong>
                    </span>
                    <span className="px-3 py-1.5 bg-slate-800 rounded-xl text-slate-300 font-semibold border border-slate-700">
                        Deal Value: <strong className="text-emerald-400 font-mono">₹{Number(lead.policy_value || 0).toLocaleString()}</strong>
                    </span>
                </div>
            </div>

            {/* Detailed Lead Info Badges Bar */}
            <div className="bg-white p-3.5 rounded-2xl shadow-xs border border-slate-200 flex flex-wrap items-center gap-2 text-xs">
                <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 text-slate-700 font-medium">
                    <User size={13} className="text-blue-600" />
                    <span className="text-slate-400">Contact:</span>
                    <strong className="text-slate-900">{lead.contact_person || '-'}</strong>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 text-slate-700 font-medium">
                    <Phone size={13} className="text-blue-600" />
                    <span className="text-slate-400">Phone:</span>
                    <strong className="text-slate-900 font-mono">{lead.phone || '-'}</strong>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 text-slate-700 font-medium">
                    <Mail size={13} className="text-blue-600" />
                    <span className="text-slate-400">Email:</span>
                    <strong className="text-slate-900 font-mono">{lead.email || '-'}</strong>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 text-slate-700 font-medium">
                    <MapPin size={13} className="text-blue-600" />
                    <span className="text-slate-400">City:</span>
                    <strong className="text-slate-900">{lead.city || '-'}</strong>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 text-slate-700 font-medium">
                    <MapPin size={13} className="text-blue-600" />
                    <span className="text-slate-400">State:</span>
                    <strong className="text-slate-900">{lead.state || '-'}</strong>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 text-slate-700 font-medium">
                    <Calendar size={13} className="text-blue-600" />
                    <span className="text-slate-400">Policy Expiry:</span>
                    <strong className="text-slate-900">{lead.expiry_date ? lead.expiry_date.split('T')[0] : '-'}</strong>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 text-slate-700 font-medium">
                    <RefreshCw size={13} className="text-blue-600" />
                    <span className="text-slate-400">Policy Type:</span>
                    <strong className="text-slate-900">{lead.transaction_type || 'Fresh'}</strong>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 text-slate-700 font-medium">
                    <Building2 size={13} className="text-blue-600" />
                    <span className="text-slate-400">Existing Insurer:</span>
                    <strong className="text-slate-900">{lead.existing_insurer || '-'}</strong>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 text-slate-700 font-medium">
                    <DollarSign size={13} className="text-emerald-600" />
                    <span className="text-slate-400">Policy Value:</span>
                    <strong className="text-slate-900 font-mono">₹{Number(lead.policy_value || 0).toLocaleString()}</strong>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 text-slate-700 font-medium">
                    <Shield size={13} className="text-blue-600" />
                    <span className="text-slate-400">Kanban Stage:</span>
                    <strong className="text-slate-900">{lead.lead_stage_name || '-'}</strong>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 text-slate-700 font-medium">
                    <Calendar size={13} className="text-blue-600" />
                    <span className="text-slate-400">Created:</span>
                    <strong className="text-slate-900">{lead.created_at?.split('T')[0] || '-'}</strong>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="space-y-6">

                {/* Assignment & Progress Split Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    
                    {/* Assignment Section */}
                    <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 space-y-4">
                        <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">Assignment</h3>
                        <div>
                            <p className="text-[11px] text-slate-400 font-semibold">Currently assigned to</p>
                            <div className="mt-1 inline-block px-3 py-1 bg-amber-500 text-white rounded-lg text-xs font-bold shadow-xs">
                                {lead.agent_name || 'Unassigned'}
                            </div>
                        </div>
                        <div className="space-y-1.5 pt-2">
                            <label className="text-xs font-bold text-slate-700">Reassign to</label>
                            <select 
                                value={selectedAgent} 
                                onChange={(e) => setSelectedAgent(e.target.value)}
                                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 font-semibold cursor-pointer"
                            >
                                <option value="">Select RM</option>
                                {employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>{emp.name || emp.full_name}</option>
                                ))}
                            </select>
                        </div>
                        <button 
                            onClick={handleReassignAgent}
                            className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
                        >
                            Reassign
                        </button>

                        {/* History Timeline */}
                        <div className="pt-4 border-t border-slate-100 space-y-3">
                            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">History</h4>
                            <div className="space-y-3 text-xs text-slate-600 max-h-60 overflow-y-auto pr-1">
                                {lead.assignment_history && lead.assignment_history.length > 0 ? (
                                    lead.assignment_history.map((hist, idx) => {
                                        const prevName = hist.prev_agent_name || 'Unassigned';
                                        const newName = hist.new_agent_name || '-';
                                        const dateStr = new Date(hist.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                                        
                                        return (
                                            <div key={idx} className="space-y-0.5 pb-2.5 border-b border-slate-50 last:border-none">
                                                <div className="flex items-center gap-2 font-medium text-xs flex-wrap">
                                                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-md font-semibold text-[11px] border border-slate-200">{prevName}</span>
                                                    <ArrowRight size={13} className="text-slate-400" />
                                                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-semibold text-[11px] border border-emerald-200">{newName}</span>
                                                </div>
                                                <p className="text-[11px] text-slate-500 mt-1 font-normal">
                                                    by <strong className="text-slate-700">{hist.changed_by || 'Admin'}</strong> • {dateStr}
                                                </p>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-[11px] text-slate-400 italic">No assignment history recorded yet.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Lead Stage Section */}
                    <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 space-y-4">
                        <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">Lead Stage</h3>
                        <div className="space-y-3">
                            <div>
                                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                                    <span>20% through pipeline</span>
                                    <span>20%</span>
                                </div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                    <div className="bg-blue-600 h-full rounded-full" style={{ width: '20%' }}></div>
                                </div>
                            </div>
                            <div className="space-y-1 text-xs pt-2">
                                <div className="flex justify-between py-1 border-b border-slate-50"><span className="text-slate-400">Pipeline Stage:</span> <strong className="text-slate-800">Sales</strong></div>
                                <div className="flex justify-between py-1 border-b border-slate-50"><span className="text-slate-400">Kanban Stage:</span> <strong className="text-slate-800">{lead.lead_stage_name || '-'}</strong></div>
                                <div className="flex justify-between py-1 border-b border-slate-50"><span className="text-slate-400">Created:</span> <strong className="text-slate-800">{lead.created_at?.split('T')[0] || '-'}</strong></div>
                            </div>
                        </div>
                    </div>

                    {/* Lead Progress Section */}
                    <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 space-y-4">
                        <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">Lead Progress</h3>
                        <div className="space-y-3">
                            <div>
                                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                                    <span>20% through pipeline</span>
                                    <span>20%</span>
                                </div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                    <div className="bg-blue-600 h-full rounded-full" style={{ width: '20%' }}></div>
                                </div>
                            </div>
                            <div className="space-y-1 text-xs pt-2">
                                <div className="flex justify-between py-1 border-b border-slate-50"><span className="text-slate-400">Pipeline Stage:</span> <strong className="text-slate-800">Sales</strong></div>
                                <div className="flex justify-between py-1 border-b border-slate-50"><span className="text-slate-400">Kanban Stage:</span> <strong className="text-slate-800">{lead.lead_stage_name || '-'}</strong></div>
                                <div className="flex justify-between py-1 border-b border-slate-50"><span className="text-slate-400">Created:</span> <strong className="text-slate-800">{lead.created_at?.split('T')[0] || '-'}</strong></div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Stats Counters Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Product</p>
                            <p className="text-sm font-black text-slate-900 mt-0.5">1</p>
                        </div>
                        <div className="p-2.5 bg-cyan-50 text-cyan-600 rounded-xl"><Building2 size={16} /></div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Source</p>
                            <p className="text-sm font-black text-slate-900 mt-0.5">0</p>
                        </div>
                        <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><FileText size={16} /></div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Files</p>
                            <p className="text-sm font-black text-slate-900 mt-0.5">0</p>
                        </div>
                        <div className="p-2.5 bg-teal-50 text-teal-600 rounded-xl"><Upload size={16} /></div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Price</p>
                            <p className="text-sm font-black text-amber-600 mt-0.5">₹{Number(lead.policy_value || 0).toLocaleString()}</p>
                        </div>
                        <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><Shield size={16} /></div>
                    </div>
                </div>

                {/* Users & Products Data Tables */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Users Table */}
                    <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">Users</h3>
                            <button className="p-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition cursor-pointer"><Plus size={14} /></button>
                        </div>
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px]">
                                    <th className="pb-2">Name</th>
                                    <th className="pb-2 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-slate-50">
                                    <td className="py-3 font-semibold text-slate-800 flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                                            {lead.agent_name ? lead.agent_name.charAt(0) : 'A'}
                                        </div>
                                        {lead.agent_name || 'Unassigned'}
                                    </td>
                                    <td className="py-3 text-right">
                                        <button className="p-1.5 bg-rose-50 text-rose-600 rounded-lg"><Trash2 size={12} /></button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Products Table */}
                    <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">Products</h3>
                            <button className="p-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition cursor-pointer"><Plus size={14} /></button>
                        </div>
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px]">
                                    <th className="pb-2">Name</th>
                                    <th className="pb-2">Price</th>
                                    <th className="pb-2 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-slate-50">
                                    <td className="py-3 font-semibold text-slate-800">{lead.insurance_type}</td>
                                    <td className="py-3 font-mono font-bold text-slate-600">₹ {Number(lead.policy_value || 0).toLocaleString()}</td>
                                    <td className="py-3 text-right">
                                        <button className="p-1.5 bg-rose-50 text-rose-600 rounded-lg"><Trash2 size={12} /></button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                </div>

                {/* Phones & Emails Tables */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Phones Table */}
                    <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">Phones</h3>
                            <button onClick={() => setShowPhoneModal(true)} className="p-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition cursor-pointer"><Plus size={14} /></button>
                        </div>
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px]">
                                    <th className="pb-2">Name / Label</th>
                                    <th className="pb-2">Number</th>
                                    <th className="pb-2">Description</th>
                                    <th className="pb-2 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lead.phones && lead.phones.length > 0 ? (
                                    lead.phones.map((p, idx) => (
                                        <tr key={idx} className="border-b border-slate-50">
                                            <td className="py-2.5 font-bold text-slate-700">
                                                {p.name || '-'} <span className="text-[10px] text-slate-400 font-normal">({p.phone_label})</span>
                                            </td>
                                            <td className="py-2.5 font-mono text-slate-900">{p.phone_number}</td>
                                            <td className="py-2.5 text-slate-500">{p.description || '-'}</td>
                                            <td className="py-2.5 text-right">
                                                <button onClick={() => handleDeletePhone(p.id)} className="p-1 bg-rose-50 text-rose-600 rounded-md"><Trash2 size={12} /></button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="py-6 text-center text-slate-400 text-xs">No Phones Available!</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Emails Table */}
                    <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">Emails</h3>
                            <button onClick={() => setShowEmailModal(true)} className="p-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition cursor-pointer"><Plus size={14} /></button>
                        </div>
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px]">
                                    <th className="pb-2">Name / Label</th>
                                    <th className="pb-2">Email Address</th>
                                    <th className="pb-2">Description</th>
                                    <th className="pb-2 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lead.emails && lead.emails.length > 0 ? (
                                    lead.emails.map((em, idx) => (
                                        <tr key={idx} className="border-b border-slate-50">
                                            <td className="py-2.5 font-bold text-slate-700">
                                                {em.name || '-'} <span className="text-[10px] text-slate-400 font-normal">({em.email_label})</span>
                                            </td>
                                            <td className="py-2.5 font-mono text-slate-900">{em.email_address}</td>
                                            <td className="py-2.5 text-slate-500">{em.description || '-'}</td>
                                            <td className="py-2.5 text-right">
                                                <button onClick={() => handleDeleteEmail(em.id)} className="p-1 bg-rose-50 text-rose-600 rounded-md"><Trash2 size={12} /></button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="py-6 text-center text-slate-400 text-xs">No Emails Available!</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                </div>

                {/* Discussions & Notes Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Multiple Discussions Section (With Modal Trigger Plus Button) */}
                    <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                                <MessageSquare size={14} className="text-blue-600" /> Discussions
                            </h3>
                            <button onClick={() => setShowDiscussionModal(true)} className="p-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition cursor-pointer"><Plus size={14} /></button>
                        </div>
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                            {lead.discussions && lead.discussions.length > 0 ? (
                                lead.discussions.map((d, idx) => {
                                    const dateStr = d.created_at ? new Date(d.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
                                    return (
                                        <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 relative group">
                                            <div className="flex items-center justify-between">
                                                <h5 className="text-xs font-bold text-slate-800">{d.subject || 'Discussion'}</h5>
                                                <button onClick={() => handleDeleteDiscussion(d.id)} className="text-rose-500 hover:text-rose-700 opacity-80 hover:opacity-100 transition"><Trash2 size={12} /></button>
                                            </div>
                                            <p className="text-xs text-slate-600 whitespace-pre-wrap">{d.discussion_text}</p>
                                            <p className="text-[10px] text-slate-400 pt-1">by {d.created_by || 'Admin'} • {dateStr}</p>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="py-8 text-center text-slate-400 text-xs">No Discussions Available!</div>
                            )}
                        </div>
                    </div>

                    {/* Notes with Rich Text Toolbar */}
                    <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 space-y-3">
                        <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">Notes</h3>
                        
                        {/* Rich Text Toolbar Mock */}
                        <div className="flex items-center gap-1.5 p-1 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 flex-wrap">
                            <button className="p-1.5 hover:bg-slate-200 rounded"><Bold size={13} /></button>
                            <button className="p-1.5 hover:bg-slate-200 rounded"><Italic size={13} /></button>
                            <button className="p-1.5 hover:bg-slate-200 rounded"><Underline size={13} /></button>
                            <span className="w-px h-4 bg-slate-200 mx-1"></span>
                            <span className="text-[11px] font-bold px-1 text-slate-500">Open Sans</span>
                            <span className="w-px h-4 bg-slate-200 mx-1"></span>
                            <button className="p-1.5 hover:bg-slate-200 rounded"><AlignLeft size={13} /></button>
                            <button className="p-1.5 hover:bg-slate-200 rounded"><AlignCenter size={13} /></button>
                            <button className="p-1.5 hover:bg-slate-200 rounded"><AlignRight size={13} /></button>
                            <button className="p-1.5 hover:bg-slate-200 rounded"><List size={13} /></button>
                            <button className="p-1.5 hover:bg-slate-200 rounded"><LinkIcon size={13} /></button>
                        </div>

                        <textarea 
                            rows={4}
                            value={noteContent}
                            onChange={(e) => setNoteContent(e.target.value)}
                            placeholder="Enter discussion remarks..."
                            className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50/50"
                        />
                        <div className="flex justify-end">
                            <button 
                                onClick={handleSaveNotes}
                                disabled={savingNote}
                                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
                            >
                                <Save size={14} /> {savingNote ? 'Saving...' : 'Save Notes'}
                            </button>
                        </div>
                    </div>

                </div>

                {/* Files Section */}
                <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">Files</h3>
                    </div>
                    <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50 hover:bg-slate-100/50 transition cursor-pointer">
                        <p className="text-xs font-bold text-slate-500">Drop files here to upload</p>
                    </div>
                </div>

                {/* Calls Table */}
                <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">Calls</h3>
                        <button className="p-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition cursor-pointer"><Plus size={14} /></button>
                    </div>
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px]">
                                <th className="pb-2">Subject</th>
                                <th className="pb-2">Call Type</th>
                                <th className="pb-2">Duration</th>
                                <th className="pb-2">User</th>
                                <th className="pb-2 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td colSpan="5" className="py-6 text-center text-slate-400 text-xs">No Calls Available!</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Activity Log Section */}
                <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 space-y-4">
                    <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">Activity</h3>
                    <div className="py-6 text-center text-slate-400 text-xs">No activity found yet.</div>
                </div>

            </div>

            {/* Modal: Add Phone Number */}
            {showPhoneModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs font-sans">
                    <div className="bg-white w-full max-w-md p-6 rounded-2xl shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-sm font-black text-slate-900">Add Phone Number</h3>
                            <button onClick={() => setShowPhoneModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"><X size={16} /></button>
                        </div>
                        <form onSubmit={handleAddPhoneSubmit} className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700">Contact Name</label>
                                <input type="text" value={newPhone.name} onChange={(e) => setNewPhone({ ...newPhone, name: e.target.value })} placeholder="e.g. Rajesh Sharma" className="w-full p-2.5 rounded-xl border border-slate-200 text-xs" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700">Label</label>
                                    <select value={newPhone.label} onChange={(e) => setNewPhone({ ...newPhone, label: e.target.value })} className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white font-semibold">
                                        <option value="Work">Work</option>
                                        <option value="Mobile">Mobile</option>
                                        <option value="Direct">Direct</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700">Phone Number</label>
                                    <input type="text" required value={newPhone.number} onChange={(e) => setNewPhone({ ...newPhone, number: e.target.value })} placeholder="9898815579" className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700">Description / Notes</label>
                                <textarea rows={2} value={newPhone.description} onChange={(e) => setNewPhone({ ...newPhone, description: e.target.value })} placeholder="Optional description..." className="w-full p-2.5 rounded-xl border border-slate-200 text-xs" />
                            </div>
                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowPhoneModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl cursor-pointer">Cancel</button>
                                <button type="submit" disabled={submittingContact} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md">
                                    {submittingContact ? 'Adding...' : 'Add Phone'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Add Email Address */}
            {showEmailModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs font-sans">
                    <div className="bg-white w-full max-w-md p-6 rounded-2xl shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-sm font-black text-slate-900">Add Email Address</h3>
                            <button onClick={() => setShowEmailModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"><X size={16} /></button>
                        </div>
                        <form onSubmit={handleAddEmailSubmit} className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700">Contact Name</label>
                                <input type="text" value={newEmail.name} onChange={(e) => setNewEmail({ ...newEmail, name: e.target.value })} placeholder="e.g. Rajesh Sharma" className="w-full p-2.5 rounded-xl border border-slate-200 text-xs" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700">Label</label>
                                    <select value={newEmail.label} onChange={(e) => setNewEmail({ ...newEmail, label: e.target.value })} className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white font-semibold">
                                        <option value="Work">Work</option>
                                        <option value="Personal">Personal</option>
                                        <option value="Billing">Billing</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700">Email Address</label>
                                    <input type="email" required value={newEmail.address} onChange={(e) => setNewEmail({ ...newEmail, address: e.target.value })} placeholder="rajesh@apex.com" className="w-full p-2.5 rounded-xl border border-slate-200 text-xs" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700">Description / Notes</label>
                                <textarea rows={2} value={newEmail.description} onChange={(e) => setNewEmail({ ...newEmail, description: e.target.value })} placeholder="Optional description..." className="w-full p-2.5 rounded-xl border border-slate-200 text-xs" />
                            </div>
                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowEmailModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl cursor-pointer">Cancel</button>
                                <button type="submit" disabled={submittingContact} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md">
                                    {submittingContact ? 'Adding...' : 'Add Email'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Add Discussion */}
            {showDiscussionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs font-sans">
                    <div className="bg-white w-full max-w-md p-6 rounded-2xl shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-sm font-black text-slate-900">Add Discussion Log</h3>
                            <button onClick={() => setShowDiscussionModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"><X size={16} /></button>
                        </div>
                        <form onSubmit={handleAddDiscussionSubmit} className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700">Subject</label>
                                <input type="text" value={newDiscussion.subject} onChange={(e) => setNewDiscussion({ ...newDiscussion, subject: e.target.value })} placeholder="e.g. Pricing Negotiation" className="w-full p-2.5 rounded-xl border border-slate-200 text-xs" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700">Discussion Details</label>
                                <textarea rows={4} required value={newDiscussion.text} onChange={(e) => setNewDiscussion({ ...newDiscussion, text: e.target.value })} placeholder="Enter discussion notes here..." className="w-full p-2.5 rounded-xl border border-slate-200 text-xs" />
                            </div>
                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowDiscussionModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl cursor-pointer">Cancel</button>
                                <button type="submit" disabled={submittingContact} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md">
                                    {submittingContact ? 'Posting...' : 'Post Discussion'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default LeadView;