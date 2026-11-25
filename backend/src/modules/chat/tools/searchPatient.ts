/**
 * tools/searchPatient.ts
 *
 * Search patients by name (single word or "First Last"),
 * phone number, or exact patient UUID.
 * Clamped to 5 matches max.
 */
import { supabaseAdmin } from '../../../lib/supabase';

export interface SearchPatientResult {
  id: string;
  name: string;
  age: number | string;
  gender: string;
  phone: string;
}

export async function searchPatient(query: string): Promise<SearchPatientResult[] | { message: string }> {
  const cleanQuery = (query || '').trim();
  if (cleanQuery.length < 2) {
    return { message: 'Search query must be at least 2 characters long.' };
  }

  // Check if query is a UUID
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanQuery);

  let queryBuilder = supabaseAdmin
    .from('patients')
    .select('id, first_name, last_name, dob, gender, phone');

  if (isUuid) {
    queryBuilder = queryBuilder.eq('id', cleanQuery);
  } else {
    const words = cleanQuery.split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      // Multiple words: e.g. "SM RR" or "John Doe" -> match first_name & last_name
      queryBuilder = queryBuilder.or(
        `and(first_name.ilike.%${words[0]}%,last_name.ilike.%${words[1]}%),and(first_name.ilike.%${words[1]}%,last_name.ilike.%${words[0]}%),first_name.ilike.%${cleanQuery}%,last_name.ilike.%${cleanQuery}%,phone.ilike.%${cleanQuery}%`
      );
    } else {
      // Single word
      queryBuilder = queryBuilder.or(
        `first_name.ilike.%${cleanQuery}%,last_name.ilike.%${cleanQuery}%,phone.ilike.%${cleanQuery}%`
      );
    }
  }

  const { data, error } = await queryBuilder.limit(5);

  if (error) {
    console.error('[searchPatient] DB error:', error.message);
    throw new Error(`Failed to search patients: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return [];
  }

  return data.map((p: any) => {
    let age: number | string = 'Unknown';
    if (p.dob) {
      const birth = new Date(p.dob);
      if (!isNaN(birth.getTime())) {
        const diff = Date.now() - birth.getTime();
        age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
      }
    }

    return {
      id: p.id,
      name: `${p.first_name || ''} ${p.last_name || ''}`.trim(),
      age,
      gender: p.gender || 'Unknown',
      phone: p.phone ? `${p.phone.slice(0, 3)}****${p.phone.slice(-3)}` : 'N/A',
    };
  });
}
