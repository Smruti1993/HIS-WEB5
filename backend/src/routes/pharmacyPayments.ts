import crypto from 'crypto';
import express, { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { initiatePosPayment, checkPaymentStatus, PosMethod } from '../utils/payu';

const DEFAULT_SALE_CURRENCY = process.env.DEFAULT_SALE_CURRENCY ?? 'SAR';
const ATTEMPT_TTL_SECONDS = Number(process.env.PAYU_ATTEMPT_TTL_SECONDS ?? 300);
const EXPIRY_GRACE_MS = 30_000;

type PayMethod = 'card' | 'upi';
const POS_METHOD: Record<PayMethod, PosMethod> = { card: 'sale', upi: 'qr' };

const getUserId = (req: Request): string | null => (req as any).user?.id ?? null;

// Secure Admin Check (No user_metadata, parameterized lookups)
async function isUserAdmin(req: Request): Promise<boolean> {
  const user = (req as any).user;
  if (!user) return false;
  if (user.role && String(user.role).toLowerCase() === 'admin') return true;
  if (user.app_metadata?.role && String(user.app_metadata.role).toLowerCase() === 'admin') return true;

  if (user.email) {
    const { data } = await supabaseAdmin.from('app_users').select('role').eq('email', user.email).maybeSingle();
    if (data?.role && String(data.role).toLowerCase() === 'admin') return true;
  }
  if (user.id) {
    const { data } = await supabaseAdmin.from('app_users').select('role').eq('id', user.id).maybeSingle();
    if (data?.role && String(data.role).toLowerCase() === 'admin') return true;
  }
  return false;
}

function getInrRate(currency: string): number {
  const RATES: Record<string, number> = {
    SAR: 22.20, USD: 83.00, BHD: 220.00, QAR: 22.80, INR: 1.00
  };
  const NORMALIZED: Record<string, string> = {
    'saudi riyal': 'SAR', 'sar': 'SAR', 'us dollar': 'USD', 'usd': 'USD',
    'bahraini dinar': 'BHD', 'bhd': 'BHD', 'qatari riyal': 'QAR', 'qar': 'QAR',
    'indian rupee': 'INR', 'inr': 'INR'
  };
  const code = NORMALIZED[currency.toLowerCase()] ?? currency.toUpperCase();
  const rate = RATES[code];
  if (!rate) throw new Error(`No INR exchange rate configured for ${currency}`);
  return rate;
}

async function logEvent(txnId: string | null, source: string, payload: unknown) {
  const { error } = await supabaseAdmin.from('pharmacy_payment_events').insert({ txn_id: txnId, source, payload });
  if (error) console.error('[payments] logEvent failed', error.message);
}

// CRITICAL FIX: Only touches 'pending' rows — never overwrites success/finalized attempts
async function markTerminal(txnId: string, status: 'failed' | 'expired' | 'cancelled', reason?: string) {
  const { data } = await supabaseAdmin
    .from('pharmacy_sale_payments')
    .update({ status, failure_reason: reason ?? null })
    .eq('txn_id', txnId)
    .eq('status', 'pending')
    .select('id');
  return (data?.length ?? 0) > 0;
}

export async function settleFromCheckStatus(txnId: string): Promise<string> {
  let result;
  try {
    result = await checkPaymentStatus(txnId);
  } catch {
    return 'pending';
  }
  await logEvent(txnId, 'check_status', result.raw);

  if (result.status === 'success') {
    const { data, error } = await supabaseAdmin.rpc('finalize_pos_payment', {
      p_txn_id: txnId,
      p_amount: result.amount ?? null,
      p_bank_ref: result.bankRef ?? null,
      p_mihpay_id: result.mihpayId ?? null,
    });
    if (error) throw error;
    return data as string;
  }
  if (result.status === 'failed') {
    await markTerminal(txnId, 'failed', result.message ?? 'Payment failed at terminal');
    return 'failed';
  }
  return 'pending';
}

export const pharmacyPaymentRouter = Router();

// POST /sales/:saleId/initiate-payment
pharmacyPaymentRouter.post('/sales/:saleId/initiate-payment', async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });

  const { saleId } = req.params;
  const paymentMethod = req.body?.paymentMethod as PayMethod;
  const storeId = req.body?.storeId as string;

  if (!['card', 'upi'].includes(paymentMethod)) return res.status(400).json({ error: 'paymentMethod must be card or upi' });
  if (!storeId) return res.status(400).json({ error: 'storeId is required' });

  // 1. Fetch sale and items
  const { data: sale, error: saleErr } = await supabaseAdmin
    .from('pharmacy_direct_sales')
    .select('*, items:pharmacy_direct_sale_items(*)')
    .eq('id', saleId)
    .single();

  if (saleErr || !sale) return res.status(404).json({ error: 'Sale not found' });
  if (sale.payment_status === 'paid') return res.status(409).json({ error: 'Sale is already paid' });
  if (sale.store_id && sale.store_id !== storeId) return res.status(400).json({ error: 'Store does not match the sale' });

  const items = sale.items || [];
  if (items.length === 0) return res.status(400).json({ error: 'Sale has no line items' });

  // 2. Fetch inventory items to resolve Sales Conversion Factors
  const itemIds = Array.from(new Set(items.map((i: any) => i.item_id)));
  const { data: invItems } = await supabaseAdmin
    .from('inventory_items')
    .select('id, sales_uom, base_uom, sales_conversion_factor')
    .in('id', itemIds);

  const invMap = new Map((invItems || []).map((inv: any) => [inv.id, inv]));

  // 3. Early Stock Check using Server-Side RPC (aggregates quantity, applies UOM factor)
  const batchReqMap = new Map<string, { itemId: string; batchNo: string; baseQty: number }>();
  for (const item of items) {
    const inv = invMap.get(item.item_id);
    const isSalesUom = (item.unit || '').toUpperCase() === (inv?.sales_uom || '').toUpperCase();
    const salesCF = isSalesUom ? Number(inv?.sales_conversion_factor || 1) : 1;
    const requiredBaseQty = Number(item.quantity || 0) * salesCF;

    const key = `${item.item_id}_${(item.batch_no || '').trim().toUpperCase()}`;
    const prev = batchReqMap.get(key) || { itemId: item.item_id, batchNo: item.batch_no, baseQty: 0 };
    prev.baseQty += requiredBaseQty;
    batchReqMap.set(key, prev);
  }

  for (const entry of batchReqMap.values()) {
    const { data: currentStock, error: rpcErr } = await supabaseAdmin.rpc('get_batch_stock_balance', {
      p_store_id: storeId,
      p_item_id: entry.itemId,
      p_batch_no: entry.batchNo
    });

    if (rpcErr) {
      console.error('[payments] get_batch_stock_balance error:', rpcErr);
      return res.status(500).json({ error: 'Failed to verify inventory balance' });
    }

    if (Number(currentStock || 0) < entry.baseQty) {
      return res.status(400).json({
        error: `Insufficient stock in batch ${entry.batchNo}. Available: ${currentStock}, Required: ${entry.baseQty}. Terminal payment aborted before charge.`
      });
    }
  }

  // 4. Amount and FX Rate (read sale.currency_code with fallback)
  const originalAmount = Number(sale.total_amount);
  const originalCurrency = sale.currency_code || DEFAULT_SALE_CURRENCY;
  const fxRate = getInrRate(originalCurrency);
  const inrAmount = Number((originalAmount * fxRate).toFixed(2));

  if (!(inrAmount > 0)) return res.status(400).json({ error: 'Calculated payable amount must be greater than 0' });

  // 5. Active Terminal
  const { data: terminal } = await supabaseAdmin
    .from('pharmacy_store_terminals')
    .select('pos_device_id')
    .eq('store_id', storeId)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  if (!terminal) return res.status(400).json({ error: 'No active POS terminal mapped to this store' });

  // 6. Payment Attempt Row
  const txnId = `DS${Date.now()}${Math.floor(100 + Math.random() * 900)}`;
  const expiresAt = new Date(Date.now() + ATTEMPT_TTL_SECONDS * 1000).toISOString();

  const { error: insErr } = await supabaseAdmin.from('pharmacy_sale_payments').insert({
    sale_id: saleId,
    txn_id: txnId,
    amount: inrAmount,
    original_amount: originalAmount,
    original_currency: originalCurrency,
    fx_rate_to_inr: fxRate,
    payment_method: paymentMethod,
    pos_device_id: terminal.pos_device_id,
    status: 'pending',
    initiated_by: userId,
    expires_at: expiresAt,
  });

  if (insErr) {
    console.error('Error creating pharmacy_sale_payments record:', insErr);
    if ((insErr as any).code === '23505') return res.status(409).json({ error: 'A payment is already in progress for this sale' });
    return res.status(500).json({ error: `Failed to create payment attempt: ${insErr.message || ''}` });
  }

  // If in mock mode and no live PayU keys are set, proceed directly to mock waiting
  if (process.env.ENABLE_PAYMENT_MOCK === 'true' && !process.env.PAYU_KEY) {
    return res.json({
      txnId,
      status: 'pending',
      expiresAt,
      paymentMethod,
      amountInr: inrAmount,
      originalAmount,
      originalCurrency,
      mock: true
    });
  }

  // 7. Initiate PayU Call
  try {
    const r = await initiatePosPayment({
      txnId,
      amount: inrAmount,
      posDeviceId: terminal.pos_device_id,
      posMethod: POS_METHOD[paymentMethod],
      cashierId: userId,
      udf1: storeId,
      udf2: saleId,
    });
    await logEvent(txnId, 'initiate_request', r.requestBody);
    await logEvent(txnId, 'initiate_response', r.raw);

    if (!r.ok) {
      await markTerminal(txnId, 'failed', `${r.statusCode ?? ''} ${r.message ?? 'Rejected by PayU'}`.trim());
      return res.status(502).json({ error: r.message ?? 'PayU rejected the request', statusCode: r.statusCode });
    }

    await supabaseAdmin.from('pharmacy_sale_payments')
      .update({ payu_payment_id: r.paymentId ?? null, payu_reference_id: r.referenceId ?? null })
      .eq('txn_id', txnId);

    return res.json({ txnId, status: 'pending', expiresAt, paymentMethod, amountInr: inrAmount, originalAmount, originalCurrency });
  } catch (e: any) {
    await markTerminal(txnId, 'failed', `Could not reach PayU: ${e?.message ?? e}`);
    return res.status(502).json({ error: 'Could not connect to PayU' });
  }
});

