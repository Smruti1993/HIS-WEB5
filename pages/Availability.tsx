import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { DAYS_OF_WEEK } from '../constants';
import { Clock, Check } from 'lucide-react';

export const Availability = () => {
  const { employees, availabilities, saveAvailability } = useData();
  const doctors = employees.filter(e => e.role === 'Doctor');
  
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [formData, setFormData] = useState({
    dayOfWeek: 1, // Monday
    startTime: '09:00',
    endTime: '17:00',
    slotDurationMinutes: 30
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor) return;

    saveAvailability({
        id: Date.now().toString(),
        doctorId: selectedDoctor,
        ...formData
    });
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
            Manage Schedule
        </h2>
        
        <form onSubmit={handleSave} className="space-y-5">
            <div>
                <label className="form-label">Select Doctor</label>
                <select 
                    className="form-input"
                    value={selectedDoctor}
                    onChange={e => setSelectedDoctor(e.target.value)}
                >
                    <option value="">-- Choose Doctor --</option>
                    {doctors.map(d => (
                        <option key={d.id} value={d.id}>Dr. {d.firstName} {d.lastName} ({d.specialization})</option>
                    ))}
                </select>
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

                <button type="submit" className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                    Save Schedule
                </button>
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
                            <div key={av.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                                <div className="flex items-center">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold mr-4">
                                        {DAYS_OF_WEEK[av.dayOfWeek].substring(0,3)}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-800">{DAYS_OF_WEEK[av.dayOfWeek]}</p>
                                        <p className="text-sm text-slate-500">{av.slotDurationMinutes} min slots</p>
                                    </div>
                                </div>
                                <div className="px-4 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-100 flex items-center">
                                    <Clock className="w-3.5 h-3.5 mr-1.5" />
                                    {av.startTime} - {av.endTime}
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
