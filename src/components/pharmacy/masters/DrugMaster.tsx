import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../../../context/DataContext';
import { getSupabase } from '../../../services/supabaseClient';
import { Plus, Pencil, Trash2, Search, Save, X, Pill, ChevronDown } from 'lucide-react';

interface DrugGenericOption {
  id: string;
  genericCode: string;
  genericName: string;
  strength: string;
  strengthUnit?: string;
}

interface DrugMasterRecord {
  id?: string;
  itemId: string;
  itemCode: string;
  drugName: string;
  genericId: string;
  genericName?: string;
  isActive: boolean;
  dosageForm?: string;
  packSize?: number;
  packUnit?: string;
  substitutable?: boolean;
  marginPercent?: number;
  costPrice?: number;
}

const EMPTY: DrugMasterRecord = {
  itemId: '',
  itemCode: '',
  drugName: '',
  genericId: '',
  isActive: true,
  dosageForm: 'tablet',
  packSize: 1,
  packUnit: 'tablets',
  substitutable: true,
  marginPercent: 0,
  costPrice: 0
};

export const DrugMaster: React.FC = () => {
  const { inventoryItems, saveDrugMaster, deleteDrugMaster } = useData();
  const supabase = getSupabase();

  const [records, setRecords] = useState<DrugMasterRecord[]>([]);
  const [generics, setGenerics] = useState<DrugGenericOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<DrugMasterRecord>(EMPTY);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Item search combobox state
  const [itemQuery, setItemQuery] = useState('');
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);

  // Generic search state
  const [genericQuery, setGenericQuery] = useState('');
  const [showGenericDropdown, setShowGenericDropdown] = useState(false);
  const genericRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (itemRef.current && !itemRef.current.contains(e.target as Node)) setShowItemDropdown(false);
      if (genericRef.current && !genericRef.current.contains(e.target as Node)) setShowGenericDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchRecords = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pharmacy_drug_master')
        .select('*, generic:generic_id(generic_name, generic_code, strength, strength_unit)')
        .order('drug_name');
      if (error) throw error;
      setRecords((data || []).map((r: any) => ({
        id: r.id,
        itemId: r.item_id,
        itemCode: r.item_code,
        drugName: r.drug_name,
        genericId: r.generic_id || '',
        genericName: r.generic ? `${r.generic.generic_name} (${r.generic.strength || '—'}${r.generic.strength_unit ? ' ' + r.generic.strength_unit : ''})` : '—',
        isActive: r.is_active !== false,
        dosageForm: r.dosage_form || 'tablet',
        packSize: r.pack_size ? Number(r.pack_size) : 1,
        packUnit: r.pack_unit || 'tablets',
        substitutable: r.substitutable !== false,
        marginPercent: r.margin_percent ? Number(r.margin_percent) : 0,
        costPrice: r.cost_price ? Number(r.cost_price) : 0
      })));
    } finally {
      setLoading(false);
    }
  };

  const fetchGenerics = async () => {
    if (!supabase) return;
    const { data } = await supabase.from('pharmacy_drug_generics').select('id, generic_code, generic_name, strength, strength_unit').eq('is_active', true).order('generic_name');
    setGenerics((data || []).map((g: any) => ({
      id: g.id,
      genericCode: g.generic_code,
      genericName: g.generic_name,
      strength: g.strength || '',
      strengthUnit: g.strength_unit || ''
    })));
  };

  useEffect(() => { fetchRecords(); fetchGenerics(); }, []);

  const openNew = () => { setForm(EMPTY); setItemQuery(''); setGenericQuery(''); setShowForm(true); setError(''); };
  const openEdit = (r: DrugMasterRecord) => {
    setForm({ ...r });
    setItemQuery(r.itemCode);
    const g = generics.find(g => g.id === r.genericId);
    setGenericQuery(g ? `${g.genericName} (${g.strength || '—'}${g.strengthUnit ? ' ' + g.strengthUnit : ''})` : '');
    setShowForm(true);
    setError('');
  };
  const closeForm = () => { setShowForm(false); setError(''); };

  const handleSelectItem = (item: typeof inventoryItems[0]) => {
    setForm(prev => ({ ...prev, itemId: item.id, itemCode: item.itemCode, drugName: item.itemName }));
    setItemQuery(item.itemCode);
    setShowItemDropdown(false);
  };

  const handleSelectGeneric = (g: DrugGenericOption) => {
    setForm(prev => ({ ...prev, genericId: g.id }));
    setGenericQuery(`${g.genericName} (${g.strength || '—'}${g.strengthUnit ? ' ' + g.strengthUnit : ''})`);
    setShowGenericDropdown(false);
  };

  const handleSave = async () => {
    if (!form.itemId || !form.drugName) { setError('Please select a drug from Item Master.'); return; }
    setSaving(true);
    try {
      const success = await saveDrugMaster({
        id: form.id || '',
        itemId: form.itemId,
        itemCode: form.itemCode,
        drugName: form.drugName,
        genericId: form.genericId || '',
        isActive: form.isActive,
        dosageForm: form.dosageForm || 'tablet',
        packSize: Number(form.packSize || 1),
        packUnit: form.packUnit || 'tablets',
        substitutable: form.substitutable !== false,
        marginPercent: Number(form.marginPercent || 0),
        costPrice: Number(form.costPrice || 0)
      });
      if (success) {
          closeForm();
          // We still fetch records to get the joined generic name for the table display
          // since the local state in DataContext might not have the full joined object
          await fetchRecords(); 
      }
    } catch (e: any) {
      setError('Save failed: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const success = await deleteDrugMaster(id);
    if (success) {
        setDeleteConfirm(null);
        await fetchRecords();
    }
  };

  // Filtered item options
  const itemOptions = inventoryItems.filter(i =>
    i.isActive !== false &&
    (i.itemCode.toLowerCase().includes(itemQuery.toLowerCase()) ||
     i.itemName.toLowerCase().includes(itemQuery.toLowerCase()))
  ).slice(0, 20);

  // Filtered generic options
  const genericOptions = generics.filter(g =>
    g.genericName.toLowerCase().includes(genericQuery.toLowerCase()) ||
    g.genericCode.toLowerCase().includes(genericQuery.toLowerCase())
  ).slice(0, 20);

  const filtered = records.filter(r =>
    !search ||
    r.drugName.toLowerCase().includes(search.toLowerCase()) ||
    r.itemCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-violet-100 rounded-lg">
            <Pill className="w-4 h-4 text-violet-600" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-800">Drug Master</h1>
            <p className="text-[10px] text-slate-400">{records.length} drugs registered</p>
          </div>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add Drug
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search drug name or code…"
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-violet-500"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table + Form */}
      <div className="flex gap-3 flex-1 min-h-0">
        {/* Table */}
        <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col min-w-0">
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-400">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 gap-2">
              <Pill className="w-8 h-8" />
              <p className="text-xs text-slate-400">No drugs found. Click "Add Drug" to begin.</p>
            </div>
          ) : (
            <div className="overflow-auto flex-1">
              <table className="w-full text-xs">
                <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Drug Code</th>
                    <th className="px-3 py-2 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Drug Name</th>
                    <th className="px-3 py-2 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Generic Mapped</th>
                    <th className="px-3 py-2 text-center text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                    <th className="px-3 py-2 text-center text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-3 py-2 font-mono font-medium text-slate-700">{r.itemCode}</td>
                      <td className="px-3 py-2 font-medium text-slate-800">{r.drugName}</td>
                      <td className="px-3 py-2">
                        {r.genericId ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 text-[9px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />{r.genericName}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-[10px]">Not mapped</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${r.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                          {r.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex justify-center gap-1">
                          <button onClick={() => openEdit(r)} className="p-1 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {deleteConfirm === r.id ? (
                            <div className="flex gap-0.5">
                              <button onClick={() => handleDelete(r.id!)} className="px-1.5 py-0.5 text-white bg-red-500 hover:bg-red-600 rounded text-[9px] font-bold">Yes</button>
                              <button onClick={() => setDeleteConfirm(null)} className="px-1.5 py-0.5 text-slate-500 bg-slate-100 hover:bg-slate-200 rounded text-[9px] font-bold">No</button>
                            </div>
                          ) : (
                            <button onClick={() => setDeleteConfirm(r.id!)} className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Form Panel */}
        {showForm && (
          <div className="w-80 flex-shrink-0 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
            {/* Form header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-violet-600 to-violet-700 flex-shrink-0">
              <div>
                <p className="text-white text-xs font-semibold">{form.id ? 'Edit' : 'New'} Drug</p>
                <p className="text-violet-200 text-[10px]">Search and map drug to generic</p>
              </div>
              <button onClick={closeForm} className="text-violet-200 hover:text-white p-1 rounded transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {error && <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600">{error}</div>}

              {/* Drug Code — Item Search */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                  Search Drug (Name or Code) <span className="text-red-500">*</span>
                  <span className="ml-1 normal-case font-normal text-slate-400">(from Item Master)</span>
                </label>
                <div className="relative" ref={itemRef}>
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Type item code or name…"
                    className="w-full pl-7 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-500"
                    value={itemQuery}
                    onChange={e => { setItemQuery(e.target.value); setShowItemDropdown(true); }}
                    onFocus={() => setShowItemDropdown(true)}
                  />
                  {showItemDropdown && itemQuery.length > 0 && itemOptions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                      {itemOptions.map(item => (
                        <button
                          key={item.id}
                          type="button"
                          onMouseDown={() => handleSelectItem(item)}
                          className="w-full text-left px-3 py-2 hover:bg-violet-50 transition-colors border-b border-slate-50 last:border-0"
                        >
                          <p className="text-xs font-medium text-slate-800">{item.itemCode}</p>
                          <p className="text-[10px] text-slate-400">{item.itemName}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Drug Name — auto-filled, read-only */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Drug Name</label>
                <div className={`w-full px-2.5 py-1.5 text-xs rounded-lg border ${form.drugName ? 'border-slate-200 bg-slate-50 text-slate-800 font-medium' : 'border-dashed border-slate-200 text-slate-300'}`}>
                  {form.drugName || 'Auto-filled when item is selected'}
                </div>
              </div>

              {/* Generic Mapping */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                  Map to Generic
                  <span className="ml-1 normal-case font-normal text-slate-400">(optional)</span>
                </label>
                <div className="relative" ref={genericRef}>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search generic name or code…"
                    className="w-full pr-7 pl-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-500"
                    value={genericQuery}
                    onChange={e => { setGenericQuery(e.target.value); setShowGenericDropdown(true); if (!e.target.value) setForm(prev => ({ ...prev, genericId: '' })); }}
                    onFocus={() => setShowGenericDropdown(true)}
                  />
                  {showGenericDropdown && genericOptions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                      <button
                        type="button"
                        onMouseDown={() => { setForm(prev => ({ ...prev, genericId: '' })); setGenericQuery(''); setShowGenericDropdown(false); }}
                        className="w-full text-left px-3 py-2 text-[10px] text-slate-400 hover:bg-slate-50 border-b border-slate-100"
                      >
                        — No generic mapping —
                      </button>
                      {genericOptions.map(g => (
                        <button
                          key={g.id}
                          type="button"
                          onMouseDown={() => handleSelectGeneric(g)}
                          className="w-full text-left px-3 py-2 hover:bg-violet-50 transition-colors border-b border-slate-50 last:border-0"
                        >
                          <p className="text-xs font-medium text-slate-800">{g.genericName}</p>
                          <p className="text-[10px] text-slate-400">{g.genericCode}{g.strength ? ` · ${g.strength}${g.strengthUnit ? ' ' + g.strengthUnit : ''}` : ''}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {form.genericId && (
                  <div className="mt-1.5 flex items-center gap-1.5 px-2.5 py-1.5 bg-violet-50 border border-violet-100 rounded-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500 flex-shrink-0" />
                    <span className="text-[10px] text-violet-700 font-medium truncate">{genericQuery}</span>
                    <button type="button" onClick={() => { setForm(prev => ({ ...prev, genericId: '' })); setGenericQuery(''); }} className="ml-auto text-violet-400 hover:text-violet-600">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Dosage Form */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Dosage Form</label>
                <select 
                  className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-violet-500 bg-white" 
                  value={form.dosageForm || 'tablet'} 
                  onChange={e => setForm(prev => ({ ...prev, dosageForm: e.target.value }))}
                >
                  {['tablet', 'capsule', 'syrup', 'cream', 'injection', 'drops', 'inhaler', 'gel'].map(df => (
                    <option key={df} value={df}>{df.charAt(0).toUpperCase() + df.slice(1)}</option>
                  ))}
                </select>
              </div>

              {/* Pack Size & Unit */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Pack Size</label>
                  <input 
                    type="number" 
                    className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-violet-500" 
                    value={form.packSize !== undefined ? form.packSize : 1} 
                    onChange={e => setForm(prev => ({ ...prev, packSize: Number(e.target.value) }))} 
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Pack Unit</label>
                  <input 
                    type="text" 
                    className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-violet-500" 
                    value={form.packUnit || 'tablets'} 
                    onChange={e => setForm(prev => ({ ...prev, packUnit: e.target.value }))} 
                    placeholder="tablets"
                  />
                </div>
              </div>

              {/* Cost Price & Margin % */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Cost Price</label>
                  <input 
                    type="number" 
                    className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-violet-500" 
                    value={form.costPrice !== undefined ? form.costPrice : 0} 
                    onChange={e => setForm(prev => ({ ...prev, costPrice: Number(e.target.value) }))} 
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Margin %</label>
                  <input 
                    type="number" 
                    className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-violet-500" 
                    value={form.marginPercent !== undefined ? form.marginPercent : 0} 
                    onChange={e => setForm(prev => ({ ...prev, marginPercent: Number(e.target.value) }))} 
                    min="0"
                    max="100"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Substitutable toggle */}
              <div className="flex items-center justify-between py-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Substitution Allowed</label>
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, substitutable: prev.substitutable === undefined ? false : !prev.substitutable }))}
                  className={`relative w-10 h-5 rounded-full transition-colors ${form.substitutable !== false ? 'bg-violet-600' : 'bg-slate-200'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.substitutable !== false ? 'translate-x-5' : ''}`} />
                </button>
              </div>

              {/* Active toggle */}
              <div className="flex items-center justify-between py-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Active Status</label>
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, isActive: !prev.isActive }))}
                  className={`relative w-10 h-5 rounded-full transition-colors ${form.isActive ? 'bg-violet-600' : 'bg-slate-200'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.isActive ? 'translate-x-5' : ''}`} />
                </button>
              </div>
            </div>

            {/* Form footer */}
            <div className="flex gap-2 px-4 py-3 border-t border-slate-100 flex-shrink-0 bg-slate-50">
              <button onClick={closeForm} className="flex-1 px-3 py-1.5 border border-slate-200 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-100 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium rounded-lg shadow-sm disabled:opacity-60 transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DrugMaster;
