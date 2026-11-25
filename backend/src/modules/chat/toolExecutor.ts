/**
 * toolExecutor.ts
 *
 * Central dispatcher for all tool calls requested by the LLM.
 * Responsibilities:
 *  1. RBAC authorization check based on DB-resolved user role.
 *  2. In-memory caching for read-only tools (30s TTL).
 *  3. Dispatch to tool implementation.
 *  4. Write audit record to `ai_chat_audit` (including denied calls).
 */
import { supabaseAdmin } from '../../lib/supabase';
import { ChatUser } from './resolveChatUser';
import { buildCacheKey, getCached, setCached } from './toolCache';
import { searchPatient } from './tools/searchPatient';
import { getPatientSummary } from './tools/getPatientSummary';
import { getPatientVisits } from './tools/getPatientVisits';
import { getPatientAllergies } from './tools/getPatientAllergies';
import { getPatientVitals } from './tools/getPatientVitals';
import { getDashboardStats } from './tools/getDashboardStats';
import { listDoctors } from './tools/listDoctors';
import { getAvailableSlots } from './tools/getAvailableSlots';
import { prepareAppointment } from './tools/prepareAppointment';
import { PendingAction } from './pendingActionStore';

export interface ToolExecutionParams {
  toolName: string;
  args: Record<string, unknown>;
  user: ChatUser;
  userMessage?: string;
}

export interface ToolExecutionResult {
  data?: unknown;
  error?: string;
  denied?: boolean;
  pendingAction?: PendingAction;
}

// ─── Known Roles & Permissions ────────────────────────────────────────────────

const VALID_ROLES = new Set(['administrator', 'admin', 'doctor', 'nurse', 'receptionist', 'lab']);

const ALLOWED_TOOLS_BY_ROLE: Record<string, Set<string>> = {
  administrator: new Set([
    'search_patient',
    'get_patient_summary',
    'get_patient_visits',
    'get_patient_allergies',
    'get_patient_vitals',
    'list_doctors',
    'get_available_slots',
    'get_dashboard_stats',
    'prepare_appointment',
  ]),
  admin: new Set([
    'search_patient',
    'get_patient_summary',
    'get_patient_visits',
    'get_patient_allergies',
    'get_patient_vitals',
    'list_doctors',
    'get_available_slots',
    'get_dashboard_stats',
    'prepare_appointment',
  ]),
  doctor: new Set([
    'search_patient',
    'get_patient_summary',
    'get_patient_visits',
    'get_patient_allergies',
    'get_patient_vitals',
    'list_doctors',
    'get_available_slots',
    'get_dashboard_stats',
    'prepare_appointment',
  ]),
  nurse: new Set([
    'search_patient',
    'get_patient_summary',
    'get_patient_visits',
    'get_patient_allergies',
    'get_patient_vitals',
    'list_doctors',
    'get_available_slots',
    'get_dashboard_stats',
    'prepare_appointment',
  ]),
  receptionist: new Set([
    'search_patient',
    'get_patient_summary',
    'get_patient_visits',
    'get_patient_allergies',
    'get_patient_vitals',
    'list_doctors',
    'get_available_slots',
    'get_dashboard_stats',
    'prepare_appointment',
  ]),
  lab: new Set([
    'search_patient',
    'get_patient_summary',
    'get_patient_visits',
    'get_patient_allergies',
    'get_patient_vitals',
    'list_doctors',
    'get_available_slots',
    'get_dashboard_stats',
    'prepare_appointment',
  ]),
};

// ─── Audit Logger ─────────────────────────────────────────────────────────────

async function writeAuditLog(params: {
  userId: string;
  role: string;
  userMessage?: string;
  toolName: string;
  toolArgs: Record<string, unknown>;
  patientId?: string | null;
  status: 'ok' | 'denied' | 'error';
}): Promise<void> {
  try {
    // Only attempt if table exists; gracefully log warning if not
    const { error } = await supabaseAdmin.from('ai_chat_audit').insert({
      user_id: params.userId,
      role: params.role,
      user_message: params.userMessage ? params.userMessage.slice(0, 1000) : null,
      tool_name: params.toolName,
      tool_args: params.toolArgs,
      patient_id: params.patientId || null,
      status: params.status,
    });

    if (error) {
      console.warn('[toolExecutor] Audit log write warning:', error.message);
    }
  } catch (err: any) {
    console.warn('[toolExecutor] Audit log exception:', err.message);
  }
}

// ─── Main Executor ────────────────────────────────────────────────────────────

