import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileSpreadsheet, CheckCircle, ArrowRight, Download, X, Clock, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/axios.js';

const companyId = localStorage.getItem('activeCompanyId') || 2;
const UploadLeadsPreview = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [uploadResult, setUploadResult] = useState(null);
    const [parsedPreview, setParsedPreview] = useState([]);
    const [agentUsers, setAgentUsers] = useState([]);

    // Timer effect while uploading
    useEffect(() => {
        let timer;
        if (uploading) {
            timer = setInterval(() => {
                setElapsedSeconds(prev => prev + 1);
            }, 1000);
        } else {
            clearInterval(timer);
            setElapsedSeconds(0);
        }
        return () => clearInterval(timer);
    }, [uploading]);

    // Fetch agents on mount to match names (e.g. Chhavi, Naveen, Jyoti) to IDs
    useEffect(() => {
        const fetchAgents = async () => {
            try {
                const res = await api.get('/employees').catch(async () => {
                    try { return await api.get('/hr/employees'); } catch { return await api.get('/users'); }
                });
                const empData = res.data?.employees || res.data?.users || res.data?.data || res.data || [];
                const list = Array.isArray(empData) ? empData : [];
                setAgentUsers(list);
            } catch (e) {
                console.warn('Could not load agents list for mapping');
            }
        };
        fetchAgents();
    }, []);

    const downloadSampleCSV = () => {
        const sampleContent = "Lead ID,Date,Expiry Date,Company Name,Contact Person,Email,Phone,Insurance Type,Policy Value,Type,Status,Remarks,agent_id,LType\n,12/11/26,12/11/27,Apex Logistics,Rajesh Sharma,rajesh@apexlogistics.com,9898815579,Group Health,450000,Fresh,New,Sample corporate lead remarks,2,EV";
        const encodedUri = encodeURI("data:text/csv;charset=utf-8," + sampleContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "sample_leads_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Sample CSV template downloaded!');
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        setProgress(15);

        const reader = new FileReader();
        reader.onload = async (evt) => {
            setProgress(45);
            const text = evt.target.result;
            const lines = text.split('\n');
            const parsedLeads = [];

            // Generate Month & Year dynamically for format (EV-Month-Year-slno)
            const now = new Date();
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const month = monthNames[now.getMonth()];
            const year = now.getFullYear();

            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue;
                const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
                
                const csvAgentName = values[12] || ''; 
                let matchedAgentId = null;

                if (csvAgentName && agentUsers.length > 0) {
                    const foundAgent = agentUsers.find(a => 
                        (a.name || a.full_name || '').toLowerCase() === csvAgentName.toLowerCase() ||
                        (a.username || '').toLowerCase() === csvAgentName.toLowerCase()
                    );
                    if (foundAgent) {
                        matchedAgentId = foundAgent.id; 
                    }
                }

                const slno = String(i).padStart(2, '0'); // Pads index to 2 digits (e.g., 01, 02)
                const prefixType = values[13] && values[13] !== 'NaN' ? values[13] : 'EV'; // 👈 Fixed column index to 13
                const fallbackTxnId = `${prefixType}-${month}-${year}-${slno}`; // Formats as EV-Month-year-slno

                parsedLeads.push({
                    transaction_id: values[0] && values[0].trim() !== '' && values[0] !== 'NaN' ? values[0].trim() : fallbackTxnId,
                    transaction_date: values[1] && values[1] !== 'NaN' ? values[1] : '',
                    expiry_date: values[2] && values[2] !== 'NaN' ? values[2] : '',
                    company_name: values[3] && values[3] !== 'NaN' ? values[3] : 'Corporate Client',
                    contact_person: values[4] && values[4] !== 'NaN' ? values[4] : 'Contact Person',
                    email: values[5] && values[5] !== 'NaN' ? values[5] : '',
                    phone: values[6] && values[6] !== 'NaN' ? values[6] : '9876543210',
                    insurance_type: values[7] && values[7] !== 'NaN' ? values[7] : 'General Insurance',
                    policy_value: values[8] && !isNaN(values[8]) ? parseFloat(values[8]) : 100000,
                    transaction_type: values[9] && values[9] !== 'NaN' ? values[9] : 'Fresh',
                    status: values[10] && values[10] !== 'NaN' ? values[10] : 'New',
                    remarks: values[11] && values[11] !== 'NaN' ? values[11] : '',
                    agent_id: values[12] && values[12] !== 'NaN' ? values[12] : '',
                    agentId: matchedAgentId
                });
            }

            setParsedPreview(parsedLeads);
            setProgress(75);

            try {
                const res = await api.post('/leads/bulk-upload', { leads: parsedLeads, companyId });
                if (res.data?.success) {
                    setProgress(100);
                    setTimeout(() => {
                        setUploadResult({
                            success: true,
                            count: parsedLeads.length,
                            message: res.data.message || `Successfully uploaded ${parsedLeads.length} leads!`
                        });
                        toast.success('Leads uploaded and assigned successfully!');
                        setUploading(false);
                    }, 400);
                }
            } catch (err) {
                console.error('Upload error:', err);
                toast.error(err.response?.data?.error || 'Failed to upload CSV file.');
                setUploading(false);
                setProgress(0);
            }
        };
        reader.readAsText(file);
    };

    const formatTime = (secs) => {
        const mins = Math.floor(secs / 60);
        const remSecs = secs % 60;
        return `${String(mins).padStart(2, '0')}:${String(remSecs).padStart(2, '0')}`;
    };

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6 font-sans text-slate-900">
            {/* Header */}
            <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
                <div>
                    <h1 className="text-base font-black text-slate-900">Temporary Lead Upload Page</h1>
                    <p className="text-xs text-slate-400">Upload your CSV file with Agent Name matching, review progress, and proceed.</p>
                </div>
                <button 
                    onClick={downloadSampleCSV}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                >
                    <Download size={14} /> Sample Template
                </button>
            </div>

            {/* Upload Box / Progress State / Success State */}
            {!uploadResult ? (
                <div className="bg-white p-10 rounded-3xl border-2 border-dashed border-slate-300 text-center space-y-5">
                    {uploading ? (
                        <div className="space-y-4 max-w-md mx-auto py-4">
                            <Loader2 size={36} className="text-blue-600 animate-spin mx-auto" />
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-xs font-bold text-slate-700">
                                    <span>Uploading & Parsing Data...</span>
                                    <span className="font-mono text-blue-600">{progress}%</span>
                                </div>
                                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                    <div className="bg-blue-600 h-full rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                                </div>
                                <div className="flex justify-center items-center gap-1.5 text-xs text-slate-400 font-mono pt-2">
                                    <Clock size={13} /> Elapsed Time: {formatTime(elapsedSeconds)}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl mx-auto flex items-center justify-center">
                                <FileSpreadsheet size={28} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-800">Select or Drag & Drop your CSV file</h3>
                                <p className="text-xs text-slate-400 mt-1">Automatically maps Agent Names to user accounts</p>
                            </div>

                            <label className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer">
                                Browse CSV File
                                <input 
                                    type="file" 
                                    accept=".csv" 
                                    ref={fileInputRef} 
                                    onChange={handleFileChange} 
                                    disabled={uploading} 
                                    className="hidden" 
                                />
                            </label>
                        </>
                    )}
                </div>
            ) : (
                /* Success Notification & Full Columns Summary Card */
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6 animate-in fade-in zoom-in duration-200">
                    <div className="text-center space-y-3">
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full mx-auto flex items-center justify-center shadow-inner">
                            <CheckCircle size={32} />
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-lg font-black text-slate-900">Upload & Assignment Successful!</h2>
                            <p className="text-xs font-semibold text-slate-600">
                                Total leads uploaded successfully: <strong className="text-emerald-600 font-mono text-sm">{uploadResult.count}</strong>
                            </p>
                        </div>
                    </div>

                    {/* Preview Table Viewing All Columns */}
                    {parsedPreview.length > 0 && (
                        <div className="border border-slate-200 rounded-2xl overflow-x-auto max-h-96">
                            <table className="w-full text-left text-xs whitespace-nowrap">
                                <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] sticky top-0 border-b border-slate-200">
                                    <tr>
                                        <th className="p-3">Txn ID</th>
                                        <th className="p-3">Date</th>
                                        <th className="p-3">Expiry Date</th>
                                        <th className="p-3">Company Name</th>
                                        <th className="p-3">Contact Person</th>
                                        <th className="p-3">Email</th>
                                        <th className="p-3">Phone</th>
                                        <th className="p-3">Insurance Type</th>
                                        <th className="p-3">Policy Value</th>
                                        <th className="p-3">Type</th>
                                        <th className="p-3">Status</th>
                                        <th className="p-3">Remarks</th>
                                        <th className="p-3">Assigned Agent ID</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                                    {parsedPreview.map((lead, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50">
                                            <td className="p-3 font-mono font-bold text-slate-900">{lead.transaction_id}</td>
                                            <td className="p-3">{lead.transaction_date}</td>
                                            <td className="p-3">{lead.expiry_date}</td>
                                            <td className="p-3 font-bold text-slate-800">{lead.company_name}</td>
                                            <td className="p-3">{lead.contact_person}</td>
                                            <td className="p-3 text-blue-600">{lead.email}</td>
                                            <td className="p-3 font-mono">{lead.phone}</td>
                                            <td className="p-3">{lead.insurance_type}</td>
                                            <td className="p-3 font-mono font-bold text-emerald-600">₹{Number(lead.policy_value).toLocaleString()}</td>
                                            <td className="p-3">{lead.transaction_type}</td>
                                            <td className="p-3">
                                                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-bold text-[10px]">{lead.status}</span>
                                            </td>
                                            <td className="p-3 text-slate-500 max-w-xs truncate" title={lead.remarks}>{lead.remarks || '-'}</td>
                                            <td className="p-3 font-mono font-bold text-violet-600">{lead.agent_id ? `ID: ${lead.agent_id}` : 'Unassigned'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="pt-2 flex justify-center gap-3">
                        <button 
                            onClick={() => { setUploadResult(null); setParsedPreview([]); }}
                            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                        >
                            Upload Another File
                        </button>
                        <button 
                            onClick={() => navigate('/crm/leads')}
                            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
                        >
                            Proceed to Leads Page <ArrowRight size={15} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UploadLeadsPreview;