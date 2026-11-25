/**
 * tools/getAvailableSlots.ts
 *
 * Compute available appointment time slots for a doctor on a specific date.
 * Steps:
 *  1. Determines day of week in Asia/Kolkata timezone.
 *  2. Fetches doctor's schedule from doctor_availability.
 *  3. Fetches existing active appointments for that doctor on that date.
 *  4. Subtracts booked slots and returns open slots.
 */
import { supabaseAdmin } from '../../../lib/supabase';
import { getTodayIST } from './getDashboardStats';

export interface GetAvailableSlotsOptions {
  doctorId: string;
  date: string; // YYYY-MM-DD
}

function parseTimeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function formatMinutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export async function getAvailableSlots(options: GetAvailableSlotsOptions): Promise<Record<string, unknown>> {
  const { doctorId, date } = options;

  if (!doctorId) {
    throw new Error('doctor_id is required');
  }

  const cleanDate = (date || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
    throw new Error('date must be in YYYY-MM-DD format');
  }

  // 1. Fetch Doctor Info
  const { data: doctor, error: docErr } = await supabaseAdmin
    .from('employees')
    .select('id, first_name, last_name, specialization')
    .eq('id', doctorId)
    .maybeSingle();

  if (docErr || !doctor) {
    throw new Error(`Doctor not found with ID: ${doctorId}`);
  }

  const doctorName = `Dr. ${doctor.first_name || ''} ${doctor.last_name || ''}`.trim();

  // 2. Determine Day of Week in Asia/Kolkata
  const [year, month, day] = cleanDate.split('-').map(Number);
  // Construct noon UTC Date to avoid any timezone day boundary drift
  const targetDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const dayOfWeek = targetDate.toLocaleDateString('en-US', {
    weekday: 'long',
    timeZone: 'Asia/Kolkata',
  });

  // 3. Fetch Doctor's Availability for this day of week
  const { data: availabilities, error: availErr } = await supabaseAdmin
    .from('doctor_availability')
    .select('start_time, end_time, slot_duration_minutes')
    .eq('doctor_id', doctorId)
    .ilike('day_of_week', dayOfWeek);

  if (availErr) {
    console.error('[getAvailableSlots] Availability query error:', availErr.message);
    throw new Error(`Failed to check doctor schedule: ${availErr.message}`);
  }

  if (!availabilities || availabilities.length === 0) {
    return {
      doctorId,
      doctorName,
      date: cleanDate,
      dayOfWeek,
      availableSlots: [],
      message: `${doctorName} does not have clinic hours scheduled on ${dayOfWeek}s.`,
    };
  }

  // 4. Fetch booked appointments for this doctor on this date
  const { data: appointments, error: aptErr } = await supabaseAdmin
    .from('appointments')
    .select('time, status')
    .eq('doctor_id', doctorId)
    .eq('date', cleanDate)
    .neq('status', 'Cancelled');

  if (aptErr) {
    console.error('[getAvailableSlots] Appointments query error:', aptErr.message);
    throw new Error(`Failed to check existing bookings: ${aptErr.message}`);
  }

  // Set of booked times (normalized to HH:MM)
  const bookedSet = new Set<string>();
  (appointments || []).forEach((apt: any) => {
    if (apt.time) {
      bookedSet.add(apt.time.slice(0, 5));
    }
  });

  // 5. Generate and filter slot list
  const allSlots: string[] = [];

  for (const block of availabilities) {
    const startMin = parseTimeToMinutes(block.start_time || '09:00');
    const endMin = parseTimeToMinutes(block.end_time || '17:00');
    const step = Math.max(Number(block.slot_duration_minutes) || 15, 5);

    for (let m = startMin; m + step <= endMin; m += step) {
      allSlots.push(formatMinutesToTime(m));
    }
  }

  // Filter out booked slots
  let freeSlots = allSlots.filter((slot) => !bookedSet.has(slot));

  // If the requested date is today (IST), filter out past time slots
  const todayIST = getTodayIST();
  if (cleanDate === todayIST) {
    const now = new Date();
    const currentISTTime = now.toLocaleTimeString('en-GB', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const currentMin = parseTimeToMinutes(currentISTTime);
    freeSlots = freeSlots.filter((slot) => parseTimeToMinutes(slot) > currentMin);
  }

  return {
    doctorId,
    doctorName,
    date: cleanDate,
    dayOfWeek,
    totalSlots: allSlots.length,
    availableSlotsCount: freeSlots.length,
    availableSlots: freeSlots,
  };
}

