import { useState, useEffect } from 'react';
import { X, Save, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/axios.js';

// Indian States and Major Cities Mapping Dictionary
const INDIAN_STATES_AND_CITIES = {
    "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Tirupati"],
    "Arunachal Pradesh": ["Itanagar", "Tawang", "Naharlagun", "Pasighat"],
    "Assam": ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Tezpur"],
    "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia"],
    "Chhattisgarh": ["Raipur", "Bhilai", "Bilaspur", "Korba", "Durg"],
    "Goa": ["Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda"],
    "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar", "Bhavnagar", "Jamnagar"],
    "Haryana": ["Gurugram", "Faridabad", "Panipat", "Ambala", "Karnal", "Hisar"],
    "Himachal Pradesh": ["Shimla", "Manali", "Dharamshala", "Solan", "Mandi"],
    "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Hazaribagh"],
    "Karnataka": ["Bengaluru", "Mysuru", "Hubballi-Dharwad", "Mangaluru", "Belagavi"],
    "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam"],
    "Madhya Pradesh": ["Bhopal", "Indore", "Gwalior", "Jabalpur", "Ujjain"],
    "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Thane", "Aurangabad", "Solapur"],
    "Manipur": ["Imphal", "Thoubal", "Bishnupur", "Churachandpur"],
    "Meghalaya": ["Shillong", "Tura", "Jowai", "Nongpoh"],
    "Mizoram": ["Aizawl", "Lunglei", "Champhai", "Serchhip"],
    "Nagaland": ["Kohima", "Dimapur", "Mokokchung", "Tuensang"],
    "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur", "Puri"],
    "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda"],
    "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer", "Bikaner"],
    "Sikkim": ["Gangtok", "Namchi", "Gyalshing", "Mangan"],
    "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli"],
    "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khamram"],
    "Tripura": ["Agartala", "Udaipur", "Dharmanagar", "Kailashahar"],
    "Uttar Pradesh": ["Lucknow", "Kanpur", "Ghaziabad", "Agra", "Varanasi", "Prayagraj", "Noida", "Meerut"],
    "Uttarakhand": ["Dehradun", "Haridwar", "Roorkee", "Haldwani", "Nainital"],
    "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri"]
};

// Constant List of Insurers for Dropdown
const EXISTING_INSURERS = [
    "HDFC Ergo",
    "ICICI Lombard",
    "Tata AIG",
    "New India Assurance",
    "Oriental Insurance",
    "United India Insurance",
    "National Insurance",
    "Bajaj Allianz",
    "SBI General Insurance",
    "Reliance General Insurance",
    "Cholamandalam MS",
    "Star Health & Allied Insurance",
    "Care Health Insurance",
    "ManipalCigna Health Insurance",
    "Other"
];

