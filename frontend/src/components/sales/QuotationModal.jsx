import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Edit, Mail, MessageCircle, Download, Printer, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';
import api from '../../lib/axios.js';

const QuotationModal = ({ isOpen, onClose, quotation, company: initialCompany }) => {
    const navigate = useNavigate();
    const [company, setCompany] = useState(initialCompany || null);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    
    // States for PDF Preview Popup Modal
    const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

    const printRef = useRef(); // Reference for PDF capture

    // Fetch company details if not provided via props, passing company_id if available
    useEffect(() => {
        const fetchCompanyDetails = async () => {
             if (isOpen) {
                try {
                    const compId = quotation?.company_id || 1;
                    const res = await api.get(`/company?companyId=${compId}`);
                    
                    const compData = res.data?.data || res.data?.company || res.data || {};
                    setCompany(Array.isArray(compData) ? compData[0] : compData);
                } catch (err) {
                    console.error('❌ Failed to load company details for modal:', err);
                }
            } else if (initialCompany) {
                setCompany(initialCompany);
            }
        };
        fetchCompanyDetails();
    }, [isOpen, initialCompany, quotation]);

    if (!isOpen || !quotation) return null;

    const handlePrint = () => {
        window.print();
    };

    const handleEdit = () => {
        onClose();
        navigate(`/quotations/edit/${quotation.id}`);
    };

    const handleEmail = () => {
        const subject = encodeURIComponent(`Quotation ${quotation.quotation_no} from ${company?.companyName || company?.company_name || 'Sahana Beverage'}`);
        const body = encodeURIComponent(`Dear ${quotation.customer_name},\n\nPlease find your quotation details for reference. Total Amount: ₹${parseFloat(quotation.total_amount || 0).toFixed(2)}.\n\nThank you!`);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
    };

    const handleWhatsApp = () => {
        const message = encodeURIComponent(`Hello ${quotation.customer_name}, here is your quotation ${quotation.quotation_no} amounting to ₹${parseFloat(quotation.total_amount || 0).toFixed(2)}. Thank you for your business!`);
        window.open(`https://wa.me/?text=${message}`, '_blank');
    };

    // Handler to generate and open PDF inside a full-page popup viewer modal
    const handleViewPDF = async () => {
        const element = printRef.current;
        if (!element) {
            toast.error('Preview element not found.');
            return;
        }

        try {
            setIsGeneratingPdf(true);
            toast.loading('Preparing full-page PDF view...', { id: 'pdf-toast' });

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                logging: false
            });

            const imgData = canvas.toDataURL('image/png');
            
            // Set dimensions to fit standard full-page ratio without page break gaps
            const imgWidth = 210; 
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: [imgWidth, imgHeight]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight, undefined, 'FAST');
            
            const pdfBlob = pdf.output('blob');
            // Append #view=FitH or #toolbar=1 to instruct browser PDF viewers to fit width automatically
            const blobUrl = `${URL.createObjectURL(pdfBlob)}#view=FitH`;

            setPdfPreviewUrl(blobUrl);
            setIsPdfModalOpen(true);

            toast.success('PDF ready for full-page viewing!', { id: 'pdf-toast' });
        } catch (error) {
            console.error('❌ Failed to generate PDF preview:', error);
            toast.error(`Failed to view PDF: ${error.message || 'Unknown error'}`, { id: 'pdf-toast' });
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    // Handler to download the file directly from the preview popup
    const handleDownloadPDF = async () => {
        const element = printRef.current;
        if (!element) return;

        try {
            setIsGeneratingPdf(true);
            toast.loading('Generating PDF...', { id: 'pdf-toast' });

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                logging: false
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Quotation_${quotation.quotation_no || 'Document'}.pdf`);

            toast.success('PDF downloaded successfully!', { id: 'pdf-toast' });
        } catch (error) {
            console.error('Failed to generate PDF:', error);
            toast.error('Failed to download PDF.', { id: 'pdf-toast' });
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    // Helper to resolve clean absolute image URLs from relative DB paths
    const resolveImageUrl = (dbPath) => {
        if (!dbPath) return null;
        if (dbPath.startsWith('http://') || dbPath.startsWith('https://')) return dbPath;

        const baseURL = api.defaults.baseURL || 'http://localhost:8000/api';
        const serverRoot = baseURL.replace(/\/api\/?$/, '');
        
        const cleanPath = dbPath.startsWith('/') ? dbPath : `/${dbPath}`;
        return `${serverRoot}${cleanPath}`;
    };

    return (
        <>
            {/* Main Quotation Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto font-sans">
                <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]">
                    
                    {/* Modal Top Header Bar */}
                    <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200/80">
                        <h2 className="text-sm font-extrabold text-slate-800 tracking-tight">Quotation Preview</h2>
                        <button 
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-slate-200/80 text-slate-500 transition cursor-pointer"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Promotional banner notice */}
                    <div className="bg-amber-50/60 border-b border-amber-100 px-6 py-2.5 flex items-center justify-between text-xs text-amber-800">
                        <span>Enjoy 15+ Templates, Remove Watermark & more</span>
                        <button onClick={() => toast('Plans & pricing opened')} className="text-blue-600 font-bold hover:underline cursor-pointer">
                            See plans & pricing
                        </button>
                    </div>

                    {/* Toolbar Actions Bar */}
                    <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-100 flex-wrap gap-2 text-xs">
                        <div className="flex items-center gap-3 text-slate-600 font-medium">
                            <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" defaultChecked className="rounded text-blue-600" /> Customer</label>
                            <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" className="rounded text-blue-600" /> Transport</label>
                            <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" className="rounded text-blue-600" /> Supplier</label>
                            <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" className="rounded text-blue-600" /> Delivery Challan</label>
                        </div>

                        <div className="flex items-center gap-2">
                            <button onClick={handleEdit} className="px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-xl font-bold flex items-center gap-1 cursor-pointer">
                                <Edit size={13} /> Edit
                            </button>
                            <button onClick={handleEmail} className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl font-bold flex items-center gap-1 cursor-pointer">
                                <Mail size={13} /> Email
                            </button>
                            <button onClick={handleWhatsApp} className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl font-bold flex items-center gap-1 cursor-pointer">
                                <MessageCircle size={13} /> Whatsapp
                            </button>
                            <button onClick={handlePrint} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer" title="Print">
                                <Printer size={15} />
                            </button>
                            {/* View PDF in Popup Button */}
                            <button 
                                onClick={handleViewPDF} 
                                disabled={isGeneratingPdf}
                                className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50" 
                                title="View PDF in Popup"
                            >
                                <Eye size={13} /> View PDF
                            </button>
                            <button 
                                onClick={handleDownloadPDF} 
                                disabled={isGeneratingPdf}
                                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer disabled:opacity-50" 
                                title="Download PDF"
                            >
                                <Download size={15} />
                            </button>
                        </div>
                    </div>

                    {/* Printable Document Sheet Container (Attached with ref for PDF rendering) */}
                    <div className="p-8 overflow-y-auto flex-1 bg-slate-100/50">
                        <div ref={printRef} className="bg-white p-10 rounded-2xl shadow-sm border border-slate-200/60 max-w-3xl mx-auto space-y-8 text-slate-800 text-xs relative">
                            
                            {/* Header Details */}
                            <div className="flex justify-between items-start border-b border-slate-100 pb-6">
                                <div className="space-y-1">
                                    <h1 className="text-xl font-black text-blue-600 tracking-wider">QUOTATION</h1>
                                    <h2 className="text-base font-extrabold text-slate-900">{company?.companyName || company?.company_name || 'SAHANA BEVERAGE'}</h2>
                                    <p className="text-[11px] text-slate-500">
                                        GSTIN: <strong className="text-slate-700">{company?.gstin || 'N/A'}</strong> | PAN: <strong className="text-slate-700">{company?.pan || 'N/A'}</strong><br />
                                        FSSAI NO: <strong className="text-slate-700">{company?.fssai || 'N/A'}</strong> | MSME NO: <strong className="text-slate-700">{company?.msmeNo || company?.msme_no || 'N/A'}</strong><br />
                                        DL NO: <strong className="text-slate-700">{quotation.dl_no || company?.dlNo || company?.dl_no || 'N/A'}</strong><br />
                                        {company?.billingAddress1 || company?.address ? (
                                            <span>
                                                {[
                                                    company?.billingAddress1,
                                                    company?.billingAddress2,
                                                    company?.billingCity,
                                                    company?.billingState,
                                                    company?.billingPincode,
                                                    company?.billingCountry
                                                ].filter(Boolean).join(', ')}
                                            </span>
                                        ) : (
                                            company?.address || 'N/A'
                                        )}
                                    </p>
                                    <p className="text-[11px] text-slate-500 pt-1">
                                        Mobile: <strong className="text-slate-700">{company?.phone || 'N/A'}</strong> | Email: <strong className="text-slate-700">{company?.email || 'N/A'}</strong> {company?.website && `| Website: `} {company?.website && <strong className="text-slate-700">{company.website}</strong>}
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
                                            {company?.companyName || company?.company_name || 'COMPANY'}
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

                            {/* Dispatch Info */}
                            <div className="text-[11px] text-slate-600 space-y-0.5">
                                <p><strong>Dispatch From:</strong> {quotation.dispatch_from || company?.address || 'N/A'}</p>
                                <p><strong>Place of Supply:</strong> 21-ODISHA</p>
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
                                            <th className="py-2.5 px-3 text-right">Taxable Value</th>
                                            <th className="py-2.5 px-3 text-right">Tax Amount</th>
                                            <th className="py-2.5 px-3 text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-medium">
                                        {(quotation.items || []).map((item, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/50">
                                                <td className="py-3 px-3 text-slate-500">{idx + 1}</td>
                                                <td className="py-3 px-3">
                                                    <p className="font-bold text-slate-900">{item.product_name}</p>
                                                    {item.product_desc && <p className="text-[10px] text-slate-400">{item.product_desc}</p>}
                                                </td>
                                                <td className="py-3 px-3 text-right font-mono">₹{parseFloat(item.unit_price).toFixed(2)}</td>
                                                <td className="py-3 px-3 text-center font-mono font-bold">{item.quantity} BOX</td>
                                                <td className="py-3 px-3 text-right font-mono">₹{parseFloat(item.total).toFixed(2)}</td>
                                                <td className="py-3 px-3 text-right font-mono text-slate-500">₹0.00 (0%)</td>
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

                            {/* Bank Details & Signatures Footer */}
                            <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-100 items-end">
                                <div className="space-y-2">
                                    <span className="text-[10px] uppercase font-bold text-slate-400">Bank Details:</span>
                                    <div className="text-[11px] text-slate-600 space-y-0.5">
                                        <p><strong>Bank:</strong> {quotation.selected_bank || 'Union Bank of India'}</p>
                                        <p><strong>Account #:</strong> 333122010001976</p>
                                        <p><strong>IFSC Code:</strong> UBIN0933317</p>
                                        <p><strong>Branch:</strong> CHATRAPUR</p>
                                    </div>
                                </div>
                                <div className="text-right space-y-4">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">For {company?.company_name || company?.name || 'COMPANY'}</p>
                                    <div className="h-12 flex items-center justify-end font-serif italic text-base font-extrabold text-slate-800">
                                        {quotation.selected_signature || 'Authorized Signatory'}
                                    </div>
                                    <p className="text-[10px] text-slate-500 border-t border-slate-200 pt-1 inline-block">Authorized Signatory</p>
                                </div>
                            </div>

                            {/* Footer branding */}
                            <div className="pt-6 border-t border-slate-100 flex justify-between text-[10px] text-slate-400">
                               <span>Page 1 / 1 • This is a digitally signed document.</span>
                               <span>Powered By <strong>ERP Cloude</strong></span>
                            </div>

                        </div>
                    </div>

                    {/* Modal Footer Close */}
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-200/80 flex justify-end">
                        <button onClick={onClose} className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs cursor-pointer">
                            Close Preview
                        </button>
                    </div>

                </div>
            </div>

            {/* Secondary Popup Modal for Viewing PDF inside browser iframe */}
            {isPdfModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
                    <div className="bg-white w-full max-w-4xl h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
                        
                        {/* PDF Viewer Header */}
                        <div className="flex items-center justify-between px-6 py-4 bg-slate-800 text-white">
                            <h3 className="text-sm font-bold tracking-tight">PDF Viewer - Quotation #{quotation.quotation_no}</h3>
                            <button 
                                onClick={() => setIsPdfModalOpen(false)}
                                className="p-2 rounded-full hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* PDF Embedded Frame Viewer */}
                        <div className="flex-1 bg-slate-100 p-2">
                            {pdfPreviewUrl ? (
                                <iframe 
                                    src={pdfPreviewUrl} 
                                    title="Quotation PDF Viewer" 
                                    className="w-full h-full rounded-xl border border-slate-300"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                                    Loading PDF viewer...
                                </div>
                            )}
                        </div>

                        {/* PDF Viewer Footer Actions */}
                        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs">
                            <span className="text-slate-500">You can print or download directly from the viewer bar above.</span>
                            <button 
                                onClick={() => setIsPdfModalOpen(false)}
                                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl cursor-pointer"
                            >
                                Close Viewer
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </>
    );
};

export default QuotationModal;