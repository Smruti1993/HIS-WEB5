import { Router, Response, Request } from 'express';
import { createClient } from '@supabase/supabase-js';
import { AuthenticatedRequest } from '../middleware/auth';
import dotenv from 'dotenv';
import multer from 'multer';
import ExcelJS from 'exceljs';
import { toUtcDateOnly, parseRequiredDate, deriveSaleDate, requireNonEmptyString } from '../utils/dateUtils';
import { splitPatientName } from '../utils/nameUtils';

dotenv.config();
const router = Router();

// Multer: accept Excel files in memory so we don't need to write to disk
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Batched stock/price lookup for multiple item IDs in one pair of queries
// instead of one round-trip pair per candidate inside a loop.
async function getBatchStockDetails(storeId: string, itemIds: string[]): Promise<Map<string, { availableQty: number; mrp: number }>> {
  const result = new Map<string, { availableQty: number; mrp: number }>();
  if (itemIds.length === 0) return result;

  const { data: ledgerData } = await supabase
    .from('inventory_stock_ledger')
    .select('item_id, batch_no, stock_in_quantity, stock_out_quantity')
    .eq('store_id', storeId)
    .in('item_id', itemIds);

  // itemId -> batchNo -> qty
  const stockMap = new Map<string, Map<string, number>>();
  ledgerData?.forEach(row => {
    const itemId = row.item_id;
    const b = (row.batch_no || '').trim().toUpperCase();
    if (!stockMap.has(itemId)) stockMap.set(itemId, new Map());
    const itemBatches = stockMap.get(itemId)!;
    const current = itemBatches.get(b) || 0;
    itemBatches.set(b, current + Number(row.stock_in_quantity || 0) - Number(row.stock_out_quantity || 0));
  });

  const { data: grnData } = await supabase
    .from('procurement_grn_items')
    .select('item_id, batch_code, public_price, expiry_date')
    .in('item_id', itemIds);

  // itemId -> sorted batches by expiry
  const grnMap = new Map<string, { batchNo: string; mrp: number; expiryDate: number }[]>();
  grnData?.forEach(g => {
    const itemId = g.item_id;
    if (!grnMap.has(itemId)) grnMap.set(itemId, []);
    grnMap.get(itemId)!.push({
      batchNo: (g.batch_code || '').trim().toUpperCase(),
      mrp: Number(g.public_price || 0),
      expiryDate: g.expiry_date ? new Date(g.expiry_date).getTime() : Infinity
    });
  });

  for (const itemId of itemIds) {
    const itemBatches = stockMap.get(itemId);
    const totalQty = itemBatches ? Array.from(itemBatches.values()).reduce((sum, q) => sum + q, 0) : 0;
    if (totalQty <= 0) {
      result.set(itemId, { availableQty: 0, mrp: 0 });
      continue;
    }

    const sortedBatches = (grnMap.get(itemId) || []).sort((a, b) => a.expiryDate - b.expiryDate);
    let mrp = 0;
    for (const b of sortedBatches) {
      if ((itemBatches!.get(b.batchNo) || 0) > 0) {
        mrp = b.mrp;
        break;
      }
    }
    if (mrp === 0 && sortedBatches.length > 0) {
      mrp = sortedBatches[0].mrp;
    }
    result.set(itemId, { availableQty: totalQty, mrp });
  }

  return result;
}

// 1. Fetch alternates
router.get('/drugs/:itemId/alternates', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { itemId } = req.params;
    const { store_id: storeId, prescription_id: prescriptionId } = req.query;

    // Validate store_id BEFORE the Rx-lock check
    if (!storeId) {
      res.status(400).json({ error: 'Missing store_id parameter' });
      return;
    }

    // Check if prescription blocks substitutions
    if (prescriptionId) {
      const { data: rx } = await supabase
        .from('prescriptions')
        .select('substitution_allowed')
        .eq('id', prescriptionId)
        .single();
      if (rx && rx.substitution_allowed === false) {
        res.json({ original_drug: null, alternates: [] });
        return;
      }
    }

    const { data: selectedDrug, error: selectedErr } = await supabase
      .from('pharmacy_drug_master')
      .select('*, generic:generic_id(*)')
      .eq('item_id', itemId)
      .single();

    if (selectedErr || !selectedDrug) {
      res.status(404).json({ error: 'Drug not found in master' });
      return;
    }

    if (selectedDrug.substitutable === false || selectedDrug.is_active === false) {
      res.json({ original_drug: null, alternates: [] });
      return;
    }

    const { generic } = selectedDrug;
    if (!generic) {
      res.json({ original_drug: null, alternates: [] });
      return;
    }

    // Refuse to match on an unmapped strength_unit — prevents NULL === NULL false-positive matches
    if (!generic.strength_unit) {
      res.json({ original_drug: null, alternates: [], warning: 'strength_unit not mapped for this generic' });
      return;
    }

    const { data: candidates, error: candidatesErr } = await supabase
      .from('pharmacy_drug_master')
      .select('*, item:item_id(item_name, item_code, sales_uom, sales_conversion_factor), generic:generic_id(*)')
      .eq('generic_id', generic.id)
      .neq('item_id', itemId)
      .eq('is_active', true)
      .eq('substitutable', true)
      .not('generic.strength_unit', 'is', null); // exclude unmapped units from candidates too

    if (candidatesErr || !candidates) {
      res.json({ original_drug: null, alternates: [] });
      return;
    }

    // Filter to matching strength/unit/route/form first (cheap, in-memory)
    const matchedCandidates = candidates.filter((cand: any) => {
      const matchStrength = cand.generic?.strength === generic.strength;
      const matchStrengthUnit = cand.generic?.strength_unit === generic.strength_unit;
      const matchRoute = cand.generic?.route_of_administration === generic.route_of_administration;
      const formA = cand.dosage_form || cand.generic?.form_of_administration;
      const formB = selectedDrug.dosage_form || generic.form_of_administration;
      const matchForm = formA?.toLowerCase() === formB?.toLowerCase();
      return matchStrength && matchStrengthUnit && matchRoute && matchForm;
    });

    // Single batched stock lookup for original + all matched candidates
    const allIds = [itemId, ...matchedCandidates.map((c: any) => c.item_id)];
    const stockDetailsMap = await getBatchStockDetails(String(storeId), allIds);
    const origStock = stockDetailsMap.get(itemId) || { availableQty: 0, mrp: 0 };

    const alternatesList = matchedCandidates
      .map((cand: any) => {
        const stockDetails = stockDetailsMap.get(cand.item_id) || { availableQty: 0, mrp: 0 };
        if (stockDetails.availableQty <= 0) return null;
        const savings = origStock.mrp > stockDetails.mrp ? (origStock.mrp - stockDetails.mrp) : 0;
        return {
          itemId: cand.item_id,
          itemName: cand.item?.item_name || cand.drug_name,
          itemCode: cand.item?.item_code || cand.item_code,
          mrp: stockDetails.mrp,
          availableQty: stockDetails.availableQty,
          savings: Number(savings.toFixed(2)),
          dosageForm: cand.dosage_form || cand.generic?.form_of_administration,
          packSize: cand.pack_size,
          packUnit: cand.pack_unit
        };
      })
      .filter((x: any): x is NonNullable<typeof x> => x !== null)
      .sort((a: any, b: any) => a.mrp - b.mrp);

    res.json({
      original_drug: { itemId, itemName: selectedDrug.drug_name, mrp: origStock.mrp },
      alternates: alternatesList.slice(0, 5)
    });

  } catch (err: any) {
    console.error('Fetch alternates error:', err);
    res.status(500).json({ error: 'Internal server error while fetching alternates' });
  }
});

