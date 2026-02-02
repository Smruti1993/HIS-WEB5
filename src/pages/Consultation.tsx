import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { 
  User, Info, Save, Printer, FileText, Bell, Activity, Stethoscope, Briefcase, 
  Pill, Clock, FileInput, ChevronRight, ChevronDown, 
  Bold, Italic, Underline, List, AlignLeft, Type, Download, XCircle, Cloud, CheckCircle, Loader2, Calculator, Plus, Trash2, Search, RotateCcw, History, AlertTriangle, ArrowLeft
} from 'lucide-react';
import { VitalSign, Allergy, Diagnosis } from '../types';

// --- Static Configs ---
const SIDEBAR_ITEMS = [
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

// --- Components ---

const VitalsEntryModal = ({ appointmentId, onClose }: { appointmentId: string, onClose: () => void }) => {
    // ... (Existing Vitals Modal Code)
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

    const rows = [
        { label: 'Temperature', key: 'temperature', unit: '°C', range: '36.5 - 37.4' },
        { label: 'Intravascular systolic', key: 'sys', unit: 'mmHg', range: '95.0 - 140.0' },
        { label: 'Intravascular diastolic', key: 'dia', unit: 'mmHg', range: '60.0 - 90.0' },
        { label: 'Pulse', key: 'pulse', unit: 'bpm', range: '50.0 - 80.0' },
        { label: 'RR', key: 'rr', unit: 'bpm', range: '12.0 - 20.0' },
        { label: 'MAP', key: 'map', unit: 'mmHg', range: '60.0 - 110.0', isCalc: true },
        { label: 'Oxygen Saturation', key: 'spo2', unit: '%', range: '94.0 - 100.0' },
        { label: 'Height', key: 'height', unit: 'cm', range: '100.0 - 270.0' },
        { label: 'Weight', key: 'weight', unit: 'kg', range: '55.0 - 80.0' },
        { label: 'BMI', key: 'bmi', unit: 'kg/m²', range: '18.5 - 24.9', isCalc: true },
        { label: 'History of tobacco use', key: 'tobacco', unit: '', range: 'Details' },
    ];

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-slate-800 px-5 py-3 flex justify-between items-center text-white shrink-0">
                    <h3 className="font-bold text-base flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-400" /> Record Vital Signs
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <XCircle className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-0">
                    <table className="w-full text-sm border-collapse">
                        <thead className="bg-slate-100 text-slate-600 sticky top-0 z-10 shadow-sm text-xs uppercase">
                            <tr>
                                <th className="px-4 py-3 font-semibold text-left w-[25%] border-b border-slate-200">Vital Sign</th>
                                <th className="px-4 py-3 font-semibold text-left w-[20%] border-b border-slate-200">Value</th>
                                <th className="px-4 py-3 font-semibold text-left w-[10%] border-b border-slate-200">Unit</th>
                                <th className="px-4 py-3 font-semibold text-left w-[20%] border-b border-slate-200 hidden sm:table-cell">Ref. Range</th>
                                <th className="px-4 py-3 font-semibold text-left border-b border-slate-200">Remarks</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {rows.map((row, idx) => (
                                <tr key={row.key} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-2.5 font-medium text-slate-700">{row.label}</td>
                                    <td className="px-4 py-2.5">
                                        <div className="relative">
                                            <input 
                                                type={row.key === 'tobacco' ? 'text' : 'number'}
                                                step="0.1"
                                                className={`w-full border border-slate-300 rounded px-2 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all ${row.isCalc ? 'bg-slate-50 text-slate-500 font-semibold' : ''}`}
                                                value={(formData as any)[row.key]}
                                                readOnly={row.isCalc}
                                                placeholder={row.isCalc ? 'Auto' : '-'}
                                                onChange={e => setFormData({...formData, [row.key]: e.target.value})}
                                            />
                                            {row.isCalc && <Calculator className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" />}
                                        </div>
                                    </td>
                                    <td className="px-4 py-2.5 text-xs text-slate-500">{row.unit}</td>
                                    <td className="px-4 py-2.5 text-xs text-slate-500 hidden sm:table-cell">{row.range}</td>
                                    <td className="px-4 py-2.5">
                                        <input 
                                            className="w-full border-b border-transparent hover:border-slate-300 focus:border-blue-500 px-1 py-1 text-sm outline-none bg-transparent transition-colors placeholder-slate-300"
                                            placeholder="Add remark..."
                                            value={formData.remarks[row.key] || ''}
                                            onChange={e => handleRemarkChange(row.key, e.target.value)}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 bg-slate-50 flex justify-end gap-3 border-t border-slate-200 shrink-0">
                    <button onClick={onClose} className="px-5 py-2 rounded-lg border border-slate-300 text-slate-600 text-sm font-medium hover:bg-white hover:border-slate-400 transition-colors">Cancel</button>
                    <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-md shadow-blue-200 transition-all flex items-center gap-2"><Save className="w-4 h-4" /> Save Vitals</button>
                </div>
            </div>
        </div>
    );
};

const AllergyEntryModal = ({ patientId, onClose }: { patientId: string, onClose: () => void }) => {
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
            // Save a specific record indicating No Known Allergies
            saveAllergy({
                id: Date.now().toString(),
                patientId,
                allergen: 'No Known Allergies',
                allergyType: 'NKA', // Specific code for No Known Allergies
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
            severity: 'Moderate', // Default for now as not in detailed form
            status: form.allergyStatus as 'Active' | 'Resolved',
            onsetDate: form.onsetDate,
            resolvedDate: form.resolvedDate,
            reaction: selectedReactions.join(', '),
            remarks: form.remarks
        });
        
        // Reset form for next entry
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
                {/* Header */}
                <div className="bg-slate-800 px-5 py-3 flex justify-between items-center text-white shrink-0">
                    <h3 className="font-bold text-base flex items-center gap-2">
                        <Bell className="w-5 h-5 text-red-400" /> Allergy Management
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <XCircle className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    {/* Left: Existing List */}
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

                    {/* Right: Form */}
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
    
    // Present On Admission checkboxes for new entries
    const [isPoaPrimary, setIsPoaPrimary] = useState(true);
    const [isPoaSecondary, setIsPoaSecondary] = useState(false);

    // Filter existing diagnoses for this visit
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
        // Prevent duplicate ICDs for the same type
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
                {/* Header */}
                <div className="bg-slate-800 px-5 py-3 flex justify-between items-center text-white shrink-0">
                    <h3 className="font-bold text-base flex items-center gap-2">
                        <Info className="w-5 h-5 text-amber-400" /> Diagnosis Entry
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <XCircle className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto bg-slate-50 p-6 space-y-6">
                    
                    {/* SECTION 1: Narrative Diagnosis */}
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

                    {/* SECTION 2: Primary Diagnosis */}
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

                    {/* SECTION 3: Secondary Diagnosis */}
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

                {/* Footer */}
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
  const { appointments, patients, vitals, updateAppointment, clinicalNotes, saveClinicalNote, employees, departments, allergies } = useData();
  
  const [activeSection, setActiveSection] = useState('Chief Complaint');
  
  // Modal states
  const [showVitals, setShowVitals] = useState(false);
  const [showAllergy, setShowAllergy] = useState(false);
  const [showDiagnosis, setShowDiagnosis] = useState(false);
  
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
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleComplete = () => {
      updateAppointment(appointment.id, { status: 'Completed', checkOutTime: new Date().toISOString() });
      navigate('/doctor-workbench');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] -m-6 bg-slate-100 overflow-hidden relative">
        {/* Modals */}
        {showVitals && <VitalsEntryModal appointmentId={appointment.id} onClose={() => setShowVitals(false)} />}
        {showAllergy && <AllergyEntryModal patientId={patient.id} onClose={() => setShowAllergy(false)} />}
        {showDiagnosis && <DiagnosisEntryModal appointmentId={appointment.id} onClose={() => setShowDiagnosis(false)} />}

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
            {/* Sidebar */}
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

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-8 bg-slate-100">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 min-h-full p-8 relative">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 border-b pb-4 flex items-center gap-3">
                        <FileText className="w-6 h-6 text-blue-600" />
                        {SIDEBAR_ITEMS.find(i => i.id === activeSection)?.label}
                    </h3>
                    
                    <div className="max-w-5xl mx-auto">
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
                </div>
            </div>
        </div>
    </div>
  );
};