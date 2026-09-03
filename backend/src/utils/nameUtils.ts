/**
 * nameUtils.ts
 * Patient name handling for offline reconciliation entries.
 *
 * IMPORTANT: This module only provides a best-effort, heuristic Western-style
 * split (first / middle / last).  Many patients in this system have names
 * (Gulf/Saudi-origin compound given names, etc.) that do not fit this model.
 *
 * Callers MUST:
 *   1. Validate the input is non-empty BEFORE calling splitPatientName,
 *      using requireNonEmptyString() from dateUtils — this module does NOT
 *      silently default to placeholder names.
 *   2. Store the raw as-entered name in full_name_raw alongside the split
 *      fields, so the original value is always recoverable if the split is wrong.
 */

export interface PatientNameParts {
  firstName: string;
  middleName: string | null;
  lastName: string | null;
}

/**
 * Splits a validated, non-empty full name string into first, middle, and last
 * name parts.  This is heuristic and intended for search/display convenience
 * ONLY — the raw string must also be preserved separately.
 *
 * Examples:
 *   "Ali"              → { firstName: "Ali", middleName: null, lastName: null }
 *   "John Doe"         → { firstName: "John", middleName: null, lastName: "Doe" }
 *   "John Smith Doe"   → { firstName: "John", middleName: "Smith", lastName: "Doe" }
 *   "Abdul Rahman bin Khalid Al-Farsi"
 *                      → { firstName: "Abdul", middleName: "Rahman bin Khalid", lastName: "Al-Farsi" }
 *
 * Assumes the caller has already verified the input is non-empty (via
 * requireNonEmptyString) so this function does not need to handle that case.
 */
export function splitPatientName(fullName: string): PatientNameParts {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return { firstName: parts[0], middleName: null, lastName: null };
  }

  if (parts.length === 2) {
    return { firstName: parts[0], middleName: null, lastName: parts[1] };
  }

  return {
    firstName: parts[0],
    middleName: parts.slice(1, -1).join(' '),
    lastName: parts[parts.length - 1]
  };
}
