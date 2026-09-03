/**
 * dateUtils.ts
 * Shared date-handling and required-field validation utilities used by
 * the offline reconciliation endpoints (manual-entry, upload-excel).
 *
 * Key design rules enforced here:
 * - Transaction Date drives reporting. Ref Doc Date is audit-trail only.
 * - created_at is NEVER accepted from client input — always db default now().
 * - All date truncation uses UTC components directly to avoid off-by-one-day
 *   shifts on servers running in non-UTC timezones.
 */

/**
 * Truncates a full timestamp to midnight UTC (i.e. the start of that UTC day),
 * returning an ISO string.  Used to derive a safe ref_doc_date default from a
 * transaction timestamp without any locale-dependent string round-trips.
 *
 * Example:
 *   toUtcDateOnly('2026-08-15T14:15:00+03:00')
 *   → '2026-08-15T00:00:00.000Z'
 */
export function toUtcDateOnly(input: string | Date): string {
  const d = new Date(input);
  if (isNaN(d.getTime())) {
    throw new Error(`Invalid date value provided to toUtcDateOnly: "${input}"`);
  }
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString();
}

/**
 * Validates and parses a required date value coming from user input (a manual
 * entry form field or a parsed Excel cell).  Throws a descriptive error on
 * missing or unparseable input so the caller can attach it to the specific
 * row/field that failed — never silently falling through to a bad value.
 */
export function parseRequiredDate(value: unknown, fieldLabel: string): Date {
  if (value === null || value === undefined || value === '') {
    throw new Error(`${fieldLabel} is required and was not provided`);
  }
  const d = new Date(value as string);
  if (isNaN(d.getTime())) {
    throw new Error(`${fieldLabel} could not be parsed as a valid date: "${value}"`);
  }
  return d;
}

/**
 * Derives the YYYY-MM-DD sale_date that Direct Sales reporting should use.
 * Always sourced from Transaction Date — never Ref Doc Date — because Ref Doc
 * Date can legitimately trail the actual sale by a day or more (e.g. a
 * pharmacist consolidating entries the next morning).
 */
export function deriveSaleDate(transactionDate: Date): string {
  return toUtcDateOnly(transactionDate).split('T')[0];
}

/**
 * Validates a required free-text string from user input (Patient Name,
 * Dispensed By, etc.).  Applies the same row-level failure pattern as
 * parseRequiredDate so a blank cell rejects the row with a clear message
 * rather than silently defaulting to a placeholder value.
 *
 * Returns the trimmed, non-empty string on success.
 */
export function requireNonEmptyString(value: unknown, fieldLabel: string): string {
  const str = typeof value === 'string' ? value.trim() : '';
  if (!str) {
    throw new Error(`${fieldLabel} is required and was not provided`);
  }
  return str;
}
