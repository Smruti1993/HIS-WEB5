import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Download, ChevronLeft, ChevronRight, ShieldCheck, RefreshCw } from 'lucide-react';
import { BACKEND_URL, getAuthToken } from '../../../services/supabaseClient';

// ─── Types ────────────────────────────────────────────────────────────────────
interface AuditRow {
  log_id: number;
  event_type: 'SUGGESTED' | 'ACCEPTED' | 'REJECTED' | 'MAPPING_CHANGED';
  sale_transaction_id: string | null;
  original_drug_code: string;
  suggested_drug_code: string | null;
  final_drug_code: string;
  generic_code: string;
  old_value: string | null;
  new_value: string | null;
  remarks: string | null;
  performed_by: string;
  performed_at: string;
  ip_or_terminal_id: string | null;
}

interface SummaryData {
  total_events: number;
  accepted_count: number;
  mapping_changes_count: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const todayStr = () => new Date().toISOString().slice(0, 10);
const weekAgoStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().slice(0, 10);
};

const formatTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};
const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const EVENT_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  SUGGESTED:       { bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'Suggested'      },
  ACCEPTED:        { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Accepted'       },
  REJECTED:        { bg: 'bg-amber-100',  text: 'text-amber-700',  label: 'Rejected'       },
  MAPPING_CHANGED: { bg: 'bg-rose-100',   text: 'text-rose-700',   label: 'Mapping changed'},
};

