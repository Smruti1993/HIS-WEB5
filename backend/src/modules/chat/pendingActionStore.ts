/**
 * pendingActionStore.ts
 *
 * In-memory store for prepared actions awaiting explicit user confirmation.
 * TTL: 5 minutes. Bound to the user's ID.
 *
 * ⚠️  PRODUCTION NOTE: In-memory store is suitable for single-instance development.
 * Move to Redis or a database table before multi-instance production deployments.
 */

export interface PendingAction {
  id: string;
  userId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  departmentId?: string;
  department?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  expiresAt: number; // Unix timestamp ms
}

const store = new Map<string, PendingAction>();
const ACTION_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function savePendingAction(
  actionData: Omit<PendingAction, 'id' | 'expiresAt'>
): PendingAction {
  const id = `act_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const action: PendingAction = {
    ...actionData,
    id,
    expiresAt: Date.now() + ACTION_TTL_MS,
  };
  store.set(id, action);
  return action;
}

export function getPendingAction(actionId: string): PendingAction | null {
  const action = store.get(actionId);
  if (!action) return null;

  if (Date.now() > action.expiresAt) {
    store.delete(actionId);
    return null;
  }

  return action;
}

export function deletePendingAction(actionId: string): void {
  store.delete(actionId);
}

export function purgeExpiredPendingActions(): void {
  const now = Date.now();
  for (const [id, action] of store.entries()) {
    if (now > action.expiresAt) {
      store.delete(id);
    }
  }
}