const AddLead = ({ leadId, onClose, onSuccess }) => {
    const isEditMode = Boolean(leadId);
    const [employees, setEmployees] = useState([]);
    const [products, setProducts] = useState([]);
    const [dealStages, setDealStages] = useState([]);
    const [leadStages, setLeadStages] = useState([]);
    const [existingLeads, setExistingLeads] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [availableCities, setAvailableCities] = useState([]);

    const [formData, setFormData] = useState({
        transaction_id: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
        transaction_date: new Date().toISOString().split('T')[0],
        expiry_date: '',
        company_name: '',
        contact_person: '',
        email: '',
        phone: '',
        state: '',
        city: '',
        insurance_type: '',
        existing_insurer: '',
        policy_value: '',
        transaction_type: 'Fresh',
        deal_stage_id: '',
        lead_stage_id: '',
        status: 'New',
        agent_id: '',
        remarks: ''
    });

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // 👈 Try fetching strictly from users endpoint with role query
                const empRes = await api.get('/users', { params: { role: 'Agent' } }).catch(() => api.get('/employees'));
                
                // 👈 Safely extract the array from the response object (.data)
                const rawData = empRes.data?.users || empRes.data?.employees || empRes.data?.data || empRes.data || [];
                const empData = Array.isArray(rawData) ? rawData : [];

                console.log('🔍 Users table API Response Data:', empData);
                setEmployees(empData);
            } catch (e) {
                console.warn('Users fetch skipped/failed', e);
                setEmployees([]);
            }

            
            try {
                const leadsRes = await api.get('/leads?limit=1000');
                if (leadsRes.data?.success) {
                    setExistingLeads(leadsRes.data.leads || []);
                }
            } catch (e) {
                console.warn('Leads fetch for duplication check failed', e);
            }

            try {
                const productsRes = await api.get('/crm-settings/meta/products');
                const prodData = productsRes.data?.data || [];
                setProducts(prodData);
                if (prodData.length > 0 && !isEditMode) {
                    setFormData(prev => ({ ...prev, insurance_type: prodData[0].name }));
                }
            } catch (e) {
                console.warn('Products fetch skipped/failed', e);
            }

            try {
                const stagesRes = await api.get('/crm-settings/meta/deal-stages');
                setDealStages(stagesRes.data?.data || []);
            } catch (e) {
                console.warn('Deal stages fetch skipped/failed', e);
            }

            try {
                const leadStagesRes = await api.get('/crm-settings/meta/lead-stages');
                setLeadStages(leadStagesRes.data?.data || []);
            } catch (e) {
                console.warn('Lead stages fetch skipped/failed', e);
            }

            if (isEditMode) {
                try {
                    const leadRes = await api.get(`/leads/${leadId}`);
                    if (leadRes.data?.success) {
                        const lead = leadRes.data.lead || leadRes.data.data;
                        if (lead) {
                            if (lead.state && INDIAN_STATES_AND_CITIES[lead.state]) {
                                setAvailableCities(INDIAN_STATES_AND_CITIES[lead.state]);
                            }
                            setFormData({
                                transaction_id: lead.transaction_id || '',
                                transaction_date: lead.transaction_date ? lead.transaction_date.split('T')[0] : '',
                                expiry_date: lead.expiry_date ? lead.expiry_date.split('T')[0] : '',
                                company_name: lead.company_name || '',
                                contact_person: lead.contact_person || '',
                                email: lead.email || '',
                                phone: lead.phone || '',
                                state: lead.state || '',
                                city: lead.city || '',
                                insurance_type: lead.insurance_type || '',
                                existing_insurer: lead.existing_insurer || '',
                                policy_value: lead.policy_value || '',
                                transaction_type: lead.transaction_type || 'Fresh',
                                deal_stage_id: lead.deal_stage_id !== null && lead.deal_stage_id !== undefined ? String(lead.deal_stage_id) : '',
                                lead_stage_id: lead.lead_stage_id !== null && lead.lead_stage_id !== undefined ? String(lead.lead_stage_id) : '',
                                status: lead.status || 'New',
                                agent_id: lead.agent_id !== null && lead.agent_id !== undefined ? String(lead.agent_id) : '',
                                remarks: lead.remarks || ''
                            });
                        }
                    }
                } catch (err) {
                    console.error('Failed to fetch lead details for editing:', err);
                    toast.error('Could not load lead record.');
                }
            }
        };
        fetchInitialData();
    }, [leadId, isEditMode]);

    // 👈 Double-check filtering on the frontend for role = "agent"
    const agentEmployees = employees.filter(emp => {
        const roleName = emp.role || emp.designation || emp.role_name || '';
        return roleName.toLowerCase() === 'Agent'.toLowerCase() || roleName.toLowerCase() === 'agent'.toLowerCase();
    });

    console.log('✅ Filtered Agent Employees:', agentEmployees);

    const handleStateChange = (e) => {
        const selectedState = e.target.value;
        setFormData(prev => ({ ...prev, state: selectedState, city: '' }));
        if (selectedState && INDIAN_STATES_AND_CITIES[selectedState]) {
            setAvailableCities(INDIAN_STATES_AND_CITIES[selectedState]);
        } else {
            setAvailableCities([]);
        }
    };

    const handleSaveLead = async (e) => {
        e.preventDefault();

        const trimmedEmail = formData.email.trim().toLowerCase();
        const trimmedPhone = formData.phone.trim();

        const duplicateLead = existingLeads.find(l => {
            if (isEditMode && String(l.id) === String(leadId)) return false;

            const matchesEmail = trimmedEmail && l.email && l.email.toLowerCase() === trimmedEmail;
            const matchesPhone = trimmedPhone && l.phone && l.phone === trimmedPhone;
            return matchesEmail || matchesPhone;
        });

        if (duplicateLead) {
            const matchType = duplicateLead.email?.toLowerCase() === trimmedEmail ? 'Email Address' : 'Phone Number';
            toast.error(`Duplicate Warning: A lead with this ${matchType} already exists (${duplicateLead.company_name})!`);
            return;
        }

        try {
            setSubmitting(true);
            const payload = {
                transactionId: formData.transaction_id,
                transactionDate: formData.transaction_date,
                expiryDate: formData.expiry_date || null,
                companyName: formData.company_name,
                contactPerson: formData.contact_person,
                email: formData.email,
                phone: formData.phone,
                state: formData.state,
                city: formData.city,
                insuranceType: formData.insurance_type,
                existingInsurer: formData.existing_insurer,
                policyValue: formData.policy_value ? parseFloat(formData.policy_value) : 0,
                transactionType: formData.transaction_type,
                dealStageId: formData.deal_stage_id ? parseInt(formData.deal_stage_id, 10) : null,
                leadStageId: formData.lead_stage_id ? parseInt(formData.lead_stage_id, 10) : null,
                status: formData.status,
                agentId: formData.agent_id ? parseInt(formData.agent_id, 10) : null,
                remarks: formData.remarks || ''
            };

            if (isEditMode) {
                await api.put(`/leads/${leadId}`, payload);
                toast.success('Lead updated successfully!');
            } else {
                await api.post('/leads', payload);
                toast.success('Lead added successfully!');
            }
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error('Save lead error:', err);
            toast.error(err.response?.data?.error || 'Failed to save lead.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-hidden font-sans">
            <div className="absolute inset-0 bg-slate-900/75 backdrop-blur-2xs transition-opacity" onClick={onClose} />

            <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
                <div className="w-screen md:w-[40vw] min-w-[700px] bg-white shadow-2xl flex flex-col justify-between transform transition-transform ease-in-out duration-300">
                    
                    {/* Drawer Header */}
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div>
                            <h2 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                                <Building2 size={16} className="text-blue-600" />
                                {isEditMode ? 'Edit Insurance Lead' : 'Add Corporate Insurance Lead'}
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">Fill in the insurance transaction details below.</p>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Drawer Body Form */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        <form id="lead-form" onSubmit={handleSaveLead} className="space-y-4">
                            
                            {/* Row 1: Transaction ID, Transaction Date, Status */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700">Transaction ID</label>
                                    <input type="text" required value={formData.transaction_id} onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })} className="w-full p-3 rounded-xl border border-slate-200 text-xs font-mono bg-slate-50" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700">Transaction Date</label>
                                    <input type="date" required value={formData.transaction_date} onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })} className="w-full p-3 rounded-xl border border-slate-200 text-xs" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700">Status</label>
                                    <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-white font-semibold cursor-pointer">
                                        <option value="New">New</option>
                                        <option value="Contacted">Contacted</option>
                                        <option value="Interested">Interested</option>
                                        <option value="Converted">Converted</option>
                                    </select>
                                </div>
                            </div>

                            {/* Row 2: Company Name, Contact Person, Phone Number */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700">Company Name</label>
                                    <input type="text" required value={formData.company_name} onChange={(e) => setFormData({ ...formData, company_name: e.target.value })} placeholder="e.g. Apex Logistics" className="w-full p-3 rounded-xl border border-slate-200 text-xs" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700">Contact Person</label>
                                    <input type="text" required value={formData.contact_person} onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })} placeholder="e.g. Rajesh Sharma" className="w-full p-3 rounded-xl border border-slate-200 text-xs" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700">Phone Number</label>
                                    <input type="text" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="9898815579" className="w-full p-3 rounded-xl border border-slate-200 text-xs font-mono" />
                                </div>
                            </div>

                            {/* Row 3: Email Address, State, City */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700">Email Address</label>
                                    <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="rajesh@apex.com" className="w-full p-3 rounded-xl border border-slate-200 text-xs" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700">State</label>
                                    <select 
                                        value={formData.state} 
                                        onChange={handleStateChange} 
                                        className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-white font-semibold cursor-pointer"
                                    >
                                        <option value="">-- Select State --</option>
                                        {Object.keys(INDIAN_STATES_AND_CITIES).map(stateName => (
                                            <option key={stateName} value={stateName}>{stateName}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700">City</label>
                                    <select 
                                        value={formData.city} 
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })} 
                                        disabled={!formData.state}
                                        className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-white font-semibold cursor-pointer disabled:bg-slate-100 disabled:text-slate-400"
                                    >
                                        <option value="">-- Select City --</option>
                                        {availableCities.map(cityName => (
                                            <option key={cityName} value={cityName}>{cityName}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Row 4: Product, Policy Value, Policy Type */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700">Product</label>
                                    <select 
                                        value={formData.insurance_type} 
                                        onChange={(e) => setFormData({ ...formData, insurance_type: e.target.value })} 
                                        className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-white font-semibold cursor-pointer"
                                    >
                                        <option value="">-- Select Product --</option>
                                        {products.map(prod => (
                                            <option key={prod.id} value={prod.name}>{prod.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700">Policy Value (₹)</label>
                                    <input type="number" required value={formData.policy_value} onChange={(e) => setFormData({ ...formData, policy_value: e.target.value })} placeholder="450000" className="w-full p-3 rounded-xl border border-slate-200 text-xs font-mono" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700">Policy Type</label>
                                    <select value={formData.transaction_type} onChange={(e) => setFormData({ ...formData, transaction_type: e.target.value })} className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-white font-semibold cursor-pointer">
                                        <option value="Fresh">Fresh</option>
                                        <option value="Rollover">Rollover</option>
                                        <option value="Renewal">Renewal</option>
                                    </select>
                                </div>
                            </div>

                            {/* Row 5: Existing Insurer, Deal Stage, Lead Stage */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700">Existing Insurer</label>
                                    <select 
                                        value={formData.existing_insurer} 
                                        onChange={(e) => setFormData({ ...formData, existing_insurer: e.target.value })} 
                                        className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-white font-semibold cursor-pointer"
                                    >
                                        <option value="">-- Select Insurer --</option>
                                        {EXISTING_INSURERS.map(insurer => (
                                            <option key={insurer} value={insurer}>{insurer}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700">Deal Stage</label>
                                    <select 
                                        value={formData.deal_stage_id} 
                                        onChange={(e) => setFormData({ ...formData, deal_stage_id: e.target.value })} 
                                        className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-white font-semibold cursor-pointer"
                                    >
                                        <option value="">-- Select Deal Stage --</option>
                                        {dealStages.map(stage => (
                                            <option key={stage.id} value={stage.id}>{stage.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700">Lead Stage</label>
                                    <select 
                                        value={formData.lead_stage_id} 
                                        onChange={(e) => setFormData({ ...formData, lead_stage_id: e.target.value })} 
                                        className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-white font-semibold cursor-pointer"
                                    >
                                        <option value="">-- Select Lead Stage --</option>
                                        {leadStages.map(stage => (
                                            <option key={stage.id} value={stage.id}>{stage.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Row 6: Expiry Date, Allocate to Agent */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700">Expiry Date</label>
                                    <input type="date" value={formData.expiry_date} onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })} className="w-full p-3 rounded-xl border border-slate-200 text-xs" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700">Allocate to Agent</label>
                                    <select 
                                        value={formData.agent_id} 
                                        onChange={(e) => setFormData({ ...formData, agent_id: e.target.value })} 
                                        className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-white font-semibold cursor-pointer"
                                    >
                                        <option value="">-- Unassigned --</option>
                                        {agentEmployees.map(emp => (
                                            <option key={emp.id} value={emp.id}>
                                                {emp.name || emp.full_name} ({emp.mobile_number || emp.mobile || 'Agent'})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700">Remarks / Notes</label>
                                <textarea rows={3} value={formData.remarks || ''} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} placeholder="Enter discussion notes..." className="w-full p-3 rounded-xl border border-slate-200 text-xs" />
                            </div>
                        </form>
                    </div>

                    <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl cursor-pointer hover:bg-slate-200 transition">Cancel</button>
                        <button type="submit" form="lead-form" disabled={submitting} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition flex items-center gap-1.5">
                            <Save size={14} /> {submitting ? 'Saving...' : (isEditMode ? 'Update Lead' : 'Save Lead')}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AddLead;