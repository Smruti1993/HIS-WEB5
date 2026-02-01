import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { DatePicker } from '../components/DatePicker';
import { User, Activity, FileText, FlaskConical, Stethoscope, Microscope, X, Calendar, AlertTriangle, ChevronRight } from 'lucide-react';
import { Appointment } from '../types';
import { useNavigate } from 'react-router-dom';

const EMRModal = ({ patientId, onClose }: { patientId: string, onClose: () => void }) => {
    const { patients, appointments, vitals, diagnoses, clinicalNotes, allergies, employees, departments } = useData();
    const [activeTab, setActiveTab] = useState('Overview');

    const patient = patients.find(p => p.id === patientId);
    if (!patient) return null;

    // Filter Data
    const patientApts = appointments.filter(a => a.patientId === patientId).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const aptIds = patientApts.map(a => a.id);
    
    const patientVitals = vitals.filter(v => aptIds.includes(v.appointmentId)).sort((a,b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
    const patientDiagnoses = diagnoses.filter(d => aptIds.includes(d.appointmentId)).sort((a,b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
    const patientNotes = clinicalNotes.filter(n => aptIds.includes(n.appointmentId)).sort((a,b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
    const patientAllergies = allergies.filter(a => a.patientId === patientId);

    const getDocName = (id: string) => {
        const doc = employees.find(e => e.id === id);
        return doc ? `Dr. ${doc.firstName} ${doc.lastName}` : 'Unknown';
    };

    const getDeptName = (id: string) => {
        const d = departments.find(dept => dept.id === id);
        return d ? d.name : '-';
    };

    const age = new Date().getFullYear() - new Date(patient.dob).getFullYear();

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
             <div className="bg-white w-full max-w-6xl h-[85vh] rounded-2xl shadow-2xl flex overflow-hidden border border-slate-200">
                {/* Sidebar */}
                <div className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col shrink-0">
                    {/* Patient Info */}
                    <div className="p-6 border-b border-slate-200 bg-white">
                         <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-3 flex items-center justify-center text-blue-600 border-2 border-blue-50">
                            <User className="w-8 h-8" />
                         </div>
                         <h3 className="text-center font-bold text-slate-800 text-lg">{patient.firstName} {patient.lastName}</h3>
                         <div className="text-center text-xs text-slate-500 mt-1">{patient.gender.toUpperCase()} • {age} Years</div>
                         <div className="text-center text-xs text-slate-400 mt-1 font-mono">ID: {patient.id.slice(-6).toUpperCase()}</div>
                    </div>
                    {/* Nav */}
                    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                        {['Overview', 'Clinical Notes', 'Vitals History', 'Visit History', 'Allergies'].map(t => (
                            <button 
                                key={t} 
                                onClick={() => setActiveTab(t)}
                                className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                                    activeTab === t 
                                    ? 'bg-blue-600 text-white shadow-md' 
                                    : 'text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                {t}
                                {activeTab === t && <ChevronRight className="w-4 h-4 opacity-75" />}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col min-w-0 bg-slate-50/30">
                    <div className="h-16 border-b border-slate-200 flex items-center justify-between px-8 bg-white shrink-0">
                        <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <h2 className="text-xl font-bold text-slate-800">Electronic Medical Record</h2>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8">
                        {/* OVERVIEW TAB */}
                        {activeTab === 'Overview' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                                        <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Last Visit</div>
                                        <div className="font-bold text-slate-800 text-lg">
                                            {patientApts[0] ? new Date(patientApts[0].date).toLocaleDateString() : 'N/A'}
                                        </div>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                                        <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Total Visits</div>
                                        <div className="font-bold text-slate-800 text-lg">{patientApts.length}</div>
                                    </div>
                                    <div className={`p-4 rounded-xl shadow-sm border ${patientAllergies.length > 0 ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                                        <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${patientAllergies.length > 0 ? 'text-red-600' : 'text-green-600'}`}>Active Allergies</div>
                                        <div className={`font-bold text-lg ${patientAllergies.length > 0 ? 'text-red-700' : 'text-green-700'}`}>{patientAllergies.length}</div>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                                        <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Last BP</div>
                                        <div className="font-bold text-slate-800 text-lg">
                                            {patientVitals[0] ? `${patientVitals[0].bpSystolic}/${patientVitals[0].bpDiastolic}` : '-'}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                                        <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                            <Activity className="w-4 h-4 text-blue-500" /> Recent Vitals
                                        </h4>
                                        {patientVitals.length > 0 ? (
                                            <div className="space-y-3">
                                                {patientVitals.slice(0, 3).map((v, i) => (
                                                    <div key={i} className="flex justify-between items-center text-sm border-b border-slate-50 pb-2 last:border-0">
                                                        <span className="text-slate-500">{new Date(v.recordedAt).toLocaleDateString()}</span>
                                                        <span className="font-medium">BP: {v.bpSystolic}/{v.bpDiastolic} &bull; HR: {v.pulse} &bull; T: {v.temperature}°C</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : <div className="text-slate-400 text-sm italic">No vitals recorded.</div>}
                                    </div>

                                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                                        <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4 text-orange-500" /> Recent Diagnosis
                                        </h4>
                                        {patientDiagnoses.length > 0 ? (
                                            <div className="space-y-3">
                                                {patientDiagnoses.slice(0, 3).map((d, i) => (
                                                    <div key={i} className="flex justify-between items-center text-sm border-b border-slate-50 pb-2 last:border-0">
                                                        <span className="font-medium text-slate-800">{d.description}</span>
                                                        <span className="text-xs px-2 py-0.5 bg-slate-100 rounded text-slate-500">{d.type}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : <div className="text-slate-400 text-sm italic">No diagnosis recorded.</div>}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* CLINICAL NOTES TAB */}
                        {activeTab === 'Clinical Notes' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                {patientNotes.length === 0 ? (
                                    <div className="text-center py-10 text-slate-400">No clinical notes found.</div>
                                ) : (
                                    patientNotes.map((note, idx) => {
                                        const apt = patientApts.find(a => a.id === note.appointmentId);
                                        return (
                                            <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                                <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-3 h-3 text-slate-400" />
                                                        <span className="text-xs font-bold text-slate-600">
                                                            {new Date(note.recordedAt).toLocaleString()}
                                                        </span>
                                                        <span className="text-slate-300">|</span>
                                                        <span className="text-xs font-medium text-blue-600">{note.noteType}</span>
                                                    </div>
                                                    <span className="text-xs text-slate-400">{getDocName(apt?.doctorId || '')}</span>
                                                </div>
                                                <div className="p-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{__html: note.description}} />
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}

                        {/* VITALS HISTORY TAB */}
                        {activeTab === 'Vitals History' && (
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500">
                                        <tr>
                                            <th className="px-6 py-3 font-semibold">Date & Time</th>
                                            <th className="px-6 py-3 font-semibold">BP (mmHg)</th>
                                            <th className="px-6 py-3 font-semibold">Pulse (bpm)</th>
                                            <th className="px-6 py-3 font-semibold">Temp (°C)</th>
                                            <th className="px-6 py-3 font-semibold">SpO2 (%)</th>
                                            <th className="px-6 py-3 font-semibold">Weight (kg)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {patientVitals.length === 0 ? (
                                            <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">No vitals recorded.</td></tr>
                                        ) : (
                                            patientVitals.map(v => (
                                                <tr key={v.id} className="hover:bg-slate-50">
                                                    <td className="px-6 py-4">{new Date(v.recordedAt).toLocaleString()}</td>
                                                    <td className="px-6 py-4">{v.bpSystolic}/{v.bpDiastolic}</td>
                                                    <td className="px-6 py-4">{v.pulse}</td>
                                                    <td className="px-6 py-4">{v.temperature}</td>
                                                    <td className="px-6 py-4">{v.spo2}%</td>
                                                    <td className="px-6 py-4">{v.weight}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* VISIT HISTORY TAB */}
                        {activeTab === 'Visit History' && (
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500">
                                        <tr>
                                            <th className="px-6 py-3 font-semibold">Date</th>
                                            <th className="px-6 py-3 font-semibold">Doctor</th>
                                            <th className="px-6 py-3 font-semibold">Department</th>
                                            <th className="px-6 py-3 font-semibold">Status</th>
                                            <th className="px-6 py-3 font-semibold">Type</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {patientApts.map(apt => (
                                            <tr key={apt.id} className="hover:bg-slate-50">
                                                <td className="px-6 py-4 font-medium">{new Date(apt.date).toLocaleDateString()}</td>
                                                <td className="px-6 py-4">{getDocName(apt.doctorId)}</td>
                                                <td className="px-6 py-4">{getDeptName(apt.departmentId)}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                                                        apt.status === 'Completed' ? 'bg-green-100 text-green-700' : 
                                                        apt.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                        {apt.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-slate-500">{apt.visitType || 'New Visit'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* ALLERGIES TAB */}
                        {activeTab === 'Allergies' && (
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500">
                                        <tr>
                                            <th className="px-6 py-3 font-semibold">Allergen</th>
                                            <th className="px-6 py-3 font-semibold">Severity</th>
                                            <th className="px-6 py-3 font-semibold">Reaction</th>
                                            <th className="px-6 py-3 font-semibold">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {patientAllergies.length === 0 ? (
                                            <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400">No allergies recorded.</td></tr>
                                        ) : (
                                            patientAllergies.map(al => (
                                                <tr key={al.id} className="hover:bg-slate-50">
                                                    <td className="px-6 py-4 font-bold text-slate-700">{al.allergen}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                            al.severity === 'Severe' ? 'bg-red-100 text-red-700' :
                                                            al.severity === 'Moderate' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                            {al.severity}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">{al.reaction}</td>
                                                    <td className="px-6 py-4 text-slate-500">{al.status}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
             </div>
        </div>
    );
};

export const DoctorWorkbench = () => {
  const { appointments, patients, vitals, diagnoses, saveVitalSign, updateAppointment, bills } = useData();
  const navigate = useNavigate();

  // --- EMR State ---
  const [showEMR, setShowEMR] = useState(false);
  const [emrPatientId, setEmrPatientId] = useState<string | null>(null);

  // --- Filter State ---
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState<'Outpatient' | 'Referral' | 'My Appointments'>('Outpatient');
  const [subTab, setSubTab] = useState<'Checked-In' | 'Checked-Out' | 'All'>('Checked-In');

  // --- Vitals Modal ---
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [vitalsForm, setVitalsForm] = useState({
      bpSystolic: '', bpDiastolic: '', temperature: '', pulse: '', weight: '', height: '', spo2: ''
  });

  // --- Filtering Logic ---
  const filteredAppointments = appointments.filter(apt => {
      const isDateMatch = apt.date === visitDate;
      
      // Sub-tab logic based on status
      let isStatusMatch = true;
      if (subTab === 'Checked-In') isStatusMatch = ['Checked-In', 'In-Consultation', 'Scheduled'].includes(apt.status);
      else if (subTab === 'Checked-Out') isStatusMatch = ['Completed', 'Checked-Out'].includes(apt.status);
      
      return isDateMatch && isStatusMatch;
  });

  const getPatientBalance = (patientId: string) => {
      const patientBills = bills.filter(b => b.patientId === patientId);
      const total = patientBills.reduce((acc, b) => acc + b.totalAmount, 0);
      const paid = patientBills.reduce((acc, b) => acc + b.paidAmount, 0);
      return total - paid;
  };

  const getLatestVitals = (aptId: string) => {
      return vitals.filter(v => v.appointmentId === aptId).sort((a,b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())[0];
  };

  const getDiagnoses = (aptId: string) => {
      return diagnoses.filter(d => d.appointmentId === aptId).map(d => d.description).join(', ');
  };

  const handleCaptureVitals = (apt: Appointment) => {
      setSelectedAppointment(apt);
      setVitalsForm({ bpSystolic: '', bpDiastolic: '', temperature: '', pulse: '', weight: '', height: '', spo2: '' });
      setShowVitalsModal(true);
  };

  const submitVitals = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedAppointment) return;

      saveVitalSign({
          id: Date.now().toString(),
          appointmentId: selectedAppointment.id,
          recordedAt: new Date().toISOString(),
          bpSystolic: Number(vitalsForm.bpSystolic),
          bpDiastolic: Number(vitalsForm.bpDiastolic),
          temperature: Number(vitalsForm.temperature),
          pulse: Number(vitalsForm.pulse),
          weight: Number(vitalsForm.weight),
          height: Number(vitalsForm.height),
          spo2: Number(vitalsForm.spo2)
      });
      
      // Auto update status to In-Consultation if strictly Checked-In
      if (selectedAppointment.status === 'Checked-In' || selectedAppointment.status === 'Scheduled') {
          updateAppointment(selectedAppointment.id, { status: 'In-Consultation' });
      }

      setShowVitalsModal(false);
  };

  const handleSelectPatient = (apt: Appointment) => {
      if (apt.status === 'Scheduled') {
          updateAppointment(apt.id, { status: 'Checked-In', checkInTime: new Date().toISOString() });
      }
      navigate(`/consultation/${apt.id}`);
  };

  const handleOpenEMR = (patientId: string) => {
      setEmrPatientId(patientId);
      setShowEMR(true);
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 -m-6 p-4 overflow-hidden">
      
      {/* Top Tabs */}
      <div className="flex bg-cyan-600 text-white rounded-t-lg overflow-hidden shrink-0">
          {['Outpatient', 'Referral', 'My Appointments'].map(tab => (
              <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`flex-1 py-3 font-bold text-center border-r border-cyan-700 transition-colors ${activeTab === tab ? 'bg-cyan-800 shadow-inner' : 'hover:bg-cyan-700'}`}
              >
                  {tab}
              </button>
          ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-white border-x border-slate-300 p-3 flex items-end gap-4 shadow-sm shrink-0">
          <div className="w-48">
              <label className="block text-xs font-bold text-slate-600 mb-1">Search Criteria</label>
              <div className="relative">
                  <select className="w-full border border-slate-300 rounded px-2 py-1 text-sm bg-slate-50">
                      <option>Visit Date</option>
                  </select>
              </div>
          </div>
          <div className="w-24">
              <select className="w-full border border-slate-300 rounded px-2 py-1 text-sm bg-slate-50">
                  <option>Equal to</option>
              </select>
          </div>
          <div className="w-40">
              <DatePicker value={visitDate} onChange={setVisitDate} />
          </div>
          <div className="flex gap-2">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded text-sm font-bold shadow-sm">Search</button>
              <button className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-1.5 rounded text-sm font-bold shadow-sm">Clear</button>
          </div>
          
          <div className="ml-auto flex items-center gap-2">
              <label className="text-xs font-bold text-slate-600">Save Search as</label>
              <input className="border border-slate-300 rounded px-2 py-1 text-sm w-32" />
              <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm">Save</button>
          </div>
      </div>

      {/* Status Sub-Tabs */}
      <div className="bg-blue-100/50 border-x border-slate-300 p-2 flex gap-1 shrink-0">
          {['Checked-In', 'Checked-Out', 'All Patients'].map(st => {
             const key = st.split(' ')[0] as any;
             return (
              <button 
                  key={st} 
                  onClick={() => setSubTab(key)}
                  className={`px-4 py-1 text-sm font-bold rounded-t-lg border border-b-0 transition-all ${subTab === key ? 'bg-blue-200 border-blue-300 text-blue-900' : 'bg-slate-50 border-transparent text-slate-500 hover:bg-white'}`}
              >
                  {st.toUpperCase()}
              </button>
             );
          })}
      </div>

      {/* Info Bar */}
      <div className="bg-blue-50 border border-blue-200 px-4 py-1 text-xs text-blue-800 font-medium italic shrink-0">
          Appointment details from {new Date(visitDate).toLocaleDateString()} • [Checked-In: {filteredAppointments.filter(a => a.status === 'Checked-In').length}] • [Consultation: {filteredAppointments.filter(a => a.status === 'In-Consultation').length}]
      </div>

      {/* Patient List (The Grid) */}
      <div className="flex-1 overflow-auto border border-slate-300 bg-white">
          <table className="w-full text-left border-collapse">
              <thead className="bg-slate-200 text-slate-700 text-xs uppercase sticky top-0 z-10 shadow-sm">
                  <tr>
                      <th className="p-2 border-r border-slate-300 w-16 text-center">Photo</th>
                      <th className="p-2 border-r border-slate-300 w-1/4">Patient Details</th>
                      <th className="p-2 border-r border-slate-300 w-12 text-center">EMR</th>
                      <th className="p-2 border-r border-slate-300 w-32">Remarks</th>
                      <th className="p-2 border-r border-slate-300 w-16 text-center">Action</th>
                      <th className="p-2 border-r border-slate-300 w-24 text-right">Balance</th>
                      <th className="p-2 border-r border-slate-300">Diagnosis</th>
                      <th className="p-2 border-r border-slate-300 w-24 text-center">Vital</th>
                      <th className="p-2 border-r border-slate-300 w-12 text-center">LAB</th>
                      <th className="p-2 border-r border-slate-300 w-12 text-center">RAD</th>
                      <th className="p-2 w-12 text-center">Proc</th>
                  </tr>
              </thead>
              <tbody className="text-sm">
                  {filteredAppointments.length === 0 ? (
                      <tr>
                          <td colSpan={11} className="p-12 text-center text-slate-400 italic">No patients found for this criteria.</td>
                      </tr>
                  ) : (
                      filteredAppointments.map((apt, idx) => {
                          const patient = patients.find(p => p.id === apt.patientId);
                          const balance = getPatientBalance(apt.patientId);
                          const latestVitals = getLatestVitals(apt.id);
                          const diagnosisText = getDiagnoses(apt.id);
                          const age = patient ? new Date().getFullYear() - new Date(patient.dob).getFullYear() : 0;
                          
                          // Alternating row colors similar to screenshot (Greenish/Yellowish)
                          const rowClass = idx % 2 === 0 ? 'bg-[#ebfadc]' : 'bg-[#eafaea]'; // Light green variants

                          return (
                              <tr key={apt.id} className={`${rowClass} border-b border-slate-200 hover:brightness-95 transition-all`}>
                                  <td className="p-2 border-r border-slate-200 text-center align-top">
                                      <div className="w-12 h-12 bg-amber-200 rounded-lg mx-auto overflow-hidden border border-amber-300 shadow-sm">
                                          <User className="w-full h-full text-amber-600 p-1 opacity-50" />
                                      </div>
                                  </td>
                                  <td className="p-2 border-r border-slate-200 align-top">
                                      <div className="font-bold text-slate-800 text-sm">{patient?.firstName} {patient?.lastName}</div>
                                      <div className="text-xs text-slate-600 font-mono mt-0.5">ID: {patient?.id.slice(-8).toUpperCase()}</div>
                                      <div className="text-xs text-slate-500 mt-1">
                                          {patient?.gender.toUpperCase()} - {age} Yrs - {apt.paymentMode || 'CASH'}
                                      </div>
                                      <div className="text-[10px] text-slate-400 mt-1">
                                          {apt.visitType || 'New Visit'} | Nurse: Pending
                                      </div>
                                  </td>
                                  <td className="p-2 border-r border-slate-200 text-center align-middle">
                                      <button 
                                          onClick={() => handleOpenEMR(apt.patientId)}
                                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded-full transition-colors"
                                          title="View EMR"
                                      >
                                          <FileText className="w-5 h-5 mx-auto" />
                                      </button>
                                  </td>
                                  <td className="p-2 border-r border-slate-200 align-top text-xs text-slate-600 italic">
                                      {apt.notes || '-'}
                                  </td>
                                  <td className="p-2 border-r border-slate-200 text-center align-middle">
                                      <button 
                                          onClick={() => handleSelectPatient(apt)}
                                          className="text-xs font-bold underline text-slate-800 hover:text-blue-700"
                                      >
                                          Select
                                      </button>
                                  </td>
                                  <td className="p-2 border-r border-slate-200 text-right align-middle font-mono font-medium text-slate-700">
                                      {balance > 0 ? <span className="text-red-600">{balance.toFixed(2)}</span> : <span className="text-green-600">0.00</span>}
                                  </td>
                                  <td className="p-2 border-r border-slate-200 align-top text-xs">
                                      {diagnosisText || <span className="text-slate-400 italic">No diagnosis</span>}
                                  </td>
                                  <td className="p-2 border-r border-slate-200 text-center align-middle">
                                      <div className="flex flex-col items-center">
                                          {latestVitals ? (
                                              <div className="group relative">
                                                  <div className="w-4 h-4 bg-green-500 rounded-full shadow-sm cursor-pointer border border-white"></div>
                                                  <span className="text-[10px] mt-1 text-slate-500">{new Date(latestVitals.recordedAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                                  {/* Tooltip */}
                                                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-800 text-white text-xs p-2 rounded z-50 whitespace-nowrap">
                                                      BP: {latestVitals.bpSystolic}/{latestVitals.bpDiastolic} | T: {latestVitals.temperature}°C
                                                  </div>
                                              </div>
                                          ) : (
                                              <button 
                                                  onClick={() => handleCaptureVitals(apt)}
                                                  className="w-4 h-4 bg-red-500 rounded-full shadow-sm animate-pulse border border-white" 
                                                  title="Capture Vitals"
                                              />
                                          )}
                                      </div>
                                  </td>
                                  <td className="p-2 border-r border-slate-200 text-center align-middle">
                                      <FlaskConical className="w-5 h-5 text-blue-400 mx-auto opacity-50" />
                                  </td>
                                  <td className="p-2 border-r border-slate-200 text-center align-middle">
                                      <Microscope className="w-5 h-5 text-purple-400 mx-auto opacity-50" />
                                  </td>
                                  <td className="p-2 text-center align-middle">
                                      <Stethoscope className="w-5 h-5 text-teal-400 mx-auto opacity-50" />
                                  </td>
                              </tr>
                          );
                      })
                  )}
              </tbody>
          </table>
      </div>

      {/* Vitals Modal */}
      {showVitalsModal && selectedAppointment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 m-4 animate-in zoom-in-95">
                  <div className="flex justify-between items-center mb-6 border-b pb-4">
                      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                          <Activity className="w-5 h-5 text-red-500" /> Capture Vitals
                      </h3>
                      <button onClick={() => setShowVitalsModal(false)}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
                  </div>

                  <form onSubmit={submitVitals} className="grid grid-cols-2 gap-4">
                      <div className="col-span-2 grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200 mb-2">
                          <div>
                              <label className="text-xs font-bold text-slate-500 uppercase">BP Systolic</label>
                              <div className="flex items-center">
                                <input type="number" required className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-sm outline-none focus:border-blue-500" placeholder="120"
                                    value={vitalsForm.bpSystolic} onChange={e => setVitalsForm({...vitalsForm, bpSystolic: e.target.value})}
                                />
                                <span className="ml-1 text-xs text-slate-400">mmHg</span>
                              </div>
                          </div>
                          <div>
                              <label className="text-xs font-bold text-slate-500 uppercase">BP Diastolic</label>
                              <div className="flex items-center">
                                <input type="number" required className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-sm outline-none focus:border-blue-500" placeholder="80"
                                    value={vitalsForm.bpDiastolic} onChange={e => setVitalsForm({...vitalsForm, bpDiastolic: e.target.value})}
                                />
                                <span className="ml-1 text-xs text-slate-400">mmHg</span>
                              </div>
                          </div>
                      </div>

                      <div>
                          <label className="text-xs font-bold text-slate-500 uppercase">Temperature</label>
                          <div className="flex items-center">
                            <input type="number" step="0.1" required className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-sm outline-none focus:border-blue-500" placeholder="37.0"
                                value={vitalsForm.temperature} onChange={e => setVitalsForm({...vitalsForm, temperature: e.target.value})}
                            />
                            <span className="ml-1 text-xs text-slate-400">°C</span>
                          </div>
                      </div>

                      <div>
                          <label className="text-xs font-bold text-slate-500 uppercase">Pulse</label>
                          <div className="flex items-center">
                            <input type="number" required className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-sm outline-none focus:border-blue-500" placeholder="72"
                                value={vitalsForm.pulse} onChange={e => setVitalsForm({...vitalsForm, pulse: e.target.value})}
                            />
                            <span className="ml-1 text-xs text-slate-400">bpm</span>
                          </div>
                      </div>

                      <div>
                          <label className="text-xs font-bold text-slate-500 uppercase">SpO2</label>
                          <div className="flex items-center">
                            <input type="number" required className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-sm outline-none focus:border-blue-500" placeholder="98"
                                value={vitalsForm.spo2} onChange={e => setVitalsForm({...vitalsForm, spo2: e.target.value})}
                            />
                            <span className="ml-1 text-xs text-slate-400">%</span>
                          </div>
                      </div>

                      <div className="col-span-2 grid grid-cols-2 gap-4 mt-2">
                           <div>
                              <label className="text-xs font-bold text-slate-500 uppercase">Height</label>
                              <div className="flex items-center">
                                <input type="number" className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-sm outline-none focus:border-blue-500" placeholder="cm"
                                    value={vitalsForm.height} onChange={e => setVitalsForm({...vitalsForm, height: e.target.value})}
                                />
                              </div>
                          </div>
                          <div>
                              <label className="text-xs font-bold text-slate-500 uppercase">Weight</label>
                              <div className="flex items-center">
                                <input type="number" className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-sm outline-none focus:border-blue-500" placeholder="kg"
                                    value={vitalsForm.weight} onChange={e => setVitalsForm({...vitalsForm, weight: e.target.value})}
                                />
                              </div>
                          </div>
                      </div>

                      <div className="col-span-2 pt-4 flex gap-3">
                          <button type="button" onClick={() => setShowVitalsModal(false)} className="flex-1 py-2 border border-slate-300 rounded-lg text-slate-600 font-bold hover:bg-slate-50">Cancel</button>
                          <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-lg shadow-blue-200">Save Vitals</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* EMR Modal */}
      {showEMR && emrPatientId && (
          <EMRModal patientId={emrPatientId} onClose={() => setShowEMR(false)} />
      )}

      {/* Footer Legend */}
      <div className="mt-2 flex gap-4 text-[10px] text-slate-500 shrink-0">
          <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span> Vitals Captured</div>
          <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-red-500 mr-1"></span> Vitals Pending</div>
      </div>
    </div>
  );
};