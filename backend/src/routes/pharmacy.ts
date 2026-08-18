import { Router, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { AuthenticatedRequest } from '../middleware/auth';
import dotenv from 'dotenv';

dotenv.config();
const router = Router();

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

// 2. Log substitution actions
router.post('/sales/substitution-log', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { logs } = req.body;
    if (!logs || !Array.isArray(logs)) {
      res.status(400).json({ error: 'Missing logs array' });
      return;
    }

    const { error } = await supabase
      .from('pharmacy_substitution_audit_logs')
      .insert(
        logs.map((log: any) => ({
          sale_id: log.saleId,
          line_no: log.lineNo,
          original_drug_id: log.originalDrugId,
          suggested_drug_ids: log.suggestedDrugIds || [],
          switched_to_drug_id: log.switchedToDrugId || null,
          action: log.action,
          user_id: req.user?.username || 'admin'
        }))
      );

    if (error) {
      console.error('Failed to save substitution logs:', error);
      res.status(500).json({ error: 'Failed to insert logs into database' });
      return;
    }

    res.json({ success: true });
  } catch (err: any) {
    console.error('Save logs error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
