import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { User, Info, Save, Printer, FileText, Bell, Activity, Stethoscope, Briefcase, Pill, Clock, AlertTriangle, FileInput, ChevronRight, X, ChevronDown, RefreshCw, Bold, Italic, Underline, List } from 'lucide-react';
import { ClinicalNote } from '../types';

const SIDEBAR_ITEMS = [
    { id: 'Chief Complaint', label: 'Chief Complaint' },
    { id: 'Past History', label: 'Past History' },
    { id: 'Family History', label: 'Family History' },
    { id: 'Medication History', label: 'Medication History' },
    { id: 'History of Present Illness', label: 'History of Present Illness' },
    { id: 'Significant Sign', label: 'Significant Sign' },
    { id: 'Treatment Desc', label: 'Treatment Desc' },
    { id: 'Treatment Plan', label: 'Treatment Plan' },
    { id: 'Remark', label: 'Remark' },
];

const TOP_BUTTONS = [
    { id: 'Allergy', label: 'Allergy(F8)', icon: Bell },
    { id: 'Vital Sign', label: 'Vital Sign(F7)', icon: Activity },
    { id: 'Encounter', label: 'Encounter(F4)', icon: Stethoscope },
    { id: 'EMR', label: 'EMR', icon: FileText },
    { id: 'Referral', label: 'Referral', icon: Briefcase },
    { id: 'Diagnosis', label: 'Diagnosis(F5)', icon: Info },
    { id: 'Patient Form', label: 'Patient Form', icon: FileInput },
    { id: 'Orders', label: 'Orders(F3)', icon: FileText },
    { id: 'Documents', label: 'Documents', icon: FileText },
    { id: 'Patient Signed Form', label: 'Patient Signed Form', icon: FileText },
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

    // Load note for active section
    useEffect(() => {
        if (!appointmentId) return;
        const note = clinicalNotes.find(n => n.appointmentId === appointmentId && n.noteType === activeSection);
        const content = note?.description || '';
        
        // Update state
        setNoteContent(content);
        setLastEdited(note?.recordedAt ? new Date(note.recordedAt).toLocaleString() : null);

        // Update editor HTML if it differs to avoid cursor jumps on simple re-renders, 
        // but ensure we update on section switch.
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
        updateAppointment(appointmentId, { status: 'Completed', checkOutTime: new Date().toISOString() });
        navigate('/doctor-workbench');
        showToast('success', 'Encounter ended successfully.');
    };

    const handleCancelEncounter = () => {
        if (window.confirm('Are you sure you want to cancel this encounter? Unsaved changes may be lost.')) {
            navigate('/doctor-workbench');
        }
    };

    if (!appointment || !patient) {
        return <div className="p-8 text-center text-slate-500">Loading consultation details...</div>;
    }

    const age = new Date().getFullYear() - new Date(patient.dob).getFullYear();

    return (
        <div className="flex flex-col h-screen bg-slate-100 overflow-hidden -m-6 fixed inset-0 z-50">
            {/* Header */}
            <div className="h-14 bg-white border-b flex justify-between items-center px-4 shrink-0">
                <h1 className="font-bold text-lg text-slate-800">Start Consultation</h1>
                <div className="flex items-center text-xs font-medium text-slate-600 space-x-4">
                    <span><strong>Consultant:</strong> Dr {doctor?.firstName} {doctor?.lastName}</span>
                    <span><strong>Dept:</strong> {dept?.name}</span>
                    <span><strong>Start:</strong> {new Date().toLocaleString()}</span>
                    <span className="bg-slate-200 px-2 py-1 rounded flex items-center"><Clock className="w-3 h-3 mr-1"/> 20:04</span>
                </div>
            </div>

            {/* Patient Banner */}
            <div className="bg-[#00aaff] text-white px-4 py-2 flex items-start gap-4 shrink-0 shadow-md">
                <div className="w-12 h-12 bg-white rounded-lg overflow-hidden border-2 border-white/50 shrink-0">
                    <User className="w-full h-full text-slate-300 p-1" />
                </div>
                <div className="flex-1 text-sm space-y-1">
                    <div className="flex flex-wrap gap-x-6 gap-y-1 font-medium">
                        <span><strong>MRNO:</strong> {patient.id.slice(0, 12).toUpperCase()}</span>
                        <span><strong>Name:</strong> {patient.firstName} {patient.lastName}</span>
                        <span><strong>Gender:</strong> {patient.gender.toUpperCase()}</span>
                        <span><strong>Age:</strong> {age} Years</span>
                        <span><strong>Phone:</strong> {patient.phone}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs opacity-90">
                        <span><strong>Last Seen By:</strong> Dr {doctor?.firstName} {doctor?.lastName}</span>
                        <span><strong>Visit No:</strong> {appointment.id.slice(-6)}</span>
                        <span><strong>Code Status:</strong> Allergy/Immunology</span>
                    </div>
                    <div className="text-xs opacity-80 pt-1 border-t border-white/20 mt-1">
                        <strong>Package Status:</strong> No Active Package
                    </div>
                </div>
                <div className="flex flex-col gap-1">
                    <button className="p-1 hover:bg-white/20 rounded"><Pill className="w-4 h-4" /></button>
                    <button className="p-1 hover:bg-white/20 rounded"><Info className="w-4 h-4" /></button>
                </div>
            </div>

            {/* Top Toolbar */}
            <div className="bg-[#0088cc] flex overflow-x-auto text-white text-xs font-medium shadow-inner shrink-0">
                {TOP_BUTTONS.map(btn => (
                    <button key={btn.id} className="flex items-center px-4 py-2 hover:bg-white/10 border-r border-white/10 whitespace-nowrap transition-colors">
                        <btn.icon className="w-4 h-4 mr-2" />
                        {btn.label}
                    </button>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar Navigation */}
                <div className="w-64 bg-[#23cba7] flex flex-col shrink-0 overflow-y-auto">
                    {SIDEBAR_ITEMS.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveSection(item.id)}
                            className={`px-4 py-3 text-left text-sm font-medium border-b border-white/10 transition-colors flex items-center justify-between ${
                                activeSection === item.id 
                                ? 'bg-[#1b9e82] text-white shadow-inner border-l-4 border-l-white' 
                                : 'text-white hover:bg-[#1b9e82]/50'
                            }`}
                        >
                            {item.label}
                            {activeSection === item.id && <ChevronRight className="w-4 h-4 opacity-75" />}
                        </button>
                    ))}
                    {/* Checkbox Mimic */}
                    <div className="mt-auto p-2">
                        {['PUB', 'CON'].map(opt => (
                            <div key={opt} className="flex items-center text-white text-xs mb-1 px-2">
                                <input type="checkbox" className="mr-2" defaultChecked /> {opt}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Editor Area */}
                <div className="flex-1 bg-white flex flex-col min-w-0">
                    {/* Section Header */}
                    <div className="bg-[#006699] text-white px-4 py-2 text-sm font-bold flex justify-between items-center shadow-sm shrink-0">
                        <span>{activeSection}</span>
                        <ChevronDown className="w-4 h-4" />
                    </div>

                    {/* Editor Toolbar */}
                    <div className="border-b border-slate-200 p-2 flex items-center gap-2 bg-slate-50 text-xs shrink-0 select-none">
                        <div className="font-bold text-blue-800 flex items-center cursor-pointer hover:bg-slate-200 px-2 py-1 rounded">
                            Select Field <ChevronDown className="w-3 h-3 ml-1" />
                        </div>
                        
                        <div className="w-px h-5 bg-slate-300 mx-2"></div>
                        
                        <div className="flex items-center gap-1">
                            <button 
                                onClick={() => execCommand('bold')} 
                                className="p-1.5 hover:bg-slate-200 rounded text-slate-600 transition-colors" 
                                title="Bold (Ctrl+B)"
                            >
                                <Bold size={16} />
                            </button>
                            <button 
                                onClick={() => execCommand('italic')} 
                                className="p-1.5 hover:bg-slate-200 rounded text-slate-600 transition-colors" 
                                title="Italic (Ctrl+I)"
                            >
                                <Italic size={16} />
                            </button>
                            <button 
                                onClick={() => execCommand('underline')} 
                                className="p-1.5 hover:bg-slate-200 rounded text-slate-600 transition-colors" 
                                title="Underline (Ctrl+U)"
                            >
                                <Underline size={16} />
                            </button>
                            <button 
                                onClick={() => execCommand('insertUnorderedList')} 
                                className="p-1.5 hover:bg-slate-200 rounded text-slate-600 transition-colors" 
                                title="Bullet List"
                            >
                                <List size={16} />
                            </button>
                        </div>
                        
                        <div className="w-px h-5 bg-slate-300 mx-2"></div>
                        
                        <div className="flex-1 text-center font-bold text-slate-600">Description</div>
                    </div>

                    {/* Rich Text Editor Area */}
                    <div 
                        className="flex-1 p-4 overflow-auto bg-slate-50/30 cursor-text" 
                        onClick={() => editorRef.current?.focus()}
                    >
                        <div
                            ref={editorRef}
                            contentEditable
                            onInput={handleInput}
                            className="w-full min-h-full border border-slate-300 rounded p-4 text-sm text-slate-800 leading-relaxed focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white shadow-inner prose prose-sm max-w-none"
                            style={{ minHeight: '300px' }}
                            data-placeholder={`Enter ${activeSection} here...`}
                        />
                    </div>

                    {/* Editor Footer / Info */}
                    <div className="px-4 py-2 text-[10px] text-slate-500 border-t border-slate-200 bg-white shrink-0 italic">
                        {lastEdited ? (
                            <span>Last Edited by Dr. {doctor?.firstName} {doctor?.lastName} on {lastEdited}</span>
                        ) : (
                            <span>Not edited yet</span>
                        )}
                    </div>

                    {/* Template Controls */}
                    <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center gap-2 shrink-0">
                        <label className="text-xs font-bold text-slate-600">Templates:</label>
                        <select className="border border-slate-300 rounded px-2 py-1 text-xs w-40 bg-white">
                            <option>-- Select --</option>
                            <option>Normal Visit</option>
                            <option>Follow Up</option>
                        </select>
                        <input className="border border-slate-300 rounded px-2 py-1 text-xs w-40 bg-[#1e5c46] text-white placeholder-white/70" placeholder="Template Name" />
                        <button className="bg-slate-300 text-slate-700 px-3 py-1 rounded text-xs font-bold border border-slate-400 hover:bg-slate-400">Save Template</button>
                        <button className="bg-slate-300 text-slate-700 px-3 py-1 rounded text-xs font-bold border border-slate-400 hover:bg-slate-400">Clear & Reset</button>
                        
                        <div className="ml-auto flex gap-2">
                            <button 
                                onClick={handleSaveNote}
                                className="bg-slate-400 text-white px-4 py-1 rounded text-xs font-bold hover:bg-slate-500 flex items-center shadow-sm"
                            >
                                <Save className="w-3 h-3 mr-1" /> Update
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="bg-[#22b9cd] p-2 flex justify-end gap-2 shrink-0 shadow-lg border-t border-white/20">
                <button className="bg-[#17a2b8] hover:bg-[#138496] text-white px-4 py-1.5 rounded text-xs font-bold shadow transition-colors border border-white/20">Pharmacy</button>
                <button className="bg-[#17a2b8] hover:bg-[#138496] text-white px-4 py-1.5 rounded text-xs font-bold shadow transition-colors border border-white/20">Print Orders</button>
                <button 
                    onClick={handleEndEncounter}
                    className="bg-[#17a2b8] hover:bg-[#138496] text-white px-4 py-1.5 rounded text-xs font-bold shadow transition-colors border border-white/20"
                >
                    End Encounter
                </button>
                <button className="bg-[#17a2b8] hover:bg-[#138496] text-white px-4 py-1.5 rounded text-xs font-bold shadow transition-colors border border-white/20">Download As PDF</button>
                <button 
                    onClick={handleCancelEncounter}
                    className="bg-[#17a2b8] hover:bg-[#138496] text-white px-4 py-1.5 rounded text-xs font-bold shadow transition-colors border border-white/20"
                >
                    Cancel Encounter
                </button>
            </div>
        </div>
    );
};
