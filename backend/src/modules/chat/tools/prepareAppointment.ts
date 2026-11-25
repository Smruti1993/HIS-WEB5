/**
 * tools/prepareAppointment.ts
 *
 * Validates slot availability, patient, and doctor details.
 * Creates a server-side pending action in pendingActionStore.
 * DOES NOT write to the database!
 */
import { supabaseAdmin } from '../../../lib/supabase';
import { getTodayIST } from './getDashboardStats';
import { savePendingAction, PendingAction } from '../pendingActionStore';

export interface PrepareAppointmentOptions {
  patientId: string;
  doctorId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  userId: string; // DB user ID executing the prepare request
}

export async function prepareAppointment(
  options: PrepareAppointmentOptions
): Promise<{ summary: Record<string, unknown>; pendingAction: PendingAction }> {
  const { patientId, doctorId, date, time, userId } = options;

  if (!patientId || !doctorId || !date || !time) {
    throw new Error('patient_id, doctor_id, date, and time are all required.');
  }

  const cleanDate = date.trim();
  const cleanTime = time.trim().slice(0, 5);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
    throw new Error('date must be in YYYY-MM-DD format.');
  }

  if (!/^\d{2}:\d{2}$/.test(cleanTime)) {
    throw new Error('time must be in HH:MM format (24-hour).');
  }

  // 1. Verify date is not in the past (IST)
  const todayIST = getTodayIST();
  if (cleanDate < todayIST) {
    throw new Error(`Cannot book an appointment for a past date (${cleanDate}). Today is ${todayIST}.`);
  }

  // 2. Verify Patient Exists
  const { data: patient, error: pErr } = await supabaseAdmin
    .from('patients')
    .select('id, first_name, last_name')
    .eq('id', patientId)
    .maybeSingle();

  if (pErr || !patient) {
    throw new Error(`Patient not found with ID: ${patientId}`);
  }
  const patientName = `${patient.first_name || ''} ${patient.last_name || ''}`.trim();

  // 3. Verify Doctor Exists
  const { data: doctor, error: dErr } = await supabaseAdmin
    .from('employees')
    .select('id, first_name, last_name, department_id')
    .eq('id', doctorId)
    .maybeSingle();

  if (dErr || !doctor) {
    throw new Error(`Doctor not found with ID: ${doctorId}`);
  }
  const doctorName = `Dr. ${doctor.first_name || ''} ${doctor.last_name || ''}`.trim();
  let departmentName = 'General';
  const departmentId = doctor.department_id || undefined;

  if (departmentId) {
    const { data: dept } = await supabaseAdmin
      .from('departments')
      .select('name')
      .eq('id', departmentId)
      .maybeSingle();
    if (dept?.name) departmentName = dept.name;
  }

  // 4. Verify Doctor has availability on that day of week
  const [y, m, d] = cleanDate.split('-').map(Number);
  const targetDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const dayOfWeek = targetDate.toLocaleDateString('en-US', {
    weekday: 'long',
    timeZone: 'Asia/Kolkata',
  });

  const { data: availabilities } = await supabaseAdmin
    .from('doctor_availability')
    .select('start_time, end_time')
    .eq('doctor_id', doctorId)
    .ilike('day_of_week', dayOfWeek);

  if (!availabilities || availabilities.length === 0) {
    throw new Error(`${doctorName} does not have clinic hours on ${dayOfWeek}s.`);
  }

  // 5. Check if the slot is currently free in appointments
  const { data: existingBooking } = await supabaseAdmin
    .from('appointments')
    .select('id, status')
    .eq('doctor_id', doctorId)
    .eq('date', cleanDate)
    .eq('time', cleanTime)
    .neq('status', 'Cancelled')
    .maybeSingle();

  if (existingBooking) {
    throw new Error(`The slot ${cleanTime} on ${cleanDate} is already booked for ${doctorName}. Please select another time.`);
  }

  // 6. Save in pendingActionStore
  const pendingAction = savePendingAction({
    userId,
    patientId,
    patientName,
    doctorId,
    doctorName,
    departmentId,
    department: departmentName,
    date: cleanDate,
    time: cleanTime,
  });

  return {
    summary: {
      actionId: pendingAction.id,
      patient: patientName,
      doctor: doctorName,
      department: departmentName,
      date: cleanDate,
      time: cleanTime,
      expiresInMinutes: 5,
      instruction: 'The appointment has been prepared. Please prompt the user to click the Confirm button on the screen to finalize booking.',
    },
    pendingAction,
  };
}

