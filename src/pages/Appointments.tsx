import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { analyzeSymptoms } from '../services/geminiService';
import { DatePicker } from '../components/DatePicker';
import { Sparkles, Loader2, Calendar, Clock, AlertCircle, Filter, RefreshCw, XCircle, AlertTriangle, Printer, Pencil, CheckCircle, Stethoscope, UserCheck } from 'lucide-react';
import { Appointment } from '../types';

export const Appointments = () => {
  const { 
    departments, employees, availabilities, appointments, 
    bookAppointment, updateAppointment, cancelAppointment, patients, showToast 
  } = useData();

  // --- Booking/Edit State ---
  const [editingId, setEditingId] = useState<string | null>(null);
  const [symptoms, setSymptoms] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState<{departmentName: string, urgency: string, reasoning: string} | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [selectedDept, setSelectedDept] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedPatient, setSelectedPatient] = useState('');
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

  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [appointmentToComplete, setAppointmentToComplete] = useState<Appointment | null>(null);
  const [clinicalNotes, setClinicalNotes] = useState('');

  // Get local date string for minDate (Today)
  const today = new Date();
  const minDateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // --- Handlers ---
  const handleAiTriage = async () => {
    if (!symptoms) return;
    setIsAnalyzing(true);
    const result = await analyzeSymptoms(symptoms, departments.map(d => d.name));
    setIsAnalyzing(false);
    
    if (result) {
      setAiAnalysis(result);
      const dept = departments.find(d => d.name === result.departmentName);
      if (dept) setSelectedDept(dept.id);
    }
  };

  const handlePrintSummary = (apt: Appointment) => {
    const patient = patients.find(p => p.id === apt.patientId);
    const doctor = employees.find(e => e.id === apt.doctorId);
    const dept = departments.find(d => d.id === apt.departmentId);

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Visit Summary - ${patient?.firstName || 'Patient'} ${patient?.lastName || ''}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
          body { font-family: 'Inter', sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #1e293b; line-height: 1.5; }
          .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-start; }
          .logo-text { font-size: 24px; font-weight: 800; color: #2563eb; letter-spacing: -0.5px; }
          .sub-text { font-size: 13px; color: #64748b; margin-top: 4px; }
          .meta { text-align: right; color: #64748b; font-size: 13px; }
          .doc-title { font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 24px; text-transform: uppercase; letter-spacing: 0.5px; }
          
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px; }
          .section { margin-bottom: 24px; }
          .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; font-weight: 700; margin-bottom: 6px; }
          .value { font-size: 15px; font-weight: 500; color: #0f172a; }
          
          .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 30px; }
          
          .footer { margin-top: 60px; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 12px; color: #94a3b8; display: flex; justify-content: space-between; }
          
          @media print {
            body { padding: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo-text">MediCore HMS</div>
            <div class="sub-text">Excellence in Healthcare Management</div>
          </div>
          <div class="meta">
            <div><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
            <div><strong>Ref ID:</strong> ${apt.id.substring(0, 8)}...</div>
          </div>
        </div>

        <div class="doc-title">Clinical Visit Summary</div>

        <div class="grid">
          <div>
            <div class="section">
              <div class="label">Patient Details</div>
              <div class="value" style="font-size: 18px;">${patient?.firstName} ${patient?.lastName}</div>
              <div style="font-size: 14px; color: #475569; margin-top: 4px;">
                <strong>DOB:</strong> ${patient?.dob || 'N/A'}<br>
                <strong>Gender:</strong> ${patient?.gender || 'N/A'}<br>
                <strong>Contact:</strong> ${patient?.phone || 'N/A'}
              </div>
            </div>
          </div>
          <div>
            <div class="section">
              <div class="label">Attending Physician</div>
              <div class="value" style="font-size: 18px;">Dr. ${doctor?.firstName} ${doctor?.lastName}</div>
              <div style="font-size: 14px; color: #475569; margin-top: 4px;">
                <strong>Department:</strong> ${dept?.name || 'General'}<br>
                <strong>Specialization:</strong> ${doctor?.specialization || 'N/A'}
              </div>
            </div>
          </div>
        </div>

        <div class="box">
          <div class="grid" style="margin-bottom: 0; gap: 20px;">
             <div>
               <div class="label">Appointment Date</div>
               <div class="value">${new Date(apt.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
             </div>
             <div>
               <div class="label">Time</div>
               <div class="value">${apt.time}</div>
             </div>
             <div>
               <div class="label">Status</div>
               <div class="value" style="color: #16a34a;">${apt.status}</div>
             </div>
             <div>
               <div class="label">Type</div>
               <div class="value">Consultation</div>
             </div>
          </div>
        </div>

        <div class="section">
           <div class="label">Reported Symptoms</div>
           <div class="value" style="background: #fff; padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px;">
             ${apt.symptoms || 'No specific symptoms recorded.'}
           </div>
        </div>
        
        <div class="section">
           <div class="label">Clinical Notes / Diagnosis / Treatment</div>
           <div class="value" style="background: #fff; padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px; min-height: 100px;">
             ${apt.notes ? apt.notes.replace(/\n/g, '<br>') : '<span style="color: #94a3b8; font-style: italic;">No clinical notes added by the doctor.</span>'}
           </div>
        </div>

        <div class="footer">
           <div>Printed from MediCore Healthcare System</div>
           <div>Confidential Medical Record</div>
        </div>
        <script>
            setTimeout(() => {
                window.print();
            }, 500);
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
  };

  // Generate Slots based on availability and existing bookings
  useEffect(() => {
    if (!selectedDoctor || !selectedDate) {
        setAvailableSlots([]);
        return;
    }

    const [y, m, d] = selectedDate.split('-').map(Number);
    const localDate = new Date(y, m - 1, d); 
    const dayIndex = localDate.getDay();

    const availability = availabilities.find(a => a.doctorId === selectedDoctor && a.dayOfWeek === dayIndex);

    if (!availability) {
        setAvailableSlots([]);
        return;
    }

    const slots: string[] = [];
    
    // Parse times
    const [startH, startM] = availability.startTime.split(':').map(Number);
    const [endH, endM] = availability.endTime.split(':').map(Number);
    
    let current = new Date(y, m - 1, d, startH, startM);
    const end = new Date(y, m - 1, d, endH, endM);
    
    const duration = availability.slotDurationMinutes;
    const now = new Date();

    while (current < end) {
        const timeStr = current.toTimeString().substring(0, 5);
        
        // Check if slot is in the past (only relevant if selectedDate is today or earlier)
        const isPast = current < now;

        // Check collision
        // When editing, exclude the current appointment from collision checks (editingId)
        const isBooked = appointments.some(a => 
            a.doctorId === selectedDoctor && 
            a.date === selectedDate && 
            a.time === timeStr &&
            a.status !== 'Cancelled' &&
            a.id !== editingId 
        );

        if (!isBooked && !isPast) slots.push(timeStr);
        current.setMinutes(current.getMinutes() + duration);
    }

    setAvailableSlots(slots);
  }, [selectedDoctor, selectedDate, availabilities, appointments, editingId]);

  const handleBooking = () => {
    if (!selectedSlot || !selectedPatient) return;
    
    // Auto-check-in if the appointment is for today (Local Time comparison)
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const isToday = selectedDate === todayStr;

    const status = isToday ? 'Checked-In' : 'Scheduled';
    const checkInTime = isToday ? new Date().toISOString() : undefined;

    if (editingId) {
      updateAppointment(editingId, {
        patientId: selectedPatient,
        doctorId: selectedDoctor,
        departmentId: selectedDept,
        date: selectedDate,
        time: selectedSlot,
        symptoms: symptoms
      });
      cancelEdit(); // Reset form
    } else {
      bookAppointment({
          id: Date.now().toString(),
          patientId: selectedPatient,
          doctorId: selectedDoctor,
          departmentId: selectedDept,
          date: selectedDate,
          time: selectedSlot,
          status: status,
          checkInTime: checkInTime,
          symptoms: symptoms,
          visitType: 'New Visit',
          paymentMode: 'CASH'
      });
      // Reset
      setSelectedSlot('');
      setAiAnalysis(null);
      setSymptoms('');
    }
  };

  const handleCheckIn = (id: string) => {
    updateAppointment(id, { 
        status: 'Checked-In',
        checkInTime: new Date().toISOString()
    });
    showToast('success', 'Patient checked in successfully');
  };

  const handleEditClick = (apt: Appointment) => {
    setEditingId(apt.id);
    setSelectedPatient(apt.patientId);
    setSelectedDept(apt.departmentId);
    setSelectedDoctor(apt.doctorId);
    setSelectedDate(apt.date);
    setSelectedSlot(apt.time);
    setSymptoms(apt.symptoms || '');
    setAiAnalysis(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setSelectedPatient('');
    setSelectedDept('');
    setSelectedDoctor('');
    setSelectedDate('');
    setSelectedSlot('');
    setSymptoms('');
    setAiAnalysis(null);
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
        if (editingId === appointmentToCancel) {
          cancelEdit();
        }
    }
  };

  const closeCancelModal = () => {
    setIsCancelModalOpen(false);
    setAppointmentToCancel(null);
  };

  const handleCompleteClick = (apt: Appointment) => {
    setAppointmentToComplete(apt);
    setClinicalNotes(apt.notes || '');
    setIsCompleteModalOpen(true);
  };

  const confirmComplete = () => {
    if (appointmentToComplete) {
      updateAppointment(appointmentToComplete.id, {
        status: 'Completed',
        notes: clinicalNotes
      });
      setIsCompleteModalOpen(false);
      setAppointmentToComplete(null);
      setClinicalNotes('');
    }
  };

  const closeCompleteModal = () => {
    setIsCompleteModalOpen(false);
    setAppointmentToComplete(null);
    setClinicalNotes('');
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
      
      {/* SECTION 1: BOOKING / EDIT INTERFACE */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Col: AI Triage & Selection */}
        <div className="xl:col-span-1 space-y-6">
          
          {/* AI Symptom Checker */}
          {!editingId && (
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center mb-4">
                    <Sparkles className="w-5 h-5 mr-2 text-yellow-300" />
                    <h3 className="font-bold text-lg">AI Smart Triage</h3>
                </div>
                <p className="text-indigo-100 text-sm mb-4">Describe symptoms to get department recommendations.</p>
                
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
                    className="mt-3 w-full bg-white text-indigo-700 font-bold py-2 rounded-lg text-sm hover:bg-indigo-50 transition-colors flex justify-center items-center"
                >
                    {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Analyze Symptoms'}
                </button>

                {aiAnalysis && (
                    <div className="mt-4 bg-white/10 rounded-lg p-3 border border-white/20 animate-in fade-in slide-in-from-top-2">
                        <p className="text-xs font-bold text-yellow-300 uppercase tracking-wide">Suggestion</p>
                        <p className="font-semibold">{aiAnalysis.departmentName}</p>
                        <div className="flex items-center gap-2 mt-2">
                            <span className={`text-xs px-2 py-0.5 rounded ${
                                aiAnalysis.urgency === 'High' ? 'bg-red-500/80' : 'bg-green-500/80'
                            }`}>Urgency: {aiAnalysis.urgency}</span>
                        </div>
                        <p className="text-xs mt-2 opacity-80 italic">"{aiAnalysis.reasoning}"</p>
                    </div>
                )}
            </div>
          )}

          {/* Booking Form */}
          <div className={`bg-white p-6 rounded-2xl shadow-sm border ${editingId ? 'border-yellow-400 ring-2 ring-yellow-100' : 'border-slate-200'}`}>
              <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold text-slate-800">{editingId ? 'Edit Appointment' : 'Book New Appointment'}</h3>
                 {editingId && <span className="text-xs font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded">EDITING MODE</span>}
              </div>
              
              <div className="space-y-4">
                  <div>
                      <label className="form-label">Patient</label>
                      <select className="form-input" value={selectedPatient} onChange={e => setSelectedPatient(e.target.value)}>
                          <option value="">Select Patient</option>
                          {patients.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
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
                      <DatePicker 
                          label="Date"
                          value={selectedDate}
                          onChange={setSelectedDate}
                          minDate={minDateStr}
                          placeholder="Select appointment date"
                      />
                  </div>
                  
                  {editingId && (
                     <div>
                         <label className="form-label">Symptoms / Notes</label>
                         <textarea 
                             className="form-input h-20"
                             value={symptoms}
                             onChange={e => setSymptoms(e.target.value)}
                         />
                     </div>
                  )}
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
                          <p>No slots available for this date (or all slots have passed).</p>
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

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                  {editingId && (
                      <button 
                          onClick={cancelEdit}
                          className="bg-white text-slate-600 hover:bg-slate-100 border border-slate-300 px-6 py-3 rounded-xl font-bold transition-all"
                      >
                          Cancel Edit
                      </button>
                  )}
                  <button 
                      disabled={!selectedSlot || !selectedPatient}
                      onClick={handleBooking}
                      className="bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all transform active:scale-95"
                  >
                      {editingId ? 'Save Changes' : 'Confirm Appointment'}
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
               <div className="w-36">
                  <DatePicker 
                    value={filterStartDate} 
                    onChange={setFilterStartDate}
                    placeholder="Start Date"
                  />
               </div>
               <span className="text-slate-400">to</span>
               <div className="w-36">
                  <DatePicker 
                    value={filterEndDate} 
                    onChange={setFilterEndDate}
                    placeholder="End Date"
                    minDate={filterStartDate}
                  />
               </div>

               <select 
                    className="bg-white border border-slate-300 text-slate-600 text-sm rounded-lg px-3 py-2 shadow-sm outline-none focus:ring-2 focus:ring-blue-500 w-40"
                    value={filterDoctorId}
                    onChange={e => setFilterDoctorId(e.target.value)}
               >
                   <option value="">All Doctors</option>
                   {allDoctors.map(doc => <option key={doc.id} value={doc.id}>Dr. {doc.lastName}</option>)}
               </select>

               <select 
                    className="bg-white border border-slate-300 text-slate-600 text-sm rounded-lg px-3 py-2 shadow-sm outline-none focus:ring-2 focus:ring-blue-500 w-36"
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
               >
                   <option value="All">All Status</option>
                   <option value="Scheduled">Scheduled</option>
                   <option value="Checked-In">Checked-In</option>
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
                                <tr key={apt.id} className={`hover:bg-slate-50 transition-colors ${editingId === apt.id ? 'bg-yellow-50' : ''}`}>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-900">{new Date(apt.date).toLocaleDateString()}</div>
                                        <div className="text-slate-500 flex items-center text-xs mt-0.5">
                                            <Clock className="w-3 h-3 mr-1" /> {apt.time}
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
                                            apt.status === 'Checked-In' ? 'bg-purple-100 text-purple-800' :
                                            apt.status === 'In-Consultation' ? 'bg-amber-100 text-amber-800' :
                                            apt.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                            'bg-red-100 text-red-800'
                                        }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                                 apt.status === 'Scheduled' ? 'bg-blue-600' :
                                                 apt.status === 'Checked-In' ? 'bg-purple-600' :
                                                 apt.status === 'In-Consultation' ? 'bg-amber-600' :
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
                                        <div className="flex justify-end gap-2">
                                            {apt.status === 'Scheduled' && (
                                                <>
                                                  <button 
                                                      onClick={() => handleCheckIn(apt.id)}
                                                      className="text-slate-400 hover:text-purple-600 hover:bg-purple-50 p-1.5 rounded-lg transition-colors"
                                                      title="Check In Patient"
                                                  >
                                                      <UserCheck className="w-4 h-4" /> 
                                                  </button>
                                                  <button 
                                                      onClick={() => handleCompleteClick(apt)}
                                                      className="text-slate-400 hover:text-green-600 hover:bg-green-50 p-1.5 rounded-lg transition-colors"
                                                      title="Complete Consultation"
                                                  >
                                                      <CheckCircle className="w-4 h-4" />
                                                  </button>
                                                  <button 
                                                      onClick={() => handleEditClick(apt)}
                                                      className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition-colors"
                                                      title="Edit Appointment"
                                                  >
                                                      <Pencil className="w-4 h-4" />
                                                  </button>
                                                  <button 
                                                      onClick={() => handleCancelClick(apt.id)}
                                                      className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                                                      title="Cancel Appointment"
                                                  >
                                                      <XCircle className="w-4 h-4" />
                                                  </button>
                                                </>
                                            )}
                                            {apt.status === 'Checked-In' && (
                                                <button 
                                                    onClick={() => handleCompleteClick(apt)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                                                >
                                                    Start/Complete
                                                </button>
                                            )}
                                            {apt.status === 'Completed' && (
                                                <button 
                                                    onClick={() => handlePrintSummary(apt)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors shadow-sm"
                                                    title="Print Summary"
                                                >
                                                    <Printer className="w-4 h-4" />
                                                    Summary
                                                </button>
                                            )}
                                        </div>
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

      {/* Complete Confirmation Modal */}
      {isCompleteModalOpen && appointmentToComplete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 m-4 scale-100 animate-in zoom-in-95 duration-200 border border-slate-200">
                  <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <Stethoscope className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                          <h3 className="text-lg font-bold text-slate-900">Complete Consultation</h3>
                          <p className="text-sm text-slate-500">
                             Patient: {patients.find(p => p.id === appointmentToComplete.patientId)?.firstName} {patients.find(p => p.id === appointmentToComplete.patientId)?.lastName}
                          </p>
                      </div>
                  </div>
                  
                  <div className="mb-6">
                      <label className="form-label">Clinical Notes / Diagnosis / Treatment</label>
                      <textarea 
                          className="form-input h-40 resize-none font-mono text-sm"
                          placeholder="Enter detailed clinical notes, diagnosis, and prescribed treatment..."
                          value={clinicalNotes}
                          onChange={e => setClinicalNotes(e.target.value)}
                      ></textarea>
                      <p className="text-xs text-slate-400 mt-2">These notes will appear on the printed patient summary.</p>
                  </div>
                  
                  <div className="flex justify-end gap-3">
                      <button 
                          onClick={closeCompleteModal}
                          className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-medium rounded-lg transition-colors"
                      >
                          Cancel
                      </button>
                      <button 
                          onClick={confirmComplete}
                          className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-lg shadow-green-200 transition-colors flex items-center gap-2"
                      >
                          <CheckCircle className="w-4 h-4" />
                          Complete Visit
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};