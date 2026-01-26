import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Search } from 'lucide-react';

export const Patients = () => {
  const { patients, addPatient } = useData();
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    gender: 'Male',
    phone: '',
    email: '',
    address: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addPatient({
      id: Date.now().toString(),
      registrationDate: new Date().toISOString(),
      ...formData
    } as any);
    setShowForm(false);
    setFormData({
        firstName: '', lastName: '', dob: '', gender: 'Male', 
        phone: '', email: '', address: ''
    });
  };

  const filteredPatients = patients.filter(p => 
    p.lastName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Patients</h2>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-lg font-medium shadow-sm transition-colors"
        >
          {showForm ? 'Cancel' : 'New Patient Registration'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-teal-100 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-slate-800 mb-6">Patient Registration</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                    <label className="form-label">First Name</label>
                    <input required className="form-input" value={formData.firstName} 
                        onChange={e => setFormData({...formData, firstName: e.target.value})} />
                </div>
                <div>
                    <label className="form-label">Last Name</label>
                    <input required className="form-input" value={formData.lastName} 
                        onChange={e => setFormData({...formData, lastName: e.target.value})} />
                </div>
                <div>
                    <label className="form-label">Date of Birth</label>
                    <input required type="date" className="form-input" value={formData.dob} 
                        onChange={e => setFormData({...formData, dob: e.target.value})} />
                </div>
                <div>
                    <label className="form-label">Gender</label>
                    <select className="form-input" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                        <option>Male</option><option>Female</option><option>Other</option>
                    </select>
                </div>
                <div>
                    <label className="form-label">Phone</label>
                    <input required type="tel" className="form-input" value={formData.phone} 
                        onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div>
                    <label className="form-label">Email</label>
                    <input type="email" className="form-input" value={formData.email} 
                        onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                    <label className="form-label">Address</label>
                    <textarea className="form-input h-20" value={formData.address} 
                        onChange={e => setFormData({...formData, address: e.target.value})}></textarea>
                </div>
                <div className="md:col-span-2 lg:col-span-3 flex justify-end">
                    <button type="submit" className="bg-teal-600 text-white px-8 py-2.5 rounded-lg font-medium hover:bg-teal-700">Register Patient</button>
                </div>
            </form>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-100">
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" 
                    placeholder="Search by name or phone..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
        <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500">
                <tr>
                    <th className="px-6 py-3 font-semibold">Name</th>
                    <th className="px-6 py-3 font-semibold">Age/Gender</th>
                    <th className="px-6 py-3 font-semibold">Contact</th>
                    <th className="px-6 py-3 font-semibold">Registration Date</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {filteredPatients.map(p => {
                    const age = new Date().getFullYear() - new Date(p.dob).getFullYear();
                    return (
                        <tr key={p.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 font-medium text-slate-900">{p.firstName} {p.lastName}</td>
                            <td className="px-6 py-4 text-slate-600">{age} Y / {p.gender}</td>
                            <td className="px-6 py-4 text-slate-600">{p.phone}</td>
                            <td className="px-6 py-4 text-slate-500">{new Date(p.registrationDate).toLocaleDateString()}</td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
      </div>
    </div>
  );
};
