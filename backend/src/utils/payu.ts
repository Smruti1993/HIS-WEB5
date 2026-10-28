import crypto from 'crypto';

const getBaseUrl = () => (process.env.PAYU_BASE_URL ?? 'https://apitest.payu.in').trim().replace(/\/v2\/payments\/?$/, '').replace(/\/+$/, '');
const getKey = () => (process.env.PAYU_KEY ?? '').trim();
const getSalt = () => (process.env.PAYU_SALT ?? '').trim();
const getAccountId = () => (process.env.PAYU_ACCOUNT_ID ?? getKey()).trim();
const getCallbackBase = () => (process.env.PAYU_CALLBACK_BASE_URL ?? 'http://localhost:5005').trim();

export function buildAuthHeaders(body: string) {
  const date = new Date().toUTCString();
  const signature = crypto.createHash('sha512').update(`${body}|${date}|${getSalt()}`).digest('hex');
  return {
    date,
    authorization: `hmac username="${getKey()}", algorithm="sha512", headers="date", signature="${signature}"`,
  };
}

export type PosMethod = 'sale' | 'qr';

export interface InitiateParams {
  txnId: string;
  amount: number;
  posDeviceId: string;
  posMethod: PosMethod;
  cashierId?: string;
  udf1?: string;
  udf2?: string;
}

export async function initiatePosPayment(p: InitiateParams) {
  const amountStr = p.amount.toFixed(2);
  const requestBody = {
    accountId: getAccountId(),
    txnId: p.txnId,
    currency: 'INR',
    paymentSource: 'WEB',
    amount: amountStr,
    paymentMethod: { name: 'POS', bankCode: 'POS' },
    order: {
      productInfo: 'Pharmacy Direct Sale',
      userDefinedFields: { udf1: p.udf1 ?? '', udf2: p.udf2 ?? '' },
      paymentChargeSpecification: { price: amountStr },
    },
    additionalInfo: { txnFlow: 'seamless', txnS2sFlow: '4' },
    callBackActions: {
      successAction: `${getCallbackBase()}/payu/success`,
      failureAction: `${getCallbackBase()}/payu/failure`,
      cancelAction: `${getCallbackBase()}/payu/cancel`,
    },
    omniChannelDetails: {
      userId: p.cashierId ?? '',
      posDeviceId: p.posDeviceId,
      posPaymentMethod: p.posMethod,
    },
  };

  const bodyString = JSON.stringify(requestBody);
  const { date, authorization } = buildAuthHeaders(bodyString);

  const res = await fetch(`${getBaseUrl()}/v2/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', date, authorization },
    body: bodyString,
  });

  const text = await res.text();
  let raw: any;
  try {
    raw = JSON.parse(text);
  } catch {
    raw = { nonJsonResponse: text };
  }
  const meta = raw?.metaData ?? {};

  return {
    ok: res.ok && meta.statusCode === 'E000' && meta.txnStatus === 'pending',
    statusCode: meta.statusCode,
    txnStatus: meta.txnStatus,
    message: meta.message ?? (res.ok ? undefined : `HTTP ${res.status}`),
    paymentId: raw?.result?.paymentId,
    referenceId: meta.referenceId,
    requestBody,
    raw,
  };
}

export async function checkPaymentStatus(_txnId: string): Promise<any> {
  // Pending official PayU Check Status specification.
  // Until doc is provided, throws so callers remain in pending status.
  throw new Error('PayU Check Status API doc not configured yet');
}

