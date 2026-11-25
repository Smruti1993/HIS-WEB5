/**
 * tools/listDoctors.ts
 *
 * List active doctors, optionally filtered by department.
 * Limits result to 20 doctors max to conserve token context.
 * Performs independent lookup on departments to avoid PostgREST foreign-key cache mismatches.
 */
import { supabaseAdmin } from '../../../lib/supabase';

export interface ListDoctorsOptions {
  department?: string;
}

export async function listDoctors(options: ListDoctorsOptions = {}): Promise<Array<Record<string, unknown>>> {
  const { department } = options;

  const { data, error } = await supabaseAdmin
    .from('employees')
    .select('id, first_name, last_name, specialization, status, department_id')
    .ilike('role', '%doctor%')
    .eq('status', 'Active')
    .limit(20);

  if (error) {
    console.error('[listDoctors] DB error:', error.message);
    throw new Error(`Failed to list doctors: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Lookup department names independently
  const deptIds = Array.from(new Set(data.map((d: any) => d.department_id).filter(Boolean)));
  const deptMap: Record<string, string> = {};

  if (deptIds.length > 0) {
    const { data: depts } = await supabaseAdmin
      .from('departments')
      .select('id, name')
      .in('id', deptIds);

    (depts || []).forEach((dp: any) => {
      deptMap[dp.id] = dp.name;
    });
  }

  let results = data.map((d: any) => ({
    id: d.id,
    name: `Dr. ${d.first_name || ''} ${d.last_name || ''}`.trim(),
    department: (d.department_id && deptMap[d.department_id]) || 'General Medicine',
    specialization: d.specialization || 'General Practice',
    status: d.status || 'Active',
  }));

  // If a department filter was specified, filter in memory for case-insensitive partial match
  if (department && department.trim()) {
    const filter = department.trim().toLowerCase();
    results = results.filter(
      (doc) =>
        doc.department.toLowerCase().includes(filter) ||
        doc.specialization.toLowerCase().includes(filter)
    );
  }

  return results;
}
