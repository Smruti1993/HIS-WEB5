/**
 * tools/getDashboardStats.ts
 *
 * Dashboard metrics for clinic operations.
 * Uses 'Asia/Kolkata' (IST) to evaluate today's calendar date.
 * RBAC: Admins see complete metrics (patients, active doctors, appointments by dept, status breakdown).
 * Non-admins see limited summary counts.
 */
import { supabaseAdmin } from '../../../lib/supabase';

export interface DashboardStatsOptions {
  role: string;
}

export function getTodayIST(): string {
  const now = new Date();
  // 'en-CA' outputs YYYY-MM-DD format reliably
  return now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

export async function getDashboardStats(options: DashboardStatsOptions): Promise<Record<string, unknown>> {
  const { role } = options;
  const today = getTodayIST();
  const normalizedRole = (role || '').toLowerCase();
  const isAdmin = normalizedRole === 'admin' || normalizedRole === 'administrator';

  try {
    // 1. Total Patients Count
    const { count: totalPatients, error: pErr } = await supabaseAdmin
      .from('patients')
      .select('*', { count: 'exact', head: true });

    if (pErr) console.warn('[getDashboardStats] Error counting patients:', pErr.message);

    // 2. Active Doctors Count
    const { count: activeDoctors, error: dErr } = await supabaseAdmin
      .from('employees')
      .select('*', { count: 'exact', head: true })
      .ilike('role', '%doctor%')
      .eq('status', 'Active');

    if (dErr) console.warn('[getDashboardStats] Error counting doctors:', dErr.message);

    // 3. Appointments Today
    const { data: todayAppointments, error: aErr } = await supabaseAdmin
      .from('appointments')
      .select('id, status, department_id')
      .eq('date', today);

    if (aErr) console.warn('[getDashboardStats] Error fetching today appointments:', aErr.message);

    const appointmentsList = todayAppointments || [];
    const totalAppointmentsToday = appointmentsList.length;

    // Lookup department names independently
    const deptIds = Array.from(new Set(appointmentsList.map((a: any) => a.department_id).filter(Boolean)));
    const deptMap: Record<string, string> = {};

    if (deptIds.length > 0) {
      const { data: depts } = await supabaseAdmin
        .from('departments')
        .select('id, name')
        .in('id', deptIds);
      (depts || []).forEach((d: any) => {
        deptMap[d.id] = d.name;
      });
    }

    // Status breakdown
    const statusCounts: Record<string, number> = {};
    const departmentCounts: Record<string, number> = {};

    appointmentsList.forEach((apt: any) => {
      const st = apt.status || 'Scheduled';
      statusCounts[st] = (statusCounts[st] || 0) + 1;

      const deptName = (apt.department_id && deptMap[apt.department_id]) || 'General';
      departmentCounts[deptName] = (departmentCounts[deptName] || 0) + 1;
    });

    if (!isAdmin) {
      // Non-admin / Receptionist / Staff limited view
      return {
        date: today,
        timezone: 'Asia/Kolkata (IST)',
        activeDoctors: activeDoctors ?? 0,
        appointmentsToday: totalAppointmentsToday,
        scheduledAppointments: statusCounts['Scheduled'] || 0,
        completedAppointments: statusCounts['Completed'] || 0,
        accessNotice: 'Detailed operational breakdown is restricted to administrators.',
      };
    }

    // Administrator full view
    return {
      date: today,
      timezone: 'Asia/Kolkata (IST)',
      totalRegisteredPatients: totalPatients ?? 0,
      activeDoctorsCount: activeDoctors ?? 0,
      totalAppointmentsToday,
      statusBreakdown: statusCounts,
      appointmentsByDepartment: departmentCounts,
    };
  } catch (err: any) {
    console.error('[getDashboardStats] Unexpected error:', err.message);
    throw new Error(`Failed to calculate dashboard statistics: ${err.message}`);
  }
}

