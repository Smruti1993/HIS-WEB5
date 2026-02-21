import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { DAYS_OF_WEEK } from '../constants';
import { Clock, Pencil, X, AlertTriangle, Calendar } from 'lucide-react';
import { DoctorAvailability } from '../types';

export const Availability = () => {
  const { employees, availabilities, saveAvailability, deleteAvailability, appointments } = useData();
  const doctors = employees.filter(e => e.role === 'Doctor');
  
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const initialFormState = {
    dayOfWeek: 1, // Monday
    startTime: '09:00',
    endTime: '17:00',
    slotDurationMinutes: 30
  };

  const [formData, setFormData] = useState(initialFormState);

  const handleEdit = (avail: DoctorAvailability) => {
    setFormData({
      dayOfWeek: avail.dayOfWeek,
      startTime: avail.startTime,
      endTime: avail.endTime,
      slotDurationMinutes: avail.slotDurationMinutes
    });
    setEditingId(avail.id);
  };

  const handleCancelEdit = () => {
    setFormData(initialFormState);
    setEditingId(null);
  };

  const getMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const isTimeOverlap = (start1: number, end1: number, start2: number, end2: number) => {
    return Math.max(start1, start2) < Math.min(end1, end2);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor) return;
    setError(null);

    const newStart = getMinutes(formData.startTime);
    const newEnd = getMinutes(formData.endTime);

    if (newStart >= newEnd) {
        setError("End time must be after start time.");
        return;
    }

    // Check for overlaps
    const hasOverlap = availabilities.some(a => 
        a.doctorId === selectedDoctor && 
        a.dayOfWeek === formData.dayOfWeek && 
        a.id !== editingId &&
        isTimeOverlap(newStart, newEnd, getMinutes(a.startTime), getMinutes(a.endTime))
    );

    if (hasOverlap) {
        setError("This time slot overlaps with another existing schedule.");
        return;
    }

    // Check for conflicts with existing appointments
    if (editingId) {
        const conflicts = appointments.filter(apt => {
            if (apt.doctorId !== selectedDoctor || apt.status === 'Cancelled') return false;
            const aptDate = new Date(apt.date);
            if (aptDate < new Date()) return false; // Only future
            if (aptDate.getDay() !== formData.dayOfWeek) return false;

            const aptTime = getMinutes(apt.time);
            // Check if it fits in new range
            return !(aptTime >= newStart && aptTime < newEnd);
        });

        if (conflicts.length > 0) {
            if (!window.confirm(`Warning: ${conflicts.length} future appointments fall outside this new time range. Proceed?`)) {
                return;
            }
        }
    }

    if (editingId) {
      deleteAvailability(editingId);
    }

    saveAvailability({
        id: editingId || Date.now().toString(),
        doctorId: selectedDoctor,
        ...formData
    });

    handleCancelEdit();
  };

  const handleDeleteClick = (id: string) => {
    const avail = availabilities.find(a => a.id === id);
    if (!avail) return;

    // Check for future appointments in this slot
    const start = getMinutes(avail.startTime);
    const end = getMinutes(avail.endTime);
    
    const conflicts = appointments.filter(apt => {
        if (apt.doctorId !== avail.doctorId || apt.status === 'Cancelled') return false;
        const aptDate = new Date(apt.date);
        if (aptDate < new Date()) return false;
        if (aptDate.getDay() !== avail.dayOfWeek) return false;
        
        const aptTime = getMinutes(apt.time);
        return aptTime >= start && aptTime < end;
    });

    if (conflicts.length > 0) {
        if (!window.confirm(`Warning: There are ${conflicts.length} future appointments scheduled in this slot. Deleting it will orphan them. Proceed?`)) {
            return;
        }
    }
    
    if (window.confirm('Are you sure you want to delete this schedule?')) {
        deleteAvailability(id);
        if (editingId === id) handleCancelEdit();
    }
  };

  const getFutureAppointmentCount = (avail: DoctorAvailability) => {
      const start = getMinutes(avail.startTime);
      const end = getMinutes(avail.endTime);

      return appointments.filter(apt => {
          if (apt.doctorId !== avail.doctorId || apt.status === 'Cancelled') return false;
          const aptDate = new Date(apt.date);
          if (aptDate < new Date()) return false;
          if (aptDate.getDay() !== avail.dayOfWeek) return false;
          
          const aptTime = getMinutes(apt.time);
          return aptTime >= start && aptTime < end;
      }).length;
  };

  const getDoctorAvailability = (docId: string) => {
    return availabilities.filter(a => a.doctorId === docId).sort((a,b) => a.dayOfWeek - b.dayOfWeek);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Configuration Panel */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-blue-600" /> 
            {editingId ? 'Edit Schedule' : 'Manage Schedule'}
        </h2>
        
        <form onSubmit={handleSave} className="space-y-5">
            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    {error}
                </div>
            )}
            <div>
                <label className="form-label">Select Doctor</label>
                <select 
                    className="form-input"
                    value={selectedDoctor}
                    disabled={!!editingId} // Disable doctor selection while editing
                    onChange={e => setSelectedDoctor(e.target.value)}
                >
                    <option value="">-- Choose Doctor --</option>
                    {doctors.map(d => (
                        <option key={d.id} value={d.id}>Dr. {d.firstName} {d.lastName} ({d.specialization})</option>
                    ))}
                </select>
                {editingId && <p className="text-xs text-slate-500 mt-1 italic">Cannot change doctor while editing</p>}
            </div>

            <div className={`transition-opacity duration-300 ${!selectedDoctor ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                <div className="mb-4">
                    <label className="form-label">Day of Week</label>
                    <select 
                        className="form-input"
                        value={formData.dayOfWeek}
                        onChange={e => setFormData({...formData, dayOfWeek: parseInt(e.target.value)})}
                    >
                        {DAYS_OF_WEEK.map((day, idx) => (
                            <option key={idx} value={idx}>{day}</option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="form-label">Start Time</label>
                        <input type="time" className="form-input" value={formData.startTime} 
                            onChange={e => setFormData({...formData, startTime: e.target.value})} />
                    </div>
                    <div>
                        <label className="form-label">End Time</label>
                        <input type="time" className="form-input" value={formData.endTime} 
                            onChange={e => setFormData({...formData, endTime: e.target.value})} />
                    </div>
                </div>

                <div className="mb-6">
                    <label className="form-label">Slot Duration (Minutes)</label>
                    <select className="form-input" value={formData.slotDurationMinutes} 
                        onChange={e => setFormData({...formData, slotDurationMinutes: parseInt(e.target.value)})}>
                        <option value="15">15 Minutes</option>
                        <option value="30">30 Minutes</option>
                        <option value="60">60 Minutes</option>
                    </select>
                </div>

                <div className="flex gap-2">
                    {editingId && (
                        <button 
                            type="button" 
                            onClick={handleCancelEdit}
                            className="flex-1 bg-slate-200 text-slate-700 py-2.5 rounded-lg font-medium hover:bg-slate-300 transition-colors"
                        >
                            Cancel
                        </button>
                    )}
                    <button 
                        type="submit" 
                        className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors flex justify-center items-center"
                    >
                        {editingId ? 'Update Schedule' : 'Save Schedule'}
                    </button>
                </div>
            </div>
        </form>
      </div>

      {/* Preview Panel */}
      <div className="lg:col-span-2">
        {selectedDoctor ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50">
                    <h3 className="font-bold text-slate-800">Current Schedule</h3>
                    <p className="text-sm text-slate-500">Weekly availability for selected doctor</p>
                </div>
                <div className="p-6 grid gap-4">
                    {getDoctorAvailability(selectedDoctor).length === 0 ? (
                        <div className="text-center py-10 text-slate-400">No schedule defined yet.</div>
                    ) : (
                        getDoctorAvailability(selectedDoctor).map(av => (
                            <div 
                                key={av.id} 
                                onClick={() => handleEdit(av)}
                                className={`group flex items-center justify-between p-4 border rounded-xl shadow-sm transition-all cursor-pointer hover:border-blue-400 hover:shadow-md ${editingId === av.id ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-200' : 'border-slate-200 bg-white'}`}
                            >
                                <div className="flex items-center">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mr-4 transition-colors ${editingId === av.id ? 'bg-blue-100 text-blue-700' : 'bg-blue-50 text-blue-600'}`}>
                                        {DAYS_OF_WEEK[av.dayOfWeek].substring(0,3)}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-800">{DAYS_OF_WEEK[av.dayOfWeek]}</p>
                                        <p className="text-sm text-slate-500">{av.slotDurationMinutes} min slots</p>
                                        
                                        {/* Booked Slots Indicator */}
                                        <div className="mt-1 flex items-center gap-1.5">
                                            <Calendar className="w-3 h-3 text-slate-400" />
                                            <span className={`text-xs font-medium ${getFutureAppointmentCount(av) > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                                                {getFutureAppointmentCount(av)} Future Bookings
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="px-4 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-100 flex items-center">
                                        <Clock className="w-3.5 h-3.5 mr-1.5" />
                                        {av.startTime} - {av.endTime}
                                    </div>
                                    <div className={`text-slate-300 group-hover:text-blue-500 transition-colors ${editingId === av.id ? 'text-blue-500' : ''}`}>
                                        <Pencil className="w-4 h-4" />
                                    </div>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleDeleteClick(av.id); }}
                                        className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        ) : (
            <div className="h-full flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                Select a doctor to view their schedule
            </div>
        )}
      </div>
    </div>
  );
};