// GET /sales/:saleId/payment-status
pharmacyPaymentRouter.get('/sales/:saleId/payment-status', async (req: Request, res: Response) => {
  const { saleId } = req.params;
  const { data: pay } = await supabaseAdmin
    .from('pharmacy_sale_payments')
    .select('txn_id, status, payment_method, bank_ref_no, failure_reason, expires_at, created_at')
    .eq('sale_id', saleId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!pay) return res.status(404).json({ error: 'No payment attempt for this sale' });

  let current = { status: pay.status as string, bank_ref_no: pay.bank_ref_no, failure_reason: pay.failure_reason };

  if (current.status === 'pending' && Date.now() - new Date(pay.created_at).getTime() > 5000) {
    await settleFromCheckStatus(pay.txn_id).catch(() => {});
    if (new Date(pay.expires_at).getTime() + EXPIRY_GRACE_MS < Date.now()) {
      await markTerminal(pay.txn_id, 'expired', 'Terminal timed out');
    }
    const { data: fresh } = await supabaseAdmin
      .from('pharmacy_sale_payments').select('status, bank_ref_no, failure_reason').eq('txn_id', pay.txn_id).single();
    if (fresh) current = fresh as any;
  }

  const { data: sale } = await supabaseAdmin.from('pharmacy_direct_sales').select('payment_status').eq('id', saleId).single();

  res.json({
    txnId: pay.txn_id,
    status: current.status,
    paymentMethod: pay.payment_method,
    bankRef: current.bank_ref_no,
    failureReason: current.failure_reason,
    expiresAt: pay.expires_at,
    saleCompleted: (sale as any)?.payment_status === 'paid',
  });
});

