import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { getAuthToken, BACKEND_URL } from '../../services/supabaseClient';
import { 
  AlertTriangle, 
  CheckCircle, 
  HelpCircle, 
  Calendar, 
  PlusCircle, 
  AlertCircle, 
  ShieldAlert, 
  RotateCw, 
  Search,
  Filter,
  FileText,
  User,
  ArrowRight,
  Upload,
  Layers,
  FileSpreadsheet,
  Check
} from 'lucide-react';

export const ReconciliationReview: React.FC = () => {
  const { 
    stores, 
    showToast, 
    formatCurrency, 
    declareOutageEmpty, 
    uploadOfflineBacklogExcel, 
    submitManualOfflineSale, 
    completeManualReconciliation, 
    fetchBatchDetails, 
    inventoryItems, 
    storeItemMappings 
  } = useData();

  const [activeTab, setActiveTab] = useState<'offline_backlog' | 'negative_balance'>('offline_backlog');
  
  // Store Selection & Status
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [localStoreStatus, setLocalStoreStatus] = useState<string>('');
  const [checkingStoreStatus, setCheckingStoreStatus] = useState<boolean>(false);

  // Negative balance states
  const [flaggedEntries, setFlaggedEntries] = useState<any[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Offline Backlog States
  const [reconciliationFile, setReconciliationFile] = useState<File | null>(null);
  const [reconciliationUploading, setReconciliationUploading] = useState<boolean>(false);
  const [reconciliationResult, setReconciliationResult] = useState<{ inserted: number; flagged: number; rows: any[] } | null>(null);
  
  // Option 3 Manual Entry States
  const [manualItemSearch, setManualItemSearch] = useState<string>('');
  const [manualItemDropdownOpen, setManualItemDropdownOpen] = useState<boolean>(false);
  const [manualSaleRow, setManualSaleRow] = useState({
    itemId: '',
    batchNo: '',
    quantity: 1,
    unitPrice: 0,
    transactionDate: '',
    refDocDate: '',
    referenceNo: '',
    patientName: '',
    patientExternalId: '',
    dispensedBy: '',
    paymentMode: 'Cash'
  });
  const [manualSaleBatches, setManualSaleBatches] = useState<any[]>([]);
  const [manualSaleSubmitting, setManualSaleSubmitting] = useState<boolean>(false);

  // Modals state (Negative balance resolutions)
  const [correctDateModal, setCorrectDateModal] = useState<{
    open: boolean;
    entry?: any;
    newDate: string;
    reason: string;
    reference: string;
    submitting: boolean;
  }>({ open: false, newDate: '', reason: '', reference: '', submitting: false });

  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    entry?: any;
    note: string;
    submitting: boolean;
  }>({ open: false, note: '', submitting: false });

  const [adjustModal, setAdjustModal] = useState<{
    open: boolean;
    entry?: any;
    qty: number;
    note: string;
    submitting: boolean;
  }>({ open: false, qty: 0, note: '', submitting: false });

  const [escalateModal, setEscalateModal] = useState<{
    open: boolean;
    entry?: any;
    note: string;
    submitting: boolean;
  }>({ open: false, note: '', submitting: false });

  // Fetch store status
  const checkStatus = async (storeId: string) => {
    if (!storeId) return;
    try {
      setCheckingStoreStatus(true);
      const token = await getAuthToken();
      const res = await fetch(`${BACKEND_URL}/api/pharmacy/store-status/${storeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLocalStoreStatus(data.status);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCheckingStoreStatus(false);
    }
  };

  useEffect(() => {
    if (selectedStore) {
      checkStatus(selectedStore);
      setReconciliationResult(null);
      setReconciliationFile(null);
      resetManualRow();
    } else {
      setLocalStoreStatus('');
    }
  }, [selectedStore]);

  const resetManualRow = () => {
    setManualSaleRow({
      itemId: '',
      batchNo: '',
      quantity: 1,
      unitPrice: 0,
      transactionDate: '',
      refDocDate: '',
      referenceNo: '',
      patientName: '',
      patientExternalId: '',
      dispensedBy: '',
      paymentMode: 'Cash'
    });
    setManualItemSearch('');
    setManualSaleBatches([]);
  };

  // Fetch flagged records
  const fetchFlagged = async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      
      let url = `${BACKEND_URL}/api/pharmacy/reconciliation/flagged-all`;
      const params = new URLSearchParams();
      if (selectedStore) params.append('storeId', selectedStore);
      if (selectedStatus) params.append('status', selectedStatus);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        throw new Error('Failed to fetch flagged reconciliations.');
      }
      const data = await res.json();
      setFlaggedEntries(data.flagged || []);
    } catch (err: any) {
      console.error(err);
      showToast('error', err.message || 'Error fetching data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlagged();
  }, [selectedStore, selectedStatus]);

  // Statistics calculation
  const stats = {
    open: flaggedEntries.filter(e => e.reconciliation_status === 'open').length,
    pending: flaggedEntries.filter(e => e.reconciliation_status === 'pending_confirmation').length,
    underReview: flaggedEntries.filter(e => e.reconciliation_status === 'under_review').length,
    resolved: flaggedEntries.filter(e => e.reconciliation_status === 'resolved').length,
  };

  // Submit Date Correction
  const handleCorrectDate = async () => {
    const { entry, newDate, reason, reference } = correctDateModal;
    if (!newDate) {
      showToast('error', 'Please select a new transaction date.');
      return;
    }
    if (!reason.trim()) {
      showToast('error', 'Reason is required.');
      return;
    }

    try {
      setCorrectDateModal(prev => ({ ...prev, submitting: true }));
      const token = await getAuthToken();
      const res = await fetch(`${BACKEND_URL}/api/pharmacy/reconciliation/${entry.id}/correct-date`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          newTransactionDate: new Date(newDate).toISOString(),
          reason: reason.trim(),
          supportingReference: reference.trim() || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to correct date.');
      }

      showToast('success', 'Transaction date corrected and ledger recalculated successfully.');
      setCorrectDateModal({ open: false, newDate: '', reason: '', reference: '', submitting: false });
      fetchFlagged();
    } catch (err: any) {
      showToast('error', err.message);
      setCorrectDateModal(prev => ({ ...prev, submitting: false }));
    }
  };

  // Submit Confirm No Issue
  const handleConfirmNoIssue = async () => {
    const { entry, note } = confirmModal;
    if (!note.trim()) {
      showToast('error', 'Note is required.');
      return;
    }

    try {
      setConfirmModal(prev => ({ ...prev, submitting: true }));
      const token = await getAuthToken();
      const res = await fetch(`${BACKEND_URL}/api/pharmacy/reconciliation/${entry.id}/confirm-no-issue`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ note: note.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to confirm no issue.');
      }

      showToast('success', 'Flag successfully marked as resolved (no issue).');
      setConfirmModal({ open: false, note: '', submitting: false });
      fetchFlagged();
    } catch (err: any) {
      showToast('error', err.message);
      setConfirmModal(prev => ({ ...prev, submitting: false }));
    }
  };

  // Submit Stock Adjustment
  const handleCreateAdjustment = async () => {
    const { entry, qty, note } = adjustModal;
    if (!note.trim()) {
      showToast('error', 'Adjustment note is required.');
      return;
    }
    if (qty === 0) {
      showToast('error', 'Adjustment quantity cannot be 0.');
      return;
    }

    try {
      setAdjustModal(prev => ({ ...prev, submitting: true }));
      const token = await getAuthToken();
      const res = await fetch(`${BACKEND_URL}/api/pharmacy/reconciliation/${entry.id}/create-adjustment`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          adjustmentQty: qty,
          note: note.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create adjustment.');
      }

      showToast('success', 'Adjustment entry recorded successfully.');
      setAdjustModal({ open: false, qty: 0, note: '', submitting: false });
      fetchFlagged();
    } catch (err: any) {
      showToast('error', err.message);
      setAdjustModal(prev => ({ ...prev, submitting: false }));
    }
  };

  // Submit Escalation
  const handleEscalate = async () => {
    const { entry, note } = escalateModal;
    if (!note.trim()) {
      showToast('error', 'Note is required.');
      return;
    }

    try {
      setEscalateModal(prev => ({ ...prev, submitting: true }));
      const token = await getAuthToken();
      const res = await fetch(`${BACKEND_URL}/api/pharmacy/reconciliation/${entry.id}/escalate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ note: note.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to escalate.');
      }

      showToast('success', 'Flag successfully escalated for review.');
      setEscalateModal({ open: false, note: '', submitting: false });
      fetchFlagged();
    } catch (err: any) {
      showToast('error', err.message);
      setEscalateModal(prev => ({ ...prev, submitting: false }));
    }
  };

  // Filter list by search query
  const filteredList = flaggedEntries.filter(entry => {
    const item = entry.inventory_items;
    const itemName = item?.item_name || '';
    const itemCode = item?.item_code || '';
    const batch = entry.batch_no || '';
    const ref = entry.reference_no || '';
    const q = searchQuery.toLowerCase();
    
    return itemName.toLowerCase().includes(q) ||
           itemCode.toLowerCase().includes(q) ||
           batch.toLowerCase().includes(q) ||
           ref.toLowerCase().includes(q);
  });

  // Autocomplete search options for Option 3 Manual Entry
  const mappedItemIds = new Set(
    storeItemMappings
      .filter(m => m.storeId === selectedStore)
      .map(m => m.itemId)
  );

  const autocompleteOpts = inventoryItems.filter(i =>
    i.isActive !== false &&
    mappedItemIds.has(i.id) &&
    (i.itemCode.toLowerCase().includes(manualItemSearch.toLowerCase()) ||
     i.itemName.toLowerCase().includes(manualItemSearch.toLowerCase()))
  ).slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Page Title & Reload */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Pharmacy Reconciliation Center</h2>
          <p className="text-xs text-slate-500 mt-1">Resolve offline outage backlogs or audit negative ledger running balances.</p>
        </div>
        <button
          onClick={() => {
            if (selectedStore) checkStatus(selectedStore);
            fetchFlagged();
          }}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50 text-slate-600 transition-colors shadow-sm disabled:opacity-50"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {/* Segmented Tab Controls */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('offline_backlog')}
          className={`px-5 py-3 text-xs font-extrabold transition-all border-b-2 uppercase tracking-wider flex items-center gap-2 ${
            activeTab === 'offline_backlog'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Layers className="w-4 h-4" />
          Offline Outage Reconciliation
        </button>
        <button
          onClick={() => setActiveTab('negative_balance')}
          className={`px-5 py-3 text-xs font-extrabold transition-all border-b-2 uppercase tracking-wider flex items-center gap-2 ${
            activeTab === 'negative_balance'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          Negative Balance Flags
        </button>
      </div>

      {/* ──────────────── TAB 1: OFFLINE BACKLOG RECONCILIATION ──────────────── */}
      {activeTab === 'offline_backlog' && (
        <div className="space-y-6">
          {/* Store Selector Header */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Store to Reconcile</label>
              <select
                className="w-full md:w-80 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-blue-500 mt-1 block"
                value={selectedStore}
                onChange={e => setSelectedStore(e.target.value)}
              >
                <option value="">-- Choose Store --</option>
                {stores.map(store => (
                  <option key={store.id} value={store.id}>{store.storeName}</option>
                ))}
              </select>
            </div>

            {selectedStore && (
              <div className="flex items-center gap-2.5 self-end md:self-center bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 text-xs">
                <span className="font-bold text-slate-400">STATUS:</span>
                {checkingStoreStatus ? (
                  <span className="flex items-center gap-1.5 text-slate-500 font-bold">
                    <RotateCw className="w-3.5 h-3.5 animate-spin" /> Checking...
                  </span>
                ) : localStoreStatus === 'reconciliation_required' ? (
                  <span className="px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 font-black rounded uppercase tracking-wide">
                    Reconciliation Required
                  </span>
                ) : localStoreStatus === 'offline' ? (
                  <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 font-black rounded uppercase tracking-wide">
                    Offline
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 font-black rounded uppercase tracking-wide">
                    Live
                  </span>
                )}
              </div>
            )}
          </div>

          {!selectedStore ? (
            <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center text-slate-400 italic">
              Please select a store from the dropdown above to view offline backlog reconciliation options.
            </div>
          ) : checkingStoreStatus ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 italic shadow-sm">
              <RotateCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
              Retrieving store outage status...
            </div>
          ) : localStoreStatus !== 'reconciliation_required' ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm flex flex-col items-center justify-center text-center gap-3">
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-full">
                <Check className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Store is fully operational</h3>
              <p className="text-xs text-slate-500 max-w-sm">Outage reconciliation is complete or was not required. The store status is currently <strong>{localStoreStatus || 'Live'}</strong>.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Option 1 & Option 2 (Left Column) */}
              <div className="lg:col-span-1 space-y-6">
                
                {/* Option 1 */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
                  <div className="p-2.5 bg-green-50 text-green-700 rounded-xl w-max">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Option 1 — Declare Outage Empty</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Use this if no offline sales occurred during the outage. Dispensing will resume immediately.</p>
                  </div>
                  <button
                    onClick={async () => {
                      const ok = await declareOutageEmpty(selectedStore);
                      if (ok) {
                        checkStatus(selectedStore);
                        showToast('success', 'Outage declared empty. Store status restored to live.');
                      } else {
                        showToast('error', 'Failed to declare outage empty.');
                      }
                    }}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-green-100"
                  >
                    Declare No Offline Sales
                  </button>
                </div>

                {/* Option 2 */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
                  <div className="p-2.5 bg-violet-50 text-violet-700 rounded-xl w-max">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Option 2 — Upload Excel Backlog</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Upload template sheet. Required columns: <code>Drug Code \| Batch No \| Qty \| Unit Price \| Reference No \| Dispensed Date &amp; Time</code></p>
                  </div>

                  <div className="space-y-2">
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={e => setReconciliationFile(e.target.files?.[0] || null)}
                      className="w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-bold file:bg-slate-100 file:text-slate-600 hover:file:bg-slate-200 text-slate-500 cursor-pointer"
                    />
                    <button
                      disabled={!reconciliationFile || reconciliationUploading}
                      onClick={async () => {
                        if (!reconciliationFile) return;
                        setReconciliationUploading(true);
                        const res = await uploadOfflineBacklogExcel(selectedStore, reconciliationFile);
                        setReconciliationUploading(false);
                        setReconciliationResult(res);
                        if (res.success) {
                          checkStatus(selectedStore);
                          if (res.flagged === 0) {
                            showToast('success', `Backlog uploaded: ${res.inserted} rows. Checkout restored.`);
                          } else {
                            showToast('info', `Uploaded ${res.inserted} rows. ${res.flagged} flagged for review.`);
                          }
                        } else {
                          showToast('error', 'Excel upload failed.');
                        }
                      }}
                      className="w-full bg-violet-600 hover:bg-violet-700 text-white py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-violet-100 disabled:opacity-50"
                    >
                      {reconciliationUploading ? 'Processing Excel...' : 'Upload &amp; Reconcile'}
                    </button>
                  </div>

                  {reconciliationResult && (
                    <div className="mt-3 bg-slate-50 rounded-xl p-3 text-[10px] space-y-1 text-slate-600 border border-slate-150">
                      <div>
                        <span className="text-green-700 font-bold">{reconciliationResult.inserted} rows inserted</span>
                        {reconciliationResult.flagged > 0 && <span className="text-amber-600 font-bold ml-3">{reconciliationResult.flagged} flagged</span>}
                      </div>
                      {reconciliationResult.rows && reconciliationResult.rows.filter((r: any) => r.status === 'rejected').length > 0 && (
                        <div className="mt-1.5 bg-rose-50 border border-rose-100 rounded-lg p-2 max-h-40 overflow-y-auto space-y-1">
                          <div className="text-rose-700 font-bold text-[9px] uppercase">Rejected Rows</div>
                          {reconciliationResult.rows.filter((r: any) => r.status === 'rejected').map((r: any) => (
                            <div key={r.row} className="text-rose-600 font-medium">Row {r.row}: {r.detail}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>

              {/* Option 3 (Right Columns) */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Option 3 — Manual Offline Entry</h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">Input transaction details recorded on paper log directly.</p>
                    </div>
                  </div>

                  {/* 2-column Form Layout */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-xs">
                    
                    {/* LEFT COLUMN */}
                    <div className="space-y-3.5">
                      {/* Drug Selector Combobox */}
                      <div className="relative">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Drug / Item *</label>
                        <input
                          type="text"
                          autoComplete="off"
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs mt-1 outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-300 font-medium"
                          placeholder="Search by code or name..."
                          value={manualItemSearch}
                          onFocus={() => setManualItemDropdownOpen(true)}
                          onChange={e => {
                            setManualItemSearch(e.target.value);
                            setManualItemDropdownOpen(true);
                            if (manualSaleRow.itemId) {
                              setManualSaleRow(prev => ({ ...prev, itemId: '', batchNo: '' }));
                              setManualSaleBatches([]);
                            }
                          }}
                          onBlur={() => setTimeout(() => setManualItemDropdownOpen(false), 180)}
                        />
                        {manualItemDropdownOpen && manualItemSearch.length >= 1 && (
                          <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-50">
                            {autocompleteOpts.length > 0 ? (
                              autocompleteOpts.map(i => (
                                <div
                                  key={i.id}
                                  className="px-3.5 py-2.5 hover:bg-slate-50 cursor-pointer text-left transition-colors"
                                  onMouseDown={async () => {
                                    setManualItemSearch(`${i.itemCode} — ${i.itemName}`);
                                    setManualSaleRow(prev => ({ ...prev, itemId: i.id, batchNo: '' }));
                                    setManualItemDropdownOpen(false);
                                    const batches = await fetchBatchDetails(selectedStore, i.id);
                                    setManualSaleBatches(batches);
                                    if (batches.length === 1) {
                                      setManualSaleRow(prev => ({ ...prev, batchNo: batches[0].batchNo, unitPrice: batches[0].mrp || 0 }));
                                    }
                                  }}
                                >
                                  <div className="font-bold text-slate-800">{i.itemName}</div>
                                  <div className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">{i.itemCode}</div>
                                  {i.salesUom && (
                                    <div className="text-[9px] text-blue-500 font-bold mt-0.5">UOM: {i.salesUom}</div>
                                  )}
                                </div>
                              ))
                            ) : (
                              <div className="px-3.5 py-2.5 text-slate-400 italic text-center">No mapped drugs found</div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Batch Selection */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Batch No *</label>
                        {manualSaleBatches.length > 0 ? (
                          <select
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs mt-1 bg-white outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-slate-700"
                            value={manualSaleRow.batchNo}
                            onChange={e => {
                              const sel = manualSaleBatches.find(b => b.batchNo === e.target.value);
                              setManualSaleRow(prev => ({ ...prev, batchNo: e.target.value, unitPrice: sel?.mrp || prev.unitPrice }));
                            }}
                          >
                            <option value="">-- Select Batch --</option>
                            {manualSaleBatches.map(b => (
                              <option key={b.batchNo} value={b.batchNo}>
                                {b.batchNo} (Qty: {b.currentStock}{b.expiryDate ? ` | Exp: ${new Date(b.expiryDate).toLocaleDateString()}` : ''})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs mt-1 bg-slate-50 outline-none placeholder-slate-400"
                            placeholder={manualSaleRow.itemId ? 'No batches found — type manually' : 'Select drug first'}
                            value={manualSaleRow.batchNo}
                            onChange={e => setManualSaleRow(prev => ({ ...prev, batchNo: e.target.value }))}
                          />
                        )}
                      </div>

                      {/* Quantity & Unit Price */}
                      <div className="grid grid-cols-2 gap-3.5">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                            Qty *
                            {(() => {
                              const selItem = inventoryItems.find(i => i.id === manualSaleRow.itemId);
                              return selItem?.salesUom ? (
                                <span className="text-[9px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-md">
                                  {selItem.salesUom}
                                </span>
                              ) : null;
                            })()}
                          </label>
                          <input
                            type="number"
                            min={1}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs mt-1 outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                            value={manualSaleRow.quantity}
                            onChange={e => setManualSaleRow(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Unit Price</label>
                          <input
                            type="number"
                            step="0.01"
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs mt-1 outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                            value={manualSaleRow.unitPrice}
                            onChange={e => setManualSaleRow(prev => ({ ...prev, unitPrice: Number(e.target.value) }))}
                          />
                        </div>
                      </div>

                      {/* Payment Mode & Reference */}
                      <div className="grid grid-cols-2 gap-3.5">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Payment Mode</label>
                          <select
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs mt-1 bg-white outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-slate-700"
                            value={manualSaleRow.paymentMode}
                            onChange={e => setManualSaleRow(prev => ({ ...prev, paymentMode: e.target.value }))}
                          >
                            <option value="Cash">Cash</option>
                            <option value="Card">Card</option>
                            <option value="Online">Online</option>
                            <option value="Insurance">Insurance</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Reference No</label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs mt-1 outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-300 font-medium"
                            placeholder="Cheque/TXN ID"
                            value={manualSaleRow.referenceNo}
                            onChange={e => setManualSaleRow(prev => ({ ...prev, referenceNo: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="space-y-3.5">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Patient Name *</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs mt-1 outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-350 font-semibold"
                          placeholder="Full name as on paper log"
                          value={manualSaleRow.patientName}
                          onChange={e => setManualSaleRow(prev => ({ ...prev, patientName: e.target.value }))}
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Patient External ID</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs mt-1 outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-300"
                          placeholder="Optional ID"
                          value={manualSaleRow.patientExternalId}
                          onChange={e => setManualSaleRow(prev => ({ ...prev, patientExternalId: e.target.value }))}
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Dispensed By *</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs mt-1 outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-300 font-semibold"
                          placeholder="Name of pharmacist"
                          value={manualSaleRow.dispensedBy}
                          onChange={e => setManualSaleRow(prev => ({ ...prev, dispensedBy: e.target.value }))}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3.5">
                        <div>
                          <label className="text-[10px] font-bold text-rose-500 uppercase">Dispensed Date &amp; Time *</label>
                          <input
                            type="datetime-local"
                            className="w-full px-2.5 py-1.5 border border-rose-200 rounded-xl text-xs mt-1 outline-none focus:ring-1 focus:ring-rose-400 font-semibold"
                            value={manualSaleRow.transactionDate}
                            onChange={e => {
                              const val = e.target.value;
                              setManualSaleRow(prev => ({
                                ...prev,
                                transactionDate: val,
                                refDocDate: prev.refDocDate || (val ? val.split('T')[0] : '')
                              }));
                            }}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Ref Doc Date</label>
                          <input
                            type="date"
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs mt-1 outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                            value={manualSaleRow.refDocDate}
                            onChange={e => setManualSaleRow(prev => ({ ...prev, refDocDate: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Submission Action */}
                  <div className="pt-3 border-t border-slate-100">
                    <button
                      disabled={
                        !manualSaleRow.itemId || 
                        !manualSaleRow.batchNo || 
                        !manualSaleRow.transactionDate || 
                        !manualSaleRow.patientName.trim() || 
                        !manualSaleRow.dispensedBy.trim() || 
                        manualSaleSubmitting
                      }
                      onClick={async () => {
                        try {
                          setManualSaleSubmitting(true);
                          
                          if (!manualSaleRow.transactionDate) {
                            throw new Error("Dispensed Date & Time is required.");
                          }
                          const parsedTxnDate = new Date(manualSaleRow.transactionDate);
                          if (isNaN(parsedTxnDate.getTime())) {
                            throw new Error("Dispensed Date & Time is invalid.");
                          }

                          let parsedRefDocDate: string | undefined = undefined;
                          if (manualSaleRow.refDocDate) {
                            const parsedRef = new Date(manualSaleRow.refDocDate);
                            if (isNaN(parsedRef.getTime())) {
                              throw new Error("Ref Doc Date is invalid.");
                            }
                            parsedRefDocDate = parsedRef.toISOString();
                          }

                          const saveRes = await submitManualOfflineSale(selectedStore, {
                            itemId: manualSaleRow.itemId,
                            batchNo: manualSaleRow.batchNo,
                            quantity: manualSaleRow.quantity,
                            unitPrice: manualSaleRow.unitPrice,
                            transactionDate: parsedTxnDate.toISOString(),
                            refDocDate: parsedRefDocDate,
                            referenceNo: manualSaleRow.referenceNo || undefined,
                            patientName: manualSaleRow.patientName.trim(),
                            patientExternalId: manualSaleRow.patientExternalId.trim() || undefined,
                            dispensedBy: manualSaleRow.dispensedBy.trim(),
                            paymentMode: manualSaleRow.paymentMode || 'Cash'
                          });

                          if (!saveRes.success) {
                            showToast('error', saveRes.error || 'Failed to save manual entry.');
                            setManualSaleSubmitting(false);
                            return;
                          }

                          const ok = await completeManualReconciliation(selectedStore);
                          setManualSaleSubmitting(false);
                          if (ok) {
                            checkStatus(selectedStore);
                            showToast('success', 'Manual entry recorded and live checkout restored.');
                            resetManualRow();
                          } else {
                            showToast('error', 'Failed to complete manual reconciliation.');
                          }
                        } catch (err: any) {
                          console.error(err);
                          showToast('error', `Error: ${err.message}`);
                          setManualSaleSubmitting(false);
                        }
                      }}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-xl text-xs font-bold hover:bg-blue-700 transition-all disabled:opacity-50 shadow-md shadow-blue-150"
                    >
                      {manualSaleSubmitting ? (
                        <>
                          <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
                          Processing entry...
                        </>
                      ) : (
                        "Finish Manual Entry & Resume Live Checkout"
                      )}
                    </button>
                  </div>

                </div>
              </div>

            </div>
          )}
        </div>
      )}

      {/* ──────────────── TAB 2: NEGATIVE BALANCE LEDGER RECONCILIATION ──────────────── */}
      {activeTab === 'negative_balance' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Open Flags */}
            <div className="bg-white rounded-2xl p-4 border border-rose-100 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Open Flags</span>
                <h3 className="text-xl font-black text-slate-800 mt-0.5">{stats.open}</h3>
              </div>
            </div>

            {/* Pending Confirmation */}
            <div className="bg-white rounded-2xl p-4 border border-amber-100 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pending Sign-off</span>
                <h3 className="text-xl font-black text-slate-800 mt-0.5">{stats.pending}</h3>
              </div>
            </div>

            {/* Under Review */}
            <div className="bg-white rounded-2xl p-4 border border-blue-100 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Under Review</span>
                <h3 className="text-xl font-black text-slate-800 mt-0.5">{stats.underReview}</h3>
              </div>
            </div>

            {/* Resolved Flags */}
            <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Resolved</span>
                <h3 className="text-xl font-black text-slate-800 mt-0.5">{stats.resolved}</h3>
              </div>
            </div>
          </div>

          {/* Filter / Search Panel */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mr-2">
                <Filter className="w-4 h-4 text-slate-400" />
                FILTERS:
              </div>

              {/* Store Selector */}
              <select
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-blue-500"
                value={selectedStore}
                onChange={e => setSelectedStore(e.target.value)}
              >
                <option value="">All Stores</option>
                {stores.map(store => (
                  <option key={store.id} value={store.id}>{store.storeName}</option>
                ))}
              </select>

              {/* Status Selector */}
              <select
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-blue-500"
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
              >
                <option value="">Active Flags (Open/Pending/Review)</option>
                <option value="open">Open</option>
                <option value="pending_confirmation">Pending Confirmation</option>
                <option value="under_review">Under Review</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            {/* Search Field */}
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Search by drug, batch, ref..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Flagged entries table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-200">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="px-5 py-4">Item details</th>
                    <th className="px-5 py-4">Batch details</th>
                    <th className="px-5 py-4 text-center">In / Out Qty</th>
                    <th className="px-5 py-4 text-center">Closing Stock</th>
                    <th className="px-5 py-4">Reason / Flag Date</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Resolution</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-12 text-center text-slate-400 italic">
                        <RotateCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                        Loading reconciliation records...
                      </td>
                    </tr>
                  ) : filteredList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-12 text-center text-slate-400 italic">
                        No flagged reconciliation entries match your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredList.map(entry => {
                      const item = entry.inventory_items;
                      const storeName = stores.find(s => s.id === entry.store_id)?.storeName || 'Unknown Store';
                      const dateStr = new Date(entry.transaction_date).toLocaleString();
                      const isResolved = entry.reconciliation_status === 'resolved';

                      return (
                        <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-4">
                            <div className="font-bold text-slate-800">{item?.item_name || 'Unknown Item'}</div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{item?.item_code || 'N/A'}</div>
                            <div className="text-[9px] text-slate-400 mt-0.5">{storeName}</div>
                          </td>
                          <td className="px-5 py-4">
                            <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 rounded text-[10px] font-bold font-mono">
                              {entry.batch_no}
                            </span>
                            {entry.reference_no && (
                              <div className="text-[9px] text-slate-400 mt-1.5">Ref: {entry.reference_no}</div>
                            )}
                          </td>
                          <td className="px-5 py-4 text-center">
                            {entry.stock_in_quantity > 0 && (
                              <span className="text-green-600 font-bold">+{entry.stock_in_quantity}</span>
                            )}
                            {entry.stock_out_quantity > 0 && (
                              <span className="text-rose-600 font-bold">-{entry.stock_out_quantity}</span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span className={`font-bold px-2 py-0.5 rounded ${
                              entry.closing_stock < 0 
                                ? 'bg-rose-50 text-rose-600 font-black' 
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {entry.closing_stock}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="text-slate-600 font-semibold text-[11px] max-w-xs">{entry.reconciliation_reason || 'N/A'}</div>
                            <div className="text-[9px] text-slate-400 mt-1">{dateStr}</div>
                          </td>
                          <td className="px-5 py-4">
                            {entry.reconciliation_status === 'open' && (
                              <span className="px-2 py-1 bg-rose-50 text-rose-700 border border-rose-100 rounded-full text-[10px] font-bold uppercase tracking-wide">
                                Open
                              </span>
                            )}
                            {entry.reconciliation_status === 'pending_confirmation' && (
                              <span className="px-2 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-full text-[10px] font-bold uppercase tracking-wide">
                                Pending Sign-off
                              </span>
                            )}
                            {entry.reconciliation_status === 'under_review' && (
                              <span className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-[10px] font-bold uppercase tracking-wide">
                                Under Review
                              </span>
                            )}
                            {entry.reconciliation_status === 'resolved' && (
                              <span className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[10px] font-bold uppercase tracking-wide">
                                Resolved
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 max-w-xs">
                            {isResolved ? (
                              <div className="space-y-1">
                                <div className="text-[10px] font-bold text-slate-600 capitalize">
                                  Resolved: {entry.resolution_type?.replace(/_/g, ' ')}
                                </div>
                                {entry.resolution_note && (
                                  <div className="text-[9px] text-slate-400 italic line-clamp-2" title={entry.resolution_note}>
                                    "{entry.resolution_note}"
                                  </div>
                                )}
                                <div className="text-[9px] text-slate-400">
                                  By {entry.resolved_by} on {new Date(entry.resolved_at).toLocaleDateString()}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Unresolved</span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-right">
                            {!isResolved ? (
                              <div className="flex justify-end gap-1.5">
                                {/* Action Correct Date */}
                                <button
                                  onClick={() => setCorrectDateModal({
                                    open: true,
                                    entry,
                                    newDate: entry.transaction_date.split('.')[0].slice(0, 16),
                                    reason: '',
                                    reference: entry.reference_no || '',
                                    submitting: false
                                  })}
                                  className="px-2 py-1 bg-white border border-slate-200 hover:bg-slate-50 rounded text-[10px] font-bold text-slate-600"
                                  title="Correct Date & Recalculate"
                                >
                                  Correct Date
                                </button>

                                {/* Action Confirm No Issue */}
                                <button
                                  onClick={() => setConfirmModal({
                                    open: true,
                                    entry,
                                    note: entry.reconciliation_status === 'pending_confirmation' 
                                      ? 'Verified - balance corrected by later stock-in' 
                                      : '',
                                    submitting: false
                                  })}
                                  className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded text-[10px] font-bold"
                                  title="Confirm No Issue"
                                >
                                  Sign-off
                                </button>

                                {/* Action Adjust */}
                                <button
                                  onClick={() => setAdjustModal({
                                    open: true,
                                    entry,
                                    qty: Math.abs(entry.closing_stock),
                                    note: '',
                                    submitting: false
                                  })}
                                  className="px-2 py-1 bg-violet-50 hover:bg-violet-100 border border-violet-200 text-violet-700 rounded text-[10px] font-bold"
                                  title="Stock Adjustment"
                                >
                                  Adjust Stock
                                </button>

                                {/* Action Escalate */}
                                {entry.reconciliation_status !== 'under_review' && (
                                  <button
                                    onClick={() => setEscalateModal({
                                      open: true,
                                      entry,
                                      note: '',
                                      submitting: false
                                    })}
                                    className="px-2 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded text-[10px] font-bold"
                                    title="Escalate to Supervisor"
                                  >
                                    Escalate
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-bold">Closed</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── MODALS ──────────────── */}

      {/* Correct Date Modal */}
      {correctDateModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                Correct Transaction Date &amp; Recalculate
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">This will backdate/edit the transaction date. PostgreSQL will cascade recalculate subsequent balances for this batch.</p>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Item</label>
                <div className="text-xs font-bold text-slate-700 mt-0.5">{correctDateModal.entry?.inventory_items?.item_name}</div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">New Transaction Date &amp; Time *</label>
                <input
                  type="datetime-local"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs mt-1 outline-none focus:ring-1 focus:ring-blue-500"
                  value={correctDateModal.newDate}
                  onChange={e => setCorrectDateModal(prev => ({ ...prev, newDate: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Correction Reason / Explanation *</label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs mt-1 outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-300 font-medium"
                  placeholder="Mandatory audit explanation..."
                  value={correctDateModal.reason}
                  onChange={e => setCorrectDateModal(prev => ({ ...prev, reason: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Supporting Reference (Invoice/GRN)</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs mt-1 outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-300"
                  placeholder="Optional reference number"
                  value={correctDateModal.reference}
                  onChange={e => setCorrectDateModal(prev => ({ ...prev, reference: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 mt-2">
              <button
                type="button"
                onClick={() => setCorrectDateModal({ open: false, newDate: '', reason: '', reference: '', submitting: false })}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={correctDateModal.submitting || !correctDateModal.newDate || !correctDateModal.reason.trim()}
                onClick={handleCorrectDate}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm disabled:opacity-50"
              >
                {correctDateModal.submitting ? 'Recalculating...' : 'Confirm Date Correction'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm No Issue Modal */}
      {confirmModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                Explicit reconciliation Sign-off
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">Provide a signature justification to close this flag. Resolving will unlock live status if no other active flags exist.</p>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Reason for Flag</label>
                <div className="text-xs font-semibold text-rose-600 mt-0.5">{confirmModal.entry?.reconciliation_reason}</div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Verification Justification Note *</label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs mt-1 outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-300 font-medium"
                  placeholder="Type verification reason (e.g. verified - offset corrected)..."
                  value={confirmModal.note}
                  onChange={e => setConfirmModal(prev => ({ ...prev, note: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 mt-2">
              <button
                type="button"
                onClick={() => setConfirmModal({ open: false, note: '', submitting: false })}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={confirmModal.submitting || !confirmModal.note.trim()}
                onClick={handleConfirmNoIssue}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm disabled:opacity-50"
              >
                {confirmModal.submitting ? 'Resolving...' : 'Resolve & Sign-off'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {adjustModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-violet-500" />
                Compensating Stock Adjustment Entry
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">Create an adjustment transaction to balance the inventory. Positive inserts a Stock In; negative inserts a Stock Out.</p>
            </div>

            <div className="space-y-3.5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Item Current Deficit</label>
                  <div className="text-xs font-black text-rose-600 mt-0.5">{adjustModal.entry?.closing_stock}</div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Batch / Store</label>
                  <div className="text-xs font-bold text-slate-700 mt-0.5">{adjustModal.entry?.batch_no}</div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Adjustment Quantity (+/-) *</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs mt-1 outline-none focus:ring-1 focus:ring-blue-500"
                  value={adjustModal.qty}
                  onChange={e => setAdjustModal(prev => ({ ...prev, qty: Number(e.target.value) }))}
                />
                <div className="text-[10px] text-slate-400 mt-1">Suggested adjustment: <span className="font-bold text-slate-600">+{Math.abs(adjustModal.entry?.closing_stock || 0)}</span> (Stock In) to clear deficit.</div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Adjustment Description / Note *</label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs mt-1 outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-300 font-medium"
                  placeholder="Explain why stock level is adjusted..."
                  value={adjustModal.note}
                  onChange={e => setAdjustModal(prev => ({ ...prev, note: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 mt-2">
              <button
                type="button"
                onClick={() => setAdjustModal({ open: false, qty: 0, note: '', submitting: false })}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={adjustModal.submitting || !adjustModal.note.trim() || adjustModal.qty === 0}
                onClick={handleCreateAdjustment}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold shadow-sm disabled:opacity-50"
              >
                {adjustModal.submitting ? 'Applying...' : 'Apply Stock Adjustment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Escalate Modal */}
      {escalateModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-blue-500" />
                Escalate Flag to Supervisor
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">Flags the status as Under Review. Provide details for senior investigation.</p>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Escalation Reason Note *</label>
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs mt-1 outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-300 font-medium"
                  placeholder="Provide detailed description of discrepancies..."
                  value={escalateModal.note}
                  onChange={e => setEscalateModal(prev => ({ ...prev, note: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 mt-2">
              <button
                type="button"
                onClick={() => setEscalateModal({ open: false, note: '', submitting: false })}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={escalateModal.submitting || !escalateModal.note.trim()}
                onClick={handleEscalate}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm disabled:opacity-50"
              >
                {escalateModal.submitting ? 'Escalating...' : 'Confirm Escalation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
