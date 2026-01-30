import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { 
  User, Info, Save, Printer, FileText, Bell, Activity, Stethoscope, Briefcase, 
  Pill, Clock, FileInput, ChevronRight, ChevronDown, 
  Bold, Italic, Underline, List, AlignLeft, Type, Download, XCircle
} from 'lucide-react';

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

export const Consultation = () => {
    const { appointmentId } = useParams();
    const navigate = useNavigate();
    const { appointments, patients, employees, departments, clinicalNotes, saveClinicalNote, updateAppointment, showToast } = useData();

    const [activeSection, setActiveSection] = useState('Chief Complaint');
    const [noteContent, setNoteContent] = useState('');
    const [lastEdited, setLastEdited] = useState<string | null>(null);
    const editorRef = useRef<HTMLDivElement>(null);

    const appointment = appointments.find(a => a.id === appointmentId);
    const patient = patients.find(p => p.id === appointment?.patientId);
    const doctor = employees.find(e => e.id === appointment?.doctorId);
    const dept = departments.find(d => d.id === appointment?.departmentId);

    // --- Effects ---
    useEffect(() => {
        if (!appointmentId) return;
        const note = clinicalNotes.find(n => n.appointmentId === appointmentId && n.noteType === activeSection);
        const content = note?.description || '';
        
        setNoteContent(content);
        setLastEdited(note?.recordedAt ? new Date(note.recordedAt).toLocaleString() : null);

        if (editorRef.current && editorRef.current.innerHTML !== content) {
            editorRef.current.innerHTML = content;
        }
    }, [activeSection, appointmentId, clinicalNotes]);

    // --- Handlers ---
    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
        setNoteContent(e.currentTarget.innerHTML);
    };

    const execCommand = (command: string) => {
        document.execCommand(command, false, undefined);
        editorRef.current?.focus();
    };

    const handleSaveNote = () => {
        if (!appointmentId) return;
        saveClinicalNote({
            id: Date.now().toString(),
            appointmentId,
            noteType: activeSection,
            description: noteContent,
            recordedAt: new Date().toISOString()
        });
    };

    const handleEndEncounter = () => {
        if (!appointmentId) return;
        if (window.confirm('Are you sure you want to Complete and End this encounter?')) {
            updateAppointment(appointmentId, { status: 'Completed', checkOutTime: new Date().toISOString() });
            navigate('/doctor-workbench');
            showToast('success', 'Encounter ended successfully.');
        }
    };

    const handleCancelEncounter = () => {
        if (window.confirm('Close consultation without completing? Unsaved notes in the current editor may be lost.')) {
            navigate('/doctor-workbench');
        }
    };

    if (!appointment || !patient) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-slate-500 font-medium">Loading Patient Context...</p>
                </div>
            </div>
        );
    }

    const age = new Date().getFullYear() - new Date(patient.dob).getFullYear();

    return (
        // Main Container: Fixed Full Screen, No Window Scroll
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-100 font-sans text-sm overflow-hidden">
            
            {/* 1. TOP HEADER: System Info */}
            <div className="h-10 bg-white border-b border-slate-200 flex justify-between items-center px-4 shrink-0 shadow-sm z-20">
                <div className="flex items-center gap-2">
                    <div className="bg-blue-600 text-white font-bold px-2 py-0.5 rounded text-xs">EMR</div>
                    <h1 className="font-bold text-slate-700">Consultation Room</h1>
                </div>
                <div className="flex items-center text-xs text-slate-500 space-x-4">
                    <div className="flex items-center gap-1">
                        <User className="w-3 h-3" /> 
                        <span>Dr. {doctor?.lastName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Briefcase className="w-3 h-3" /> 
                        <span>{dept?.name}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-100">
                        <Clock className="w-3 h-3" />
                        <span>Started: {new Date().toLocaleTimeString()}</span>
                    </div>
                </div>
            </div>

            {/* 2. PATIENT BANNER: High Contrast */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-3 shrink-0 shadow-md z-20">
                <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center border border-white/20 shrink-0">
                        <span className="text-lg font-bold text-white">{patient.firstName[0]}{patient.lastName[0]}</span>
                    </div>

                    {/* Info Grid */}
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-6 gap-y-1 items-center">
                        <div>
                            <span className="text-slate-400 text-[10px] uppercase font-bold block">Patient Name</span>
                            <span className="font-medium text-sm truncate block" title={`${patient.firstName} ${patient.lastName}`}>
                                {patient.firstName} {patient.lastName}
                            </span>
                        </div>
                        <div>
                            <span className="text-slate-400 text-[10px] uppercase font-bold block">MRN / ID</span>
                            <span className="font-mono text-xs text-yellow-300 block">{patient.id.slice(0,8).toUpperCase()}</span>
                        </div>
                        <div>
                            <span className="text-slate-400 text-[10px] uppercase font-bold block">Demographics</span>
                            <span className="text-xs block">{age} Y / {patient.gender}</span>
                        </div>
                        <div>
                             <span className="text-slate-400 text-[10px] uppercase font-bold block">Contact</span>
                             <span className="text-xs block truncate">{patient.phone}</span>
                        </div>
                        <div className="md:col-span-2 lg:col-span-2">
                            <span className="text-slate-400 text-[10px] uppercase font-bold block">Active Package</span>
                            <span className="text-xs text-slate-300 italic block">No active insurance package linked</span>
                        </div>
                    </div>

                    {/* Quick Alerts */}
                    <div className="flex flex-col gap-1 shrink-0">
                        <button className="bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/50 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-colors">
                            <Bell className="w-3 h-3" /> Allergies
                        </button>
                        <button className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border border-blue-500/50 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-colors">
                            <Info className="w-3 h-3" /> Alerts
                        </button>
                    </div>
                </div>
            </div>

            {/* 3. TOOLBAR: Utility Ribbon */}
            <div className="bg-white border-b border-slate-200 px-2 py-1.5 flex gap-2 overflow-x-auto shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.05)] z-10">
                {TOP_TOOLS.map((tool) => (
                    <button 
                        key={tool.id}
                        className="flex flex-col items-center justify-center min-w-[80px] px-2 py-1.5 rounded hover:bg-slate-50 hover:text-blue-600 text-slate-600 transition-all active:scale-95 group"
                    >
                        <tool.icon className={`w-5 h-5 mb-1 ${tool.color} group-hover:scale-110 transition-transform`} />
                        <span className="text-[10px] font-bold">{tool.label}</span>
                    </button>
                ))}
            </div>

            {/* 4. MAIN WORKSPACE: Sidebar + Editor */}
            <div className="flex flex-1 overflow-hidden relative">
                
                {/* Sidebar Navigation */}
                <div className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col shrink-0">
                    <div className="p-3 bg-slate-100 border-b border-slate-200">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Clinical Sections</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {SIDEBAR_ITEMS.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveSection(item.id)}
                                className={`w-full text-left px-4 py-3 text-xs font-medium border-b border-slate-100 flex items-center justify-between transition-colors
                                    ${activeSection === item.id 
                                        ? 'bg-white text-blue-700 border-l-4 border-l-blue-600 shadow-sm z-10' 
                                        : 'text-slate-600 hover:bg-white hover:text-slate-900'
                                    }`}
                            >
                                {item.label}
                                {activeSection === item.id && <ChevronRight className="w-3.5 h-3.5" />}
                            </button>
                        ))}
                    </div>
                    {/* Status Checkboxes */}
                    <div className="p-4 bg-slate-100 border-t border-slate-200">
                        <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer mb-2">
                            <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                            <span>Mark as Confidential</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                            <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                            <span>Share with Patient</span>
                        </label>
                    </div>
                </div>

                {/* Editor Area */}
                <div className="flex-1 flex flex-col bg-white min-w-0">
                    
                    {/* Editor Header */}
                    <div className="h-10 bg-slate-50 border-b border-slate-200 flex items-center justify-between px-4 shrink-0">
                        <span className="font-bold text-slate-700 text-sm">{activeSection}</span>
                        <div className="text-[10px] text-slate-400">
                           {lastEdited ? `Last saved: ${lastEdited}` : 'Unsaved changes'}
                        </div>
                    </div>

                    {/* Formatting Toolbar */}
                    <div className="p-2 border-b border-slate-200 flex items-center gap-1 shrink-0 bg-white">
                        <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                            <button onClick={() => execCommand('bold')} className="p-1.5 hover:bg-white hover:shadow-sm rounded text-slate-700 transition-all" title="Bold">
                                <Bold className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => execCommand('italic')} className="p-1.5 hover:bg-white hover:shadow-sm rounded text-slate-700 transition-all" title="Italic">
                                <Italic className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => execCommand('underline')} className="p-1.5 hover:bg-white hover:shadow-sm rounded text-slate-700 transition-all" title="Underline">
                                <Underline className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <div className="w-px h-5 bg-slate-200 mx-1"></div>
                        <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                             <button onClick={() => execCommand('insertUnorderedList')} className="p-1.5 hover:bg-white hover:shadow-sm rounded text-slate-700 transition-all" title="Bullet List">
                                <List className="w-3.5 h-3.5" />
                            </button>
                            <button className="p-1.5 hover:bg-white hover:shadow-sm rounded text-slate-700 transition-all" title="Align Left">
                                <AlignLeft className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <div className="w-px h-5 bg-slate-200 mx-1"></div>
                         <button className="flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs font-medium text-slate-700 border border-slate-200 transition-colors">
                             <Type className="w-3.5 h-3.5" /> Insert Template
                         </button>
                    </div>

                    {/* Text Area */}
                    <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6 cursor-text" onClick={() => editorRef.current?.focus()}>
                        <div className="max-w-4xl mx-auto bg-white min-h-[500px] shadow-sm border border-slate-200 rounded-sm p-8">
                            <div
                                ref={editorRef}
                                contentEditable
                                onInput={handleInput}
                                className="w-full h-full outline-none text-sm text-slate-800 leading-relaxed whitespace-pre-wrap prose prose-sm prose-slate max-w-none empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400"
                                data-placeholder="Start typing clinical notes here..."
                            />
                        </div>
                    </div>

                    {/* Bottom Save Bar for Section */}
                    <div className="p-3 border-t border-slate-200 bg-white flex justify-between items-center shrink-0">
                         <div className="flex items-center gap-2">
                             <label className="text-xs text-slate-500 font-medium">Quick Template:</label>
                             <select className="text-xs border border-slate-300 rounded px-2 py-1 bg-slate-50 outline-none focus:border-blue-500">
                                 <option>Select...</option>
                                 <option>Normal Examination</option>
                                 <option>Follow-up Note</option>
                             </select>
                         </div>
                         <button 
                            onClick={handleSaveNote}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded text-xs font-bold shadow-sm flex items-center gap-2 transition-all"
                         >
                             <Save className="w-3.5 h-3.5" /> Save Section
                         </button>
                    </div>
                </div>
            </div>

            {/* 5. FOOTER: Global Actions */}
            <div className="h-14 bg-slate-100 border-t border-slate-300 flex items-center justify-between px-6 shrink-0 z-20">
                <div className="flex items-center gap-3">
                    <button className="text-slate-600 hover:text-blue-600 text-xs font-bold flex items-center gap-1 px-3 py-1.5 rounded hover:bg-white border border-transparent hover:border-slate-200 transition-all">
                        <Printer className="w-4 h-4" /> Print Rx
                    </button>
                    <button className="text-slate-600 hover:text-blue-600 text-xs font-bold flex items-center gap-1 px-3 py-1.5 rounded hover:bg-white border border-transparent hover:border-slate-200 transition-all">
                        <Download className="w-4 h-4" /> Download PDF
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleCancelEncounter}
                        className="text-slate-600 hover:text-red-600 text-xs font-bold flex items-center gap-1 px-4 py-2 rounded hover:bg-red-50 border border-transparent transition-all"
                    >
                        <XCircle className="w-4 h-4" /> Cancel
                    </button>
                    <button 
                        onClick={handleEndEncounter}
                        className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-6 py-2.5 rounded shadow-sm hover:shadow-md flex items-center gap-2 transition-all transform active:scale-95"
                    >
                        <Stethoscope className="w-4 h-4" /> Complete & End Encounter
                    </button>
                </div>
            </div>

        </div>
    );
};