// ─── Component ────────────────────────────────────────────────────────────────
export function AuditTrailViewer() {
  // Filter state
  const [fromDate,   setFromDate]   = useState(weekAgoStr());
  const [toDate,     setToDate]     = useState(todayStr());
  const [eventType,  setEventType]  = useState('ALL');
  const [drugCode,   setDrugCode]   = useState('');
  const [userFilter, setUserFilter] = useState('');

  // Applied (committed) filters — only updated on Apply / Reset
  const [applied, setApplied] = useState({
    from: weekAgoStr(), to: todayStr(),
    event_type: 'ALL', drug_code: '', user: '',
  });

  // Data state
  const [rows,        setRows]        = useState<AuditRow[]>([]);
  const [totalCount,  setTotalCount]  = useState(0);
  const [page,        setPage]        = useState(1);
  const PAGE_SIZE = 25;
  const [summary,     setSummary]     = useState<SummaryData>({ total_events: 0, accepted_count: 0, mapping_changes_count: 0 });
  const [loading,     setLoading]     = useState(false);
  const [exporting,   setExporting]   = useState(false);
  const [error,       setError]       = useState('');

  // Build backend URL with query params
  const buildUrl = useCallback((overrides: Record<string, string | number> = {}) => {
    const params = new URLSearchParams({
      from:       applied.from,
      to:         applied.to,
      event_type: applied.event_type,
      drug_code:  applied.drug_code,
      user:       applied.user,
      page:       String(page),
      page_size:  String(PAGE_SIZE),
      ...Object.fromEntries(Object.entries(overrides).map(([k, v]) => [k, String(v)])),
    });
    return `${BACKEND_URL}/api/pharmacy/audit/substitution-log?${params.toString()}`;
  }, [applied, page]);

  // Fetch paginated rows
  const fetchRows = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = await getAuthToken();
      const res = await fetch(buildUrl(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setRows(json.rows ?? []);
      setTotalCount(json.total_count ?? 0);
    } catch (e: any) {
      setError(e.message || 'Failed to load audit log');
    } finally {
      setLoading(false);
    }
  }, [buildUrl]);

  // Fetch summary counts
  const fetchSummary = useCallback(async () => {
    try {
      const token = await getAuthToken();
      const params = new URLSearchParams({
        from:       applied.from,
        to:         applied.to,
        drug_code:  applied.drug_code,
        user:       applied.user,
        summary:    'true',
      });
      const res = await fetch(
        `${BACKEND_URL}/api/pharmacy/audit/substitution-log?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) return;
      const json = await res.json();
      setSummary(json);
    } catch { /* non-critical */ }
  }, [applied]);

  // Re-fetch when applied filters or page changes
  useEffect(() => { fetchRows(); fetchSummary(); }, [applied, page]);

  // Handlers
  const handleApply = () => {
    setPage(1);
    setApplied({ from: fromDate, to: toDate, event_type: eventType, drug_code: drugCode, user: userFilter });
  };

  const handleReset = () => {
    const f = weekAgoStr(), t = todayStr();
    setFromDate(f); setToDate(t); setEventType('ALL'); setDrugCode(''); setUserFilter('');
    setPage(1);
    setApplied({ from: f, to: t, event_type: 'ALL', drug_code: '', user: '' });
  };

  // CSV export — hits the same endpoint with format=csv, prompts download
  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const token = await getAuthToken();
      const params = new URLSearchParams({
        from:       applied.from,
        to:         applied.to,
        event_type: applied.event_type,
        drug_code:  applied.drug_code,
        user:       applied.user,
        format:     'csv',
      });
      const res = await fetch(
        `${BACKEND_URL}/api/pharmacy/audit/substitution-log?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `substitution_audit_${applied.from}_${applied.to}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e.message || 'CSV export failed');
    } finally {
      setExporting(false);
    }
  };

  const totalPages  = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const rangeStart  = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd    = Math.min(page * PAGE_SIZE, totalCount);

  // Days in the selected range label for summary card header
  const dayDiff = Math.max(1,
    Math.round((new Date(applied.to).getTime() - new Date(applied.from).getTime()) / 86400000) + 1
  );

  return (
    <div className="flex flex-col h-full gap-4">

      {/* ── Page Header ───────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-100 rounded-xl">
            <ShieldCheck className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-800">Substitution audit trail</h1>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Every suggestion, acceptance, rejection, and mapping change — insert-only.
            </p>
          </div>
        </div>
        <button
          onClick={fetchRows}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-500 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors border border-slate-200"
          title="Refresh"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* ── Filter Panel ──────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 flex-shrink-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          {/* From date */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">From date</label>
            <input
              type="date"
              value={fromDate}
              max={toDate}
              onChange={e => setFromDate(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-violet-500 bg-white"
            />
          </div>
          {/* To date */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">To date</label>
            <input
              type="date"
              value={toDate}
              min={fromDate}
              max={todayStr()}
              onChange={e => setToDate(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-violet-500 bg-white"
            />
          </div>
          {/* Event type */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Event type</label>
            <select
              value={eventType}
              onChange={e => setEventType(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-violet-500 bg-white"
            >
              <option value="ALL">All events</option>
              <option value="SUGGESTED">Suggested</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="REJECTED">Rejected</option>
              <option value="MAPPING_CHANGED">Mapping changed</option>
            </select>
          </div>
          {/* Drug / generic code */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Drug / generic code</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="e.g. IT-002 or PARA-8…"
                value={drugCode}
                onChange={e => setDrugCode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleApply()}
                className="w-full pl-7 pr-3 border border-slate-200 rounded-lg py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-violet-500 bg-white"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* User filter */}
          <div className="flex-1 max-w-xs">
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">User</label>
            <input
              type="text"
              placeholder="Pharmacist name or ID…"
              value={userFilter}
              onChange={e => setUserFilter(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleApply()}
              className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-violet-500 bg-white"
            />
          </div>
          <div className="flex items-end gap-2 mt-4">
            <button
              onClick={handleReset}
              className="px-3 py-1.5 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Reset
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-1.5 text-xs text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors font-medium shadow-sm"
            >
              Apply
            </button>
          </div>
        </div>

        {error && (
          <p className="mt-2 text-[10px] text-red-500 font-medium">{error}</p>
        )}
      </div>

      {/* ── Summary Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 flex-shrink-0">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Events ({dayDiff} day{dayDiff !== 1 ? 's' : ''})</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{summary.total_events.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Substitutions accepted</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{summary.accepted_count.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Mapping changes</p>
          <p className="text-2xl font-bold text-rose-500 mt-1">{summary.mapping_changes_count.toLocaleString()}</p>
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────────────── */}
      <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-0">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-slate-400">
              <div className="w-5 h-5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs">Loading…</span>
            </div>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300 gap-2">
            <ShieldCheck className="w-8 h-8" />
            <p className="text-xs text-slate-400">No audit records found for the selected filters.</p>
          </div>
        ) : (
          <div className="overflow-auto flex-1">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10">
                <tr>
                  {['Time', 'Event', 'Original drug', 'Final drug', 'Generic', 'Old value', 'New value', 'User', 'Remarks'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left font-semibold text-slate-500 text-[10px] uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map(row => {
                  const ev = EVENT_STYLES[row.event_type] ?? { bg: 'bg-slate-100', text: 'text-slate-600', label: row.event_type };
                  return (
                    <tr key={row.log_id} className="hover:bg-violet-50/30 transition-colors">
                      <td className="px-3 py-2 font-mono text-slate-600 whitespace-nowrap" title={formatDateTime(row.performed_at)}>
                        {formatTime(row.performed_at)}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${ev.bg} ${ev.text}`}>
                          {ev.label}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-mono text-slate-700 whitespace-nowrap">{row.original_drug_code}</td>
                      <td className="px-3 py-2 font-mono font-semibold text-slate-800 whitespace-nowrap">{row.final_drug_code}</td>
                      <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{row.generic_code}</td>
                      <td className="px-3 py-2 text-slate-500 max-w-[140px] truncate" title={row.old_value ?? ''}>
                        {row.old_value
                          ? <span className="italic text-slate-500">{row.old_value}</span>
                          : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-3 py-2 text-slate-500 max-w-[140px] truncate" title={row.new_value ?? ''}>
                        {row.new_value
                          ? <span className="italic text-slate-500">{row.new_value}</span>
                          : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{row.performed_by}</td>
                      <td className="px-3 py-2 text-slate-500 max-w-xs truncate" title={row.remarks ?? ''}>
                        {row.remarks
                          ? row.remarks
                          : <span className="text-slate-300">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination Footer ───────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-100 bg-white flex-shrink-0">
          <p className="text-[10px] text-slate-400">
            {totalCount === 0
              ? 'No records'
              : `Showing ${rangeStart}–${rangeEnd} of ${totalCount.toLocaleString()}`}
          </p>
          <div className="flex items-center gap-1.5">
            {/* Prev */}
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            {/* Page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = totalPages <= 5 ? i + 1
                : page <= 3             ? i + 1
                : page >= totalPages - 2 ? totalPages - 4 + i
                :                         page - 2 + i;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-7 h-7 flex items-center justify-center rounded-lg text-[10px] font-semibold transition-colors ${
                    p === page
                      ? 'bg-violet-600 text-white shadow-sm'
                      : 'border border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </button>
              );
            })}
            {/* Next */}
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* Export CSV */}
            <button
              onClick={handleExportCsv}
              disabled={exporting || totalCount === 0}
              className="ml-2 flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Download className="w-3 h-3" />
              {exporting ? 'Exporting…' : 'Export CSV'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