// POST /sales/:saleId/cancel-payment
pharmacyPaymentRouter.post('/sales/:saleId/cancel-payment', async (req: Request, res: Response) => {
  const { saleId } = req.params;
  const { data: pay } = await supabaseAdmin
    .from('pharmacy_sale_payments').select('txn_id').eq('sale_id', saleId).eq('status', 'pending').maybeSingle();
  if (!pay) return res.json({ cancelled: false, reason: 'No pending payment' });

  const outcome = await settleFromCheckStatus(pay.txn_id).catch(() => 'pending');
  if (outcome === 'finalized' || outcome === 'already_done') {
    return res.status(409).json({ cancelled: false, reason: 'Payment was already completed' });
  }
  await markTerminal(pay.txn_id, 'cancelled', 'Cancelled by cashier');
  res.json({ cancelled: true });
});

// POST /sales/:saleId/claim-completion
pharmacyPaymentRouter.post('/sales/:saleId/claim-completion', async (req: Request, res: Response) => {
  const { data, error } = await supabaseAdmin.rpc('claim_pos_sale_completion', { p_sale_id: req.params.saleId });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ claimed: data === true });
});

// POST /sales/:saleId/release-completion
pharmacyPaymentRouter.post('/sales/:saleId/release-completion', async (req: Request, res: Response) => {
  const { error } = await supabaseAdmin.rpc('release_pos_sale_completion', { p_sale_id: req.params.saleId });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ released: true });
});

