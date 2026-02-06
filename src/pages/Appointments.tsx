
import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { analyzeSymptoms } from '../services/geminiService';
import { Sparkles, Loader2, Calendar as CalendarIcon, Clock, AlertCircle, Filter, RefreshCw, XCircle, AlertTriangle, ChevronLeft, ChevronRight, User, Check } from 'lucide-react';

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
  const [selectedDate, setSelectedDate] = useState(''); // YYYY-MM-DD
  const [selectedPatient, setSelectedPatient] = useState('');
  const [visitType, setVisitType] = useState<'New Visit' | 'Follow-up'>('New Visit');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState('');

  // --- Calendar State ---
  const [viewDate, setViewDate] = useState(new Date()); // Tracks the month being viewed

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
  const bookingDoctors = employees.filter(e => e.role === 'Doctor' && e.departmentId === selectedDept);
  const allDoctors = employees.filter(e => e.role === 'Doctor');

  // --- Calendar Helpers ---
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  // Check if doctor works on a specific day of week (0-6)
  const isDoctorAvailableOnDay = (dayOfWeek: number) => {
      if (!selectedDoctor) return false;
      return availabilities.some(a => a.doctorId === selectedDoctor && a.dayOfWeek === dayOfWeek);
  };

  const calendarDays = useMemo(() => {
      const year = viewDate.getFullYear();
      const month = viewDate.getMonth();
      const daysInMonth = getDaysInMonth(year, month);
      const firstDay = getFirstDayOfMonth(year, month);
      
      const days = [];
      // Empty slots for alignment
      for (let i = 0; i < firstDay; i++) {
          days.push(null);
      }
      
      // Actual days
      for (let d = 1; d <= daysInMonth; d++) {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const dateObj = new Date(year, month, d);
          const dayOfWeek = dateObj.getDay();
          const isAvailable = isDoctorAvailableOnDay(dayOfWeek);
          
          // Check if date is in the past
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const isPast = dateObj < today;

          days.push({
              day: d,
              fullDate: dateStr,
              isAvailable: isAvailable && !isPast,
              isPast: isPast,
              isToday: dateObj.getTime() === today.getTime()
          });
      }
      return days;
  }, [viewDate, selectedDoctor, availabilities]);

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
            if (result.departmentName) {
                setAiAnalysis(result);
                const dept = departments.find(d => d.name === result.departmentName);
                if (dept) {
                    setSelectedDept(dept.id);
                    showToast('success', `Suggesting ${dept.name}`);
                } else {
                    showToast('info', `Suggested department '${result.departmentName}' not found.`);
                }
            } else {
                showToast('error', result.reasoning || 'AI analysis failed.');
            }
        } else {
            showToast('error', 'AI Service is currently unavailable.');
        }
    } catch (error) {
        console.error(error);
        showToast('error', 'An unexpected error occurred.');
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

    const dateObj = new Date(selectedDate + 'T00:00:00');
    const dayIndex = dateObj.getDay();
    const availability = availabilities.find(a => a.doctorId === selectedDoctor && a.dayOfWeek === dayIndex);

    if (!availability) {
        setAvailableSlots([]);
        return;
    }

    const slots: string[] = [];
    // Ensure dates are parsed correctly without timezone shifts
    const [y, m, d] = selectedDate.split('-').map(Number);
    // Construct times relative to the selected date
    let current = new Date(y, m - 1, d); // Local time midnight
    const [startH, startM] = availability.startTime.split(':').map(Number);
    const [endH, endM] = availability.endTime.split(':').map(Number);
    
    current.setHours(startH, startM, 0, 0);
    const end = new Date(current);
    end.setHours(endH, endM, 0, 0);
    
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

        // Check if time has passed (only if selected date is today)
        const isToday = new Date().toISOString().split('T')[0] === selectedDate;
        const isPast = isToday && current < now;

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
    showToast('success', 'Appointment confirmed successfully!');
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

  // --- Filter Logic ---
  const filteredAppointments = appointments.filter(apt => {
    const matchDoc = filterDoctorId ? apt.doctorId === filterDoctorId : true;
    const matchStatus = filterStatus !== 'All' ? apt.status === filterStatus : true;
    const matchStart = filterStartDate ? apt.date >= filterStartDate : true;
    const matchEnd = filterEndDate ? apt.date <= filterEndDate : true;
    return matchDoc && matchStatus && matchStart && matchEnd;
  }).sort((a,b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime());

  return (
    <div className="space-y-8">
      
      {/* SECTION 1: BOOKING INTERFACE */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Left Col: AI Triage & Configuration (4 Columns) */}
        <div className="xl:col-span-4 space-y-6">
          
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

          {/* Booking Config Form */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-slate-800 mb-4">Book New Appointment</h3>
              
              <div className="space-y-4">
                  <div>
                      <label className="form-label">Patient</label>
                      <div className="relative">
                        <select className="form-input" value={selectedPatient} onChange={e => setSelectedPatient(e.target.value)}>
                            <option value="">Select Patient</option>
                            {patients.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
                        </select>
                        <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
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
              </div>
          </div>
        </div>

        {/* Right Col: Calendar & Slots (8 Columns) */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          
          {/* CALENDAR CARD */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row h-full">
              
              {/* Calendar Section */}
              <div className="flex-1 p-6 border-r border-slate-100">
                  <div className="flex items-center justify-between mb-6">
                      <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                          <CalendarIcon className="w-5 h-5 text-blue-600" />
                          {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                      </h3>
                      <div className="flex gap-1">
                          <button 
                            onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                          >
                              <ChevronLeft className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                          >
                              <ChevronRight className="w-5 h-5" />
                          </button>
                      </div>
                  </div>

                  {/* Calendar Grid */}
                  <div>
                      <div className="grid grid-cols-7 mb-2 text-center">
                          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                              <div key={d} className="text-xs font-bold text-slate-400 uppercase py-2">{d}</div>
                          ))}
                      </div>
                      <div className="grid grid-cols-7 gap-2">
                          {calendarDays.map((date, i) => {
                              if (!date) return <div key={`empty-${i}`} className="aspect-square" />;
                              
                              const isSelected = selectedDate === date.fullDate;
                              
                              return (
                                  <button
                                      key={date.fullDate}
                                      disabled={!date.isAvailable}
                                      onClick={() => {
                                          setSelectedDate(date.fullDate);
                                          setSelectedSlot(''); // Reset slot when date changes
                                      }}
                                      className={`
                                          aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all duration-200
                                          ${isSelected 
                                              ? 'bg-blue-600 text-white shadow-md shadow-blue-200 ring-2 ring-blue-600 ring-offset-2' 
                                              : date.isAvailable 
                                                  ? 'bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-700' 
                                                  : 'bg-slate-50 text-slate-300 cursor-not-allowed'
                                          }
                                      `}
                                  >
                                      <span className={`text-sm font-medium ${date.isToday && !isSelected ? 'text-blue-600 font-bold' : ''}`}>
                                          {date.day}
                                      </span>
                                      {date.isAvailable && !isSelected && (
                                          <span className="w-1 h-1 rounded-full bg-green-400 mt-1"></span>
                                      )}
                                  </button>
                              );
                          })}
                      </div>
                  </div>
                  
                  {/* Legend */}
                  <div className="mt-6 flex items-center gap-4 text-[10px] text-slate-500 justify-center border-t border-slate-50 pt-4">
                      <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-400"></span> Available</div>
                      <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-200"></span> Unavailable</div>
                      <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-600"></span> Selected</div>
                  </div>
              </div>

              {/* Slots Section */}
              <div className="w-full md:w-80 bg-slate-50 p-6 flex flex-col border-t md:border-t-0 md:border-l border-slate-100">
                  <div className="mb-4">
                      <h4 className="font-bold text-slate-800 mb-1">Available Slots</h4>
                      <p className="text-xs text-slate-500">
                          {selectedDate 
                            ? `For ${new Date(selectedDate).toLocaleDateString(undefined, {weekday: 'long', month: 'short', day: 'numeric'})}`
                            : 'Select a date on the calendar'}
                      </p>
                  </div>

                  <div className="flex-1 overflow-y-auto min-h-[200px] pr-2 custom-scrollbar">
                      {!selectedDoctor ? (
                          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center">
                              <User className="w-10 h-10 mb-2 opacity-20" />
                              <p className="text-sm">Select a Doctor first</p>
                          </div>
                      ) : !selectedDate ? (
                          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center">
                              <CalendarIcon className="w-10 h-10 mb-2 opacity-20" />
                              <p className="text-sm">Pick a date</p>
                          </div>
                      ) : availableSlots.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-orange-400 text-center p-4 bg-orange-50/50 rounded-xl border border-orange-100">
                              <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
                              <p className="text-sm font-medium">No slots available</p>
                              <p className="text-xs mt-1">Doctor may be off or fully booked.</p>
                          </div>
                      ) : (
                          <div className="grid grid-cols-2 gap-2">
                              {availableSlots.map(slot => (
                                  <button
                                      key={slot}
                                      onClick={() => setSelectedSlot(slot)}
                                      className={`
                                          py-2 px-3 rounded-lg text-sm font-medium border transition-all flex items-center justify-between
                                          ${selectedSlot === slot 
                                              ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                                              : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:text-blue-600'
                                          }
                                      `}
                                  >
                                      <span>{slot}</span>
                                      {selectedSlot === slot && <Check className="w-3.5 h-3.5" />}
                                  </button>
                              ))}
                          </div>
                      )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-200">
                      <div className="flex justify-between items-center mb-3">
                          <span className="text-xs font-bold text-slate-500 uppercase">Selected</span>
                          <span className="text-sm font-bold text-slate-800">{selectedSlot || '--:--'}</span>
                      </div>
                      <button 
                          disabled={!selectedSlot || !selectedPatient}
                          onClick={handleBooking}
                          className="w-full bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed hover:bg-blue-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
                      >
                          Confirm Booking
                      </button>
                  </div>
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
                   <CalendarIcon className="w-4 h-4 text-slate-400 mr-2" />
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
                  onClick={() => {
                      setFilterStartDate(''); setFilterEndDate(''); setFilterDoctorId(''); setFilterStatus('All');
                  }}
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
                          onClick={() => { setIsCancelModalOpen(false); setAppointmentToCancel(null); }}
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
