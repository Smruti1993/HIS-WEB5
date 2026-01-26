import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { DAYS_OF_WEEK } from '../constants';
import { analyzeSymptoms } from '../services/geminiService';
import { Sparkles, Loader2, Calendar, Clock, AlertCircle } from 'lucide-react';

export const Appointments = () => {
  const { 
    departments, employees, availabilities, appointments, 
    bookAppointment, patients 
  } = useData();

  // --- State ---
  const [symptoms, setSymptoms] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState<{departmentName: string, urgency: string, reasoning: string} | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [selectedDept, setSelectedDept] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedPatient, setSelectedPatient] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState('');

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

  // Generate Slots based on availability and existing bookings
  useEffect(() => {
    if (!selectedDoctor || !selectedDate) {
        setAvailableSlots([]);
        return;
    }

    const dateObj = new Date(selectedDate);
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

    while (current < end) {
        const timeStr = current.toTimeString().substring(0, 5);
        
        // Check collision
        const isBooked = appointments.some(a => 
            a.doctorId === selectedDoctor && 
            a.date === selectedDate && 
            a.time === timeStr
        );

        if (!isBooked) slots.push(timeStr);
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
        symptoms: symptoms
    });
    // Reset
    setSelectedSlot('');
    setAiAnalysis(null);
    setSymptoms('');
  };

  const filteredDoctors = employees.filter(e => e.role === 'Doctor' && e.departmentId === selectedDept);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
      {/* Left Col: AI Triage & Selection */}
      <div className="xl:col-span-1 space-y-6">
        
        {/* AI Symptom Checker */}
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

        {/* Booking Form - Step 1 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-4">Booking Details</h3>
            
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
                        {filteredDoctors.map(d => <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>)}
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
  );
};
