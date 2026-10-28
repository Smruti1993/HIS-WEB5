import React, { useCallback, useEffect, useRef, useState } from 'react';
import { posApi } from '../../services/posPaymentApi';

type Phase = 'starting' | 'waiting' | 'success' | 'failed' | 'expired' | 'cancelled' | 'needs_review' | 'error';

interface Props {
  saleId: string;
  storeId: string;
  paymentMethod: 'card' | 'upi';
  onSuccess: (r: { txnId: string; bankRef?: string }) => void;
  onClose: () => void;
}

export const PosPaymentModal: React.FC<Props> = ({
  saleId,
  storeId,
  paymentMethod,
  onSuccess,
  onClose
}) => {
  const [phase, setPhase] = useState<Phase>('starting');
  const [message, setMessage] = useState('');
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [amountInr, setAmountInr] = useState<number | null>(null);
  const [original, setOriginal] = useState<{ amount: number; currency: string } | null>(null);
  const [txnId, setTxnId] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);

  const startedRef = useRef(false);
  const doneRef = useRef(false);
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  const start = useCallback(async () => {
    setPhase('starting');
    setMessage('');
    doneRef.current = false;
    try {
      const r = await posApi(`/api/pharmacy/sales/${saleId}/initiate-payment`, {
        method: 'POST',
        body: JSON.stringify({ paymentMethod, storeId }),
      });
      setAmountInr(r.amountInr);
      setOriginal({ amount: r.originalAmount, currency: r.originalCurrency });
      setExpiresAt(new Date(r.expiresAt).getTime());
      setTxnId(r.txnId);
      if (r.mock) setIsMock(true);
      setPhase('waiting');
    } catch (e: any) {
      setPhase('error');
      setMessage(e?.message ?? 'Could not start the terminal payment');
    }
  }, [saleId, storeId, paymentMethod]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    start();
  }, [start]);

  useEffect(() => {
    if (phase !== 'waiting') return;
    const id = setInterval(async () => {
      if (doneRef.current) return;
      try {
        const s = await posApi(`/api/pharmacy/sales/${saleId}/payment-status`);
        if (s.status === 'success') {
          doneRef.current = true;
          setPhase('success');
          onSuccessRef.current({ txnId: s.txnId, bankRef: s.bankRef ?? undefined });
        } else if (['failed', 'expired', 'cancelled', 'needs_review'].includes(s.status)) {
          doneRef.current = true;
          setPhase(s.status as Phase);
          setMessage(s.failureReason ?? '');
        }
      } catch {}
    }, 3000);
    return () => clearInterval(id);
  }, [phase, saleId]);

  useEffect(() => {
    if (phase !== 'waiting' || !expiresAt) return;
    const id = setInterval(() => setSecondsLeft(Math.max(0, Math.round((expiresAt - Date.now()) / 1000))), 500);
    return () => clearInterval(id);
  }, [phase, expiresAt]);

  const cancel = async () => {
    try {
      await posApi(`/api/pharmacy/sales/${saleId}/cancel-payment`, { method: 'POST' });
    } catch {}
    doneRef.current = true;
    onClose();
  };

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-[450px] rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-800">
            {paymentMethod === 'card' ? 'Card Terminal Payment' : 'UPI QR Payment'}
          </h3>
          <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-50 text-purple-700">
            NEXGO N82
          </span>
        </div>

        {amountInr !== null && (
          <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Payable on POS</span>
            <p className="text-3xl font-black text-purple-700 mt-0.5">₹ {amountInr.toFixed(2)}</p>
            {original && original.amount > 0 && (
              <p className="text-xs text-slate-400 mt-1">
                Sale Total: {original.currency} {original.amount.toFixed(2)} (Effective Rate: 1 {original.currency} = ₹{(amountInr / original.amount).toFixed(2)})
              </p>
            )}
          </div>
        )}

        {phase === 'starting' && (
          <div className="py-8 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
            <p className="mt-3 text-sm font-semibold text-slate-600">Connecting to POS terminal…</p>
          </div>
        )}

        {phase === 'waiting' && (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-slate-600 text-center">
              Please prompt the customer to {paymentMethod === 'card' ? 'insert / tap their card' : 'scan the QR code'} on the terminal.
            </p>
            <div className="flex items-center justify-center gap-2 text-xs font-mono text-slate-500">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              Waiting for PayU confirmation… {mm}:{ss}
            </div>

            <div className="mt-3 p-2.5 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-[11px] text-amber-800 leading-tight">
                <strong>Notice on Cancel:</strong> Cancelling in software does not abort the physical terminal screen. If the customer taps or pays afterwards, the funds are safely held for supervisor review.
              </p>
            </div>

            {(isMock || import.meta.env.DEV) && txnId && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    await posApi(`/api/pharmacy/dev/mock-payment/${txnId}/success`, { method: 'POST' });
                  } catch (e: any) {
                    alert('Mock simulation error: ' + (e?.message || e));
                  }
                }}
                className="w-full py-2 px-3 rounded-xl text-xs font-bold text-violet-700 bg-violet-100 hover:bg-violet-200 border border-violet-300 transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                <span>⚡</span> Simulate Terminal Tap (Mock Success)
              </button>
            )}

            <button onClick={cancel} className="mt-4 w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-600 border border-slate-200 hover:bg-slate-50">
              Cancel Payment
            </button>
          </div>
        )}

        {phase === 'success' && (
          <div className="py-6 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xl">✓</div>
            <p className="mt-3 text-sm font-bold text-emerald-700">Payment Captured!</p>
            <p className="text-xs text-slate-500 mt-1">Completing stock dispense and invoicing…</p>
          </div>
        )}

        {(phase === 'failed' || phase === 'expired' || phase === 'cancelled' || phase === 'error') && (
          <div className="mt-4 text-center">
            <p className="text-sm font-bold text-rose-600">
              {phase === 'expired' ? 'Payment Timed Out' : phase === 'cancelled' ? 'Payment Cancelled' : 'Payment Failed'}
            </p>
            {message && <p className="text-xs text-slate-500 mt-1">{message}</p>}
            <div className="mt-5 flex gap-2">
              <button onClick={() => { startedRef.current = false; start(); }} className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700">
                Retry
              </button>
              <button onClick={onClose} className="flex-1 py-2 rounded-xl text-xs font-bold text-slate-600 border border-slate-200 hover:bg-slate-50">
                Close
              </button>
            </div>
          </div>
        )}

        {phase === 'needs_review' && (
          <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-center">
            <p className="text-sm font-bold text-amber-800">Requires Supervisor Review</p>
            <p className="text-xs text-amber-700 mt-1">
              Payment was reported by PayU with a mismatch or after timeout. <strong>DO NOT DISPENSE</strong> drugs until reviewed.
            </p>
            <button onClick={onClose} className="mt-4 w-full py-2 rounded-xl text-xs font-bold bg-amber-600 text-white hover:bg-amber-700">
              Acknowledge & Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
export default PosPaymentModal;

