import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Employee, EmployeeRole } from '../types';
import { UserPlus, Filter, Pencil, X, AlertTriangle, Power } from 'lucide-react';

export const Employees = () => {
  const { employees, addEmployee, updateEmployee, departments } = useData();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterRole, setFilterRole] = useState<string>('All');
  const [isConfirming, setIsConfirming] = useState(false);

  const initialFormState = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: EmployeeRole.DOCTOR,
    departmentId: '',
    specialization: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  const resetForm = () => {
    setFormData(initialFormState);
    setEditingId(null);
    setIsConfirming(false);
  };

  const toggleForm = () => {
    if (showForm) {
      setShowForm(false);
      resetForm();
    } else {
      setShowForm(true);
    }
  };

  const handleEdit = (emp: Employee) => {
    setFormData({
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      phone: emp.phone,
      role: emp.role,
      departmentId: emp.departmentId || '',
      specialization: emp.specialization || ''
    });
    setEditingId(emp.id);
    setIsConfirming(false);
    setShowForm(true);
    // Smooth scroll to top to see the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleStatus = (emp: Employee) => {
    const newStatus = emp.status === 'Active' ? 'Inactive' : 'Active';
    updateEmployee(emp.id, { status: newStatus });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      if (!isConfirming) {
        setIsConfirming(true);
        return;
      }
      updateEmployee(editingId, formData);
    } else {
      addEmployee({
        id: Date.now().toString(),
        ...formData,
        status: 'Active'
      });
    }
    setShowForm(false);
    resetForm();
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
          onClick={toggleForm}
          className={`${showForm ? 'bg-slate-500 hover:bg-slate-600' : 'bg-blue-600 hover:bg-blue-700'} text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors w-fit`}
        >
          {showForm ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Register Employee'}
        </button>
      </div>

      {showForm && (
        <div className={`bg-white p-6 rounded-2xl shadow-lg border border-slate-200 animate-in slide-in-from-top-4 ${isConfirming ? 'ring-2 ring-yellow-400' : ''}`}>
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
             <h3 className="text-lg font-bold text-slate-800">
                {editingId ? 'Edit Employee Details' : 'New Employee Registration'}
             </h3>
             {isConfirming && (
                 <span className="flex items-center text-sm font-bold text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full animate-pulse">
                     <AlertTriangle className="w-4 h-4 mr-2" /> Confirm Changes?
                 </span>
             )}
          </div>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {/* Form Fields */}
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <select 
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.role}
                  disabled={isConfirming}
                  onChange={e => setFormData({...formData, role: e.target.value as EmployeeRole})}
                >
                  {Object.values(EmployeeRole).map(r => <option key={r} value={r}>{r}</option>)}
                </select>
             </div>
             
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                <input required type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  disabled={isConfirming}
                  value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
             </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                <input required type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  disabled={isConfirming}
                  value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
             </div>

             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                <select 
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.departmentId}
                  disabled={isConfirming}
                  onChange={e => setFormData({...formData, departmentId: e.target.value})}
                >
                  <option value="">Select Department</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
             </div>

             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Specialization</label>
                <input type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  disabled={isConfirming}
                  value={formData.specialization} onChange={e => setFormData({...formData, specialization: e.target.value})} />
             </div>

             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input required type="email" className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  disabled={isConfirming}
                  value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
             </div>

             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <input required type="tel" className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  disabled={isConfirming}
                  value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
             </div>
             
             <div className="md:col-span-2 lg:col-span-3 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => isConfirming ? setIsConfirming(false) : toggleForm()} 
                  className="px-6 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  {isConfirming ? 'Back to Edit' : 'Cancel'}
                </button>
                <button 
                  type="submit" 
                  className={`px-6 py-2 rounded-lg text-white transition-colors shadow-md ${
                      isConfirming 
                      ? 'bg-green-600 hover:bg-green-700 ring-2 ring-green-200' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                    {editingId ? (isConfirming ? 'Yes, Save Changes' : 'Update Changes') : 'Save Employee'}
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
                    <th className="px-6 py-3 text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {filteredEmployees.map(emp => {
                    const dept = departments.find(d => d.id === emp.departmentId);
                    return (
                        <tr key={emp.id} className={`hover:bg-slate-50/50 transition-colors ${emp.status === 'Inactive' ? 'opacity-60 bg-slate-50' : ''}`}>
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
                                <span className={`flex items-center text-xs font-medium ${
                                    emp.status === 'Active' ? 'text-green-700' : 'text-slate-500'
                                }`}>
                                    <span className={`w-2 h-2 rounded-full mr-2 ${
                                        emp.status === 'Active' ? 'bg-green-500' : 'bg-slate-400'
                                    }`}></span> 
                                    {emp.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                    <button 
                                      onClick={() => toggleStatus(emp)}
                                      className={`p-1 rounded-full transition-colors ${
                                        emp.status === 'Active' 
                                          ? 'text-red-400 hover:text-red-600 hover:bg-red-50' 
                                          : 'text-green-400 hover:text-green-600 hover:bg-green-50'
                                      }`}
                                      title={emp.status === 'Active' ? 'Deactivate' : 'Activate'}
                                    >
                                      <Power className="w-4 h-4" />
                                    </button>
                                    <button 
                                      onClick={() => handleEdit(emp)}
                                      className="text-slate-400 hover:text-blue-600 transition-colors p-1 rounded-full hover:bg-blue-50"
                                      title="Edit Employee"
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </button>
                                </div>
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