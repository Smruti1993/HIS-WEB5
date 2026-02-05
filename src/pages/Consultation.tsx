
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { 
  User, Info, Save, Printer, FileText, Bell, Activity, Stethoscope, Briefcase, 
  Pill, Clock, FileInput, ChevronRight, ChevronDown, 
  Bold, Italic, Underline, List, AlignLeft, Type, Download, XCircle, Cloud, CheckCircle, Loader2, Calculator, Plus, Trash2, Search, RotateCcw, History, AlertTriangle, ArrowLeft, Calendar, Wind, Scale, Edit, X, RefreshCw
} from 'lucide-react';
import { VitalSign, Allergy, Diagnosis, ServiceDefinition, ServiceOrder } from '../types';

// --- Static Configs ---
const SIDEBAR_ITEMS = [
    { id: 'Visit History', label: 'Visit History' },
    { id: 'Chief Complaint', label: 'Chief Complaint' },
    { id: 'History of Present Illness', label: 'History of Present Illness' },
    { id: 'Past History', label: 'Past History' },
    { id: 'Family History', label: 'Family History' },
    { id: 'Medication History', label: 'Medication History' },
    { id: 'Allergies', label: 'Allergies & Intolerances' },
    { id: 'Review of Systems', label: 'Review of Systems' },
    { id: 'Physical Examination', label: 'Physical Examination' },
    { id: 'Significant Sign', label: 'Significant Signs' },
    { id: 'Diagnosis', label: 'Provisional Diagnosis' },
    { id: 'Treatment Plan', label: 'Treatment Plan' },
    { id: 'Treatment Desc', label: 'Prescription Notes' },
    { id: 'Remark', label: 'Doctor Remarks' },
];

const TOP_TOOLS = [
    { id: 'Vitals', label: 'Vitals (F7)', icon: Activity, color: 'text-blue-600' },
    { id: 'Allergy', label: 'Allergy (F8)', icon: Bell, color: 'text-red-600' },
    { id: 'Diagnosis', label: 'Diagnosis (F5)', icon: Info, color: 'text-amber-600' },
    { id: 'Orders', label: 'CPOE Orders (F3)', icon: Pill, color: 'text-emerald-600' },
    { id: 'Documents', label: 'Documents', icon: FileText, color: 'text-slate-600' },
    { id: 'Referral', label: 'Referral', icon: Briefcase, color: 'text-purple-600' },
];

const ALLERGY_REACTIONS = [
    'Cough', 'Dermatographism', 'Diarrhea', 'Dizziness', 'Headache', 
    'Nausea', 'Running Nose', 'Skin Rash', 'Sneezing', 'Swelling', 'Vomiting'
];

const ALLERGY_TYPES = ['Drug', 'Environmental', 'Food', 'NonFormulaDrug'];

