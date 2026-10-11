import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileSpreadsheet, CheckCircle, ArrowRight, Download, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/axios.js';

const UploadLeadsPreview = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null); // { success: true, count: 20, message: '...' }
    const [parsedPreview, setParsedPreview] = useState([]);

    const downloadSampleCSV = () => {
        const sampleContent = "Transaction ID,Date,Expiry Date,Company Name,Contact Person,Email,Phone,Insurance Type,Policy Value,Type,Status,Remarks\nTXN-1001,01/06/26,01/06/27,Apex Logistics,Rajesh Sharma,rajesh@apex.com,9898815579,Group Health Insurance,450000,Fresh,New,Sample corporate lead remarks";
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

        const reader = new FileReader();
        reader.onload = async (evt) => {
            const text = evt.target.result;
            const lines = text.split('\n');
            const parsedLeads = [];

            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue;
                const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
                
                parsedLeads.push({
                    transaction_id: values[0] || `TXN-${Date.now()}-${i}`,
                    transaction_date: values[1] || '',
                    expiry_date: values[2] || '',
                    company_name: values[3] || 'Corporate Client',
                    contact_person: values[4] || 'Contact Person',
                    email: values[5] || '',
                    phone: values[6] || '9876543210',
                    insurance_type: values[7] || 'General Insurance',
                    policy_value: parseFloat(values[8]) || 100000,
                    transaction_type: values[9] || 'Fresh',
                    status: values[10] || 'New',
                    remarks: values[11] || ''
                });
            }

            setParsedPreview(parsedLeads);

            // Automatically send to backend for upload
            try {
                setUploading(true);
                const res = await api.post('/leads/bulk-upload', { leads: parsedLeads });
                if (res.data?.success) {
                    setUploadResult({
                        success: true,
                        count: parsedLeads.length,
                        message: res.data.message || `Successfully uploaded ${parsedLeads.length} leads!`
                    });
                    toast.success('Leads uploaded successfully!');
                }
            } catch (err) {
                console.error('Upload error:', err);
                toast.error(err.response?.data?.error || 'Failed to upload CSV file.');
            } finally {
                setUploading(false);
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6 font-sans text-slate-900">
            {/* Header */}
            <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
                <div>
                    <h1 className="text-base font-black text-slate-900">Temporary Lead Upload Page</h1>
                    <p className="text-xs text-slate-400">Upload your CSV file, review all columns, and proceed to the leads database.</p>
                </div>
                <button 
                    onClick={downloadSampleCSV}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                >
                    <Download size={14} /> Sample Template
                </button>
            </div>

            {/* Upload Box / Success State */}
            {!uploadResult ? (
                <div className="bg-white p-10 rounded-3xl border-2 border-dashed border-slate-300 text-center space-y-4">
                    <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl mx-auto flex items-center justify-center">
                        <FileSpreadsheet size={28} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-800">Select or Drag & Drop your CSV file</h3>
                        <p className="text-xs text-slate-400 mt-1">Supports standard corporate lead template files</p>
                    </div>

                    <label className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer">
                        {uploading ? 'Processing & Uploading...' : 'Browse CSV File'}
                        <input 
                            type="file" 
                            accept=".csv" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            disabled={uploading} 
                            className="hidden" 
                        />
                    </label>
                </div>
            ) : (
                /* Success Notification & Full Columns Summary Card */
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6 animate-in fade-in zoom-in duration-200">
                    <div className="text-center space-y-3">
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full mx-auto flex items-center justify-center shadow-inner">
                            <CheckCircle size={32} />
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-lg font-black text-slate-900">Upload Successful!</h2>
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