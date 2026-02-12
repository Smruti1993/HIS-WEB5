import React, { useState, useRef } from 'react';
import { useData } from '../context/DataContext';
import { MasterEntity, ServiceDefinition, ServiceTariff } from '../types';
import { Plus, Search, Save, X, FileSpreadsheet, Download, FileDown } from 'lucide-react';
import * as XLSX from 'xlsx';

// --- Helper for Downloads ---
const downloadTemplate = (type: 'diagnosis' | 'service') => {
    const data = type === 'diagnosis' 
        ? [{ 'ICD Code': 'A00.0', 'Description': 'Cholera due to Vibrio cholerae 01, biovar cholerae' }]
        : [{ 
            'Code': 'SVC001', 
            'Name': 'General Consultation', 
            'Category': 'Consultation', 
            'Type': 'Single service', 
            'Price': 50.00,
            'Schedulable': true,
            'Surgical': false 
          }];

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, `${type}_upload_template.xlsx`);
};

// --- Generic Component for Simple Masters ---
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
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
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

// --- Diagnosis Master Component ---
const DiagnosisMaster = () => {
    const { masterDiagnoses, uploadMasterDiagnoses, isLoading } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws) as any[];
            
            const mapped = data.map((row: any) => ({
                id: Date.now().toString() + Math.random(),
                code: row['ICD Code'] || row['Code'] || '',
                description: row['Description'] || row['Diagnosis'] || '',
                status: 'Active' as const
            })).filter(d => d.code && d.description);

            if (mapped.length > 0) {
                uploadMasterDiagnoses(mapped);
            }
        };
        reader.readAsBinaryString(file);
    };

    const filtered = masterDiagnoses.filter(d => 
        d.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
        d.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[calc(100vh-200px)] animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center bg-slate-50/50 gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <h3 className="font-bold text-slate-800 whitespace-nowrap">Diagnosis (ICD-10)</h3>
                    <div className="relative w-full md:w-64">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            className="pl-9 pr-4 py-1.5 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 w-full"
                            placeholder="Search code or description..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto justify-end">
                    <button 
                        onClick={() => downloadTemplate('diagnosis')}
                        className="flex items-center gap-2 px-3 py-2 bg-white text-slate-700 rounded-lg border border-slate-300 hover:bg-slate-50 hover:text-blue-600 transition-colors text-xs font-bold"
                    >
                        <FileDown className="w-4 h-4" /> Download Template
                    </button>
                    <input 
                        type="file" 
                        accept=".xlsx, .xls" 
                        className="hidden" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                    />
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition-colors"
                        disabled={isLoading}
                    >
                        <FileSpreadsheet className="w-4 h-4" /> Import Excel
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-100 text-slate-600 sticky top-0 z-10">
                        <tr>
                            <th className="px-6 py-3 font-semibold w-32">ICD Code</th>
                            <th className="px-6 py-3 font-semibold">Description</th>
                            <th className="px-6 py-3 font-semibold w-24">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filtered.length === 0 ? (
                            <tr><td colSpan={3} className="px-6 py-12 text-center text-slate-400">No diagnoses found. Import from Excel.</td></tr>
                        ) : (
                            filtered.map((d, i) => (
                                <tr key={i} className="hover:bg-slate-50">
                                    <td className="px-6 py-2 font-mono font-bold text-blue-700">{d.code}</td>
                                    <td className="px-6 py-2 text-slate-700">{d.description}</td>
                                    <td className="px-6 py-2">
                                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold">Active</span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <div className="p-2 border-t border-slate-200 text-xs text-slate-500 text-center bg-slate-50">
                Showing {filtered.length} records
            </div>
        </div>
    );
};

// --- Service Master Component ---
const ServiceMaster = () => {
    const { serviceDefinitions, serviceTariffs, saveServiceDefinition, uploadServiceDefinitions, isLoading } = useData();
    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initial Form State
    const initialForm: ServiceDefinition = {
        id: '',
        code: '',
        name: '',
        alternateName: '',
        serviceType: 'Single service',
        serviceCategory: 'General',
        status: 'Active',
        chargeable: true,
        applicableVisitType: 'Both',
        applicableGender: 'Both',
        schedulable: false,
        surgicalService: false,
        individuallyOrderable: true,
        autoProcessable: false,
        consentRequired: false,
        isRestricted: false,
        isExternal: false,
        isPercentageTariff: false,
        isToothMandatory: false,
        isAuthRequired: false,
        estDuration: 0,
        tariffs: []
    };

    const [form, setForm] = useState<ServiceDefinition>(initialForm);
    const [price, setPrice] = useState<string>('');

    const handleEdit = (s: ServiceDefinition) => {
        setForm(s);
        // Extract price from separate tariff list
        const tariff = serviceTariffs.find(t => t.serviceId === s.id);
        if (tariff) {
            setPrice(tariff.price.toString());
        } else {
            setPrice('');
        }
        setShowForm(true);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        const newId = form.id || Date.now().toString();
        
        // Handle basic tariff (Self Pay)
        const tariff: ServiceTariff = {
            id: Date.now().toString() + '_t',
            serviceId: newId,
            tariffName: 'Self Pay',
            price: parseFloat(price) || 0,
            effectiveDate: new Date().toISOString(),
            status: 'Active'
        };

        const payload: ServiceDefinition = {
            ...form,
            id: newId,
            tariffs: [tariff]
        };

        saveServiceDefinition(payload);
        setShowForm(false);
        setForm(initialForm);
        setPrice('');
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws) as any[];
            
            const mapped: ServiceDefinition[] = data.map((row: any) => ({
                id: Date.now().toString() + Math.random(),
                code: row['Code'] || '',
                name: row['Name'] || '',
                serviceType: row['Type'] || 'Single service',
                serviceCategory: row['Category'] || 'General',
                status: 'Active' as const,
                chargeable: true,
                applicableVisitType: 'Both' as const,
                applicableGender: 'Both' as const,
                schedulable: !!row['Schedulable'],
                surgicalService: !!row['Surgical'],
                individuallyOrderable: true,
                autoProcessable: false,
                consentRequired: false,
                isRestricted: false,
                isExternal: false,
                isPercentageTariff: false,
                isToothMandatory: false,
                isAuthRequired: false,
                tariffs: [{
                    id: Date.now().toString() + Math.random(),
                    serviceId: '', 
                    tariffName: 'Self Pay',
                    price: parseFloat(row['Price']) || 0,
                    effectiveDate: new Date().toISOString(),
                    status: 'Active' as const
                }]
            })).filter(s => s.code && s.name);

            if (mapped.length > 0) {
                uploadServiceDefinitions(mapped);
            }
        };
        reader.readAsBinaryString(file);
    };

    const filtered = serviceDefinitions.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex gap-6 h-[calc(100vh-200px)] animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* List Section */}
            <div className={`flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col ${showForm ? 'hidden md:flex' : ''}`}>
                <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center bg-slate-50/50 gap-4">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <h3 className="font-bold text-slate-800 whitespace-nowrap">Service Master</h3>
                        <div className="relative w-full md:w-64">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                className="pl-9 pr-4 py-1.5 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 w-full"
                                placeholder="Search service..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto justify-end">
                        <button 
                            onClick={() => downloadTemplate('service')}
                            className="flex items-center gap-2 px-3 py-2 bg-white text-slate-700 rounded-lg border border-slate-300 hover:bg-slate-50 hover:text-blue-600 transition-colors text-xs font-bold"
                        >
                            <FileDown className="w-4 h-4" /> Download Template
                        </button>
                        <input 
                            type="file" 
                            accept=".xlsx, .xls" 
                            className="hidden" 
                            ref={fileInputRef} 
                            onChange={handleFileUpload} 
                        />
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition-colors"
                            disabled={isLoading}
                        >
                            <FileSpreadsheet className="w-4 h-4" /> Import Excel
                        </button>
                        <button 
                            onClick={() => { setForm(initialForm); setPrice(''); setShowForm(true); }}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition-colors"
                        >
                            <Plus className="w-4 h-4" /> Add Service
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-100 text-slate-600 sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-3 font-semibold">Code</th>
                                <th className="px-6 py-3 font-semibold">Service Name</th>
                                <th className="px-6 py-3 font-semibold">Category</th>
                                <th className="px-6 py-3 font-semibold">Type</th>
                                <th className="px-6 py-3 font-semibold text-right">Price (Est.)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.map((s, i) => {
                                // Find price from tariffs list
                                const tariff = serviceTariffs.find(t => t.serviceId === s.id);
                                const displayPrice = tariff ? tariff.price.toFixed(2) : '-';

                                return (
                                <tr key={i} onClick={() => handleEdit(s)} className="hover:bg-blue-50 cursor-pointer transition-colors">
                                    <td className="px-6 py-2 font-mono font-bold text-blue-700">{s.code}</td>
                                    <td className="px-6 py-2 font-medium text-slate-800">{s.name}</td>
                                    <td className="px-6 py-2 text-slate-600">{s.serviceCategory}</td>
                                    <td className="px-6 py-2 text-slate-500">{s.serviceType}</td>
                                    <td className="px-6 py-2 text-right font-mono font-bold text-green-700">
                                        {displayPrice}
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Form Section */}
            {showForm && (
                <div className="w-full md:w-[450px] bg-white rounded-2xl shadow-xl border border-slate-200 flex flex-col animate-in slide-in-from-right-10 duration-300">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
                        <h3 className="font-bold text-slate-800">
                            {form.id ? 'Edit Service' : 'New Service'}
                        </h3>
                        <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        <div>
                            <label className="form-label">Service Code</label>
                            <input 
                                className="form-input font-mono" 
                                value={form.code}
                                onChange={e => setForm({...form, code: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="form-label">Service Name</label>
                            <input 
                                className="form-input" 
                                value={form.name}
                                onChange={e => setForm({...form, name: e.target.value})}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="form-label">Category</label>
                                <select 
                                    className="form-input"
                                    value={form.serviceCategory}
                                    onChange={e => setForm({...form, serviceCategory: e.target.value})}
                                >
                                    <option>General</option>
                                    <option>Consultation</option>
                                    <option>Laboratory</option>
                                    <option>Radiology</option>
                                    <option>Procedure</option>
                                </select>
                            </div>
                            <div>
                                <label className="form-label">Type</label>
                                <select 
                                    className="form-input"
                                    value={form.serviceType}
                                    onChange={e => setForm({...form, serviceType: e.target.value})}
                                >
                                    <option>Single service</option>
                                    <option>Package</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="form-label">Base Price (Self Pay)</label>
                            <input 
                                type="number"
                                className="form-input text-right font-mono" 
                                placeholder="0.00"
                                value={price}
                                onChange={e => setPrice(e.target.value)}
                            />
                        </div>
                        
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Settings</h4>
                            <div className="grid grid-cols-2 gap-y-2">
                                {[
                                    { k: 'schedulable', l: 'Schedulable' },
                                    { k: 'surgicalService', l: 'Surgical Service' },
                                    { k: 'individuallyOrderable', l: 'Individually Orderable' },
                                    { k: 'autoProcessable', l: 'Auto Processable' },
                                    { k: 'consentRequired', l: 'Consent Required' },
                                    { k: 'isRestricted', l: 'Is Restricted' },
                                    { k: 'isExternal', l: 'Is External Service' },
                                    { k: 'isPercentageTariff', l: 'Is Percentage Tariff' },
                                    { k: 'isToothMandatory', l: 'Is Tooth Mandatory' },
                                    { k: 'isAuthRequired', l: 'Is Auth Required' },
                                ].map(c => (
                                    <label key={c.k} className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={(form as any)[c.k]} 
                                            onChange={e => setForm({...form, [c.k]: e.target.checked})}
                                            className="rounded text-blue-600"
                                        /> 
                                        <span className="text-xs text-slate-600 font-medium">{c.l}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-2xl">
                        <button onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
                        <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold shadow-sm transition-colors">Save</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export const Masters = () => {
  const { 
    departments, addDepartment, 
    units, addUnit, 
    serviceCentres, addServiceCentre 
  } = useData();

  const [activeTab, setActiveTab] = useState<'departments' | 'units' | 'services' | 'diagnosis' | 'service_defs'>('departments');

  const tabs = [
    { id: 'departments', label: 'Departments' },
    { id: 'units', label: 'Medical Units' },
    { id: 'services', label: 'Service Locations' }, // Renamed from Service Centres to clarify
    { id: 'diagnosis', label: 'Diagnosis (ICD)' },
    { id: 'service_defs', label: 'Service Master' }, // Renamed from Service Definitions to clarify
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 bg-white p-1.5 rounded-xl w-fit shadow-sm border border-slate-200">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
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
          <MasterList title="Service Location" data={serviceCentres} onAdd={addServiceCentre} />
        )}
        {activeTab === 'diagnosis' && (
            <DiagnosisMaster />
        )}
        {activeTab === 'service_defs' && (
            <ServiceMaster />
        )}
      </div>
    </div>
  );
};