// Mock ICD Data fallback if DB is empty
const FALLBACK_ICD_CODES = [
    { code: 'A00', description: 'Cholera' },
    { code: 'A01', description: 'Typhoid and paratyphoid fevers' },
    { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications' },
    { code: 'I10', description: 'Essential (primary) hypertension' },
];

// --- CPOE Components (New) ---

const ServiceOrderingModal = ({ 
    appointmentId, 
    doctorId, 
    onClose 
}: { 
    appointmentId: string, 
    doctorId: string, 
    onClose: () => void 
}) => {
    const { serviceDefinitions, serviceTariffs, departments, serviceOrders, saveServiceOrders, showToast } = useData();
    
    // Filters
    const [filterServiceType, setFilterServiceType] = useState('All');
    const [filterDept, setFilterDept] = useState('All');
    const [searchName, setSearchName] = useState('');
    const [showOnlyCash, setShowOnlyCash] = useState(false);

    // Selection
    const [selectedServices, setSelectedServices] = useState<ServiceOrder[]>([]);

    const filteredServices = serviceDefinitions.filter(s => {
        const typeMatch = filterServiceType === 'All' || s.serviceType === filterServiceType;
        const nameMatch = s.name.toLowerCase().includes(searchName.toLowerCase()) || s.code.toLowerCase().includes(searchName.toLowerCase());
        // Simple dept matching logic (assuming groupName might map to dept for demo, or all if All)
        const deptMatch = true; 
        return typeMatch && nameMatch && deptMatch && s.status === 'Active';
    });

    const getPrice = (serviceId: string) => {
        const t = serviceTariffs.find(t => t.serviceId === serviceId && t.status === 'Active');
        return t ? t.price : 0;
    };

    const toggleService = (s: ServiceDefinition) => {
        const exists = selectedServices.find(order => order.serviceId === s.id);
        
        if (exists) {
            setSelectedServices(prev => prev.filter(o => o.serviceId !== s.id));
        } else {
            const price = getPrice(s.id);
            const newOrder: ServiceOrder = {
                id: Date.now().toString() + Math.random().toString().slice(2,5),
                appointmentId,
                serviceId: s.id,
                serviceName: s.name,
                cptCode: s.cptCode,
                quantity: 1,
                unitPrice: price,
                discountAmount: 0,
                totalPrice: price, // initial
                orderDate: new Date().toISOString(),
                status: 'Ordered',
                billingStatus: 'Pending',
                priority: 'Routine',
                orderingDoctorId: doctorId,
                instructions: '',
                serviceCenter: 'General'
            };
            setSelectedServices(prev => [...prev, newOrder]);
        }
    };

    const updateOrder = (id: string, field: keyof ServiceOrder, val: any) => {
        setSelectedServices(prev => prev.map(o => {
            if (o.id !== id) return o;
            
            const updated = { ...o, [field]: val };
            
            // Recalc total if qty/price/discount changes
            if (field === 'quantity' || field === 'unitPrice' || field === 'discountAmount') {
                const q = field === 'quantity' ? Number(val) : o.quantity;
                const p = field === 'unitPrice' ? Number(val) : o.unitPrice;
                const d = field === 'discountAmount' ? Number(val) : o.discountAmount;
                updated.totalPrice = (q * p) - d;
            }
            return updated;
        }));
    };

    const handleSave = () => {
        if (selectedServices.length === 0) {
            showToast('info', 'No services selected.');
            return;
        }
        saveServiceOrders(selectedServices);
        onClose();
    };

    const totalServiceAmount = selectedServices.reduce((sum, o) => sum + o.totalPrice, 0);

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-[95vw] h-[90vh] rounded-lg shadow-2xl flex flex-col border border-slate-300 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-slate-100 border-b border-slate-300 px-4 py-2 flex justify-between items-center shrink-0">
                    <h3 className="font-bold text-slate-800 text-sm">Ordering Services</h3>
                    <div className="flex gap-2">
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-bold transition-colors">Previous</button>
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-bold transition-colors">MI</button>
                        <button onClick={onClose} className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs transition-colors"><X className="w-4 h-4"/></button>
                    </div>
                </div>

                {/* Filters */}
                <div className="p-3 bg-blue-50/50 border-b border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs items-end shrink-0">
                    <div>
                        <label className="block font-bold text-slate-600 mb-1">Service Type</label>
                        <select className="w-full border border-slate-300 rounded p-1" value={filterServiceType} onChange={e => setFilterServiceType(e.target.value)}>
                            <option value="All">-- Select --</option>
                            <option value="Single service">Single Service</option>
                            <option value="Package">Package</option>
                        </select>
                    </div>
                    <div>
                        <label className="block font-bold text-slate-600 mb-1">Department</label>
                        <select className="w-full border border-slate-300 rounded p-1" value={filterDept} onChange={e => setFilterDept(e.target.value)}>
                            <option value="All">-- Select --</option>
                            {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block font-bold text-slate-600 mb-1">Service Center</label>
                        <select className="w-full border border-slate-300 rounded p-1">
                            <option value="All">All</option>
                        </select>
                    </div>
                    <div>
                        <label className="block font-bold text-slate-600 mb-1">Service Name</label>
                        <input className="w-full border border-slate-300 rounded p-1" value={searchName} onChange={e => setSearchName(e.target.value)} />
                    </div>
                    <div className="md:col-span-4 flex items-center gap-4 mt-2">
                        <label className="flex items-center gap-1 cursor-pointer select-none">
                            <input type="checkbox" /> <span className="font-bold text-slate-600">Favourites</span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer select-none">
                            <input type="checkbox" checked={showOnlyCash} onChange={e => setShowOnlyCash(e.target.checked)} /> <span className="font-bold text-slate-600">Only Cash Service</span>
                        </label>
                        <div className="ml-auto flex gap-2">
                            <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded font-bold text-xs">Sponsor Price</button>
                            <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded font-bold text-xs">Base Price</button>
                        </div>
                    </div>
                </div>

                {/* Service Grid */}
                <div className="flex-1 overflow-y-auto p-4 bg-white border-b border-slate-200 min-h-[200px]">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1 text-xs">
                        {filteredServices.map(s => (
                            <label key={s.id} className={`flex items-center gap-2 p-1 hover:bg-blue-50 cursor-pointer rounded border border-transparent hover:border-blue-100 ${selectedServices.some(o => o.serviceId === s.id) ? 'bg-blue-50 border-blue-200' : ''}`}>
                                <input 
                                    type="checkbox" 
                                    checked={selectedServices.some(o => o.serviceId === s.id)}
                                    onChange={() => toggleService(s)}
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="truncate" title={s.name}>{s.code} - {s.name}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Added Orders Table (Bottom) */}
                <div className="h-64 flex flex-col bg-slate-50 shrink-0">
                    <div className="bg-white border-b border-slate-200 px-4 py-1 flex justify-between items-center">
                        <h4 className="font-bold text-slate-800 text-xs">Added Service Order</h4>
                        <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-bold transition-colors">Add Service</button>
                    </div>
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-xs text-left border-collapse">
                            <thead className="bg-slate-200 text-slate-700 font-bold sticky top-0 z-10">
                                <tr>
                                    <th className="p-2 border-r border-slate-300">Service Name</th>
                                    <th className="p-2 border-r border-slate-300 w-16">CPT</th>
                                    <th className="p-2 border-r border-slate-300 w-16">Portable</th>
                                    <th className="p-2 border-r border-slate-300 w-12 text-center">Qty</th>
                                    <th className="p-2 border-r border-slate-300 w-24">Approval Req</th>
                                    <th className="p-2 border-r border-slate-300 w-20 text-right">Unit Price</th>
                                    <th className="p-2 border-r border-slate-300 w-20 text-right">Max Disc</th>
                                    <th className="p-2 border-r border-slate-300 w-20 text-right">Discount</th>
                                    <th className="p-2 border-r border-slate-300 w-20 text-right">Disc %</th>
                                    <th className="p-2 border-r border-slate-300 w-24 text-right">Total Price</th>
                                    <th className="p-2 border-r border-slate-300 w-10 text-center">FC</th>
                                    <th className="p-2 border-r border-slate-300 w-16">Pkg Cover</th>
                                    <th className="p-2 border-r border-slate-300 w-24">Service Center</th>
                                    <th className="p-2 border-r border-slate-300 w-16">Policy</th>
                                    <th className="p-2 border-r border-slate-300">Order Remarks</th>
                                    <th className="p-2 w-16 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {selectedServices.map(order => (
                                    <tr key={order.id} className="hover:bg-slate-50">
                                        <td className="p-1 border-r border-slate-200 truncate max-w-[200px]">{order.serviceName}</td>
                                        <td className="p-1 border-r border-slate-200">{order.cptCode}</td>
                                        <td className="p-1 border-r border-slate-200 text-center"><input type="checkbox" /></td>
                                        <td className="p-1 border-r border-slate-200">
                                            <input 
                                                type="number" className="w-full bg-yellow-50 border border-yellow-200 text-center rounded px-1"
                                                value={order.quantity} onChange={e => updateOrder(order.id, 'quantity', e.target.value)}
                                            />
                                        </td>
                                        <td className="p-1 border-r border-slate-200 text-center"><input type="checkbox" /></td>
                                        <td className="p-1 border-r border-slate-200 text-right">{order.unitPrice.toFixed(2)}</td>
                                        <td className="p-1 border-r border-slate-200 text-right">0.00</td>
                                        <td className="p-1 border-r border-slate-200">
                                            <input 
                                                type="number" className="w-full bg-white border border-slate-200 text-right rounded px-1"
                                                value={order.discountAmount} onChange={e => updateOrder(order.id, 'discountAmount', e.target.value)}
                                            />
                                        </td>
                                        <td className="p-1 border-r border-slate-200 text-right">0.00</td>
                                        <td className="p-1 border-r border-slate-200 text-right font-bold">{order.totalPrice.toFixed(2)}</td>
                                        <td className="p-1 border-r border-slate-200 text-center"><input type="checkbox" /></td>
                                        <td className="p-1 border-r border-slate-200 text-center">No</td>
                                        <td className="p-1 border-r border-slate-200">{order.serviceCenter || 'General'}</td>
                                        <td className="p-1 border-r border-slate-200"></td>
                                        <td className="p-1 border-r border-slate-200">
                                            <input 
                                                className="w-full bg-white border border-slate-200 rounded px-1"
                                                value={order.instructions || ''} onChange={e => updateOrder(order.id, 'instructions', e.target.value)}
                                            />
                                        </td>
                                        <td className="p-1 text-center">
                                            <button onClick={() => setSelectedServices(prev => prev.filter(o => o.id !== order.id))} className="text-red-500 hover:text-red-700">
                                                <Trash2 className="w-3 h-3 mx-auto" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="bg-slate-100 p-2 border-t border-slate-300 text-xs font-bold text-blue-800 flex gap-4">
                        <span>Total Service Amount : {totalServiceAmount.toFixed(2)}</span>
                        <div className="flex items-center gap-2">
                            <span className="text-red-600">Doctor Sugg. Amount</span>
                            <input className="border border-slate-300 w-24 px-1" value="0.0" readOnly />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CPOEView = ({ 
    appointmentId, 
    patientName,
    doctorId,
    onClose 
}: { 
    appointmentId: string, 
    patientName: string,
    doctorId: string,
    onClose: () => void 
}) => {
    const { serviceOrders, employees } = useData();
    const [showNewOrder, setShowNewOrder] = useState(false);
    
    // Filters
    const [orderDateFrom, setOrderDateFrom] = useState(new Date().toISOString().split('T')[0]);
    const [orderDateTo, setOrderDateTo] = useState(new Date().toISOString().split('T')[0]);
    const [statusFilter, setStatusFilter] = useState('All');

    const appointmentOrders = serviceOrders.filter(o => o.appointmentId === appointmentId);

    const getDocName = (id: string) => {
        const d = employees.find(e => e.id === id);
        return d ? `Dr. ${d.firstName} ${d.lastName}` : '';
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            {showNewOrder && <ServiceOrderingModal appointmentId={appointmentId} doctorId={doctorId} onClose={() => setShowNewOrder(false)} />}
            
            <div className="bg-white w-full max-w-[95vw] h-[90vh] rounded-lg shadow-2xl flex flex-col overflow-hidden border border-slate-200">
                {/* Header Tabs */}
                <div className="flex border-b border-slate-300 bg-slate-100 px-2 pt-2 gap-1 shrink-0">
                    <div className="bg-slate-200 px-4 py-1.5 rounded-t-lg text-sm font-bold text-slate-700 border-t border-l border-r border-slate-300">Services</div>
                    <div className="bg-cyan-600 px-4 py-1.5 rounded-t-lg text-sm font-bold text-white flex items-center gap-2"><Pill className="w-3 h-3"/> Pharmacy</div>
                    <div className="bg-teal-600 px-4 py-1.5 rounded-t-lg text-sm font-bold text-white flex items-center gap-2"><Briefcase className="w-3 h-3"/> Package</div>
                    <div className="bg-blue-500 px-4 py-1.5 rounded-t-lg text-sm font-bold text-white flex items-center gap-2"><FileText className="w-3 h-3"/> Patient Contract</div>
                    <button onClick={onClose} className="ml-auto text-slate-500 hover:text-red-500 p-1"><XCircle className="w-5 h-5"/></button>
                </div>

                {/* Filter Bar */}
                <div className="bg-blue-50/50 p-3 border-b border-slate-200 text-xs shrink-0">
                    <div className="font-bold text-slate-800 mb-2 border-b border-slate-200 pb-1 flex justify-between items-center">
                        <span>Existing Service Order</span>
                        <button 
                            onClick={() => setShowNewOrder(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded shadow-sm transition-colors"
                        >
                            New Orders
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="w-28 font-bold text-slate-600">Ordered Date From</span>
                                <input type="date" className="border border-slate-300 rounded px-1" value={orderDateFrom} onChange={e => setOrderDateFrom(e.target.value)} />
                                <span className="font-bold text-slate-600">To</span>
                                <input type="date" className="border border-slate-300 rounded px-1" value={orderDateTo} onChange={e => setOrderDateTo(e.target.value)} />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-28 font-bold text-slate-600">Ordered From</span>
                                <input className="border border-slate-300 rounded px-1 flex-1" />
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="w-28 font-bold text-slate-600">Visit</span>
                                <label className="flex items-center gap-1"><input type="radio" name="visit" defaultChecked /> Current</label>
                                <label className="flex items-center gap-1"><input type="radio" name="visit" /> All</label>
                            </div>
                        </div>
                        
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="w-24 font-bold text-slate-600">Status</span>
                                <select className="border border-slate-300 rounded px-1 flex-1">
                                    <option>-- Select --</option>
                                    <option>Ordered</option>
                                    <option>Cancelled</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-24 font-bold text-slate-600">Ordered By</span>
                                <select className="border border-slate-300 rounded px-1 flex-1">
                                    <option>-- Select --</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="w-24 font-bold text-slate-600">ServiceOrder No</span>
                                <input className="border border-slate-300 rounded px-1 flex-1" />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="w-24 font-bold text-slate-600">Service Name</span>
                                <input className="border border-slate-300 rounded px-1 flex-1" />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-24 font-bold text-slate-600">Order Type</span>
                                <select className="border border-slate-300 rounded px-1 flex-1">
                                    <option>-- Select --</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded font-bold shadow-sm">Search</button>
                        </div>
                    </div>
                </div>

                {/* Data Grid */}
                <div className="flex-1 overflow-auto bg-white border-b border-slate-200">
                    <table className="w-full text-xs text-left border-collapse">
                        <thead className="bg-slate-200 text-slate-700 font-bold sticky top-0 z-10 whitespace-nowrap">
                            <tr>
                                <th className="p-2 border-r border-slate-300">Service Name</th>
                                <th className="p-2 border-r border-slate-300">CPT Code</th>
                                <th className="p-2 border-r border-slate-300">Order No</th>
                                <th className="p-2 border-r border-slate-300">Portable</th>
                                <th className="p-2 border-r border-slate-300">Qty</th>
                                <th className="p-2 border-r border-slate-300 text-right">Unit Price</th>
                                <th className="p-2 border-r border-slate-300 text-right">ContractAmt</th>
                                <th className="p-2 border-r border-slate-300 text-right">Discount Amount</th>
                                <th className="p-2 border-r border-slate-300 text-right">Total Price</th>
                                <th className="p-2 border-r border-slate-300">Ordered Date</th>
                                <th className="p-2 border-r border-slate-300">Status</th>
                                <th className="p-2 border-r border-slate-300">Result Status</th>
                                <th className="p-2 border-r border-slate-300">Package Cover</th>
                                <th className="p-2 border-r border-slate-300">Billing Status</th>
                                <th className="p-2 border-r border-slate-300">Priority</th>
                                <th className="p-2 border-r border-slate-300">Service Center</th>
                                <th className="p-2 border-r border-slate-300">Consulting Doctor</th>
                                <th className="p-2 border-r border-slate-300">Ordered Doctor</th>
                                <th className="p-2 border-r border-slate-300">Plan</th>
                                <th className="p-2 border-r border-slate-300">Patient Form</th>
                                <th className="p-2 border-r border-slate-300">Appr. Sts.</th>
                                <th className="p-2 border-r border-slate-300">ICD-Tooth</th>
                                <th className="p-2 border-r border-slate-300">Done/Not Done</th>
                                <th className="p-2 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {appointmentOrders.length === 0 ? (
                                <tr><td colSpan={24} className="p-12 text-center text-slate-400 italic">No services ordered for this visit.</td></tr>
                            ) : (
                                appointmentOrders.map(order => (
                                    <tr key={order.id} className="hover:bg-slate-50 whitespace-nowrap">
                                        <td className="p-2 border-r border-slate-200 font-medium">{order.serviceName}</td>
                                        <td className="p-2 border-r border-slate-200">{order.cptCode}</td>
                                        <td className="p-2 border-r border-slate-200 text-blue-600 font-medium">ORD-{order.id.slice(-6)}</td>
                                        <td className="p-2 border-r border-slate-200">No</td>
                                        <td className="p-2 border-r border-slate-200 text-center">{order.quantity}</td>
                                        <td className="p-2 border-r border-slate-200 text-right font-bold">{order.unitPrice.toFixed(2)}</td>
                                        <td className="p-2 border-r border-slate-200 text-right">0.00</td>
                                        <td className="p-2 border-r border-slate-200 text-right">{order.discountAmount.toFixed(2)}</td>
                                        <td className="p-2 border-r border-slate-200 text-right font-bold">{order.totalPrice.toFixed(2)}</td>
                                        <td className="p-2 border-r border-slate-200">{new Date(order.orderDate).toLocaleString()}</td>
                                        <td className="p-2 border-r border-slate-200">
                                            <span className={`px-1 py-0.5 rounded text-[10px] ${order.status === 'Ordered' ? 'text-red-500' : 'text-green-500'}`}>{order.status}</span>
                                        </td>
                                        <td className="p-2 border-r border-slate-200"></td>
                                        <td className="p-2 border-r border-slate-200">No</td>
                                        <td className="p-2 border-r border-slate-200 text-red-500">{order.billingStatus}</td>
                                        <td className="p-2 border-r border-slate-200 text-red-500">{order.priority}</td>
                                        <td className="p-2 border-r border-slate-200">{order.serviceCenter || 'General'}</td>
                                        <td className="p-2 border-r border-slate-200">{getDocName(doctorId)}</td>
                                        <td className="p-2 border-r border-slate-200">{getDocName(order.orderingDoctorId)}</td>
                                        <td className="p-2 border-r border-slate-200">C001/Cash</td>
                                        <td className="p-2 border-r border-slate-200"></td>
                                        <td className="p-2 border-r border-slate-200"></td>
                                        <td className="p-2 border-r border-slate-200">-</td>
                                        <td className="p-2 border-r border-slate-200">
                                            <select className="border border-slate-300 rounded text-[10px]">
                                                <option>Not Done</option>
                                                <option>Done</option>
                                            </select>
                                            <button className="bg-blue-500 text-white px-1 ml-1 rounded text-[10px]">Update</button>
                                        </td>
                                        <td className="p-2 text-center flex items-center justify-center gap-1">
                                            <button className="text-blue-600"><Edit className="w-3 h-3" /></button>
                                            <button className="text-red-500"><Trash2 className="w-3 h-3" /></button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer Buttons */}
                <div className="bg-white p-3 border-t border-slate-200 flex justify-between items-center shrink-0">
                    <button onClick={onClose} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded font-bold text-xs">Cancel</button>
                    <div className="flex gap-2">
                        <button className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-1.5 rounded font-bold text-xs">Pharmacy</button>
                        <button className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-1.5 rounded font-bold text-xs">Print Orders</button>
                        <button className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-1.5 rounded font-bold text-xs">End Encounter</button>
                        <button className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-1.5 rounded font-bold text-xs">Download As PDF</button>
                        <button className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-1.5 rounded font-bold text-xs">Cancel Encounter</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ... (Existing Modals: VitalsEntryModal, AllergyEntryModal, DiagnosisEntryModal) -> Retaining them below but truncating for brevity in this delta as they are unchanged from previous file except imports

// Re-including VitalsEntryModal etc. for full file context if needed, but since I am replacing the file content, I must include everything.

const VitalsEntryModal = ({ appointmentId, onClose }: { appointmentId: string, onClose: () => void }) => {
    // ... [Same implementation as before]
    const { vitals, saveVitalSign } = useData();
    const existingVital = vitals.find(v => v.appointmentId === appointmentId);

    const [formData, setFormData] = useState({
        temperature: existingVital?.temperature?.toString() || '',
        sys: existingVital?.bpSystolic?.toString() || '',
        dia: existingVital?.bpDiastolic?.toString() || '',
        pulse: existingVital?.pulse?.toString() || '',
        rr: existingVital?.respiratoryRate?.toString() || '',
        spo2: existingVital?.spo2?.toString() || '',
        height: existingVital?.height?.toString() || '',
        weight: existingVital?.weight?.toString() || '',
        tobacco: existingVital?.tobaccoUse || '',
        map: existingVital?.map?.toString() || '',
        bmi: existingVital?.bmi?.toString() || '',
        remarks: existingVital?.rowRemarks || {} as Record<string, string>
    });

    useEffect(() => {
        const h = parseFloat(formData.height);
        const w = parseFloat(formData.weight);
        if (h > 0 && w > 0) {
            const bmiVal = (w / ((h / 100) * (h / 100))).toFixed(1);
            setFormData(prev => ({ ...prev, bmi: bmiVal }));
        }
    }, [formData.height, formData.weight]);

    useEffect(() => {
        const sys = parseFloat(formData.sys);
        const dia = parseFloat(formData.dia);
        if (sys > 0 && dia > 0) {
            const mapVal = ((2 * dia + sys) / 3).toFixed(1);
            setFormData(prev => ({ ...prev, map: mapVal }));
        }
    }, [formData.sys, formData.dia]);

    const handleRemarkChange = (key: string, val: string) => {
        setFormData(prev => ({
            ...prev,
            remarks: { ...prev.remarks, [key]: val }
        }));
    };

    const handleSave = () => {
        saveVitalSign({
            id: existingVital?.id || Date.now().toString(),
            appointmentId,
            recordedAt: new Date().toISOString(),
            temperature: formData.temperature ? parseFloat(formData.temperature) : undefined,
            bpSystolic: formData.sys ? parseInt(formData.sys) : undefined,
            bpDiastolic: formData.dia ? parseInt(formData.dia) : undefined,
            pulse: formData.pulse ? parseInt(formData.pulse) : undefined,
            respiratoryRate: formData.rr ? parseInt(formData.rr) : undefined,
            spo2: formData.spo2 ? parseInt(formData.spo2) : undefined,
            height: formData.height ? parseFloat(formData.height) : undefined,
            weight: formData.weight ? parseFloat(formData.weight) : undefined,
            map: formData.map ? parseFloat(formData.map) : undefined,
            bmi: formData.bmi ? parseFloat(formData.bmi) : undefined,
            tobaccoUse: formData.tobacco,
            rowRemarks: formData.remarks
        });
        onClose();
    };

    const VitalField = ({ label, _key, unit, range, isCalc = false, placeholder = '-' }: any) => (
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-end mb-1">
            <label className="text-xs font-semibold text-slate-600">{label}</label>
            <span className="text-[10px] text-slate-400">{range}</span>
          </div>
          <div className="relative">
            <input
              type={_key === 'tobacco' ? 'text' : 'number'}
              step="0.1"
              className={`w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${isCalc ? 'bg-slate-100 text-slate-500 font-bold' : 'bg-white'}`}
              value={(formData as any)[_key]}
              readOnly={isCalc}
              placeholder={placeholder}
              onChange={e => setFormData({...formData, [_key]: e.target.value})}
            />
            {unit && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">{unit}</span>}
          </div>
          {!isCalc && (
              <input
                className="w-full text-[10px] border-b border-transparent hover:border-slate-300 focus:border-blue-400 bg-transparent outline-none placeholder-slate-300 transition-colors py-0.5"
                placeholder="Add remark..."
                value={formData.remarks[_key] || ''}
                onChange={e => handleRemarkChange(_key, e.target.value)}
              />
          )}
        </div>
    );

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 overflow-hidden">
                {/* Header */}
                <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-blue-600" /> Vital Signs
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">Record patient physiological parameters</p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                        <XCircle className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                            <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-wide border-b border-slate-100 pb-2">
                                <Activity className="w-4 h-4 text-red-500" /> Cardiovascular
                            </h4>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                                <VitalField label="BP Systolic" _key="sys" unit="mmHg" range="90-140" />
                                <VitalField label="BP Diastolic" _key="dia" unit="mmHg" range="60-90" />
                                <VitalField label="Pulse Rate" _key="pulse" unit="bpm" range="60-100" />
                                <VitalField label="MAP" _key="map" unit="mmHg" range="70-100" isCalc />
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                            <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-wide border-b border-slate-100 pb-2">
                                <Wind className="w-4 h-4 text-blue-500" /> Respiratory & General
                            </h4>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                                <VitalField label="Temperature" _key="temperature" unit="°C" range="36.5-37.5" />
                                <VitalField label="SpO2" _key="spo2" unit="%" range="95-100" />
                                <VitalField label="Resp. Rate" _key="rr" unit="bpm" range="12-20" />
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm md:col-span-2">
                            <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-wide border-b border-slate-100 pb-2">
                                <Scale className="w-4 h-4 text-emerald-500" /> Anthropometry
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                <VitalField label="Height" _key="height" unit="cm" />
                                <VitalField label="Weight" _key="weight" unit="kg" />
                                <VitalField label="BMI" _key="bmi" unit="kg/m²" isCalc />
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm md:col-span-2">
                            <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-wide border-b border-slate-100 pb-2">
                                <History className="w-4 h-4 text-purple-500" /> Social History
                            </h4>
                            <div className="grid grid-cols-1">
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-semibold text-slate-600">Tobacco Use History</label>
                                    <input
                                        type="text"
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        value={formData.tobacco}
                                        placeholder="e.g. Smoker, Non-smoker, Ex-smoker..."
                                        onChange={e => setFormData({...formData, tobacco: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-white border-t border-slate-200 p-4 flex justify-end gap-3 shrink-0">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors">Cancel</button>
                    <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg font-bold shadow-md shadow-blue-200 transition-all flex items-center gap-2">
                        <Save className="w-4 h-4" /> Save Vitals
                    </button>
                </div>
            </div>
        </div>
    );
};

const AllergyEntryModal = ({ patientId, onClose }: { patientId: string, onClose: () => void }) => {
    // ... [Same implementation]
    const { allergies, saveAllergy, showToast } = useData();
    const patientAllergies = allergies.filter(a => a.patientId === patientId);

    const [form, setForm] = useState({
        allergyType: '',
        allergicTo: '',
        onSet: '', // Text desc
        onsetDate: '',
        allergyStatus: 'Active',
        resolvedDate: '',
        remarks: ''
    });
    const [selectedReactions, setSelectedReactions] = useState<string[]>([]);
    const [noKnownAllergies, setNoKnownAllergies] = useState(false);

    const handleSave = () => {
        if (noKnownAllergies) {
            saveAllergy({
                id: Date.now().toString(),
                patientId,
                allergen: 'No Known Allergies',
                allergyType: 'NKA', 
                severity: '',
                reaction: '',
                status: 'Active',
                onsetDate: new Date().toISOString(),
                resolvedDate: '',
                remarks: 'Patient confirmed no known allergies.'
            });
            onClose();
            return;
        }

        if (!form.allergyType || !form.allergicTo) {
            showToast('error', 'Please fill required fields (Type, Allergic To)');
            return;
        }

        saveAllergy({
            id: Date.now().toString(),
            patientId,
            allergen: form.allergicTo,
            allergyType: form.allergyType,
            severity: 'Moderate', 
            status: form.allergyStatus as 'Active' | 'Resolved',
            onsetDate: form.onsetDate,
            resolvedDate: form.resolvedDate,
            reaction: selectedReactions.join(', '),
            remarks: form.remarks
        });
        
        setForm({
            allergyType: '', allergicTo: '', onSet: '', onsetDate: '',
            allergyStatus: 'Active', resolvedDate: '', remarks: ''
        });
        setSelectedReactions([]);
    };

    const toggleReaction = (r: string) => {
        if (selectedReactions.includes(r)) {
            setSelectedReactions(prev => prev.filter(x => x !== r));
        } else {
            setSelectedReactions(prev => [...prev, r]);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-slate-800 px-5 py-3 flex justify-between items-center text-white shrink-0">
                    <h3 className="font-bold text-base flex items-center gap-2">
                        <Bell className="w-5 h-5 text-red-400" /> Allergy Management
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <XCircle className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    <div className="flex-1 bg-slate-50 border-r border-slate-200 flex flex-col overflow-hidden">
                        <div className="p-3 bg-slate-100 border-b border-slate-200 font-bold text-slate-700 text-sm">
                            Existing Allergy
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-200 text-slate-600 text-xs uppercase sticky top-0">
                                    <tr>
                                        <th className="px-4 py-2">Category</th>
                                        <th className="px-4 py-2">Allergic To</th>
                                        <th className="px-4 py-2">Status</th>
                                        <th className="px-4 py-2">Reaction</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {patientAllergies.length === 0 ? (
                                        <tr><td colSpan={4} className="p-8 text-center text-slate-400 italic">No allergies recorded yet.</td></tr>
                                    ) : (
                                        patientAllergies.map(a => (
                                            <tr key={a.id} className="bg-white">
                                                <td className="px-4 py-2 text-slate-600">{a.allergyType || '-'}</td>
                                                <td className="px-4 py-2 font-medium text-slate-800">{a.allergen}</td>
                                                <td className="px-4 py-2">
                                                    <span className={`px-2 py-0.5 rounded text-xs ${a.status === 'Active' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                        {a.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 text-xs text-slate-500 max-w-[150px] truncate" title={a.reaction}>
                                                    {a.reaction}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="flex-[1.2] flex flex-col bg-white overflow-y-auto">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-blue-50/30">
                            <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer select-none">
                                <input 
                                    type="checkbox" 
                                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                    checked={noKnownAllergies}
                                    onChange={e => setNoKnownAllergies(e.target.checked)}
                                />
                                No Known Allergies
                            </label>
                            <button 
                                onClick={() => {
                                    setForm({ allergyType: '', allergicTo: '', onSet: '', onsetDate: '', allergyStatus: 'Active', resolvedDate: '', remarks: '' });
                                    setSelectedReactions([]);
                                    setNoKnownAllergies(false);
                                }}
                                className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded flex items-center gap-1 hover:bg-blue-700 transition-colors"
                            >
                                <Plus className="w-3 h-3" /> New Allergy
                            </button>
                        </div>
                        <div className={`p-6 space-y-4 ${noKnownAllergies ? 'opacity-50 pointer-events-none' : ''}`}>
                            <h4 className="font-bold text-slate-800 border-b border-slate-200 pb-2">Allergy Details</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-600 block mb-1">Allergy Type</label>
                                    <select 
                                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white"
                                        value={form.allergyType}
                                        onChange={e => setForm({...form, allergyType: e.target.value})}
                                    >
                                        <option value="">-- Select --</option>
                                        {ALLERGY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-600 block mb-1">Allergic To <span className="text-red-500">*</span></label>
                                    <input 
                                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm outline-none focus:border-blue-500"
                                        placeholder="Substance name..."
                                        value={form.allergicTo}
                                        onChange={e => setForm({...form, allergicTo: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-600 block mb-1">Onset Date</label>
                                    <input 
                                        type="date"
                                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm outline-none focus:border-blue-500"
                                        value={form.onsetDate}
                                        onChange={e => setForm({...form, onsetDate: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-600 block mb-1">Allergy Status</label>
                                    <select 
                                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white"
                                        value={form.allergyStatus}
                                        onChange={e => setForm({...form, allergyStatus: e.target.value})}
                                    >
                                        <option>Active</option>
                                        <option>Resolved</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-600 block mb-1">Resolved Date</label>
                                    <input 
                                        type="date"
                                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm outline-none focus:border-blue-500"
                                        disabled={form.allergyStatus !== 'Resolved'}
                                        value={form.resolvedDate}
                                        onChange={e => setForm({...form, resolvedDate: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-600 block mb-1">Reactions</label>
                                <div className="border border-slate-300 rounded h-32 overflow-y-auto p-2 bg-slate-50">
                                    <div className="grid grid-cols-1 gap-1">
                                        {ALLERGY_REACTIONS.map(r => (
                                            <label key={r} className="flex items-center gap-2 text-sm text-slate-700 hover:bg-white p-1 rounded cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                    checked={selectedReactions.includes(r)}
                                                    onChange={() => toggleReaction(r)}
                                                />
                                                {r}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-600 block mb-1">Remarks</label>
                                <textarea 
                                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm outline-none focus:border-blue-500 h-20 resize-none"
                                    value={form.remarks}
                                    onChange={e => setForm({...form, remarks: e.target.value})}
                                ></textarea>
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-200 mt-auto flex justify-end gap-3">
                            <button onClick={onClose} className="px-5 py-2 rounded-lg border border-slate-300 text-slate-600 text-sm font-medium hover:bg-white hover:border-slate-400 transition-colors">
                                Cancel
                            </button>
                            <button 
                                onClick={handleSave} 
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-md shadow-blue-200 transition-all"
                            >
                                Save Allergy
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const DiagnosisEntryModal = ({ appointmentId, onClose }: { appointmentId: string, onClose: () => void }) => {
    // ... [Same implementation]
    const { 
        diagnoses, saveDiagnosis, deleteDiagnosis, 
        narrativeDiagnoses, saveNarrativeDiagnosis, showToast,
        masterDiagnoses 
    } = useData();

    // -- State for Narrative --
    const existingNarrative = narrativeDiagnoses.find(n => n.appointmentId === appointmentId);
    const [narrativeForm, setNarrativeForm] = useState({
        illness: existingNarrative?.illness || '',
        durationVal: existingNarrative?.illnessDurationValue?.toString() || '',
        durationUnit: existingNarrative?.illnessDurationUnit || 'Days',
        activity: existingNarrative?.behaviouralActivity || '',
        notes: existingNarrative?.narrative || ''
    });

    // -- State for ICD --
    const [searchPrimary, setSearchPrimary] = useState('');
    const [searchSecondary, setSearchSecondary] = useState('');
    
    // Fallback if master list is empty
    const availableCodes = masterDiagnoses.length > 0 ? masterDiagnoses : FALLBACK_ICD_CODES;

    const [searchResultsPrimary, setSearchResultsPrimary] = useState(availableCodes);
    const [searchResultsSecondary, setSearchResultsSecondary] = useState(availableCodes);
    const [noComorbidities, setNoComorbidities] = useState(false);
    
    const [isPoaPrimary, setIsPoaPrimary] = useState(true);
    const [isPoaSecondary, setIsPoaSecondary] = useState(false);

    const primaryDiagnoses = diagnoses.filter(d => d.appointmentId === appointmentId && d.type === 'Primary');
    const secondaryDiagnoses = diagnoses.filter(d => d.appointmentId === appointmentId && d.type === 'Secondary');

    // -- Effects --
    useEffect(() => {
        if (searchPrimary) {
            setSearchResultsPrimary(availableCodes.filter(c => c.description.toLowerCase().includes(searchPrimary.toLowerCase()) || c.code.toLowerCase().includes(searchPrimary.toLowerCase())));
        } else {
            setSearchResultsPrimary(availableCodes);
        }
    }, [searchPrimary, masterDiagnoses]);

    useEffect(() => {
        if (searchSecondary) {
            setSearchResultsSecondary(availableCodes.filter(c => c.description.toLowerCase().includes(searchSecondary.toLowerCase()) || c.code.toLowerCase().includes(searchSecondary.toLowerCase())));
        } else {
            setSearchResultsSecondary(availableCodes);
        }
    }, [searchSecondary, masterDiagnoses]);

    // -- Handlers --
    const handleAddDiagnosis = (icd: {code: string, description: string}, type: 'Primary' | 'Secondary') => {
        const exists = diagnoses.some(d => d.appointmentId === appointmentId && d.type === type && d.icdCode === icd.code);
        if (exists) {
            showToast('info', 'Diagnosis already added.');
            return;
        }

        const isPoa = type === 'Primary' ? isPoaPrimary : isPoaSecondary;

        saveDiagnosis({
            id: Date.now().toString(),
            appointmentId,
            icdCode: icd.code,
            description: icd.description,
            type: type,
            isPoa: isPoa,
            addedAt: new Date().toISOString()
        });
        
        if (type === 'Primary') setSearchPrimary('');
        if (type === 'Secondary') setSearchSecondary('');
    };

    const handleSaveNarrative = () => {
        saveNarrativeDiagnosis({
            id: existingNarrative?.id || Date.now().toString(),
            appointmentId,
            illness: narrativeForm.illness,
            illnessDurationValue: narrativeForm.durationVal ? parseInt(narrativeForm.durationVal) : undefined,
            illnessDurationUnit: narrativeForm.durationUnit,
            behaviouralActivity: narrativeForm.activity,
            narrative: narrativeForm.notes,
            recordedAt: new Date().toISOString()
        });
        showToast('success', 'Diagnosis details saved.');
        onClose();
    };

    const ToolbarButton = ({ icon: Icon }: { icon: any }) => (
        <button className="p-1 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded transition-colors">
            <Icon className="w-3.5 h-3.5" />
        </button>
    );

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-slate-800 px-5 py-3 flex justify-between items-center text-white shrink-0">
                    <h3 className="font-bold text-base flex items-center gap-2">
                        <Info className="w-5 h-5 text-amber-400" /> Diagnosis Entry
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <XCircle className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto bg-slate-50 p-6 space-y-6">
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="text-xs font-bold text-slate-600 block mb-1">Illness</label>
                                <select 
                                    className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm outline-none focus:border-blue-500 bg-white"
                                    value={narrativeForm.illness}
                                    onChange={e => setNarrativeForm({...narrativeForm, illness: e.target.value})}
                                >
                                    <option value="">-- Select --</option>
                                    <option>Fever</option>
                                    <option>Headache</option>
                                    <option>Abdominal Pain</option>
                                    <option>Cough</option>
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-slate-600 block mb-1">Illness Duration</label>
                                    <input 
                                        type="number"
                                        className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm outline-none focus:border-blue-500"
                                        value={narrativeForm.durationVal}
                                        onChange={e => setNarrativeForm({...narrativeForm, durationVal: e.target.value})}
                                    />
                                </div>
                                <div className="w-32">
                                    <label className="text-xs font-bold text-slate-600 block mb-1">&nbsp;</label>
                                    <select 
                                        className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm outline-none focus:border-blue-500 bg-white"
                                        value={narrativeForm.durationUnit}
                                        onChange={e => setNarrativeForm({...narrativeForm, durationUnit: e.target.value})}
                                    >
                                        <option>Days</option>
                                        <option>Weeks</option>
                                        <option>Months</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-600 block mb-1">Behavioural Activity</label>
                                <select 
                                    className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm outline-none focus:border-blue-500 bg-white"
                                    value={narrativeForm.activity}
                                    onChange={e => setNarrativeForm({...narrativeForm, activity: e.target.value})}
                                >
                                    <option value="">-- Select --</option>
                                    <option>Normal</option>
                                    <option>Agitated</option>
                                    <option>Lethargic</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-blue-700 block mb-1">Narrative Diagnosis</label>
                            <div className="border border-slate-300 rounded overflow-hidden">
                                <textarea 
                                    className="w-full p-3 text-sm outline-none resize-none h-24"
                                    value={narrativeForm.notes}
                                    onChange={e => setNarrativeForm({...narrativeForm, notes: e.target.value})}
                                ></textarea>
                                <div className="bg-slate-50 border-t border-slate-200 p-1 flex gap-1">
                                    <ToolbarButton icon={Bold} />
                                    <ToolbarButton icon={Italic} />
                                    <ToolbarButton icon={Underline} />
                                    <div className="w-px bg-slate-300 mx-1"></div>
                                    <ToolbarButton icon={RotateCcw} />
                                    <div className="w-px bg-slate-300 mx-1"></div>
                                    <ToolbarButton icon={List} />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-blue-700 text-sm">Primary Diagnosis<span className="text-red-500">*</span></h4>
                            <div className="flex flex-col items-end w-1/2">
                                <div className="flex items-center gap-2 mb-1 w-full">
                                    <label className="text-xs font-bold text-slate-600 flex items-center gap-1 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={isPoaPrimary}
                                            onChange={e => setIsPoaPrimary(e.target.checked)}
                                            className="rounded text-blue-600"
                                        />
                                        Present On Admission
                                    </label>
                                    <span className="text-xs font-bold text-slate-600">Search:</span>
                                    <input 
                                        className="flex-1 bg-yellow-50 border border-slate-300 rounded px-2 py-1 text-sm outline-none focus:border-blue-500 focus:bg-white transition-colors"
                                        value={searchPrimary}
                                        onChange={e => setSearchPrimary(e.target.value)}
                                        placeholder="Search ICD..."
                                    />
                                </div>
                                {searchPrimary && (
                                    <div className="absolute bg-white border border-slate-200 shadow-lg rounded mt-8 w-64 z-20 max-h-40 overflow-y-auto">
                                        {searchResultsPrimary.length === 0 ? (
                                            <div className="px-3 py-2 text-sm text-slate-400 italic">No matches found</div>
                                        ) : (
                                            searchResultsPrimary.slice(0, 50).map(res => (
                                                <div 
                                                    key={res.code} 
                                                    onClick={() => handleAddDiagnosis(res, 'Primary')}
                                                    className="px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-0"
                                                >
                                                    <span className="font-bold text-slate-700">{res.code}</span> - {res.description}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-4 text-xs mb-3 text-slate-600 font-medium">
                            <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="pd_type" defaultChecked /> All</label>
                            <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="pd_type" /> Internal Medicine</label>
                            <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="pd_type" /> Favourites</label>
                        </div>
                        <div className="border border-slate-300 rounded bg-slate-50 min-h-[60px]">
                            {primaryDiagnoses.map(d => (
                                <div key={d.id} className="flex justify-between items-center p-2 border-b border-slate-200 bg-slate-200/50">
                                    <div className="text-sm">
                                        <span className="font-bold text-slate-800">{d.icdCode}</span> - {d.description}
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {d.isPoa && (
                                            <span className="text-xs text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-300 font-medium shadow-sm">
                                                Present On Admission
                                            </span>
                                        )}
                                        <button onClick={() => deleteDiagnosis(d.id)} className="text-slate-400 hover:text-red-500">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {primaryDiagnoses.length === 0 && <div className="p-4 text-center text-xs text-slate-400 italic">No primary diagnosis selected</div>}
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-blue-700 text-sm">Secondary Diagnosis<span className="text-red-500">*</span></h4>
                            <div className="flex items-center gap-2">
                                <label className="flex items-center gap-1 text-xs font-bold text-slate-600 cursor-pointer select-none">
                                    No Known Co-Morbidities 
                                    <input 
                                        type="checkbox" 
                                        className="ml-1"
                                        checked={noComorbidities}
                                        onChange={e => setNoComorbidities(e.target.checked)}
                                    />
                                </label>
                            </div>
                        </div>
                        {!noComorbidities && (
                            <>
                                <div className="flex justify-end mb-2 relative">
                                    <div className="flex items-center gap-2 w-1/2 justify-end">
                                        <label className="text-xs font-bold text-slate-600 flex items-center gap-1 cursor-pointer mr-2">
                                            <input 
                                                type="checkbox" 
                                                checked={isPoaSecondary}
                                                onChange={e => setIsPoaSecondary(e.target.checked)}
                                                className="rounded text-blue-600"
                                            />
                                            Present On Admission
                                        </label>
                                        <span className="text-xs font-bold text-slate-600">Search:</span>
                                        <input 
                                            className="flex-1 bg-yellow-50 border border-slate-300 rounded px-2 py-1 text-sm outline-none focus:border-blue-500 focus:bg-white transition-colors max-w-[200px]"
                                            value={searchSecondary}
                                            onChange={e => setSearchSecondary(e.target.value)}
                                            placeholder="Search ICD..."
                                        />
                                    </div>
                                    {searchSecondary && (
                                        <div className="absolute right-0 top-full bg-white border border-slate-200 shadow-lg rounded mt-1 w-64 z-20 max-h-40 overflow-y-auto">
                                            {searchResultsSecondary.length === 0 ? (
                                                <div className="px-3 py-2 text-sm text-slate-400 italic">No matches found</div>
                                            ) : (
                                                searchResultsSecondary.slice(0, 50).map(res => (
                                                    <div 
                                                        key={res.code} 
                                                        onClick={() => handleAddDiagnosis(res, 'Secondary')}
                                                        className="px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-0"
                                                    >
                                                        <span className="font-bold text-slate-700">{res.code}</span> - {res.description}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="border border-slate-300 rounded bg-slate-50 min-h-[60px]">
                                    {secondaryDiagnoses.map(d => (
                                        <div key={d.id} className="flex justify-between items-center p-2 border-b border-slate-200 bg-slate-200/50">
                                            <div className="text-sm">
                                                <span className="font-bold text-slate-800">{d.icdCode}</span> - {d.description}
                                            </div>
                                            <div className="flex items-center gap-4">
                                                {d.isPoa && (
                                                    <span className="text-xs text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-300 font-medium shadow-sm">
                                                        Present On Admission
                                                    </span>
                                                )}
                                                <button onClick={() => deleteDiagnosis(d.id)} className="text-slate-400 hover:text-red-500">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {secondaryDiagnoses.length === 0 && <div className="p-4 text-center text-xs text-slate-400 italic">No secondary diagnosis selected</div>}
                                </div>
                            </>
                        )}
                        {noComorbidities && (
                            <div className="p-4 bg-slate-100 border border-slate-200 rounded text-center text-xs text-slate-500 italic">
                                Patient marked as having no known co-morbidities.
                            </div>
                        )}
                    </div>
                </div>
                <div className="p-4 bg-slate-100 border-t border-slate-300 shrink-0 flex justify-end items-center gap-3">
                    <button onClick={onClose} className="px-5 py-2 rounded-lg border border-slate-300 text-slate-600 text-sm font-medium hover:bg-white hover:border-slate-400 transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleSaveNarrative} className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-6 py-2 rounded-lg font-bold shadow-md">
                        Save Diagnosis
                    </button>
                </div>
            </div>
        </div>
    );
};

export const Consultation = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const { appointments, patients, vitals, updateAppointment, clinicalNotes, saveClinicalNote, employees, departments, allergies, diagnoses } = useData();
  
  const [activeSection, setActiveSection] = useState('Chief Complaint');
  
  // Modal states
  const [showVitals, setShowVitals] = useState(false);
  const [showAllergy, setShowAllergy] = useState(false);
  const [showDiagnosis, setShowDiagnosis] = useState(false);
  const [showCPOE, setShowCPOE] = useState(false);
  
  const appointment = appointments.find(a => a.id === appointmentId);
  const patient = patients.find(p => p.id === appointment?.patientId);
  
  // Derived data
  const employee = employees.find(e => e.id === appointment?.doctorId);
  const department = departments.find(d => d.id === appointment?.departmentId);
  const activeAllergiesCount = allergies.filter(a => a.patientId === patient?.id && a.status === 'Active').length;

  // If not found, handle gracefully (redirect or show error)
  if (!appointment || !patient) {
      return <div className="p-10 text-center">Loading or Appointment not found...</div>;
  }

  const age = new Date().getFullYear() - new Date(patient.dob).getFullYear();

  // Keyboard shortcuts
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'F7') { e.preventDefault(); setShowVitals(true); }
          if (e.key === 'F8') { e.preventDefault(); setShowAllergy(true); }
          if (e.key === 'F5') { e.preventDefault(); setShowDiagnosis(true); }
          if (e.key === 'F3') { e.preventDefault(); setShowCPOE(true); }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleComplete = () => {
      updateAppointment(appointment.id, { status: 'Completed', checkOutTime: new Date().toISOString() });
      navigate('/doctor-workbench');
  };

  const getPatientHistory = () => {
    return appointments
        .filter(a => a.patientId === patient.id && a.id !== appointment.id && a.status !== 'Cancelled')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const renderVisitHistory = () => {
    const history = getPatientHistory();
    if (history.length === 0) return <div className="p-8 text-center text-slate-400 italic">No past visit history found for this patient.</div>;

    return (
        <div className="space-y-4">
            {history.map(apt => {
                const doc = employees.find(e => e.id === apt.doctorId);
                const dept = departments.find(d => d.id === apt.departmentId);
                const aptDiagnoses = diagnoses.filter(d => d.appointmentId === apt.id);
                const aptVitals = vitals.find(v => v.appointmentId === apt.id);

                return (
                    <div key={apt.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors bg-slate-50/50">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-blue-500" />
                                    {new Date(apt.date).toLocaleDateString()} 
                                    <span className="text-slate-400 font-normal text-xs">at {apt.time}</span>
                                </div>
                                <div className="text-xs text-slate-600 mt-1 ml-6">
                                    Dr. {doc?.firstName} {doc?.lastName} <span className="text-slate-300 mx-1">|</span> {dept?.name}
                                </div>
                            </div>
                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border ${
                                apt.status === 'Completed' 
                                ? 'bg-green-50 text-green-700 border-green-100' 
                                : 'bg-blue-50 text-blue-700 border-blue-100'
                            }`}>
                                {apt.status}
                            </span>
                        </div>
                        {aptDiagnoses.length > 0 && (
                            <div className="mb-3 ml-6">
                                <div className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                                    <Info className="w-3 h-3" /> Diagnosis
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {aptDiagnoses.map(d => (
                                        <span key={d.id} className="bg-amber-50 text-amber-800 border border-amber-100 px-2 py-0.5 rounded text-xs">
                                            {d.description}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {aptVitals && (
                            <div className="ml-6 mb-3">
                                <div className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                                    <Activity className="w-3 h-3" /> Vitals
                                </div>
                                <div className="text-xs text-slate-700 flex flex-wrap gap-x-4 gap-y-1">
                                    {aptVitals.bpSystolic && <div><span className="font-semibold text-slate-500">BP:</span> {aptVitals.bpSystolic}/{aptVitals.bpDiastolic}</div>}
                                    {aptVitals.temperature && <div><span className="font-semibold text-slate-500">Temp:</span> {aptVitals.temperature}°C</div>}
                                    {aptVitals.pulse && <div><span className="font-semibold text-slate-500">HR:</span> {aptVitals.pulse}</div>}
                                    {aptVitals.spo2 && <div><span className="font-semibold text-slate-500">SpO2:</span> {aptVitals.spo2}%</div>}
                                    {aptVitals.weight && <div><span className="font-semibold text-slate-500">Wt:</span> {aptVitals.weight}kg</div>}
                                </div>
                            </div>
                        )}
                        {apt.notes && (
                             <div className="mt-3 ml-6 text-xs text-slate-500 italic border-t border-slate-200 pt-2 flex items-start gap-1">
                                <FileText className="w-3 h-3 shrink-0 mt-0.5" />
                                {apt.notes}
                             </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] -m-6 bg-slate-100 overflow-hidden relative">
        {/* Modals */}
        {showVitals && <VitalsEntryModal appointmentId={appointment.id} onClose={() => setShowVitals(false)} />}
        {showAllergy && <AllergyEntryModal patientId={patient.id} onClose={() => setShowAllergy(false)} />}
        {showDiagnosis && <DiagnosisEntryModal appointmentId={appointment.id} onClose={() => setShowDiagnosis(false)} />}
        {showCPOE && <CPOEView appointmentId={appointment.id} patientName={`${patient.firstName} ${patient.lastName}`} doctorId={employee?.id || ''} onClose={() => setShowCPOE(false)} />}

        {/* 1. Sub-Header (White) */}
        <div className="bg-white px-6 py-2 border-b border-slate-200 flex justify-between items-center shrink-0 shadow-sm z-20 h-14">
            <div className="flex items-center gap-3">
                <span className="bg-blue-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wide">EMR</span>
                <h1 className="text-lg font-bold text-slate-800">Consultation Room</h1>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-600 font-medium">
                <div className="flex items-center gap-1.5"><User className="w-4 h-4 text-slate-400" /> Dr. {employee?.lastName || 'RR'}</div>
                <div className="flex items-center gap-1.5"><Briefcase className="w-4 h-4 text-slate-400" /> {(department?.name || 'General').toUpperCase()}</div>
                <div className="flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1 rounded-full border border-green-100 text-xs font-bold">
                    <Clock className="w-3.5 h-3.5" /> Started: {new Date(appointment.checkInTime || Date.now()).toLocaleTimeString()}
                </div>
            </div>
        </div>

        {/* 2. Patient Banner (Dark Blue) */}
        <div className="bg-slate-900 text-white p-4 shrink-0 shadow-md z-10">
            <div className="flex items-center justify-between">
                <div className="flex gap-6 items-center flex-1">
                    {/* Avatar */}
                    <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center text-lg font-bold text-slate-300 border border-slate-600 shadow-inner">
                        {patient.firstName[0]}{patient.lastName[0]}
                    </div>
                    
                    {/* Details Grid */}
                    <div className="grid grid-cols-5 gap-8 flex-1">
                        <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Patient Name</p>
                            <h2 className="text-base font-bold text-white uppercase tracking-tight truncate">{patient.firstName} {patient.lastName}</h2>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">MRN / ID</p>
                            <p className="text-yellow-400 font-mono font-bold text-sm">{patient.id.slice(-8).toUpperCase()}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Demographics</p>
                            <p className="font-medium text-slate-100 text-sm">{age} Y / {patient.gender}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Contact</p>
                            <p className="font-medium text-slate-100 text-sm">{patient.phone}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Active Package</p>
                            <p className="text-slate-400 italic text-xs">No active insurance</p>
                        </div>
                    </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-col gap-2 ml-6 w-32 shrink-0">
                        <button 
                        onClick={() => setShowAllergy(true)} 
                        className={`flex items-center justify-center gap-2 border px-3 py-1.5 rounded-md text-xs font-bold transition-all shadow-sm ${
                            activeAllergiesCount > 0 
                            ? 'bg-[#3f191b] hover:bg-[#5c2427] border-red-900/50 text-red-200' 
                            : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                        }`}
                        >
                        <Bell className={`w-3.5 h-3.5 ${activeAllergiesCount > 0 ? 'text-red-400' : 'text-slate-400'}`} /> 
                        Allergies {activeAllergiesCount > 0 && `(${activeAllergiesCount})`}
                        </button>
                        <button className="flex items-center justify-center gap-2 bg-[#172554] hover:bg-[#1e3a8a] border border-blue-900/50 text-blue-100 px-3 py-1.5 rounded-md text-xs font-bold transition-all shadow-sm">
                        <Info className="w-3.5 h-3.5 text-blue-400" /> Alerts
                        </button>
                </div>
            </div>
        </div>

        {/* 3. Toolbar (White) */}
        <div className="bg-white border-b border-slate-200 shadow-sm shrink-0 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                {TOP_TOOLS.map(tool => {
                    const Icon = tool.icon;
                    return (
                        <button 
                            key={tool.id}
                            onClick={() => {
                                if(tool.id === 'Vitals') setShowVitals(true);
                                if(tool.id === 'Allergy') setShowAllergy(true);
                                if(tool.id === 'Diagnosis') setShowDiagnosis(true);
                                if(tool.id === 'Orders') setShowCPOE(true);
                            }}
                            className="flex flex-col items-center justify-center min-w-[70px] p-2 hover:bg-slate-50 rounded-lg transition-all group"
                        >
                            <Icon className={`w-5 h-5 mb-1.5 ${tool.color} group-hover:scale-110 transition-transform`} />
                            <span className="text-[10px] font-bold text-slate-600 group-hover:text-slate-900">{tool.label.split(' ')[0]}</span>
                            <span className="text-[9px] text-slate-400 font-medium">{tool.label.split(' ')[1] || ''}</span>
                        </button>
                    )
                })}
            </div>
            
            <div className="flex items-center gap-3">
                <button onClick={handleComplete} className="bg-green-600 text-white px-6 py-2.5 rounded-lg text-xs font-bold hover:bg-green-700 shadow-sm flex items-center gap-2 transition-transform active:scale-95">
                    <CheckCircle className="w-4 h-4" /> Complete Consult
                </button>
            </div>
        </div>

        {/* 4. Workspace (Sidebar + Content) */}
        <div className="flex-1 flex overflow-hidden">
            <div className="w-64 bg-slate-900 text-slate-400 flex flex-col shrink-0 border-r border-slate-800">
                <div className="flex-1 overflow-y-auto py-2">
                    {SIDEBAR_ITEMS.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveSection(item.id)}
                            className={`w-full text-left px-5 py-3.5 text-sm font-medium transition-all relative group ${
                                activeSection === item.id 
                                ? 'bg-blue-600 text-white shadow-lg' 
                                : 'hover:bg-slate-800 hover:text-slate-200'
                            }`}
                        >
                            {activeSection === item.id && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-white"></div>
                            )}
                            {item.label}
                        </button>
                    ))}
                </div>
                <div className="p-4 border-t border-slate-800 bg-slate-900">
                    <button onClick={() => navigate('/doctor-workbench')} className="flex items-center justify-center w-full py-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-white transition-colors border border-slate-700 rounded hover:border-slate-500">
                        <ArrowLeft className="w-3 h-3 mr-2" /> Back to List
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-slate-100">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 min-h-full p-8 relative">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 border-b pb-4 flex items-center gap-3">
                        <FileText className="w-6 h-6 text-blue-600" />
                        {SIDEBAR_ITEMS.find(i => i.id === activeSection)?.label}
                    </h3>
                    
                    {activeSection === 'Visit History' ? (
                        <div className="animate-in fade-in duration-300">
                            {renderVisitHistory()}
                        </div>
                    ) : (
                        <div className="max-w-5xl mx-auto animate-in fade-in duration-300">
                            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg text-amber-800 text-sm mb-6 flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold">Currently editing: {activeSection}</p>
                                    <p className="text-xs mt-1 text-amber-700">Use the toolbar buttons (F3-F8) or sidebar to navigate through the clinical workflow. Changes are auto-saved locally until completed.</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Clinical Notes & Findings</label>
                                    <div className="relative">
                                        <textarea 
                                            className="w-full h-80 p-5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none text-slate-700 leading-relaxed text-sm bg-white shadow-inner"
                                            placeholder={`Enter clinical details for ${activeSection} here...`}
                                        ></textarea>
                                        <div className="absolute bottom-4 right-4 text-xs text-slate-400">
                                            Markdown Supported
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                    <button className="px-6 py-2.5 border border-slate-300 text-slate-600 rounded-lg font-bold text-sm hover:bg-slate-50 transition-colors">
                                        Clear Notes
                                    </button>
                                    <button className="bg-blue-600 text-white px-8 py-2.5 rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors shadow-md shadow-blue-100 flex items-center gap-2">
                                        <Save className="w-4 h-4" /> Save {activeSection}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};
