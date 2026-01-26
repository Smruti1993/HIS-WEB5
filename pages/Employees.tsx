import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { EmployeeRole } from '../types';
import { UserPlus, Filter } from 'lucide-react';

export const Employees = () => {
  const { employees, addEmployee, departments } = useData();
  const [showForm, setShowForm] = useState(false);
  const [filterRole, setFilterRole] = useState<string>('All');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: EmployeeRole.DOCTOR,
    departmentId: '',
    specialization: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addEmployee({
      id: Date.now().toString(),
      ...formData,
      status: 'Active'
    });
    setShowForm(false);
    setFormData({
        firstName: '', lastName: '', email: '', phone: '', 
        role: EmployeeRole.DOCTOR, departmentId: '', specialization: ''
    });
  };

  const filteredEmployees = filterRole === 'All' 
    ? employees 
    : employees.filter(e => e.role === filterRole);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">Doctors & Staff</h2>
           <p className="text-slate-500 text-sm">Manage hospital personnel</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors w-fit"
        >
          <UserPlus className="w-4 h-4" />
          {showForm ? 'Cancel Registration' : 'Register Employee'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 animate-in slide-in-from-top-4">
          <h3 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">New Employee Registration</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {/* Form Fields */}
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <select 
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value as EmployeeRole})}
                >
                  {Object.values(EmployeeRole).map(r => <option key={r} value={r}>{r}</option>)}
                </select>
             </div>
             
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                <input required type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
             </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                <input required type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
             </div>

             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                <select 
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.departmentId}
                  onChange={e => setFormData({...formData, departmentId: e.target.value})}
                >
                  <option value="">Select Department</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
             </div>

             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Specialization</label>
                <input type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.specialization} onChange={e => setFormData({...formData, specialization: e.target.value})} />
             </div>

             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input required type="email" className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
             </div>

             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <input required type="tel" className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
             </div>
             
             <div className="md:col-span-2 lg:col-span-3 flex justify-end">
                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Save Employee
                </button>
             </div>
          </form>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-4 h-4 text-slate-500" />
        <div className="flex space-x-2">
            {['All', 'Doctor', 'Nurse', 'Admin'].map(r => (
                <button 
                  key={r}
                  onClick={() => setFilterRole(r)}
                  className={`px-3 py-1 text-xs rounded-full border transition-all ${
                      filterRole === r 
                      ? 'bg-slate-800 text-white border-slate-800' 
                      : 'bg-white text-slate-600 border-slate-300 hover:border-slate-500'
                  }`}
                >
                    {r}
                </button>
            ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Role</th>
                    <th className="px-6 py-3">Department</th>
                    <th className="px-6 py-3">Contact</th>
                    <th className="px-6 py-3">Status</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {filteredEmployees.map(emp => {
                    const dept = departments.find(d => d.id === emp.departmentId);
                    return (
                        <tr key={emp.id} className="hover:bg-slate-50/50">
                            <td className="px-6 py-4">
                                <div className="font-medium text-slate-900">{emp.firstName} {emp.lastName}</div>
                                <div className="text-xs text-slate-500">{emp.specialization}</div>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    emp.role === 'Doctor' ? 'bg-blue-100 text-blue-800' :
                                    emp.role === 'Nurse' ? 'bg-pink-100 text-pink-800' :
                                    'bg-gray-100 text-gray-800'
                                }`}>
                                    {emp.role}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-slate-600">{dept?.name || '-'}</td>
                            <td className="px-6 py-4 text-slate-600">
                                <div>{emp.email}</div>
                                <div className="text-xs text-slate-400">{emp.phone}</div>
                            </td>
                            <td className="px-6 py-4">
                                <span className="text-green-600 flex items-center text-xs font-medium">
                                    <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span> Active
                                </span>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
      </div>
    </div>
  );
};
