import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Building2, User, Mail, Phone, Calendar, ArrowLeft, 
    FileText, Plus, Trash2, Download, Upload, Clock, CheckCircle, Shield, Save, 
    Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List, Link as LinkIcon, Image as ImageIcon, MapPin, RefreshCw, DollarSign, Layers, ArrowRight, X, MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/axios.js';

const LeadView = ({ leadId, id: propId }) => {
    const { id: paramId } = useParams();
    // Resolves ID from prop (leadId or id) or URL route parameters
    const activeId = leadId || propId || paramId;
    
    const navigate = useNavigate();
    const [lead, setLead] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAgent, setSelectedAgent] = useState('');
    const [noteContent, setNoteContent] = useState('');
    const [savingNote, setSavingNote] = useState(false);
    const [uploadingFiles, setUploadingFiles] = useState(false);

    // Call Timer States
    const [isCalling, setIsCalling] = useState(false);
    const [callSeconds, setCallSeconds] = useState(0);

    // Break Timer States
    const [breakType, setBreakType] = useState('');
    const [isOnBreak, setIsOnBreak] = useState(false);
    const [breakSeconds, setBreakSeconds] = useState(0);

    // Modal States
    const [showPhoneModal, setShowPhoneModal] = useState(false);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [showDiscussionModal, setShowDiscussionModal] = useState(false);
    const [showCallModal, setShowCallModal] = useState(false);

    const [newPhone, setNewPhone] = useState({ label: 'Work', number: '', name: '', description: '' });
    const [newEmail, setNewEmail] = useState({ label: 'Work', address: '', name: '', description: '' });
    const [newDiscussion, setNewDiscussion] = useState({ subject: '', text: '' });
    const [newCall, setNewCall] = useState({ subject: '', callType: 'Outbound', duration: '00:00', userName: 'Admin', remarks: '' });
    const [submittingContact, setSubmittingContact] = useState(false);

    // Call Timer Effect
    useEffect(() => {
        let timer;
        if (isCalling) {
            timer = setInterval(() => {
                setCallSeconds(prev => prev + 1);
            }, 1000);
        } else {
            clearInterval(timer);
        }
        return () => clearInterval(timer);
    }, [isCalling]);

    // Break Timer Effect
    useEffect(() => {
        let breakTimer;
        if (isOnBreak) {
            breakTimer = setInterval(() => {
                setBreakSeconds(prev => prev + 1);
            }, 1000);
        } else {
            clearInterval(breakTimer);
        }
        return () => clearInterval(breakTimer);
    }, [isOnBreak]);

    const formatTime = (totalSeconds) => {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const fetchLeadDetails = async () => {
        if (!activeId) {
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const res = await api.get(`/leads/${activeId}`);
            if (res.data?.success) {
                const leadData = res.data.lead || res.data.data;
                setLead(leadData);
                setSelectedAgent(leadData?.agent_id ? String(leadData.agent_id) : '');
                setNoteContent(leadData?.remarks || '');
            } else {
                setLead(null);
                toast.error('Could not fetch lead details.');
            }
        } catch (err) {
            console.error('Failed to load lead details:', err);
            setLead(null);
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
    }, []);

    useEffect(() => {
        fetchLeadDetails();
    }, [activeId]);

    const handleReassignAgent = async () => {
        try {
            const assignedEmp = employees.find(e => String(e.id) === String(selectedAgent));
            const changedByName = assignedEmp ? (assignedEmp.name || assignedEmp.full_name) : 'Admin';

            await api.put(`/leads/${activeId}`, { 
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
            await api.put(`/leads/${activeId}`, { remarks: noteContent });
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
            await api.put(`/leads/${activeId}`, { phones: updatedPhones.map(p => ({ label: p.phone_label || p.label, number: p.phone_number || p.number, name: p.name || '', description: p.description || '' })) });
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
            await api.put(`/leads/${activeId}`, { emails: updatedEmails.map(em => ({ label: em.email_label || em.label, address: em.email_address || em.address, name: em.name || '', description: em.description || '' })) });
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
            await api.put(`/leads/${activeId}`, { discussions: updatedDiscussions.map(d => ({ subject: d.subject, text: d.discussion_text || d.text })) });
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

    const handleAddCallSubmit = async (e) => {
        e.preventDefault();
        if (!newCall.subject.trim()) return;
        try {
            setSubmittingContact(true);
            const updatedCalls = [...(lead.calls || []), { subject: newCall.subject, call_type: newCall.callType, duration: newCall.duration, user_name: newCall.userName, remarks: newCall.remarks }];
            await api.put(`/leads/${activeId}`, { calls: updatedCalls });
            toast.success('Call log added successfully!');
            setNewCall({ subject: '', callType: 'Outbound', duration: '00:00', userName: 'Admin', remarks: '' });
            setShowCallModal(false);
            fetchLeadDetails();
        } catch (err) {
            toast.error('Failed to add call log.');
        } finally {
            setSubmittingContact(false);
        }
    };

    const handleFileUpload = async (e) => {
        const uploadedFiles = Array.from(e.target.files);
        if (uploadedFiles.length === 0) return;

        try {
            setUploadingFiles(true);
            const newFiles = uploadedFiles.map(file => ({
                name: file.name,
                url: URL.createObjectURL(file),
                type: file.type
            }));

            const updatedFiles = [...(lead.files || []), ...newFiles];
            await api.put(`/leads/${activeId}`, { files: updatedFiles.map(f => ({ name: f.file_name || f.name, url: f.file_url || f.url, type: f.file_type || f.type })) });
            
            toast.success('Files uploaded successfully!');
            fetchLeadDetails();
        } catch (err) {
            console.error('File upload error:', err);
            toast.error('Failed to upload files.');
        } finally {
            setUploadingFiles(false);
        }
    };

    const handleDeletePhone = async (phoneId) => {
        try {
            const updatedPhones = (lead.phones || []).filter(p => p.id !== phoneId);
            await api.put(`/leads/${activeId}`, { phones: updatedPhones.map(p => ({ label: p.phone_label, number: p.phone_number, name: p.name, description: p.description })) });
            toast.success('Phone removed successfully!');
            fetchLeadDetails();
        } catch (err) {
            toast.error('Failed to remove phone.');
        }
    };

    const handleDeleteEmail = async (emailId) => {
        try {
            const updatedEmails = (lead.emails || []).filter(em => em.id !== emailId);
            await api.put(`/leads/${activeId}`, { emails: updatedEmails.map(em => ({ label: em.email_label, address: em.email_address, name: em.name, description: em.description })) });
            toast.success('Email removed successfully!');
            fetchLeadDetails();
        } catch (err) {
            toast.error('Failed to remove email.');
        }
    };

    const handleDeleteDiscussion = async (discId) => {
        try {
            const updatedDiscussions = (lead.discussions || []).filter(d => d.id !== discId);
            await api.put(`/leads/${activeId}`, { discussions: updatedDiscussions.map(d => ({ subject: d.subject, text: d.discussion_text })) });
            toast.success('Discussion deleted successfully!');
            fetchLeadDetails();
        } catch (err) {
            toast.error('Failed to delete discussion.');
        }
    };

    const handleDeleteFile = async (fileId) => {
        try {
            const updatedFiles = (lead.files || []).filter(f => f.id !== fileId);
            await api.put(`/leads/${activeId}`, { files: updatedFiles.map(f => ({ name: f.file_name, url: f.file_url, type: f.file_type })) });
            toast.success('File removed successfully!');
            fetchLeadDetails();
        } catch (err) {
            toast.error('Failed to remove file.');
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
            <div className="p-8 text-center space-y-3">
                <p className="text-sm font-bold text-slate-700">Lead not found (ID: {activeId || 'None'}).</p>
                {!leadId && !propId && (
                    <button onClick={() => navigate(-1)} className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl cursor-pointer">Go Back</button>
                )}
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 w-full space-y-6 font-sans text-slate-900">
            
            {/* Breadcrumb & Top Header Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white p-5 rounded-2xl shadow-md">
                <div className="flex items-center gap-3">
                    {!(leadId || propId) && (
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
                            <div className="mt-1 inline-block px-3 py-1 bg-transparent text-amber-600 border border-amber-500 rounded-lg text-xs font-bold shadow-xs">
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
                            className="w-full py-2.5 bg-transparent hover:bg-amber-50 text-amber-600 border border-amber-500 text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
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
                                                    by <strong className="text-slate-700">{hist.changed_by || 'Admin'}</strong> on {dateStr}
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
                    
                    {/* Lead Activity & Call Controls */}
                    <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 space-y-4">
                        <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">Lead Progress</h3>
                        
                        {/* Break Status Widget with Live Timer & Close Toggle */}
                        <div className="space-y-3 pt-1">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-cyan-400 flex items-center justify-center text-white shadow-xs">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3m6-3v3"/></svg>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-800">Break</h4>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] font-medium ${isOnBreak ? 'text-emerald-600 font-bold animate-pulse' : 'text-slate-400'}`}>
                                                {isOnBreak ? `On Break (${formatTime(breakSeconds)})` : 'Not on break'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <select 
                                    disabled={isOnBreak}
                                    value={breakType} 
                                    onChange={(e) => setBreakType(e.target.value)} 
                                    className={`w-full text-xs font-medium text-slate-700 bg-white border rounded-lg px-2.5 py-1.5 outline-none ${isOnBreak ? 'border-slate-200 bg-slate-50 opacity-60' : 'border-cyan-500 focus:ring-1 focus:ring-cyan-500'}`}
                                >
                                    <option value="">Select Break</option>
                                    <option value="lunch">Lunch Break</option>
                                    <option value="tea">Tea Break</option>
                                    <option value="short">Short Break</option>
                                </select>
                                <button 
                                    type="button"
                                    onClick={async () => {
                                        if (isOnBreak) {
                                            setIsOnBreak(false);
                                            setBreakSeconds(0);
                                            setBreakType('');
                                            toast.success('Break ended');
                                        } else {
                                            if (!breakType) {
                                                toast.error('Please select a break type first');
                                                return;
                                            }
                                            setIsOnBreak(true);
                                            toast.success('Break started');
                                            
                                            // Optionally log activity to database
                                            try {
                                                const storedAgent = JSON.parse(localStorage.getItem('agentUser') || '{}');
                                                if (storedAgent.id || storedAgent.employeeId) {
                                                    await api.post('/employee-activities', {
                                                        employeeId: storedAgent.employeeId || storedAgent.id,
                                                        activityType: `Break (${breakType})`,
                                                        status: 'In Progress',
                                                        remarks: 'Agent went on break'
                                                    });
                                                }
                                            } catch (err) {
                                                console.warn('Activity log note skipped');
                                            }
                                        }
                                    }}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                                        isOnBreak 
                                            ? 'text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200' 
                                            : 'text-cyan-600 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200'
                                    }`}
                                >
                                    {isOnBreak ? 'Close' : 'Start'}
                                </button>
                            </div>
                        </div>

                        {/* Call Action Controls */}
                        <div className="space-y-3 pt-2"> 
                            <div className="pt-3 border-t border-slate-100 space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Call Controls</span>
                                    {isCalling && (
                                        <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 animate-pulse">
                                            ⏱ {formatTime(callSeconds)}
                                        </span>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            setIsCalling(true);
                                            console.log('Call Started');
                                        }}
                                        disabled={isCalling}
                                        className={`w-full py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                                            isCalling 
                                                ? 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-400 border border-slate-200' 
                                                : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                                        }`}
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                                        Start Call
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            const finalDuration = formatTime(callSeconds);
                                            setIsCalling(false);
                                            setCallSeconds(0);
                                            setNewCall(prev => ({ ...prev, duration: finalDuration, subject: `Call with ${lead.company_name || 'Lead'}` }));
                                            setShowCallModal(true);
                                            console.log('Call Ended');
                                        }}
                                        disabled={!isCalling}
                                        className={`w-full py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                                            !isCalling 
                                                ? 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-400 border border-slate-200' 
                                                : 'text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200'
                                        }`}
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 8l-8 8m0-8l8 8M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                                        End Call
                                    </button>
                                </div>
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
                            <p className="text-sm font-black text-slate-900 mt-0.5">{lead.files?.length || 0}</p>
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
                    
                    {/* Multiple Discussions Section */}
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
                                            <p className="text-[10px] text-slate-400 pt-1">by {d.created_by || 'Admin'} on {dateStr}</p>
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

                {/* Multiple Files & Images Uploader Section */}
                <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                            <ImageIcon size={14} className="text-blue-600" /> Files & Images ({lead.files?.length || 0})
                        </h3>
                        <label className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition cursor-pointer text-xs font-bold flex items-center gap-1">
                            <Plus size={14} /> Add Files
                            <input type="file" multiple accept="image/*,.pdf,.doc,.docx" onChange={handleFileUpload} className="hidden" />
                        </label>
                    </div>

                    {uploadingFiles && <p className="text-xs text-blue-600 font-semibold animate-pulse">Uploading files...</p>}

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {lead.files && lead.files.length > 0 ? (
                            lead.files.map((file, idx) => (
                                <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 relative group">
                                    {file.file_type?.startsWith('image') || file.type?.startsWith('image') || file.file_url?.match(/\.(jpeg|jpg|png|gif)$/i) ? (
                                        <div className="w-full h-24 bg-slate-200 rounded-lg overflow-hidden flex items-center justify-center">
                                            <img src={file.file_url || file.url} alt={file.file_name || file.name} className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        <div className="w-full h-24 bg-blue-50 text-blue-600 rounded-lg flex flex-col items-center justify-center font-bold text-[10px]">
                                            <FileText size={24} /> Document
                                        </div>
                                    )}
                                    <p className="text-[11px] font-bold text-slate-700 truncate">{file.file_name || file.name}</p>
                                    <div className="flex items-center justify-between pt-1">
                                        <a href={file.file_url || file.url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-600 font-bold hover:underline">View</a>
                                        <button onClick={() => handleDeleteFile(file.id)} className="text-rose-500 hover:text-rose-700"><Trash2 size={12} /></button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center bg-slate-50">
                                <p className="text-xs font-bold text-slate-400">No files or images uploaded yet. Click "Add Files" above.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Calls Table */}
                <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">Calls</h3>
                        <button onClick={() => setShowCallModal(true)} className="p-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition cursor-pointer"><Plus size={14} /></button>
                    </div>
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px]">
                                <th className="pb-2">Subject</th>
                                <th className="pb-2">Call Type</th>
                                <th className="pb-2">Duration</th>
                                <th className="pb-2">Remarks</th>
                                <th className="pb-2">User</th>
                                <th className="pb-2 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lead.calls && lead.calls.length > 0 ? (
                                lead.calls.map((c, idx) => (
                                    <tr key={idx} className="border-b border-slate-50">
                                        <td className="py-2.5 font-bold text-slate-700">{c.subject}</td>
                                        <td className="py-2.5">
                                            <span className="px-2 py-0.5 bg-cyan-50 text-cyan-700 rounded font-semibold text-[10px]">{c.call_type}</span>
                                        </td>
                                        <td className="py-2.5 font-mono text-slate-600">{c.duration}</td>
                                        <td className="py-2.5 text-slate-600 max-w-xs truncate" title={c.remarks}>{c.remarks || '-'}</td>
                                        <td className="py-2.5 text-slate-600">{c.user_name || 'Admin'}</td>
                                        <td className="py-2.5 text-right">
                                            <button onClick={() => {
                                                const updated = lead.calls.filter((_, i) => i !== idx);
                                                api.put(`/leads/${activeId}`, { calls: updated }).then(() => {
                                                    toast.success('Call log removed');
                                                    fetchLeadDetails();
                                                });
                                            }} className="p-1 bg-rose-50 text-rose-600 rounded-md"><Trash2 size={12} /></button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="py-6 text-center text-slate-400 text-xs">No Calls Available!</td>
                                </tr>
                            )}
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

            {/* Modal: Add Call Activity */}
            {showCallModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs font-sans">
                    <div className="bg-white w-full max-w-md p-6 rounded-2xl shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-sm font-black text-slate-900">Add Call Log</h3>
                            <button onClick={() => setShowCallModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"><X size={16} /></button>
                        </div>
                        <form onSubmit={handleAddCallSubmit} className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700">Subject / Purpose</label>
                                <input type="text" required value={newCall.subject} onChange={(e) => setNewCall({ ...newCall, subject: e.target.value })} placeholder="e.g. Follow-up on Quotation" className="w-full p-2.5 rounded-xl border border-slate-200 text-xs" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700">Call Type</label>
                                    <select value={newCall.callType} onChange={(e) => setNewCall({ ...newCall, callType: e.target.value })} className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white font-semibold">
                                        <option value="Outbound">Outbound</option>
                                        <option value="Inbound">Inbound</option>
                                        <option value="Missed">Missed</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700">Duration (MM:SS)</label>
                                    <input type="text" value={newCall.duration} onChange={(e) => setNewCall({ ...newCall, duration: e.target.value })} placeholder="02:45" className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono bg-slate-50 font-bold" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700">Call Remarks / Notes</label>
                                <textarea rows={3} value={newCall.remarks} onChange={(e) => setNewCall({ ...newCall, remarks: e.target.value })} placeholder="Enter call discussion notes..." className="w-full p-2.5 rounded-xl border border-slate-200 text-xs" />
                            </div>
                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowCallModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl cursor-pointer">Cancel</button>
                                <button type="submit" disabled={submittingContact} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md">
                                    {submittingContact ? 'Saving...' : 'Save Call Log'}
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