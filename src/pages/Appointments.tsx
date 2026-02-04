import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { analyzeSymptoms } from '../services/geminiService';
import { Sparkles, Loader2, Calendar, Clock, AlertCircle, Filter, RefreshCw, XCircle, AlertTriangle } from 'lucide-react';

export const Appointments = () => {
  const { 
    departments, employees, availabilities, appointments, 
    bookAppointment, cancelAppointment, patients, allergies, showToast
  } = useData();

  // --- Booking State ---
  const [symptoms, setSymptoms] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState<{departmentName: string | null, urgency: string, reasoning: string} | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [selectedDept, setSelectedDept] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedPatient, setSelectedPatient] = useState('');
  const [visitType, setVisitType] = useState<'New Visit' | 'Follow-up'>('New Visit');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState('');

  // --- Filter State ---
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterDoctorId, setFilterDoctorId] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  // --- Modal State ---
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<string | null>(null);

  // --- Derived Data ---
  const currentPatient = patients.find(p => p.id === selectedPatient);

  // --- Handlers ---
  const handleAiTriage = async () => {
    if (!symptoms.trim()) {
        showToast('info', 'Please describe the symptoms first.');
        return;
    }
    
    setIsAnalyzing(true);
    setAiAnalysis(null);
    
    let patientContext: { age?: number; gender?: string; allergies?: string[] } = {};
    
    if (currentPatient) {
        const age = new Date().getFullYear() - new Date(currentPatient.dob).getFullYear();
        const activeAllergies = allergies
            .filter(a => a.patientId === currentPatient.id && a.status === 'Active')
            .map(a => a.allergen);
            
        patientContext = {
            age,
            gender: currentPatient.gender,
            allergies: activeAllergies
        };
    }

    try {
        const result = await analyzeSymptoms(symptoms, departments.map(d => d.name), patientContext);
        
        if (result) {
            // Check for API Key specific error returned by service
            if (result.departmentName === null && result.reasoning?.includes('API Key')) {
                showToast('error', result.reasoning);
            } else {
                setAiAnalysis(result);
                if (result.departmentName) {
                    const dept = departments.find(d => d.name === result.departmentName);
                    if (dept) {
                        setSelectedDept(dept.id);
                        showToast('success', `Suggesting ${dept.name}`);
                    } else {
                        showToast('info', `Suggested department '${result.departmentName}' not found in system.`);
                    }
                }
            }
        } else {
            showToast('error', 'AI Analysis failed to return a result. Please try again.');
        }
    } catch (error) {
        console.error(error);
        showToast('error', 'An error occurred during symptom analysis.');
    } finally {
        setIsAnalyzing(false);
    }
  };

  // Generate Slots based on availability and existing bookings
  useEffect(() => {
    if (!selectedDoctor || !selectedDate) {
        setAvailableSlots([]);
        return;
    }

    // Use local time for day index calculation to avoid UTC offset issues
    const dateObj = new Date(selectedDate + 'T00:00:00');
    const dayIndex = dateObj.getDay();
    const availability = availabilities.find(a => a.doctorId === selectedDoctor && a.dayOfWeek === dayIndex);

    if (!availability) {
        setAvailableSlots([]);
        return;
    }

    const slots: string[] = [];
    let current = new Date(`${selectedDate}T${availability.startTime}`);
    const end = new Date(`${selectedDate}T${availability.endTime}`);
    const duration = availability.slotDurationMinutes;
    const now = new Date();

    while (current < end) {
        const timeStr = current.toTimeString().substring(0, 5);
        
        // Check collision
        const isBooked = appointments.some(a => 
            a.doctorId === selectedDoctor && 
            a.date === selectedDate && 
            a.time === timeStr &&
            a.status !== 'Cancelled'
        );

        // Check if time has passed
        const isPast = current < now;

        if (!isBooked && !isPast) slots.push(timeStr);
        current.setMinutes(current.getMinutes() + duration);
    }

    setAvailableSlots(slots);
  }, [selectedDoctor, selectedDate, availabilities, appointments]);

  const handleBooking = () => {
    if (!selectedSlot || !selectedPatient) return;
    bookAppointment({
        id: Date.now().toString(),
        patientId: selectedPatient,
        doctorId: selectedDoctor,
        departmentId: selectedDept,
        date: selectedDate,
        time: selectedSlot,
        status: 'Scheduled',
        symptoms: symptoms,
        visitType: visitType
    });
    // Reset
    setSelectedSlot('');
    setAiAnalysis(null);
    setSymptoms('');
    setVisitType('New Visit');
  };

  const handleCancelClick = (id: string) => {
    setAppointmentToCancel(id);
    setIsCancelModalOpen(true);
  };

  const confirmCancel = () => {
    if (appointmentToCancel) {
        cancelAppointment(appointmentToCancel);
        setIsCancelModalOpen(false);
        setAppointmentToCancel(null);
    }
  };

  const closeCancelModal = () => {
    setIsCancelModalOpen(false);
    setAppointmentToCancel(null);
  };

  const resetFilters = () => {
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterDoctorId('');
    setFilterStatus('All');
  };

  // --- Filter Logic ---
  const filteredAppointments = appointments.filter(apt => {
    const matchDoc = filterDoctorId ? apt.doctorId === filterDoctorId : true;
    const matchStatus = filterStatus !== 'All' ? apt.status === filterStatus : true;
    const matchStart = filterStartDate ? apt.date >= filterStartDate : true;
    const matchEnd = filterEndDate ? apt.date <= filterEndDate : true;
    return matchDoc && matchStatus && matchStart && matchEnd;
  }).sort((a,b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime());

  const bookingDoctors = employees.filter(e => e.role === 'Doctor' && e.departmentId === selectedDept);
  const allDoctors = employees.filter(e => e.role === 'Doctor');

  return (
    <div className="space-y-8">
      
      {/* SECTION 1: BOOKING INTERFACE */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Col: AI Triage & Selection */}
        <div className="xl:col-span-1 space-y-6">
          
          {/* AI Symptom Checker */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center mb-4 justify-between">
                  <div className="flex items-center">
                      <Sparkles className="w-5 h-5 mr-2 text-yellow-300" />
                      <h3 className="font-bold text-lg">AI Smart Triage</h3>
                  </div>
                  {currentPatient && (
                      <span className="text-[10px] bg-white/20 border border-white/30 px-2 py-1 rounded text-indigo-100 font-medium">
                          Context: {currentPatient.firstName}
                      </span>
                  )}
              </div>
              <p className="text-indigo-100 text-sm mb-4">
                  {currentPatient 
                    ? `Analyze symptoms for ${currentPatient.firstName} (considering age & allergies).` 
                    : "Select a patient below for personalized triage, or describe symptoms generally."}
              </p>
              
              <textarea 
                  className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white placeholder-indigo-200 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
                  rows={3}
                  placeholder="e.g. Severe headache and sensitivity to light..."
                  value={symptoms}
                  onChange={e => setSymptoms(e.target.value)}
              ></textarea>
              
              <button 
                  onClick={handleAiTriage}
                  disabled={isAnalyzing}
                  className="mt-3 w-full bg-white text-indigo-700 font-bold py-2 rounded-lg text-sm hover:bg-indigo-50 transition-colors flex justify-center items-center shadow-md"
              >
                  {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Analyze Symptoms'}
              </button>

              {aiAnalysis && (
                  <div className="mt-4 bg-white/10 rounded-lg p-3 border border-white/20 animate-in fade-in slide-in-from-top-2">
                      <p className="text-xs font-bold text-yellow-300 uppercase tracking-wide">Suggestion</p>
                      <p className="font-semibold">{aiAnalysis.departmentName || 'No specific department'}</p>
                      <div className="flex items-center gap-2 mt-2">
                          <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                              aiAnalysis.urgency === 'High' ? 'bg-red-500 text-white' : 
                              aiAnalysis.urgency === 'Medium' ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'
                          }`}>Urgency: {aiAnalysis.urgency}</span>
                      </div>
                      <p className="text-xs mt-2 opacity-90 italic leading-relaxed">"{aiAnalysis.reasoning}"</p>
                  </div>
              )}
          </div>

          {/* Booking Form */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-slate-800 mb-4">Book New Appointment</h3>
              
              <div className="space-y-4">
                  <div>
                      <label className="form-label">Patient</label>
                      <select className="form-input" value={selectedPatient} onChange={e => setSelectedPatient(e.target.value)}>
                          <option value="">Select Patient</option>
                          {patients.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
                      </select>
                  </div>

                  <div>
                      <label className="form-label">Visit Type</label>
                      <select 
                          className="form-input" 
                          value={visitType} 
                          onChange={e => setVisitType(e.target.value as 'New Visit' | 'Follow-up')}
                      >
                          <option value="New Visit">New Visit</option>
                          <option value="Follow-up">Follow-up</option>
                      </select>
                  </div>

                  <div>
                      <label className="form-label">Department</label>
                      <select className="form-input" value={selectedDept} onChange={e => setSelectedDept(e.target.value)}>
                          <option value="">Select Department</option>
                          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                  </div>

                  <div>
                      <label className="form-label">Doctor</label>
                      <select 
                          className="form-input" 
                          value={selectedDoctor} 
                          onChange={e => setSelectedDoctor(e.target.value)}
                          disabled={!selectedDept}
                      >
                          <option value="">Select Doctor</option>
                          {bookingDoctors.map(d => <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>)}
                      </select>
                  </div>

                  <div>
                      <label className="form-label">Date</label>
                      <input 
                          type="date" 
                          className="form-input" 
                          value={selectedDate} 
                          onChange={e => setSelectedDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                      />
                  </div>
              </div>
          </div>
        </div>

        {/* Right Col: Slots & Confirmation */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 h-full flex flex-col">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 flex items-center">
                      <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                      Available Slots
                  </h3>
                  {selectedDate && <span className="text-sm font-medium text-slate-500">{new Date(selectedDate).toDateString()}</span>}
              </div>

              <div className="p-8 flex-1">
                  {!selectedDoctor || !selectedDate ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400">
                          <Clock className="w-12 h-12 mb-4 opacity-20" />
                          <p>Select a Doctor and Date to view slots</p>
                      </div>
                  ) : availableSlots.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-orange-400">
                          <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
                          <p>No slots available for this date.</p>
                      </div>
                  ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                          {availableSlots.map(slot => (
                              <button
                                  key={slot}
                                  onClick={() => setSelectedSlot(slot)}
                                  className={`py-2 px-1 rounded-lg text-sm font-medium border transition-all ${
                                      selectedSlot === slot 
                                      ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-200' 
                                      : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:text-blue-600'
                                  }`}
                              >
                                  {slot}
                              </button>
                          ))}
                      </div>
                  )}
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                  <button 
                      disabled={!selectedSlot || !selectedPatient}
                      onClick={handleBooking}
                      className="bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all transform active:scale-95"
                  >
                      Confirm Appointment
                  </button>
              </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: APPOINTMENT LIST & FILTERS */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50">
           <div>
               <h3 className="font-bold text-slate-800 text-lg">Scheduled Appointments</h3>
               <p className="text-slate-500 text-sm">Manage and track patient visits</p>
           </div>
           
           {/* Filters Toolbar */}
           <div className="flex flex-wrap items-center gap-3">
               <div className="flex items-center bg-white border border-slate-300 rounded-lg px-3 py-1.5 shadow-sm">
                   <Calendar className="w-4 h-4 text-slate-400 mr-2" />
                   <input 
                        type="date" 
                        className="text-sm outline-none text-slate-600 w-32"
                        placeholder="Start Date"
                        value={filterStartDate}
                        onChange={e => setFilterStartDate(e.target.value)}
                   />
                   <span className="text-slate-300 mx-2">to</span>
                   <input 
                        type="date" 
                        className="text-sm outline-none text-slate-600 w-32"
                        value={filterEndDate}
                        onChange={e => setFilterEndDate(e.target.value)}
                   />
               </div>

               <select 
                    className="bg-white border border-slate-300 text-slate-600 text-sm rounded-lg px-3 py-2 shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
                    value={filterDoctorId}
                    onChange={e => setFilterDoctorId(e.target.value)}
               >
                   <option value="">All Doctors</option>
                   {allDoctors.map(doc => <option key={doc.id} value={doc.id}>Dr. {doc.lastName}</option>)}
               </select>

               <select 
                    className="bg-white border border-slate-300 text-slate-600 text-sm rounded-lg px-3 py-2 shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
               >
                   <option value="All">All Status</option>
                   <option value="Scheduled">Scheduled</option>
                   <option value="Completed">Completed</option>
                   <option value="Cancelled">Cancelled</option>
               </select>

               <button 
                  onClick={resetFilters}
                  className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Reset Filters"
               >
                   <RefreshCw className="w-4 h-4" />
               </button>
           </div>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-white text-slate-500 border-b border-slate-100">
                    <tr>
                        <th className="px-6 py-4 font-semibold">Date & Time</th>
                        <th className="px-6 py-4 font-semibold">Patient</th>
                        <th className="px-6 py-4 font-semibold">Doctor</th>
                        <th className="px-6 py-4 font-semibold">Department</th>
                        <th className="px-6 py-4 font-semibold">Status</th>
                        <th className="px-6 py-4 font-semibold">Symptoms/Notes</th>
                        <th className="px-6 py-4 font-semibold text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredAppointments.length === 0 ? (
                        <tr>
                            <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                                <div className="flex flex-col items-center">
                                    <Filter className="w-8 h-8 mb-2 opacity-30" />
                                    No appointments found matching your filters.
                                </div>
                            </td>
                        </tr>
                    ) : (
                        filteredAppointments.map(apt => {
                            const patient = patients.find(p => p.id === apt.patientId);
                            const doctor = employees.find(e => e.id === apt.doctorId);
                            const dept = departments.find(d => d.id === apt.departmentId);
                            
                            return (
                                <tr key={apt.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-900">{new Date(apt.date).toLocaleDateString()}</div>
                                        <div className="text-slate-500 flex items-center text-xs mt-0.5">
                                            <Clock className="w-3 h-3 mr-1" /> {apt.time}
                                        </div>
                                        <div className="text-[10px] text-blue-600 font-bold mt-1 uppercase tracking-wide">
                                            {apt.visitType || 'New Visit'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-900">{patient?.firstName} {patient?.lastName}</div>
                                        <div className="text-xs text-slate-400">{patient?.phone}</div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        Dr. {doctor?.firstName} {doctor?.lastName}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        <span className="inline-block px-2 py-1 bg-slate-100 rounded text-xs">
                                            {dept?.name || '-'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            apt.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
                                            apt.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                            'bg-red-100 text-red-800'
                                        }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                                 apt.status === 'Scheduled' ? 'bg-blue-600' :
                                                 apt.status === 'Completed' ? 'bg-green-600' :
                                                 'bg-red-600'
                                            }`}></span>
                                            {apt.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 max-w-xs truncate text-slate-500" title={apt.symptoms}>
                                        {apt.symptoms || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {apt.status === 'Scheduled' && (
                                            <button 
                                                onClick={() => handleCancelClick(apt.id)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors shadow-sm"
                                                title="Cancel Appointment"
                                            >
                                                <XCircle className="w-4 h-4" />
                                                Cancel
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {isCancelModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 m-4 scale-100 animate-in zoom-in-95 duration-200 border border-slate-200">
                  <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                          <AlertTriangle className="w-6 h-6 text-red-600" />
                      </div>
                      <div>
                          <h3 className="text-lg font-bold text-slate-900">Cancel Appointment</h3>
                          <p className="text-sm text-slate-500">Are you sure you want to cancel?</p>
                      </div>
                  </div>
                  
                  <p className="text-slate-600 mb-6 text-sm leading-relaxed">
                      This action will change the appointment status to 'Cancelled'. This action cannot be undone immediately unless re-booked.
                  </p>
                  
                  <div className="flex justify-end gap-3">
                      <button 
                          onClick={closeCancelModal}
                          className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-medium rounded-lg transition-colors"
                      >
                          No, Keep it
                      </button>
                      <button 
                          onClick={confirmCancel}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow-lg shadow-red-200 transition-colors"
                      >
                          Yes, Cancel Appointment
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};