// POST /sales/:saleId/mark-needs-review (Secured to matching sale and success status)
pharmacyPaymentRouter.post('/sales/:saleId/mark-needs-review', async (req: Request, res: Response) => {
  const { saleId } = req.params;
  const { txnId, reason } = req.body;
  if (!txnId) return res.status(400).json({ error: 'txnId required' });

  const { data, error } = await supabaseAdmin
    .from('pharmacy_sale_payments')
    .update({ status: 'needs_review', failure_reason: reason || 'Stock deduction failed after payment' })
    .eq('txn_id', txnId)
    .eq('sale_id', saleId)
    .eq('status', 'success')
    .select('id');

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: (data?.length ?? 0) > 0 });
});

// GET /sales/:saleId/active-payment (Guards cash and manual completion from collisions)
pharmacyPaymentRouter.get('/sales/:saleId/active-payment', async (req: Request, res: Response) => {
  const { saleId } = req.params;
  const { data: pays } = await supabaseAdmin
    .from('pharmacy_sale_payments').select('status').eq('sale_id', saleId).in('status', ['pending', 'success']);
  const { data: sale } = await supabaseAdmin.from('pharmacy_direct_sales').select('payment_status').eq('id', saleId).single();
  const hasPending = (pays ?? []).some((p: any) => p.status === 'pending');
  const paidNotCompleted = (pays ?? []).some((p: any) => p.status === 'success') && (sale as any)?.payment_status !== 'paid';
  res.json({ active: hasPending || paidNotCompleted });
});

