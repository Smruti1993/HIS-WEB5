/**
 * tools/getPatientSummary.ts
 *
 * Demographics and last visit date for a specific patient.
 */
import { supabaseAdmin } from '../../../lib/supabase';

export async function getPatientSummary(patientId: string): Promise<Record<string, unknown> | null> {
  if (!patientId) {
    throw new Error('patient_id is required');
  }

  const { data: patient, error: patientError } = await supabaseAdmin
    .from('patients')
    .select('id, first_name, last_name, dob, gender, registration_date')
    .eq('id', patientId)
    .maybeSingle();

  if (patientError) {
    console.error('[getPatientSummary] Patient query error:', patientError.message);
    throw new Error(`Failed to fetch patient summary: ${patientError.message}`);
  }

  if (!patient) {
    return null;
  }

  // Calculate age
  let age: number | string = 'Unknown';
  if (patient.dob) {
    const birth = new Date(patient.dob);
    if (!isNaN(birth.getTime())) {
      const diff = Date.now() - birth.getTime();
      age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    }
  }

  // Fetch last visit
  const { data: lastVisit } = await supabaseAdmin
    .from('appointments')
    .select('date, time, status, visit_type')
    .eq('patient_id', patientId)
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    patientId: patient.id,
    name: `${patient.first_name || ''} ${patient.last_name || ''}`.trim(),
    age,
    gender: patient.gender || 'Unknown',
    registeredOn: patient.registration_date,
    lastVisit: lastVisit
      ? {
          date: lastVisit.date,
          time: lastVisit.time,
          status: lastVisit.status,
          visitType: lastVisit.visit_type || 'OP',
        }
      : 'No prior visits recorded',
  };
}

