import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { MasterEntity, ServiceDefinition } from '../types';
import { Plus, Trash2, Download, Upload, FileUp, ChevronLeft, ChevronRight, Search, Save, X, Settings } from 'lucide-react';

const PaginationControls = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  totalItems,
  startIndex,
  endIndex
}: { 
  currentPage: number, 
  totalPages: number, 
  onPageChange: (p: number) => void,
  totalItems: number,
  startIndex: number,
  endIndex: number
}) => {
  if (totalItems === 0) return null;

  return (
    <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
      <span className="text-xs text-slate-500">
        Showing <span className="font-medium text-slate-700">{startIndex + 1}</span> to <span className="font-medium text-slate-700">{Math.min(endIndex, totalItems)}</span> of <span className="font-medium text-slate-700">{totalItems}</span> results
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-medium text-slate-600">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

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
  
  // Pagination & Search State
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPage = 10;

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

  // Filter and Paginate
  const filteredData = useMemo(() => {
    return data.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  // Reset page on search
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
        <h3 className="font-semibold text-slate-800">{title}s</h3>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder={`Search ${title}...`}
              className="w-full pl-9 pr-4 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg flex items-center transition-colors shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Add New
          </button>
        </div>
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

      <div className="overflow-x-auto min-h-[300px]">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50">
            <tr>
              <th className="px-6 py-3 font-semibold">Name</th>
              <th className="px-6 py-3 font-semibold">Code</th>
              <th className="px-6 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {currentData.length === 0 ? (
               <tr><td colSpan={3} className="px-6 py-12 text-center text-slate-400">No records found.</td></tr>
            ) : (
              currentData.map((item) => (
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

      <PaginationControls 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={filteredData.length}
        startIndex={startIndex}
        endIndex={startIndex + itemsPerPage}
      />
    </div>
  );
};

const DiagnosisUploader = () => {
    const { masterDiagnoses, uploadMasterDiagnoses, showToast } = useData();
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const itemsPerPage = 15;

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
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i].trim();
                if (!row) continue;
                const [code, description] = row.split(',').map(c => c.trim());
                if (code && description) {
                    newDiagnoses.push({
                        id: Date.now().toString() + i,
                        code,
                        description: description.replace(/^"|"$/g, ''),
                        status: 'Active' as const
                    });
                }
            }
            if (newDiagnoses.length > 0) {
                await uploadMasterDiagnoses(newDiagnoses);
                if(fileInputRef.current) fileInputRef.current.value = '';
                setCurrentPage(1);
            } else {
                showToast('error', 'No valid rows found in CSV.');
            }
        };
        reader.readAsText(file);
    };

    const filteredData = useMemo(() => {
        return masterDiagnoses.filter(item => 
            item.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
            item.code.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [masterDiagnoses, searchTerm]);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

    React.useEffect(() => { setCurrentPage(1); }, [searchTerm]);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-50/50 gap-4">
                <div>
                    <h3 className="font-semibold text-slate-800">Master Diagnosis List (ICD)</h3>
                    <p className="text-xs text-slate-500 mt-1">Upload standard ICD codes and descriptions.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input 
                          type="text" 
                          placeholder="Search ICD Codes..."
                          className="w-full pl-9 pr-4 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          value={searchTerm}
                          onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 shrink-0">
                        <button onClick={handleDownloadTemplate} className="text-sm bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg flex items-center shadow-sm">
                            <Download className="w-4 h-4 sm:mr-1.5" /> <span className="hidden sm:inline">Template</span>
                        </button>
                        <label className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg flex items-center shadow-sm cursor-pointer">
                            <Upload className="w-4 h-4 sm:mr-1.5" /> <span className="hidden sm:inline">Upload CSV</span>
                            <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                        </label>
                    </div>
                </div>
            </div>
            <div className="overflow-x-auto min-h-[300px]">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 font-semibold">ICD Code</th>
                            <th className="px-6 py-3 font-semibold">Description</th>
                            <th className="px-6 py-3 font-semibold">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentData.length === 0 ? (
                            <tr><td colSpan={3} className="px-6 py-12 text-center text-slate-400 italic">No diagnoses found.</td></tr>
                        ) : (
                            currentData.map((item) => (
                                <tr key={item.id} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                                    <td className="px-6 py-3 font-mono font-bold text-slate-700 w-32">{item.code}</td>
                                    <td className="px-6 py-3 text-slate-600">{item.description}</td>
                                    <td className="px-6 py-3 w-32">
                                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-semibold">Active</span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={filteredData.length} startIndex={startIndex} endIndex={startIndex + itemsPerPage} />
        </div>
    );
};

const ServiceMaster = () => {
    const { serviceDefinitions, saveServiceDefinition } = useData();
    const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const initialFormState: ServiceDefinition = {
        id: '', code: '', name: '', alternateName: '', serviceType: 'Single service', serviceCategory: '', estDuration: 0,
        status: 'Active', chargeable: true, applicableVisitType: 'Both', applicableGender: 'Both',
        reOrderDuration: 0, autoCancellationDays: 0, minTimeBilling: 0, maxTimeBilling: 0, maxOrderableQty: 0,
        cptCode: '', nphiesCode: '', nphiesDesc: '',
        schedulable: false, surgicalService: false, individuallyOrderable: true, autoProcessable: false,
        consentRequired: false, isRestricted: false, isExternal: false, isPercentageTariff: false,
        isToothMandatory: false, isAuthRequired: false,
        groupName: '', billingGroupName: '', financialGroup: '', cptDescription: '', specialInstructions: ''
    };

    const [form, setForm] = useState<ServiceDefinition>(initialFormState);

    const handleEdit = (service: ServiceDefinition) => {
        setForm(service);
        setViewMode('form');
    };

    const handleCreate = () => {
        setForm({ ...initialFormState, id: Date.now().toString() });
        setViewMode('form');
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        saveServiceDefinition(form);
        setViewMode('list');
    };

    const filteredData = useMemo(() => {
        return serviceDefinitions.filter(s => 
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            s.code.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [serviceDefinitions, searchTerm]);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

    // List View Component
    if (viewMode === 'list') {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-semibold text-slate-800">Service Definition</h3>
                    <div className="flex gap-3">
                         <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input 
                                className="pl-9 pr-4 py-1.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500"
                                placeholder="Search services..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button onClick={handleCreate} className="bg-blue-600 text-white text-sm px-4 py-1.5 rounded-lg flex items-center gap-2 hover:bg-blue-700">
                            <Plus className="w-4 h-4" /> Add New
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 font-semibold">Code</th>
                                <th className="px-6 py-3 font-semibold">Name</th>
                                <th className="px-6 py-3 font-semibold">Type</th>
                                <th className="px-6 py-3 font-semibold">Category</th>
                                <th className="px-6 py-3 font-semibold">Status</th>
                                <th className="px-6 py-3 font-semibold text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {currentData.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">No services defined.</td></tr>
                            ) : (
                                currentData.map((s) => (
                                    <tr key={s.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-mono font-medium text-slate-700">{s.code}</td>
                                        <td className="px-6 py-4 font-medium text-slate-900">{s.name}</td>
                                        <td className="px-6 py-4 text-slate-600">{s.serviceType}</td>
                                        <td className="px-6 py-4 text-slate-600">{s.serviceCategory}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${s.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                                {s.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => handleEdit(s)} className="text-blue-600 hover:underline">Edit</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={filteredData.length} startIndex={startIndex} endIndex={startIndex + itemsPerPage} />
            </div>
        );
    }

    // Form View Component (Matches Screenshot)
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full animate-in slide-in-from-right-4">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 flex justify-between items-center text-white shrink-0">
                <h3 className="font-bold text-lg flex items-center gap-2">
                    <Settings className="w-5 h-5" /> Service Definition
                </h3>
                <button onClick={() => setViewMode('list')} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>
            
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                {/* Top Section */}
                <div className="grid grid-cols-12 gap-6 mb-6">
                    {/* Left Column Fields */}
                    <div className="col-span-12 md:col-span-9 grid grid-cols-3 gap-x-6 gap-y-4">
                        <div className="col-span-1">
                            <label className="form-label">Service Code<span className="text-red-500">*</span></label>
                            <input required className="form-input" value={form.code} onChange={e => setForm({...form, code: e.target.value})} />
                        </div>
                        <div className="col-span-1">
                            <label className="form-label">Service Name<span className="text-red-500">*</span></label>
                            <input required className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                        </div>
                        <div className="col-span-1">
                            <label className="form-label">Alternate Name</label>
                            <input className="form-input" value={form.alternateName} onChange={e => setForm({...form, alternateName: e.target.value})} />
                        </div>

                        <div className="col-span-1">
                            <label className="form-label">Service Type<span className="text-red-500">*</span></label>
                            <select className="form-input" value={form.serviceType} onChange={e => setForm({...form, serviceType: e.target.value})}>
                                <option>Single service</option>
                                <option>Package</option>
                                <option>Consultation</option>
                            </select>
                        </div>
                        <div className="col-span-1">
                            <label className="form-label">Service Category</label>
                            <select className="form-input" value={form.serviceCategory} onChange={e => setForm({...form, serviceCategory: e.target.value})}>
                                <option value="">-- Select --</option>
                                <option>Radiology</option>
                                <option>Laboratory</option>
                                <option>Procedure</option>
                                <option>Dental</option>
                            </select>
                        </div>
                        <div className="col-span-1 flex gap-2">
                             <div className="flex-1">
                                <label className="form-label">Est Duration</label>
                                <input type="number" className="form-input" value={form.estDuration} onChange={e => setForm({...form, estDuration: parseInt(e.target.value) || 0})} />
                             </div>
                             <div className="w-20 pt-6 text-sm text-slate-500">Minutes</div>
                        </div>

                        <div className="col-span-1">
                            <label className="form-label">Re-Order Duration</label>
                            <div className="flex gap-2">
                                <input type="number" className="form-input" value={form.reOrderDuration} onChange={e => setForm({...form, reOrderDuration: parseInt(e.target.value) || 0})} />
                                <select className="form-input w-32"><option>Days</option></select>
                            </div>
                        </div>
                        <div className="col-span-1">
                            <label className="form-label">Mnemonics</label>
                            <input className="form-input" />
                        </div>
                         <div className="col-span-1">
                            <label className="form-label">Applicable Gender</label>
                            <select className="form-input" value={form.applicableGender} onChange={e => setForm({...form, applicableGender: e.target.value as any})}>
                                <option>Both</option><option>Male</option><option>Female</option>
                            </select>
                        </div>

                        <div className="col-span-1">
                            <label className="form-label">Auto Cancellation</label>
                            <div className="flex gap-2">
                                <input type="number" className="form-input" value={form.autoCancellationDays} onChange={e => setForm({...form, autoCancellationDays: parseInt(e.target.value) || 0})} />
                                <span className="pt-2 text-sm text-slate-500">Days</span>
                            </div>
                        </div>
                        <div className="col-span-1">
                            <label className="form-label">Max Time For Hourly Billing</label>
                            <div className="flex gap-2">
                                <input type="number" className="form-input" value={form.maxTimeBilling} onChange={e => setForm({...form, maxTimeBilling: parseInt(e.target.value) || 0})} />
                                <span className="pt-2 text-sm text-slate-500">Hours</span>
                            </div>
                        </div>
                        <div className="col-span-1">
                            <label className="form-label">Applicable Visit Type</label>
                            <select className="form-input" value={form.applicableVisitType} onChange={e => setForm({...form, applicableVisitType: e.target.value as any})}>
                                <option>Both</option><option>New</option><option>Follow-up</option>
                            </select>
                        </div>

                        <div className="col-span-1">
                            <label className="form-label">Min Time For Billing</label>
                             <div className="flex gap-2">
                                <input type="number" className="form-input" value={form.minTimeBilling} onChange={e => setForm({...form, minTimeBilling: parseInt(e.target.value) || 0})} />
                                <span className="pt-2 text-sm text-slate-500">Minutes</span>
                            </div>
                        </div>
                         <div className="col-span-1">
                            <label className="form-label">Max Orderable Qty</label>
                            <input type="number" className="form-input" value={form.maxOrderableQty} onChange={e => setForm({...form, maxOrderableQty: parseInt(e.target.value) || 0})} />
                        </div>
                         <div className="col-span-1">
                            <label className="form-label">NphiesServType</label>
                            <select className="form-input"><option>-- Select --</option></select>
                        </div>
                    </div>

                    {/* Right Column Checkboxes */}
                    <div className="col-span-12 md:col-span-3 space-y-3 bg-white p-4 rounded-lg border border-slate-200 h-fit">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={form.status === 'Active'} onChange={e => setForm({...form, status: e.target.checked ? 'Active' : 'Inactive'})} className="rounded text-blue-600" /> 
                            <span className="font-bold text-sm text-slate-700">Active</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={form.chargeable} onChange={e => setForm({...form, chargeable: e.target.checked})} className="rounded text-blue-600" /> 
                            <span className="font-bold text-sm text-slate-700">Chargeable</span>
                        </label>
                        <hr className="border-slate-100 my-2" />
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Configurations</div>
                        
                        {[
                            { k: 'schedulable', l: 'Schedulable' },
                            { k: 'surgicalService', l: 'Surgical Service' },
                            { k: 'individuallyOrderable', l: 'Individually Orderable' },
                            { k: 'autoProcessable', l: 'Auto Processable' },
                            { k: 'consentRequired', l: 'Consent Required' },
                            { k: 'isRestricted', l: 'Is Restricted' },
                            { k: 'isExternal', l: 'Is External Service' },
                            { k: 'isPercentageTariff', l: 'Is Percentage Tariff' },
                            { k: 'isToothMandatory', l: 'Is Tooth No Mandatory' },
                            { k: 'isAuthRequired', l: 'Is Authorization Required' },
                        ].map(c => (
                            <label key={c.k} className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={(form as any)[c.k]} 
                                    onChange={e => setForm({...form, [c.k]: e.target.checked})}
                                    className="rounded text-blue-600"
                                /> 
                                <span className="text-sm text-slate-600">{c.l}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-4">
                     <div>
                        <label className="form-label">Group Name<span className="text-red-500">*</span></label>
                        <div className="flex gap-2">
                             <input className="form-input flex-1" value={form.groupName} onChange={e => setForm({...form, groupName: e.target.value})} />
                             <button type="button" className="p-2 bg-slate-100 rounded border border-slate-300"><Search className="w-4 h-4 text-slate-500" /></button>
                        </div>
                     </div>
                     <div>
                        <label className="form-label">Billing Group Name<span className="text-red-500">*</span></label>
                        <div className="flex gap-2">
                             <input className="form-input flex-1" value={form.billingGroupName} onChange={e => setForm({...form, billingGroupName: e.target.value})} />
                             <button type="button" className="p-2 bg-slate-100 rounded border border-slate-300"><Search className="w-4 h-4 text-slate-500" /></button>
                        </div>
                     </div>
                      <div>
                        <label className="form-label">Financial Group</label>
                        <div className="flex gap-2">
                             <input className="form-input flex-1" value={form.financialGroup} onChange={e => setForm({...form, financialGroup: e.target.value})} />
                             <button type="button" className="p-2 bg-slate-100 rounded border border-slate-300"><Search className="w-4 h-4 text-slate-500" /></button>
                        </div>
                     </div>
                     
                     <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="form-label">CPT Description</label>
                            <textarea className="form-input h-20" value={form.cptDescription} onChange={e => setForm({...form, cptDescription: e.target.value})}></textarea>
                         </div>
                         <div>
                            <label className="form-label">Special Instruction</label>
                            <textarea className="form-input h-20" value={form.specialInstructions} onChange={e => setForm({...form, specialInstructions: e.target.value})}></textarea>
                         </div>
                     </div>
                </div>
            </form>

            <div className="bg-white border-t border-slate-200 p-4 flex justify-end gap-3 shrink-0">
                <button onClick={() => setViewMode('list')} className="px-6 py-2 border border-slate-300 rounded-lg text-slate-600 font-bold hover:bg-slate-50">Close</button>
                <button onClick={handleSave} className="px-8 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-md">Save</button>
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

  const [activeTab, setActiveTab] = useState<'departments' | 'units' | 'services' | 'diagnosis' | 'serviceMaster'>('departments');

  const tabs = [
    { id: 'departments', label: 'Departments' },
    { id: 'units', label: 'Medical Units' },
    { id: 'services', label: 'Service Centres' },
    { id: 'diagnosis', label: 'Diagnoses (ICD)' },
    { id: 'serviceMaster', label: 'Service Master' },
  ];

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex space-x-1 bg-white p-1 rounded-xl w-fit shadow-sm border border-slate-200 overflow-x-auto max-w-full shrink-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 animate-in fade-in duration-500">
        {activeTab === 'departments' && <MasterList title="Department" data={departments} onAdd={addDepartment} />}
        {activeTab === 'units' && <MasterList title="Medical Unit" data={units} onAdd={addUnit} />}
        {activeTab === 'services' && <MasterList title="Service Centre" data={serviceCentres} onAdd={addServiceCentre} />}
        {activeTab === 'diagnosis' && <DiagnosisUploader />}
        {activeTab === 'serviceMaster' && <ServiceMaster />}
      </div>
    </div>
  );
};