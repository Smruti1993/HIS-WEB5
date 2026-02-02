import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { MasterEntity } from '../types';
import { Plus, Trash2, Download, Upload, FileUp } from 'lucide-react';

const MasterList = <T extends MasterEntity>({ 
  title, 
  data, 
  onAdd 
}: { 
  title: string, 
  data: T[], 
  onAdd: (item: any) => void 
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', code: '', status: 'Active' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.code) return;
    
    onAdd({
      id: Date.now().toString(),
      ...newItem
    });
    setNewItem({ name: '', code: '', status: 'Active' });
    setIsAdding(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 className="font-semibold text-slate-800">{title}</h3>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg flex items-center transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Add New
        </button>
      </div>
      
      {isAdding && (
        <form onSubmit={handleSubmit} className="p-4 bg-blue-50/50 border-b border-blue-100 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in slide-in-from-top-2">
          <input 
            placeholder={`${title} Name`} 
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={newItem.name}
            onChange={e => setNewItem({...newItem, name: e.target.value})}
          />
          <input 
            placeholder="Code (e.g. DEPT-01)" 
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={newItem.code}
            onChange={e => setNewItem({...newItem, code: e.target.value})}
          />
          <button type="submit" className="bg-blue-600 text-white rounded-lg text-sm font-medium">Save</button>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50">
            <tr>
              <th className="px-6 py-3 font-semibold">Name</th>
              <th className="px-6 py-3 font-semibold">Code</th>
              <th className="px-6 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
               <tr><td colSpan={3} className="px-6 py-4 text-center text-slate-400">No records found.</td></tr>
            ) : (
              data.map((item) => (
                <tr key={item.id} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-3 font-medium text-slate-900">{item.name}</td>
                  <td className="px-6 py-3 font-mono text-slate-500">{item.code}</td>
                  <td className="px-6 py-3">
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-semibold">Active</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const DiagnosisUploader = () => {
    const { masterDiagnoses, uploadMasterDiagnoses, showToast } = useData();
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleDownloadTemplate = () => {
        const csvContent = "data:text/csv;charset=utf-8,Code,Description\nA00,Cholera\nA01,Typhoid and paratyphoid fevers";
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "diagnosis_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target?.result as string;
            if (!text) return;

            const rows = text.split('\n');
            const newDiagnoses = [];
            
            // Skip header (index 0)
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i].trim();
                if (!row) continue;
                
                // Simple CSV split (Note: does not handle commas inside quotes)
                const [code, description] = row.split(',').map(c => c.trim());
                
                if (code && description) {
                    newDiagnoses.push({
                        id: Date.now().toString() + i, // Temp ID generation
                        code,
                        description: description.replace(/^"|"$/g, ''), // Remove potential quotes
                        status: 'Active' as const
                    });
                }
            }

            if (newDiagnoses.length > 0) {
                await uploadMasterDiagnoses(newDiagnoses);
                if(fileInputRef.current) fileInputRef.current.value = '';
            } else {
                showToast('error', 'No valid rows found in CSV.');
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-50/50 gap-4">
                <div>
                    <h3 className="font-semibold text-slate-800">Master Diagnosis List (ICD)</h3>
                    <p className="text-xs text-slate-500 mt-1">Upload standard ICD codes and descriptions here.</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={handleDownloadTemplate}
                        className="text-sm bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg flex items-center transition-colors shadow-sm"
                    >
                        <Download className="w-4 h-4 mr-1.5" /> Template
                    </button>
                    <label className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg flex items-center transition-colors shadow-sm cursor-pointer">
                        <Upload className="w-4 h-4 mr-1.5" /> Upload CSV
                        <input 
                            type="file" 
                            accept=".csv" 
                            className="hidden" 
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                        />
                    </label>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 font-semibold">ICD Code</th>
                            <th className="px-6 py-3 font-semibold">Description</th>
                            <th className="px-6 py-3 font-semibold">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {masterDiagnoses.length === 0 ? (
                            <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-400 italic">No diagnoses found. Upload a CSV to populate.</td></tr>
                        ) : (
                            masterDiagnoses.slice(0, 100).map((item) => (
                                <tr key={item.id} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                                    <td className="px-6 py-3 font-mono font-bold text-slate-700">{item.code}</td>
                                    <td className="px-6 py-3 text-slate-600">{item.description}</td>
                                    <td className="px-6 py-3">
                                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-semibold">Active</span>
                                    </td>
                                </tr>
                            ))
                        )}
                        {masterDiagnoses.length > 100 && (
                            <tr><td colSpan={3} className="px-6 py-3 text-center text-xs text-slate-400 italic">Showing first 100 of {masterDiagnoses.length} records...</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const Masters = () => {
  const { 
    departments, addDepartment, 
    units, addUnit, 
    serviceCentres, addServiceCentre 
  } = useData();

  const [activeTab, setActiveTab] = useState<'departments' | 'units' | 'services' | 'diagnosis'>('departments');

  const tabs = [
    { id: 'departments', label: 'Departments' },
    { id: 'units', label: 'Medical Units' },
    { id: 'services', label: 'Service Centres' },
    { id: 'diagnosis', label: 'Diagnoses (ICD)' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex space-x-1 bg-white p-1 rounded-xl w-fit shadow-sm border border-slate-200">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === tab.id 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="animate-in fade-in duration-500">
        {activeTab === 'departments' && (
          <MasterList title="Department" data={departments} onAdd={addDepartment} />
        )}
        {activeTab === 'units' && (
          <MasterList title="Medical Unit" data={units} onAdd={addUnit} />
        )}
        {activeTab === 'services' && (
          <MasterList title="Service Centre" data={serviceCentres} onAdd={addServiceCentre} />
        )}
        {activeTab === 'diagnosis' && (
            <DiagnosisUploader />
        )}
      </div>
    </div>
  );
};