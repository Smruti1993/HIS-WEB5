import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { DatePicker } from '../components/DatePicker';
import { Search, RefreshCw, User, Activity, FileText, FlaskConical, Stethoscope, Microscope, CheckCircle, AlertCircle, Plus, X } from 'lucide-react';
import { Appointment } from '../types';
import { useNavigate } from 'react-router-dom';

export const DoctorWorkbench = () => {
  const { appointments, patients, vitals, diagnoses, saveVitalSign, updateAppointment, bills } = useData();
  const navigate = useNavigate();

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
                                      <button className="text-blue-600 hover:text-blue-800">
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

      {/* Footer Legend */}
      <div className="mt-2 flex gap-4 text-[10px] text-slate-500 shrink-0">
          <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span> Vitals Captured</div>
          <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-red-500 mr-1"></span> Vitals Pending</div>
      </div>
    </div>
  );
};