// GET /payments/awaiting-completion
pharmacyPaymentRouter.get('/payments/awaiting-completion', async (_req: Request, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('pharmacy_sale_payments')
    .select('txn_id, sale_id, amount, original_amount, original_currency, bank_ref_no, finalized_at, pharmacy_direct_sales!inner(sale_no, payment_status)')
    .eq('status', 'success')
    .neq('pharmacy_direct_sales.payment_status', 'paid')
    .order('finalized_at', { ascending: true })
    .limit(100);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ items: data ?? [] });
});

// GET /payments/needs-review
pharmacyPaymentRouter.get('/payments/needs-review', async (_req: Request, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('pharmacy_sale_payments')
    .select('txn_id, sale_id, amount, bank_ref_no, failure_reason, updated_at')
    .eq('status', 'needs_review')
    .order('updated_at', { ascending: false })
    .limit(100);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ items: data ?? [] });
});

// DEV MOCK ENDPOINT
if (process.env.ENABLE_PAYMENT_MOCK === 'true') {
  pharmacyPaymentRouter.post('/dev/mock-payment/:txnId/:outcome', async (req: Request, res: Response) => {
    const admin = await isUserAdmin(req);
    if (!admin) return res.status(403).json({ error: 'Admin only' });

    const { txnId, outcome } = req.params;
    await logEvent(txnId, 'manual', { mock: outcome, by: getUserId(req) });

    if (outcome === 'success') {
      const { data: pay } = await supabaseAdmin.from('pharmacy_sale_payments').select('amount').eq('txn_id', txnId).single();
      const { data, error } = await supabaseAdmin.rpc('finalize_pos_payment', {
        p_txn_id: txnId,
        p_amount: (pay as any)?.amount ?? null,
        p_bank_ref: 'MOCK_REF_' + Date.now().toString().slice(-6),
        p_mihpay_id: 'MOCK_MIHPAY_' + Date.now().toString().slice(-6),
      });
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ result: data });
    }

    await markTerminal(txnId, 'failed', 'Simulated mock failure');
    res.json({ result: 'failed' });
  });
}

// Background Reconciler
export function startPaymentReconciler(intervalMs = 60_000) {
  const tick = async () => {
    try {
      const cutoff = new Date(Date.now() - 30_000).toISOString();
      const { data } = await supabaseAdmin
        .from('pharmacy_sale_payments')
        .select('txn_id, expires_at')
        .eq('status', 'pending')
        .lt('created_at', cutoff)
        .limit(100);

      for (const p of data ?? []) {
        const outcome = await settleFromCheckStatus(p.txn_id).catch(() => 'pending');
        if (outcome === 'pending' && new Date(p.expires_at).getTime() + EXPIRY_GRACE_MS < Date.now()) {
          await markTerminal(p.txn_id, 'expired', 'Expired: no confirmation from terminal');
        }
      }
    } catch (e) {
      console.error('[reconciler] tick failed', e);
    }
  };
  return setInterval(tick, intervalMs);
}

// ============================================================ WEBHOOK ROUTER
export const payuWebhookRouter = Router();

payuWebhookRouter.post(
  '/webhooks/payu',
  express.urlencoded({ extended: false }),
  async (req: Request, res: Response) => {
    const payload = req.body ?? {};
    const txnId: string | null = payload.txnId ?? payload.txnid ?? null;

    const expected = process.env.PAYU_WEBHOOK_TOKEN;
    if (process.env.NODE_ENV === 'production' && !expected) {
      console.error('[webhook] FATAL: PAYU_WEBHOOK_TOKEN is required in production');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    if (expected) {
      const got = String(req.query.token ?? '');
      const a = Buffer.from(got), b = Buffer.from(expected);
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        await logEvent(txnId, 'webhook', { rejected: 'bad token' });
        return res.status(401).json({ error: 'unauthorized' });
      }
    }

    await logEvent(txnId, 'webhook', payload);
    res.status(200).json({ received: true });

    if (txnId) {
      setImmediate(() => settleFromCheckStatus(txnId).catch(() => {}));
    }
  }
);

