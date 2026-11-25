/**
 * tools/getPatientVisits.ts
 *
 * Patient appointment and visit history.
 * RBAC: Stripping of clinical notes/diagnoses happens based on role.
 * Queries employees and departments independently to avoid PostgREST foreign-key cache errors.
 */
import { supabaseAdmin } from '../../../lib/supabase';

export interface GetPatientVisitsOptions {
  patientId: string;
  limit?: number;
  role: string;
}

export async function getPatientVisits(options: GetPatientVisitsOptions): Promise<Array<Record<string, unknown>>> {
  const { patientId, role } = options;
  if (!patientId) {
    throw new Error('patient_id is required');
  }

  const limit = Math.min(Math.max(Number(options.limit) || 5, 1), 20);

  // Fetch appointments without embedded relationships
  const { data: appointments, error } = await supabaseAdmin
    .from('appointments')
    .select('id, date, time, status, visit_type, symptoms, notes, doctor_id, department_id')
    .eq('patient_id', patientId)
    .order('date', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[getPatientVisits] DB error:', error.message);
    throw new Error(`Failed to fetch visits: ${error.message}`);
  }

  if (!appointments || appointments.length === 0) {
    return [];
  }

  // Lookup doctors and departments independently
  const doctorIds = Array.from(new Set(appointments.map((a: any) => a.doctor_id).filter(Boolean)));
  const deptIds = Array.from(new Set(appointments.map((a: any) => a.department_id).filter(Boolean)));

  const doctorMap: Record<string, string> = {};
  const deptMap: Record<string, string> = {};

  if (doctorIds.length > 0) {
    const { data: docs } = await supabaseAdmin
      .from('employees')
      .select('id, first_name, last_name')
      .in('id', doctorIds);
    (docs || []).forEach((d: any) => {
      doctorMap[d.id] = `Dr. ${d.first_name || ''} ${d.last_name || ''}`.trim();
    });
  }

  if (deptIds.length > 0) {
    const { data: depts } = await supabaseAdmin
      .from('departments')
      .select('id, name')
      .in('id', deptIds);
    (depts || []).forEach((dp: any) => {
      deptMap[dp.id] = dp.name;
    });
  }

  // Determine if role has clinical access
  const normalizedRole = (role || '').toLowerCase();
  const hasClinicalAccess =
    normalizedRole === 'doctor' ||
    normalizedRole === 'nurse' ||
    normalizedRole === 'administrator' ||
    normalizedRole === 'admin';

  // If role is clinical, also fetch diagnoses for these appointments
  let diagnosesByAppointment: Record<string, string[]> = {};
  if (hasClinicalAccess) {
    const aptIds = appointments.map((a: any) => a.id);
    const { data: diagData } = await supabaseAdmin
      .from('clinical_diagnoses')
      .select('appointment_id, description, icd_code, type')
      .in('appointment_id', aptIds);

    if (diagData) {
      diagData.forEach((d: any) => {
        if (!diagnosesByAppointment[d.appointment_id]) {
          diagnosesByAppointment[d.appointment_id] = [];
        }
        const text = d.icd_code ? `${d.description} (${d.icd_code})` : d.description;
        diagnosesByAppointment[d.appointment_id].push(`[DATA: ${String(text).slice(0, 200)}]`);
      });
    }
  }

  return appointments.map((apt: any) => {
    const doctorName = (apt.doctor_id && doctorMap[apt.doctor_id]) || 'Unassigned';
    const deptName = (apt.department_id && deptMap[apt.department_id]) || 'General';

    const baseRecord: Record<string, unknown> = {
      appointmentId: apt.id,
      date: apt.date,
      time: apt.time,
      status: apt.status,
      visitType: apt.visit_type || 'OP',
      doctor: doctorName,
      department: deptName,
    };

    if (hasClinicalAccess) {
      baseRecord.symptoms = apt.symptoms ? `[DATA: ${String(apt.symptoms).slice(0, 300)}]` : null;
      baseRecord.notes = apt.notes ? `[DATA: ${String(apt.notes).slice(0, 500)}]` : null;
      baseRecord.diagnoses = diagnosesByAppointment[apt.id] || [];
    } else {
      // Receptionist / Lab / other non-clinical roles
      baseRecord.clinicalNotesRedacted = 'Clinical notes and diagnoses are restricted to medical personnel.';
    }

    return baseRecord;
  });
}