// 2. Log GxP substitution actions
router.post('/sales/gxp-substitution-log', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { logs, terminalId } = req.body;
    if (!logs || !Array.isArray(logs)) {
      res.status(400).json({ error: 'Missing logs array' });
      return;
    }

    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '');
    const clientTerminal = terminalId || ip || null;
    const userId = req.user?.email || req.user?.username || 'ph001';

    const { data, error } = await supabase.rpc('gxp_log_substitutions', {
      p_user_id: userId,
      p_ip_or_terminal: clientTerminal,
      p_logs: logs
    });

    if (error) {
      console.error('Failed to save GxP substitution logs:', error);
      res.status(500).json({ error: 'Failed to insert GxP logs: ' + error.message });
      return;
    }

    res.json({ success: true });
  } catch (err: any) {
    console.error('Save GxP logs error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 2b. GxP Save Drug Master record
router.post('/drugs/master', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      id, itemId, itemCode, drugName, genericId, isActive,
      dosageForm, packSize, packUnit, substitutable, marginPercent, costPrice
    } = req.body;

    if (!itemId || !drugName) {
      res.status(400).json({ error: 'Missing required drug master fields.' });
      return;
    }

    const userId = req.user?.email || req.user?.username || 'ph001';

    const { data, error } = await supabase.rpc('gxp_save_drug_master', {
      p_user_id: userId,
      p_id: id || null,
      p_item_id: itemId,
      p_item_code: itemCode,
      p_drug_name: drugName,
      p_generic_id: genericId || null,
      p_is_active: isActive !== false,
      p_dosage_form: dosageForm || 'tablet',
      p_pack_size: packSize !== undefined ? Number(packSize) : 1.0,
      p_pack_unit: packUnit || 'tablets',
      p_substitutable: substitutable !== false,
      p_margin_percent: marginPercent !== undefined ? Number(marginPercent) : 0.00,
      p_cost_price: costPrice !== undefined ? Number(costPrice) : 0.00
    });

    if (error) {
      console.error('Failed to save drug master via GxP RPC:', error);
      res.status(500).json({ error: 'Failed to save drug master: ' + error.message });
      return;
    }

    res.json({ success: true });
  } catch (err: any) {
    console.error('Save drug master error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 2c. GxP Delete (Deactivate) Drug Master record
router.delete('/drugs/master/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Missing ID parameter' });
      return;
    }

    const userId = req.user?.email || req.user?.username || 'ph001';

    const { data, error } = await supabase.rpc('gxp_delete_drug_master', {
      p_user_id: userId,
      p_id: id
    });

    if (error) {
      console.error('Failed to deactivate drug master via GxP RPC:', error);
      res.status(500).json({ error: 'Failed to deactivate drug master: ' + error.message });
      return;
    }

    res.json({ success: true });
  } catch (err: any) {
    console.error('Delete drug master error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 2d. GxP Audit Trail — read-only viewer endpoint
// GET /api/pharmacy/audit/substitution-log
// Query params: from, to, event_type, drug_code, user, page, page_size, summary, format
router.get('/audit/substitution-log', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const {
      from,
      to,
      event_type,
      drug_code,
      user: userFilter,
      page,
      page_size,
      summary,
      format,
    } = req.query as Record<string, string | undefined>;

    const fromDate = from ? `${from}T00:00:00.000Z` : new Date(Date.now() - 7 * 86400000).toISOString();
    const toDate   = to   ? `${to}T23:59:59.999Z`   : new Date().toISOString();

    // Helper: apply shared filter chain to a supabase query builder
    const applyFilters = (q: any) => {
      q = q.gte('performed_at', fromDate).lte('performed_at', toDate);
      if (event_type && event_type !== 'ALL') q = q.eq('event_type', event_type);
      if (drug_code?.trim()) {
        const dc = drug_code.trim();
        q = q.or(
          `original_drug_code.ilike.%${dc}%,generic_code.ilike.%${dc}%,` +
          `final_drug_code.ilike.%${dc}%,suggested_drug_code.ilike.%${dc}%`
        );
      }
      if (userFilter?.trim()) q = q.ilike('performed_by', `%${userFilter.trim()}%`);
      return q;
    };

    // ── Summary mode ──────────────────────────────────────────
    if (summary === 'true') {
      const { data, error } = await supabase.rpc('gxp_get_substitution_summary', {
        p_from:      fromDate,
        p_to:        toDate,
        p_drug_code: drug_code?.trim() || null,
        p_user:      userFilter?.trim() || null,
      });
      if (error) {
        console.error('Audit summary RPC error:', error);
        res.status(500).json({ error: error.message });
        return;
      }
      // Fold rows into named counters
      let total = 0, accepted = 0, mappingChanged = 0;
      (data || []).forEach((row: { event_type: string; cnt: number }) => {
        const n = Number(row.cnt);
        total += n;
        if (row.event_type === 'ACCEPTED')        accepted      = n;
        if (row.event_type === 'MAPPING_CHANGED') mappingChanged = n;
      });
      res.json({ total_events: total, accepted_count: accepted, mapping_changes_count: mappingChanged });
      return;
    }

    // ── CSV export mode ───────────────────────────────────────
    if (format === 'csv') {
      const { data: rows, error } = await applyFilters(
        supabase.from('audit_log_substitution').select('*').order('performed_at', { ascending: false })
      );
      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }
      const safeTo   = (to   || new Date().toISOString().slice(0, 10)).replace(/-/g, '');
      const safeFrom = (from || new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)).replace(/-/g, '');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=substitution_audit_${safeFrom}_${safeTo}.csv`);
      res.write('\uFEFF'); // UTF-8 BOM for Excel
      res.write('Log ID,Time (UTC),Event,Original Drug,Suggested Drug,Final Drug,Generic,Old Value,New Value,Remarks,Performed By,Terminal\n');
      (rows || []).forEach((r: any) => {
        const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
        res.write(
          [r.log_id, r.performed_at, r.event_type, r.original_drug_code,
           r.suggested_drug_code, r.final_drug_code, r.generic_code,
           r.old_value, r.new_value, r.remarks, r.performed_by, r.ip_or_terminal_id
          ].map(esc).join(',') + '\n'
        );
      });
      res.end();
      return;
    }

    // ── Paginated rows (default) ──────────────────────────────
    const pageNum  = Math.max(1, Number(page)      || 1);
    const pageSize = Math.min(100, Math.max(1, Number(page_size) || 25));
    const offset   = (pageNum - 1) * pageSize;

    const { data: rows, error, count } = await applyFilters(
      supabase
        .from('audit_log_substitution')
        .select('*', { count: 'exact' })
        .order('performed_at', { ascending: false })
    ).range(offset, offset + pageSize - 1);

    if (error) {
      console.error('Audit log query error:', error);
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({
      rows:        rows || [],
      total_count: count ?? 0,
      page:        pageNum,
      page_size:   pageSize,
    });
  } catch (err: any) {
    console.error('Audit trail endpoint error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================
// OFFLINE CONTINUITY & STOCK RECONCILIATION ROUTES
// ============================================================

// Health-check endpoint for client-side connectivity pings
router.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true });
});

// Helper: get the currently open (processing) backlog batch for a store
async function getOpenBacklogBatch(storeId: string) {
  const { data, error } = await supabase
    .from('pharmacy_offline_backlog_batches')
    .select('*')
    .eq('store_id', storeId)
    .eq('status', 'processing')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  if (error || !data) return null;
  return data;
}

// Helper: refresh the balance cache for a specific item/batch/store
async function refreshBalanceCache(storeId: string, itemId: string, batchNo: string, lastLedgerId: string) {
  const { data: ledgerRows } = await supabase
    .from('inventory_stock_ledger')
    .select('stock_in_quantity, stock_out_quantity')
    .eq('store_id', storeId)
    .eq('item_id', itemId)
    .eq('batch_no', batchNo);

  const currentQty = (ledgerRows || []).reduce(
    (sum: number, r: any) => sum + Number(r.stock_in_quantity || 0) - Number(r.stock_out_quantity || 0),
    0
  );

  await supabase
    .from('inventory_stock_balance_cache')
    .upsert(
      { item_id: itemId, batch_no: batchNo, store_id: storeId, current_qty: currentQty, last_ledger_id: lastLedgerId, updated_at: new Date().toISOString() },
      { onConflict: 'item_id,batch_no,store_id' }
    );

  return currentQty;
}

async function getItemValuation(storeId: string, itemId: string): Promise<{ quantity: number; rate: number }> {
  const { data, error } = await supabase
    .from('inventory_stock_ledger')
    .select('closing_stock, closing_stock_rate')
    .eq('store_id', storeId)
    .eq('item_id', itemId)
    .order('ref_doc_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    return { quantity: 0, rate: 0 };
  }
  return {
    quantity: Number(data[0].closing_stock || 0),
    rate: Number(data[0].closing_stock_rate || 0)
  };
}

async function getBatchDates(storeId: string, itemId: string, batchNo: string): Promise<{ batchDate: string | null; expiryDate: string | null }> {
  const { data, error } = await supabase
    .from('inventory_stock_ledger')
    .select('batch_date, expiry_date')
    .eq('store_id', storeId)
    .eq('item_id', itemId)
    .eq('batch_no', batchNo)
    .order('ref_doc_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    const { data: globalData } = await supabase
      .from('inventory_stock_ledger')
      .select('batch_date, expiry_date')
      .eq('item_id', itemId)
      .eq('batch_no', batchNo)
      .limit(1);
    if (globalData && globalData.length > 0) {
      return {
        batchDate: globalData[0].batch_date || null,
        expiryDate: globalData[0].expiry_date || null
      };
    }
    return { batchDate: null, expiryDate: null };
  }
  return {
    batchDate: data[0].batch_date || null,
    expiryDate: data[0].expiry_date || null
  };
}

router.post('/store-status/heartbeat', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { storeId, clientDetectedOfflineAt } = req.body;
    if (!storeId) { res.status(400).json({ error: 'Missing storeId' }); return; }

    const { data: current } = await supabase
      .from('pharmacy_store_status').select('*').eq('store_id', storeId).single();

    const now = new Date().toISOString();

    if (clientDetectedOfflineAt) {
      if (current && current.status === 'reconciliation_required') {
        res.json({ status: 'reconciliation_required' });
        return;
      }
      
      const wentOfflineAt = new Date(clientDetectedOfflineAt).toISOString();
      
      await supabase.from('pharmacy_store_status').upsert({
        store_id: storeId,
        status: 'reconciliation_required',
        went_offline_at: wentOfflineAt,
        went_offline_source: 'client_detected',
        reconnected_at: now,
        updated_at: now
      }, { onConflict: 'store_id' });

      await supabase.from('pharmacy_offline_backlog_batches').insert({
        store_id: storeId,
        outage_started_at: wentOfflineAt,
        outage_ended_at: now,
        outage_started_source: 'client_detected',
        status: 'processing'
      });

      res.json({ status: 'reconciliation_required' });
      return;
    }

    if (!current) {
      await supabase.from('pharmacy_store_status').upsert(
        { store_id: storeId, status: 'live', updated_at: now }, { onConflict: 'store_id' }
      );
      res.json({ status: 'live' }); return;
    }

    if (current.status === 'offline') {
      await supabase.from('pharmacy_store_status').update({
        status: 'reconciliation_required', reconnected_at: now, updated_at: now
      }).eq('store_id', storeId);

      await supabase.from('pharmacy_offline_backlog_batches').insert({
        store_id: storeId, outage_started_at: current.went_offline_at || now, outage_ended_at: now,
        outage_started_source: 'server_heartbeat_timeout', status: 'processing'
      });

      res.json({ status: 'reconciliation_required' }); return;
    }

    res.json({ status: current.status });
  } catch (err: any) {
    console.error('Heartbeat error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// -------------------------------------------------------
// GET /store-status/:storeId
// -------------------------------------------------------
router.get('/store-status/:storeId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { storeId } = req.params;
    const { data, error } = await supabase
      .from('pharmacy_store_status').select('*').eq('store_id', storeId).single();
    if (error || !data) { res.json({ storeId, status: 'live' }); return; }
    res.json(data);
  } catch (err: any) {
    console.error('Get store status error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// -------------------------------------------------------
// POST /reconciliation/declare-empty
// -------------------------------------------------------
router.post('/reconciliation/declare-empty', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { storeId } = req.body;
    if (!storeId) { res.status(400).json({ error: 'Missing storeId' }); return; }
    const now = new Date().toISOString();
    await supabase.from('pharmacy_offline_backlog_batches').update({
      upload_method: 'declared_empty', status: 'completed',
      uploaded_by: req.user?.email || req.user?.username || 'unknown',
      completed_at: now, total_rows: 0, rows_flagged: 0
    }).eq('store_id', storeId).eq('status', 'processing');

    await supabase.from('pharmacy_store_status').update({
      status: 'live', reconciliation_cleared_at: now, updated_at: now
    }).eq('store_id', storeId);
    res.json({ success: true, status: 'live' });
  } catch (err: any) {
    console.error('Declare-empty error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// -------------------------------------------------------
// POST /reconciliation/complete-manual
// -------------------------------------------------------
router.post('/reconciliation/complete-manual', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { storeId } = req.body;
    if (!storeId) { res.status(400).json({ error: 'Missing storeId' }); return; }
    const now = new Date().toISOString();

    const openBatch = await getOpenBacklogBatch(storeId);
    if (openBatch) {
      const { count: flaggedCount } = await supabase
        .from('inventory_stock_ledger')
        .select('*', { count: 'exact', head: true })
        .eq('backlog_batch_id', openBatch.id)
        .eq('needs_reconciliation', true);

      const { count: totalCount } = await supabase
        .from('inventory_stock_ledger')
        .select('*', { count: 'exact', head: true })
        .eq('backlog_batch_id', openBatch.id);

      const hasFlags = flaggedCount !== null && flaggedCount > 0;
      await supabase.from('pharmacy_offline_backlog_batches').update({
        upload_method: 'manual',
        status: hasFlags ? 'completed_with_flags' : 'completed',
        uploaded_by: req.user?.email || req.user?.username || 'unknown',
        completed_at: now,
        total_rows: totalCount || 0,
        rows_flagged: flaggedCount || 0
      }).eq('id', openBatch.id);
    }

    await supabase.from('pharmacy_offline_backlog_batches').update({
      upload_method: 'manual',
      status: 'completed',
      uploaded_by: req.user?.email || req.user?.username || 'unknown',
      completed_at: now,
      total_rows: 0,
      rows_flagged: 0
    }).eq('store_id', storeId).eq('status', 'processing');

    await supabase.from('pharmacy_store_status').update({
      status: 'live', reconciliation_cleared_at: now, updated_at: now
    }).eq('store_id', storeId);

    res.json({ success: true, status: 'live' });
  } catch (err: any) {
    console.error('Complete-manual error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// -------------------------------------------------------
// POST /reconciliation/manual-entry
// Required fields: storeId, itemId, batchNo, quantity, transactionDate,
//                  patientName, dispensedBy
// Optional: refDocDate (defaults to UTC date of transactionDate),
//           referenceNo, unitPrice, patientExternalId, paymentMode
// created_by is ALWAYS the authenticated API user (req.user), never dispensedBy.
// -------------------------------------------------------
router.post('/reconciliation/manual-entry', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      storeId, itemId, batchNo, quantity, unitPrice,
      referenceNo, transactionDate, refDocDate,
      patientName, patientExternalId, dispensedBy, paymentMode
    } = req.body;

    if (!storeId || !itemId || !batchNo || !quantity) {
      res.status(400).json({ error: 'Missing required fields: storeId, itemId, batchNo, quantity' });
      return;
    }

    // --- Validate all required fields up-front, same pattern for dates and strings ---
    let parsedTransactionDate: Date;
    let parsedRefDocDate: string;
    let rawPatientName: string;
    let rawDispensedBy: string;
    try {
      parsedTransactionDate = parseRequiredDate(transactionDate, 'Transaction Date');
      parsedRefDocDate = refDocDate
        ? parseRequiredDate(refDocDate, 'Ref Doc Date').toISOString()
        : toUtcDateOnly(parsedTransactionDate);  // UTC-safe default: date portion of transaction
      rawPatientName  = requireNonEmptyString(patientName, 'Patient Name');
      rawDispensedBy  = requireNonEmptyString(dispensedBy, 'Dispensed By');
    } catch (validationErr: any) {
      res.status(400).json({ error: validationErr.message });
      return;
    }

    const { firstName, middleName, lastName } = splitPatientName(rawPatientName);
    const saleDate = deriveSaleDate(parsedTransactionDate); // always from transaction date, never ref_doc_date

    // created_by = authenticated API user performing the reconciliation action
    // dispensed_by = the physical person who handed the medicine over (free-text from form)
    const createdBy = req.user?.email || req.user?.username || 'unknown';
    const saleNo = `DSALE-M-${Date.now().toString().slice(-6)}`;

    const openBatch = await getOpenBacklogBatch(storeId);
    if (!openBatch) { res.status(409).json({ error: 'No open backlog batch found. Declare outage first.' }); return; }

    let resolvedItemId = itemId;
    let salesConversionFactor = 1;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(itemId);
    if (!isUuid) {
      const { data: invItem } = await supabase
        .from('inventory_items')
        .select('id, sales_conversion_factor')
        .ilike('item_code', itemId)
        .limit(1)
        .maybeSingle();
      if (!invItem) {
        res.status(400).json({ error: `Drug code "${itemId}" not found in database.` });
        return;
      }
      resolvedItemId = invItem.id;
      salesConversionFactor = Number(invItem.sales_conversion_factor || 1);
    } else {
      // UUID supplied directly — look up the conversion factor
      const { data: invItem } = await supabase
        .from('inventory_items')
        .select('sales_conversion_factor')
        .eq('id', itemId)
        .maybeSingle();
      salesConversionFactor = Number(invItem?.sales_conversion_factor || 1);
    }

    // quantity entered by user is in Sales UOM; convert to Base UOM for ledger
    const baseQuantity = quantity * salesConversionFactor;

    const val = await getItemValuation(storeId, resolvedItemId);
    const dates = await getBatchDates(storeId, resolvedItemId, batchNo);
    const newClosingStock = val.quantity - baseQuantity;
    const valuationRate = val.rate;

    const { data: ledgerRow, error: ledgerError } = await supabase
      .from('inventory_stock_ledger').insert({
        store_id: storeId, item_id: resolvedItemId, batch_no: batchNo,
        batch_date: dates.batchDate, expiry_date: dates.expiryDate,
        transaction_type: 'STOCKOUT', ref_type: 'DIRECT SALE', ref_doc_no: saleNo,
        ref_doc_date: parsedRefDocDate,          // audit doc date — independent of transaction_date
        stock_out_quantity: baseQuantity, stock_in_quantity: 0, // baseQuantity = quantity × sales_conversion_factor
        closing_stock: newClosingStock,
        closing_stock_rate: valuationRate,
        closing_stock_value: newClosingStock * valuationRate,
        source: 'offline_manual', reference_no: referenceNo || null,
        transaction_date: parsedTransactionDate.toISOString(), // actual time of offline sale
        backlog_batch_id: openBatch.id, needs_reconciliation: false,
        created_by: createdBy  // authenticated user — NOT overwritten by dispensedBy
      }).select().single();

    if (ledgerError) {
      if (ledgerError.code === '23505') {
        res.status(409).json({ error: `Duplicate reference_no "${referenceNo}" already exists for this store.` });
        return;
      }
      res.status(500).json({ error: 'Failed to insert ledger row', detail: ledgerError.message }); return;
    }

    const newBalance = await refreshBalanceCache(storeId, resolvedItemId, batchNo, ledgerRow.id);
    if (newBalance < 0) {
      await supabase.from('inventory_stock_ledger').update({ needs_reconciliation: true }).eq('id', ledgerRow.id);
    }

    const { data: saleRow } = await supabase.from('pharmacy_direct_sales').insert({
      store_id: storeId,
      sale_no: saleNo,
      // Name: raw always preserved; split fields are best-effort convenience only
      full_name_raw: rawPatientName,
      first_name: firstName,
      middle_name: middleName || null,
      last_name: lastName || null,
      external_no: patientExternalId || null,
      dispensed_by: rawDispensedBy,             // physical dispenser — separate from created_by
      sale_date: parsedTransactionDate.toISOString(), // full timestamp; date part = saleDate for reporting
      dispensed_at: parsedTransactionDate.toISOString(),
      source: 'offline_manual',
      backlog_batch_id: openBatch.id,
      payment_status: 'paid',
      payment_mode: paymentMode || 'Cash',
      total_amount: (unitPrice || 0) * quantity,
      tax_amount: 0,
      reference_no: referenceNo || null
    }).select('id').single();

    if (saleRow?.id) {
      await supabase.from('inventory_stock_ledger').update({ sale_id: saleRow.id }).eq('id', ledgerRow.id);
    }
    await supabase.from('pharmacy_offline_backlog_batches').update({
      total_rows: (openBatch.total_rows || 0) + 1,
      rows_flagged: (openBatch.rows_flagged || 0) + (newBalance < 0 ? 1 : 0)
    }).eq('id', openBatch.id);

    res.json({ success: true, ledgerId: ledgerRow.id, saleId: saleRow?.id || null, newBalance, flagged: newBalance < 0 });
  } catch (err: any) {
    console.error('Manual entry error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// -------------------------------------------------------
// POST /reconciliation/upload-excel
// 11-column template:
//   Col 1: Reference No.        (required)
//   Col 2: Patient Name         (required)
//   Col 3: Patient External ID  (optional)
//   Col 4: Drug Code            (required)
//   Col 5: Batch No.            (optional — FIFO if blank)
//   Col 6: Qty                  (required)
//   Col 7: Unit Price           (required)
//   Col 8: Dispensed Date & Time (required) → transaction_date
//   Col 9: Ref Doc Date         (optional) → ref_doc_date (defaults to UTC date of col 8)
//   Col 10: Dispensed By        (required)
//   Col 11: Payment Mode        (optional, defaults to 'Cash')
//
// created_by is always the authenticated uploader (req.user), NOT the template's Dispensed By.
// -------------------------------------------------------
router.post('/reconciliation/upload-excel', upload.single('file'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { storeId } = req.body;
    if (!storeId) { res.status(400).json({ error: 'Missing storeId' }); return; }
    if (!req.file) { res.status(400).json({ error: 'No file uploaded' }); return; }
    const openBatch = await getOpenBacklogBatch(storeId);
    if (!openBatch) { res.status(409).json({ error: 'No open backlog batch found for this store.' }); return; }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer.buffer as ArrayBuffer);
    const worksheet = workbook.worksheets[0];
    if (!worksheet) { res.status(400).json({ error: 'Excel file has no worksheets' }); return; }

    // created_by = authenticated uploader — distinct from the template's Dispensed By column
    const createdBy = req.user?.email || req.user?.username || 'unknown';
    const results: { row: number; status: string; detail?: string }[] = [];
    let insertedCount = 0;
    let flaggedCount = 0;

    for (let rowNum = 2; rowNum <= worksheet.rowCount; rowNum++) {
      const row = worksheet.getRow(rowNum);

      // Read all 11 columns
      const refNoRaw       = String(row.getCell(1).value || '').trim();
      const patientNameRaw = String(row.getCell(2).value || '').trim();
      const externalIdRaw  = String(row.getCell(3).value || '').trim();
      const itemCodeRaw    = String(row.getCell(4).value || '').trim();
      const batchNoRaw     = String(row.getCell(5).value || '').trim();
      const qtyRaw         = Number(row.getCell(6).value || 0);
      const unitPriceRaw   = Number(row.getCell(7).value || 0);
      const txnDateCell    = row.getCell(8).value;
      const refDocDateCell = row.getCell(9).value;  // optional
      const dispensedByRaw = String(row.getCell(10).value || '').trim();
      const paymentModeRaw = String(row.getCell(11).value || '').trim();

      // Stop processing on a fully blank row
      if (!itemCodeRaw && !patientNameRaw) break;

      // --- Row-level validation — same pattern for dates, strings, and numbers ---
      let parsedTransactionDate: Date;
      let parsedRefDocDate: string;
      let rawPatientName: string;
      let rawDispensedBy: string;
      try {
        if (!itemCodeRaw) throw new Error('Drug Code is required and was not provided');
        if (qtyRaw <= 0)  throw new Error('Qty must be greater than 0');
        parsedTransactionDate = parseRequiredDate(txnDateCell, `Row ${rowNum}: Dispensed Date & Time`);
        parsedRefDocDate = refDocDateCell
          ? parseRequiredDate(refDocDateCell, `Row ${rowNum}: Ref Doc Date`).toISOString()
          : toUtcDateOnly(parsedTransactionDate);  // UTC-safe default
        rawPatientName = requireNonEmptyString(patientNameRaw, `Row ${rowNum}: Patient Name`);
        rawDispensedBy = requireNonEmptyString(dispensedByRaw, `Row ${rowNum}: Dispensed By`);
      } catch (validationErr: any) {
        results.push({ row: rowNum, status: 'rejected', detail: validationErr.message });
        continue;
      }

      const { firstName, middleName, lastName } = splitPatientName(rawPatientName);

      const { data: invItem } = await supabase.from('inventory_items').select('id, sales_conversion_factor').eq('item_code', itemCodeRaw).single();
      if (!invItem) { results.push({ row: rowNum, status: 'rejected', detail: `Drug code "${itemCodeRaw}" not found` }); continue; }

      const salesCF = Number(invItem.sales_conversion_factor || 1);
      const baseQty = qtyRaw * salesCF; // convert Sales UOM → Base UOM for ledger

      const batchNo = batchNoRaw || 'AUTO';
      const refNo = refNoRaw || null;
      const saleNo = `DSALE-E-${Date.now().toString().slice(-6)}-${rowNum}`;

      const val = await getItemValuation(storeId, invItem.id);
      const dates = await getBatchDates(storeId, invItem.id, batchNo);
      const newClosingStock = val.quantity - baseQty;
      const valuationRate = val.rate;

      const { data: ledgerRow, error: ledgerError } = await supabase
        .from('inventory_stock_ledger').insert({
          store_id: storeId, item_id: invItem.id, batch_no: batchNo,
          batch_date: dates.batchDate, expiry_date: dates.expiryDate,
          transaction_type: 'STOCKOUT', ref_type: 'DIRECT SALE', ref_doc_no: saleNo,
          ref_doc_date: parsedRefDocDate,               // audit doc date
          stock_out_quantity: baseQty, stock_in_quantity: 0, // baseQty = qtyRaw × sales_conversion_factor
          closing_stock: newClosingStock,
          closing_stock_rate: valuationRate,
          closing_stock_value: newClosingStock * valuationRate,
          source: 'offline_excel', reference_no: refNo,
          transaction_date: parsedTransactionDate.toISOString(), // actual sale time
          backlog_batch_id: openBatch.id,
          needs_reconciliation: false,
          created_by: createdBy  // authenticated uploader — NOT the template's Dispensed By
        }).select().single();

      if (ledgerError) {
        if (ledgerError.code === '23505') { results.push({ row: rowNum, status: 'duplicate', detail: `Duplicate ref_no "${refNo}" — skipped` }); continue; }
        results.push({ row: rowNum, status: 'rejected', detail: ledgerError.message }); continue;
      }

      insertedCount++;
      const newBalance = await refreshBalanceCache(storeId, invItem.id, batchNo, ledgerRow.id);
      let flagged = false;
      if (newBalance < 0) {
        await supabase.from('inventory_stock_ledger').update({ needs_reconciliation: true }).eq('id', ledgerRow.id);
        flagged = true; flaggedCount++;
      }

      const { data: saleRow } = await supabase.from('pharmacy_direct_sales').insert({
        store_id: storeId,
        sale_no: saleNo,
        // Name: raw always preserved; split fields are best-effort convenience only
        full_name_raw: rawPatientName,
        first_name: firstName,
        middle_name: middleName || null,
        last_name: lastName || null,
        external_no: externalIdRaw || null,
        dispensed_by: rawDispensedBy,               // physical dispenser — separate from created_by
        sale_date: parsedTransactionDate.toISOString(), // date from transaction_date for reporting accuracy
        dispensed_at: parsedTransactionDate.toISOString(),
        source: 'offline_excel',
        backlog_batch_id: openBatch.id,
        payment_status: 'paid',
        payment_mode: paymentModeRaw || 'Cash',
        total_amount: unitPriceRaw * qtyRaw,
        tax_amount: 0,
        reference_no: refNo
      }).select('id').single();

      if (saleRow?.id) {
        await supabase.from('inventory_stock_ledger').update({ sale_id: saleRow.id }).eq('id', ledgerRow.id);
      }
      results.push({ row: rowNum, status: flagged ? 'flagged' : 'inserted' });
    }

    const finalStatus = flaggedCount > 0 ? 'completed_with_flags' : 'completed';
    await supabase.from('pharmacy_offline_backlog_batches').update({
      upload_method: 'excel', uploaded_by: createdBy, status: finalStatus,
      total_rows: insertedCount, rows_flagged: flaggedCount, completed_at: new Date().toISOString()
    }).eq('id', openBatch.id);

    if (flaggedCount === 0) {
      await supabase.from('pharmacy_store_status').update({
        status: 'live', reconciliation_cleared_at: new Date().toISOString(), updated_at: new Date().toISOString()
      }).eq('store_id', storeId);
    }

    res.json({
      success: true,
      inserted: insertedCount,
      flagged: flaggedCount,
      storeStatus: flaggedCount === 0 ? 'live' : 'reconciliation_required',
      rows: results
    });
  } catch (err: any) {
    console.error('Excel upload error:', err);
    res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
});

// -------------------------------------------------------
// GET /reconciliation/flagged
// -------------------------------------------------------
router.get('/reconciliation/flagged', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { storeId } = req.query;
    if (!storeId) { res.status(400).json({ error: 'Missing storeId' }); return; }
    const { data, error } = await supabase
      .from('inventory_stock_ledger')
      .select(`id, store_id, item_id, batch_no, stock_out_quantity,
        transaction_date, reference_no, backlog_batch_id, created_by, created_at,
        backlog_batch:pharmacy_offline_backlog_batches(outage_started_at, outage_ended_at, outage_started_source)`)
      .eq('store_id', storeId as string)
      .eq('needs_reconciliation', true)
      .order('transaction_date', { ascending: false });
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ flagged: data || [] });
  } catch (err: any) {
    console.error('Fetch flagged error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// -------------------------------------------------------
// POST /reconciliation/resolve-flag
// -------------------------------------------------------
router.post('/reconciliation/resolve-flag', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { ledgerId, resolution, correctedBatchNo } = req.body;
    if (!ledgerId || !resolution) { res.status(400).json({ error: 'Missing ledgerId or resolution' }); return; }

    const updatePayload: any = { needs_reconciliation: false };
    if (correctedBatchNo) updatePayload.batch_no = correctedBatchNo;

    const { error } = await supabase.from('inventory_stock_ledger').update(updatePayload).eq('id', ledgerId);
    if (error) { res.status(500).json({ error: error.message }); return; }

    // Clear reconciliation lock if no more flags remain for this store
    const { data: ledgerEntry } = await supabase.from('inventory_stock_ledger').select('store_id').eq('id', ledgerId).single();
    if (ledgerEntry?.store_id) {
      const { count } = await supabase
        .from('inventory_stock_ledger').select('id', { count: 'exact', head: true })
        .eq('store_id', ledgerEntry.store_id).eq('needs_reconciliation', true);
      if ((count || 0) === 0) {
        const now = new Date().toISOString();
        await supabase.from('pharmacy_store_status').update(
          { status: 'live', reconciliation_cleared_at: now, updated_at: now }
        ).eq('store_id', ledgerEntry.store_id);
      }
    }
    res.json({ success: true });
  } catch (err: any) {
    console.error('Resolve flag error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// -------------------------------------------------------
// GET /reconciliation/flagged-all
// -------------------------------------------------------
router.get('/reconciliation/flagged-all', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { storeId, status } = req.query;
    let query = supabase
      .from('inventory_stock_ledger')
      .select(`
        id, store_id, item_id, batch_no, stock_in_quantity, stock_out_quantity, closing_stock,
        transaction_date, reference_no, created_by, created_at,
        needs_reconciliation, reconciliation_reason, reconciliation_status,
        resolved_by, resolved_at, resolution_type, resolution_note,
        inventory_items (item_name, item_code)
      `)
      .in('reconciliation_status', ['open', 'pending_confirmation', 'under_review', 'resolved']);

    if (storeId) {
      query = query.eq('store_id', storeId);
    }
    if (status) {
      query = query.eq('reconciliation_status', status);
    } else {
      query = query.in('reconciliation_status', ['open', 'pending_confirmation', 'under_review']);
    }

    const { data, error } = await query.order('transaction_date', { ascending: false });
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ flagged: data || [] });
  } catch (err: any) {
    console.error('Fetch flagged-all error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// -------------------------------------------------------
// POST /reconciliation/:ledgerId/correct-date
// -------------------------------------------------------
router.post('/reconciliation/:ledgerId/correct-date', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { ledgerId } = req.params;
    const { newTransactionDate, reason, supportingReference } = req.body;
    const correctedBy = req.user?.email || req.user?.username || 'unknown';

    if (!reason || !reason.trim()) {
      res.status(400).json({ error: 'Correction reason is required.' });
      return;
    }
    if (!newTransactionDate) {
      res.status(400).json({ error: 'New transaction date is required.' });
      return;
    }

    const { data: ledgerRow, error: fetchErr } = await supabase
      .from('inventory_stock_ledger')
      .select('transaction_date, item_id, batch_no, store_id')
      .eq('id', ledgerId)
      .single();
    if (fetchErr || !ledgerRow) {
      res.status(404).json({ error: 'Ledger entry not found.' });
      return;
    }

    const oldDate = ledgerRow.transaction_date;

    const { error: logErr } = await supabase
      .from('pharmacy_ledger_date_correction_log')
      .insert({
        ledger_id: ledgerId,
        old_transaction_date: oldDate,
        new_transaction_date: newTransactionDate,
        reason: reason.trim(),
        supporting_reference: supportingReference || null,
        corrected_by: correctedBy
      });
    if (logErr) {
      res.status(500).json({ error: 'Failed to create audit log', detail: logErr.message });
      return;
    }

    const now = new Date().toISOString();
    const { error: updateErr } = await supabase
      .from('inventory_stock_ledger')
      .update({
        transaction_date: newTransactionDate,
        ref_doc_date: newTransactionDate.split('T')[0], // keep ref doc date aligned on manual correct
        needs_reconciliation: false,
        reconciliation_status: 'resolved',
        resolved_by: correctedBy,
        resolved_at: now,
        resolution_type: 'date_corrected',
        resolution_note: reason.trim()
      })
      .eq('id', ledgerId);
    if (updateErr) {
      res.status(500).json({ error: 'Failed to update ledger date', detail: updateErr.message });
      return;
    }

    const earliestDate = new Date(oldDate) < new Date(newTransactionDate) ? oldDate : newTransactionDate;
    await supabase.rpc('recalculate_stock_ledger_running_balances', {
      p_item_id: ledgerRow.item_id,
      p_batch_no: ledgerRow.batch_no,
      p_store_id: ledgerRow.store_id,
      p_from_date: earliestDate
    });

    res.json({ success: true });
  } catch (err: any) {
    console.error('Correct date error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// -------------------------------------------------------
// POST /reconciliation/:ledgerId/confirm-no-issue
// -------------------------------------------------------
router.post('/reconciliation/:ledgerId/confirm-no-issue', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { ledgerId } = req.params;
    const { note } = req.body;
    const resolvedBy = req.user?.email || req.user?.username || 'unknown';

    if (!note || !note.trim()) {
      res.status(400).json({ error: 'Note is required to resolve flag.' });
      return;
    }

    const now = new Date().toISOString();
    const { error } = await supabase
      .from('inventory_stock_ledger')
      .update({
        needs_reconciliation: false,
        reconciliation_status: 'resolved',
        resolved_by: resolvedBy,
        resolved_at: now,
        resolution_type: 'confirmed_no_issue',
        resolution_note: note.trim()
      })
      .eq('id', ledgerId);

    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ success: true });
  } catch (err: any) {
    console.error('Confirm no-issue error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// -------------------------------------------------------
// POST /reconciliation/:ledgerId/create-adjustment
// -------------------------------------------------------
router.post('/reconciliation/:ledgerId/create-adjustment', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { ledgerId } = req.params;
    const { adjustmentQty, note } = req.body;
    const resolvedBy = req.user?.email || req.user?.username || 'unknown';

    if (!note || !note.trim()) {
      res.status(400).json({ error: 'Adjustment note is required.' });
      return;
    }
    if (adjustmentQty === undefined || isNaN(Number(adjustmentQty))) {
      res.status(400).json({ error: 'Valid adjustment quantity is required.' });
      return;
    }

    const { data: ledgerRow, error: fetchErr } = await supabase
      .from('inventory_stock_ledger')
      .select('item_id, batch_no, store_id, transaction_date, expiry_date, batch_date, closing_stock_rate')
      .eq('id', ledgerId)
      .single();
    if (fetchErr || !ledgerRow) {
      res.status(404).json({ error: 'Ledger entry not found.' });
      return;
    }

    const now = new Date().toISOString();
    const adjQtyNum = Number(adjustmentQty);

    const { data: adjRow, error: adjErr } = await supabase
      .from('inventory_stock_ledger')
      .insert({
        store_id: ledgerRow.store_id,
        item_id: ledgerRow.item_id,
        batch_no: ledgerRow.batch_no,
        batch_date: ledgerRow.batch_date,
        expiry_date: ledgerRow.expiry_date,
        transaction_type: 'ADJUSTMENT',
        ref_type: 'ADJUSTMENT',
        ref_doc_no: `ADJ-${Date.now().toString().slice(-6)}`,
        ref_doc_date: now.split('T')[0],
        stock_in_quantity: adjQtyNum > 0 ? adjQtyNum : 0,
        stock_out_quantity: adjQtyNum < 0 ? Math.abs(adjQtyNum) : 0,
        closing_stock: 0,
        closing_stock_rate: ledgerRow.closing_stock_rate || 0,
        closing_stock_value: 0,
        source: 'offline_manual',
        transaction_date: now,
        created_by: resolvedBy
      })
      .select()
      .single();

    if (adjErr) {
      res.status(500).json({ error: 'Failed to insert adjustment ledger entry', detail: adjErr.message });
      return;
    }

    const { error: resolveErr } = await supabase
      .from('inventory_stock_ledger')
      .update({
        needs_reconciliation: false,
        reconciliation_status: 'resolved',
        resolved_by: resolvedBy,
        resolved_at: now,
        resolution_type: 'adjustment_created',
        resolution_note: `Adjustment created with Qty: ${adjustmentQty}. Note: ${note.trim()}`
      })
      .eq('id', ledgerId);

    if (resolveErr) {
      res.status(500).json({ error: 'Failed to resolve original flag', detail: resolveErr.message });
      return;
    }

    res.json({ success: true, adjustmentId: adjRow.id });
  } catch (err: any) {
    console.error('Create adjustment error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// -------------------------------------------------------
// POST /reconciliation/:ledgerId/escalate
// -------------------------------------------------------
router.post('/reconciliation/:ledgerId/escalate', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { ledgerId } = req.params;
    const { note } = req.body;
    const user = req.user?.email || req.user?.username || 'unknown';

    if (!note || !note.trim()) {
      res.status(400).json({ error: 'Note is required to escalate.' });
      return;
    }

    const { error } = await supabase
      .from('inventory_stock_ledger')
      .update({
        reconciliation_status: 'under_review',
        resolution_note: `Escalated by ${user}: ${note.trim()}`
      })
      .eq('id', ledgerId);

    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ success: true });
  } catch (err: any) {
    console.error('Escalate error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
