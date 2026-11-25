/**
 * tools/getPatientAllergies.ts
 *
 * Active allergy records for a patient.
 */
import { supabaseAdmin } from '../../../lib/supabase';

export async function getPatientAllergies(patientId: string): Promise<Array<Record<string, unknown>>> {
  if (!patientId) {
    throw new Error('patient_id is required');
  }

  const { data, error } = await supabaseAdmin
    .from('clinical_allergies')
    .select('allergen, reaction, severity, status, allergy_type, onset_date')
    .eq('patient_id', patientId)
    .order('onset_date', { ascending: false });

  if (error) {
    console.error('[getPatientAllergies] DB error:', error.message);
    throw new Error(`Failed to fetch allergies: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return [];
  }

  return data.map((a: any) => ({
    allergen: a.allergen,
    reaction: a.reaction ? `[DATA: ${String(a.reaction).slice(0, 200)}]` : 'Not specified',
    severity: a.severity || 'Unknown',
    status: a.status || 'Active',
    type: a.allergy_type || 'General',
    onsetDate: a.onset_date || 'N/A',
  }));
}

