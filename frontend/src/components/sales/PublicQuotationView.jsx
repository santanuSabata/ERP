import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../lib/axios.js';

const PublicQuotationView = () => {
    const { id } = useParams();
    const [quotation, setQuotation] = useState(null);
    const [company, setCompany] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPublicData = async () => {
            try {
                // Public fetch for quotation details
                const res = await api.get(`/quotations/${id}`);
                const qData = res.data?.data || res.data;
                setQuotation(qData);

                // Fetch matching company details based on quotation's company reference
                if (qData?.company_id) {
                    const compRes = await api.get(`/company?companyId=${qData.company_id}`);
                    const compData = compRes.data?.data || compRes.data || {};
                    setCompany(Array.isArray(compData) ? compData[0] : compData);
                }
            } catch (err) {
                console.error('Failed to load public quotation:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchPublicData();
    }, [id]);

    const resolveImageUrl = (dbPath) => {
        if (!dbPath) return null;
        if (dbPath.startsWith('http://') || dbPath.startsWith('https://')) return dbPath;
        const baseURL = api.defaults.baseURL || 'http://localhost:8000/api';
        const serverRoot = baseURL.replace(/\/api\/?$/, '');
        const cleanPath = dbPath.startsWith('/') ? dbPath : `/${dbPath}`;
        return `${serverRoot}${cleanPath}`;
    };

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen text-slate-500 text-sm font-medium">Loading Quotation...</div>;
    }

    if (!quotation) {
        return <div className="flex items-center justify-center min-h-screen text-rose-500 text-sm font-bold">Quotation not found or link has expired.</div>;
    }

    return (
        <div className="min-h-screen bg-slate-100 py-10 px-4 font-sans text-slate-800">
            <div className="max-w-3xl mx-auto bg-white p-10 rounded-2xl shadow-sm border border-slate-200 space-y-8 text-xs">
                
                {/* Header Details */}
                <div className="flex justify-between items-start border-b border-slate-100 pb-6">
                    <div className="space-y-1">
                        <h1 className="text-xl font-black text-blue-600 tracking-wider">QUOTATION</h1>
                        <h2 className="text-base font-extrabold text-slate-900">{company?.companyName || company?.company_name || 'SAHANA BEVERAGE'}</h2>
                        <p className="text-[11px] text-slate-500">
                            GSTIN: <strong className="text-slate-700">{company?.gstin || 'N/A'}</strong> | PAN: <strong className="text-slate-700">{company?.pan || 'N/A'}</strong><br />
                            FSSAI NO: <strong className="text-slate-700">{company?.fssai || 'N/A'}</strong> | MSME NO: <strong className="text-slate-700">{company?.msmeNo || company?.msme_no || 'N/A'}</strong><br />
                            DL NO: <strong className="text-slate-700">{quotation.dl_no || company?.dlNo || company?.dl_no || 'N/A'}</strong><br />
                            {company?.billingAddress1 || company?.address || 'N/A'}
                        </p>
                        <p className="text-[11px] text-slate-500 pt-1">
                            Mobile: <strong className="text-slate-700">{company?.phone || 'N/A'}</strong> | Email: <strong className="text-slate-700">{company?.email || 'N/A'}</strong>
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-slate-400 mt-2 uppercase font-bold tracking-wider">Original For Recipient</p>
                        {company?.logoUrl || company?.logo_url ? (
                            <img 
                                src={resolveImageUrl(company.logoUrl || company.logo_url)}
                                alt="Company Logo" 
                                className="w-20 h-20 object-contain rounded-xl ml-auto border border-slate-100" 
                            />
                        ) : (
                            <div className="w-20 h-20 bg-slate-900 text-white rounded-xl flex items-center justify-center font-bold text-center p-2 text-[10px] ml-auto">
                                {company?.companyName || 'COMPANY'}
                            </div>
                        )}
                    </div>
                </div>

                {/* Meta Metadata Grid */}
                <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Quotation #:</span>
                        <strong className="font-mono text-slate-900 text-sm">{quotation.quotation_no}</strong>
                    </div>
                    <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Quotation Date:</span>
                        <strong className="font-mono text-slate-900">{quotation.quotation_date?.split('T')[0]}</strong>
                    </div>
                    <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Validity:</span>
                        <strong className="font-mono text-slate-900">{quotation.validity_date?.split('T')[0] || 'N/A'}</strong>
                    </div>
                </div>

                {/* Customer & Addresses */}
                <div className="grid grid-cols-3 gap-6 pt-2">
                    <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Customer Details:</span>
                        <p className="font-bold text-slate-900">{quotation.customer_name}</p>
                    </div>
                    <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Billing Address:</span>
                        <p className="text-slate-600">{quotation.billing_address || 'N/A'}</p>
                    </div>
                    <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Shipping Address:</span>
                        <p className="text-slate-600">{quotation.shipping_address || 'N/A'}</p>
                    </div>
                </div>

                {/* Items Table */}
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-400 uppercase font-extrabold text-[10px] border-b border-slate-200">
                                <th className="py-2.5 px-3">#</th>
                                <th className="py-2.5 px-3">Item</th>
                                <th className="py-2.5 px-3 text-right">Rate / Item</th>
                                <th className="py-2.5 px-3 text-center">Qty</th>
                                <th className="py-2.5 px-3 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                            {(quotation.items || []).map((item, idx) => (
                                <tr key={idx}>
                                    <td className="py-3 px-3 text-slate-500">{idx + 1}</td>
                                    <td className="py-3 px-3">
                                        <p className="font-bold text-slate-900">{item.product_name}</p>
                                    </td>
                                    <td className="py-3 px-3 text-right font-mono">₹{parseFloat(item.unit_price).toFixed(2)}</td>
                                    <td className="py-3 px-3 text-center font-mono font-bold">{item.quantity} BOX</td>
                                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">₹{parseFloat(item.total).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Summary Totals */}
                <div className="flex justify-end pt-2">
                    <div className="w-72 space-y-2 text-xs">
                        <div className="flex justify-between text-slate-600">
                            <span>Taxable Amount</span>
                            <span className="font-mono font-bold">₹{parseFloat(quotation.subtotal || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                            <span>Total Amount</span>
                            <span className="font-mono text-base text-blue-600">₹{parseFloat(quotation.total_amount || 0).toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Footer branding */}
                <div className="pt-6 border-t border-slate-100 flex justify-between text-[10px] text-slate-400">
                    <span>Page 1 / 1 • This is a digitally signed document.</span>
                    <span>Powered By <strong>ERP Cloude</strong></span>
                </div>

            </div>
        </div>
    );
};

export default PublicQuotationView;