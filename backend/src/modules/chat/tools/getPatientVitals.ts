/**
 * tools/getPatientVitals.ts
 *
 * Patient vital signs history.
 * Joins clinical_vitals to appointments on appointment_id to filter by patient_id.
 * RBAC: Receptionist gets only BP, pulse, and temperature.
 * Nurses, Doctors, Admins get full vitals (SpO2, weight, height, BMI, etc.).
 */
import { supabaseAdmin } from '../../../lib/supabase';

export interface GetPatientVitalsOptions {
  patientId: string;
  limit?: number;
  role: string;
}

export async function getPatientVitals(options: GetPatientVitalsOptions): Promise<Array<Record<string, unknown>>> {
  const { patientId, role } = options;
  if (!patientId) {
    throw new Error('patient_id is required');
  }

  const limit = Math.min(Math.max(Number(options.limit) || 3, 1), 10);

  // First fetch appointment IDs for this patient
  const { data: apts, error: aptError } = await supabaseAdmin
    .from('appointments')
    .select('id')
    .eq('patient_id', patientId);

  if (aptError) {
    console.error('[getPatientVitals] Appointments query error:', aptError.message);
    throw new Error(`Failed to fetch vitals: ${aptError.message}`);
  }

  if (!apts || apts.length === 0) {
    return [];
  }

  const aptIds = apts.map((a: any) => a.id);

  const { data: vitals, error: vitalsError } = await supabaseAdmin
    .from('clinical_vitals')
    .select(`
      id,
      recorded_at,
      bp_systolic,
      bp_diastolic,
      temperature,
      pulse,
      respiratory_rate,
      weight,
      height,
      bmi,
      spo2
    `)
    .in('appointment_id', aptIds)
    .order('recorded_at', { ascending: false })
    .limit(limit);

  if (vitalsError) {
    console.error('[getPatientVitals] Vitals query error:', vitalsError.message);
    throw new Error(`Failed to fetch vitals: ${vitalsError.message}`);
  }

  if (!vitals || vitals.length === 0) {
    return [];
  }

  const normalizedRole = (role || '').toLowerCase();
  const isReceptionist = normalizedRole === 'receptionist';

  return vitals.map((v: any) => {
    const bp = (v.bp_systolic && v.bp_diastolic)
      ? `${v.bp_systolic}/${v.bp_diastolic} mmHg`
      : 'N/A';

    if (isReceptionist) {
      // Receptionist: BP, pulse, and temperature only
      return {
        recordedAt: v.recorded_at,
        bloodPressure: bp,
        pulse: v.pulse ? `${v.pulse} bpm` : 'N/A',
        temperature: v.temperature ? `${v.temperature} °F` : 'N/A',
        accessNotice: 'Full vitals (SpO2, Weight, Height) are restricted to clinical staff.',
      };
    }

    // Doctor, Nurse, Admin, Lab: Full vitals
    return {
      recordedAt: v.recorded_at,
      bloodPressure: bp,
      pulse: v.pulse ? `${v.pulse} bpm` : 'N/A',
      temperature: v.temperature ? `${v.temperature} °F` : 'N/A',
      spo2: v.spo2 ? `${v.spo2}%` : 'N/A',
      respiratoryRate: v.respiratory_rate ? `${v.respiratory_rate} /min` : 'N/A',
      weight: v.weight ? `${v.weight} kg` : 'N/A',
      height: v.height ? `${v.height} cm` : 'N/A',
      bmi: v.bmi ? String(v.bmi) : 'N/A',
    };
  });
}