export async function executeTool(params: ToolExecutionParams): Promise<ToolExecutionResult> {
  const { toolName, args, user, userMessage } = params;
  const normalizedRole = (user.role || '').toLowerCase();

  // Extract patientId for audit log if present
  let patientId: string | null = null;
  if (typeof args.patient_id === 'string' && args.patient_id.length > 10) {
    patientId = args.patient_id;
  }

  // 1. RBAC authorization
  const allowedTools = ALLOWED_TOOLS_BY_ROLE[normalizedRole];
  if (!VALID_ROLES.has(normalizedRole) || !allowedTools || !allowedTools.has(toolName)) {
    console.warn(`[toolExecutor] Denied tool '${toolName}' for user '${user.username}' (role: ${user.role})`);
    
    // Log denied attempt
    await writeAuditLog({
      userId: user.id,
      role: user.role,
      userMessage,
      toolName,
      toolArgs: args,
      patientId,
      status: 'denied',
    });

    return {
      denied: true,
      error: `Access denied. Role '${user.role}' does not have permission to execute tool '${toolName}'.`,
    };
  }

  // 2. Cache check for read-only tools
  const isCacheable = [
    'search_patient',
    'get_patient_summary',
    'get_patient_visits',
    'get_patient_allergies',
    'get_patient_vitals',
    'list_doctors',
    'get_available_slots',
    'get_dashboard_stats',
  ].includes(toolName);

  const cacheKey = isCacheable ? buildCacheKey(`${toolName}:${normalizedRole}`, args) : null;
  if (cacheKey) {
    const cached = getCached(cacheKey);
    if (cached !== null) {
      // Audit log as ok (from cache)
      await writeAuditLog({
        userId: user.id,
        role: user.role,
        userMessage,
        toolName,
        toolArgs: args,
        patientId,
        status: 'ok',
      });
      return { data: cached };
    }
  }

  // 3. Dispatch to tool handler
  try {
    let resultData: unknown = null;

    switch (toolName) {
      case 'search_patient': {
        const query = String(args.query || '');
        resultData = await searchPatient(query);
        break;
      }

      case 'get_patient_summary': {
        const pId = String(args.patient_id || '');
        resultData = await getPatientSummary(pId);
        break;
      }

      case 'get_patient_visits': {
        const pId = String(args.patient_id || '');
        const limit = typeof args.limit === 'number' ? args.limit : undefined;
        resultData = await getPatientVisits({ patientId: pId, limit, role: user.role });
        break;
      }

      case 'get_patient_allergies': {
        const pId = String(args.patient_id || '');
        resultData = await getPatientAllergies(pId);
        break;
      }

      case 'get_patient_vitals': {
        const pId = String(args.patient_id || '');
        const limit = typeof args.limit === 'number' ? args.limit : undefined;
        resultData = await getPatientVitals({ patientId: pId, limit, role: user.role });
        break;
      }

      case 'list_doctors': {
        const dept = typeof args.department === 'string' ? args.department : undefined;
        resultData = await listDoctors({ department: dept });
        break;
      }

      case 'get_available_slots': {
        const dId = String(args.doctor_id || '');
        const dateStr = String(args.date || '');
        resultData = await getAvailableSlots({ doctorId: dId, date: dateStr });
        break;
      }

      case 'get_dashboard_stats': {
        resultData = await getDashboardStats({ role: user.role });
        break;
      }

      case 'prepare_appointment': {
        const pId = String(args.patient_id || '');
        const dId = String(args.doctor_id || '');
        const dateStr = String(args.date || '');
        const timeStr = String(args.time || '');

        const prep = await prepareAppointment({
          patientId: pId,
          doctorId: dId,
          date: dateStr,
          time: timeStr,
          userId: user.id,
        });

        await writeAuditLog({
          userId: user.id,
          role: user.role,
          userMessage,
          toolName,
          toolArgs: args,
          patientId: pId,
          status: 'ok',
        });

        return {
          data: prep.summary,
          pendingAction: prep.pendingAction,
        };
      }

      default:
        throw new Error(`Unrecognized tool name: ${toolName}`);
    }

    // Cache if successful
    if (cacheKey && resultData) {
      setCached(cacheKey, resultData);
    }

    // Write audit log
    await writeAuditLog({
      userId: user.id,
      role: user.role,
      userMessage,
      toolName,
      toolArgs: args,
      patientId,
      status: 'ok',
    });

    return { data: resultData };
  } catch (err: any) {
    console.error(`[toolExecutor] Error executing tool '${toolName}':`, err.message);

    await writeAuditLog({
      userId: user.id,
      role: user.role,
      userMessage,
      toolName,
      toolArgs: args,
      patientId,
      status: 'error',
    });

    return { error: `Tool error: ${err.message}` };
  }
}

