/**
 * chat.controller.ts  — Phase 2: Full tool loop with RBAC & audit logging
 *
 * POST /api/chat
 *   Body:    { messages: [{ role: 'user'|'assistant', content: string }] }
 *   Returns: { reply: string, pendingAction?: PendingAction }
 *
 * POST /api/chat/confirm-action   (Phase 5)
 */
import { Response, Router } from 'express';
import { ChatRequest } from './resolveChatUser';
import {
  generate,
  createToolResponsePart,
  type Content,
  type Part,
} from './llmClient';
import { SYSTEM_PROMPT } from './systemPrompt';
import { CHAT_TOOLS } from './toolDefinitions';
import { executeTool } from './toolExecutor';
import { supabaseAdmin } from '../../lib/supabase';
import { getPendingAction, deletePendingAction, purgeExpiredPendingActions } from './pendingActionStore';
import { purgeExpired } from './toolCache';
import { checkRateLimit } from './rateLimiter';

const router = Router();

// Periodic cleanup of expired cache entries and pending actions (every 5 mins)
setInterval(() => {
  purgeExpired();
  purgeExpiredPendingActions();
}, 5 * 60 * 1000).unref();

// ─── Config ──────────────────────────────────────────────────────────────────

const MAX_HISTORY = parseInt(process.env.AI_CHAT_MAX_HISTORY ?? '10', 10);
const MAX_TOOL_LOOPS = parseInt(process.env.AI_CHAT_MAX_TOOL_LOOPS ?? '5', 10);
const GEMINI_TIMEOUT_MS = 30_000;

// ─── Types ───────────────────────────────────────────────────────────────────

interface ClientMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildLlmContents(clientMessages: ClientMessage[]): Content[] {
  return clientMessages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }] as Part[],
    }));
}

function trimHistory(contents: Content[], maxHistory: number): Content[] {
  const trimmed = contents.slice(-maxHistory);
  // Ensure we start with a user message
  const firstUserIdx = trimmed.findIndex((m) => m.role === 'user');
  return firstUserIdx > 0 ? trimmed.slice(firstUserIdx) : trimmed;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('GEMINI_TIMEOUT')), ms)
    ),
  ]);
}

// ─── POST /api/chat ──────────────────────────────────────────────────────────

router.post('/', async (req: ChatRequest, res: Response): Promise<void> => {
  // Feature flag check
  if (process.env.AI_CHAT_ENABLED === 'false') {
    res.status(503).json({
      error: 'The AI Assistant is currently disabled. Please contact your administrator.',
    });
    return;
  }

  const chatUser = req.chatUser!; // Injected by resolveChatUser middleware

  // ── Rate Limiting (20 messages / min per user) ───────────────────────────
  const rateLimit = checkRateLimit(chatUser.id);
  if (!rateLimit.allowed) {
    res.status(429).json({
      error: `Rate limit exceeded. You can send up to 20 messages per minute. Please try again in ${rateLimit.retryAfterSec} seconds.`,
      retryAfterSec: rateLimit.retryAfterSec,
    });
    return;
  }

  // ── Validate body ─────────────────────────────────────────────────────────
  const { messages } = req.body as { messages?: ClientMessage[] };

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'Request body must contain a non-empty messages array.' });
    return;
  }

  // Sanitize messages: accept only user/assistant, string content, capped size
  const sanitized: ClientMessage[] = messages
    .filter(
      (m) =>
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string' &&
        m.content.trim().length > 0
    )
    .map((m) => ({ role: m.role, content: m.content.trim().slice(0, 4000) }));

  if (sanitized.length === 0) {
    res.status(400).json({ error: 'No valid messages found after sanitization.' });
    return;
  }

  // Find last user message for context in audit logs
  const lastUserMsg = [...sanitized].reverse().find((m) => m.role === 'user')?.content || '';

  // Build and trim history
  const contents = trimHistory(buildLlmContents(sanitized), MAX_HISTORY);

  // ── Multi-Turn Tool Loop ──────────────────────────────────────────────────
  let loopCount = 0;
  let finalReply = '';
  let capturedPendingAction: Record<string, unknown> | undefined = undefined;

  try {
    while (loopCount < MAX_TOOL_LOOPS) {
      loopCount++;

      // Call Gemini with tools
      let result;
      try {
        result = await withTimeout(
          generate(contents, CHAT_TOOLS, SYSTEM_PROMPT),
          GEMINI_TIMEOUT_MS
        );
      } catch (callErr: any) {
        // Quota / High demand retry logic
        const isRetryableError =
          callErr.status === 429 ||
          callErr.status === 503 ||
          callErr.message?.includes('429') ||
          callErr.message?.includes('503') ||
          callErr.message?.toLowerCase().includes('quota') ||
          callErr.message?.toLowerCase().includes('rate limit') ||
          callErr.message?.toLowerCase().includes('high demand') ||
          callErr.message?.toLowerCase().includes('unavailable');

        if (isRetryableError) {
          console.warn(`[chat] Gemini ${callErr.status || 'service'} error encountered — waiting 3s to retry...`);
          await new Promise((resolve) => setTimeout(resolve, 3000));
          result = await withTimeout(
            generate(contents, CHAT_TOOLS, SYSTEM_PROMPT),
            GEMINI_TIMEOUT_MS
          );
        } else {
          throw callErr;
        }
      }

      // Check if the model requested any function calls
      if (result.toolCalls && result.toolCalls.length > 0) {
        // 1. Append model turn containing tool call(s) to conversation history
        if (result.rawContent) {
          contents.push(result.rawContent);
        }

        // 2. Execute each tool and collect response parts
        const toolResponseParts: Part[] = [];

        for (const tc of result.toolCalls) {
          console.log(`[chat] Iteration ${loopCount}: Executing tool '${tc.name}' with args:`, tc.args);

          const execResult = await executeTool({
            toolName: tc.name,
            args: tc.args,
            user: chatUser,
            userMessage: lastUserMsg,
          });

          // Capture pending action if generated
          if (execResult.pendingAction) {
            capturedPendingAction = {
              actionId: execResult.pendingAction.id,
              patientName: execResult.pendingAction.patientName,
              doctorName: execResult.pendingAction.doctorName,
              department: execResult.pendingAction.department,
              date: execResult.pendingAction.date,
              time: execResult.pendingAction.time,
            };
          }

          // Wrap output as JSON-friendly payload for the model
          const payload: Record<string, unknown> = execResult.error
            ? { error: execResult.error }
            : { result: execResult.data };

          const part = createToolResponsePart(tc.id || '', tc.name, payload);
          toolResponseParts.push(part);
        }

        // 3. Append function responses back into conversation history as user/tool turn
        contents.push({
          role: 'user',
          parts: toolResponseParts,
        });

        // Continue loop to give model the tool results
        continue;
      }

      // If no function call, model produced a final text answer
      if (result.text) {
        finalReply = result.text;
        break;
      }

      // If neither, fallback
      break;
    }

    if (!finalReply) {
      if (loopCount >= MAX_TOOL_LOOPS) {
        finalReply =
          'I gathered some information, but reached the maximum tool search limit. Please refine or narrow your question.';
      } else {
        finalReply = 'I could not retrieve an answer. Please try again.';
      }
    }

    res.json({
      reply: finalReply,
      pendingAction: capturedPendingAction,
    });
  } catch (err: any) {
    if (err.message === 'GEMINI_TIMEOUT') {
      console.warn(`[chat] Gemini timeout for user ${chatUser.username}`);
      res.status(504).json({
        reply: 'The AI assistant took too long to respond. Please try again.',
      });
      return;
    }

    const isQuotaOrBusy =
      err.status === 429 ||
      err.status === 503 ||
      err.message?.includes('429') ||
      err.message?.includes('503') ||
      err.message?.toLowerCase().includes('quota') ||
      err.message?.toLowerCase().includes('rate limit') ||
      err.message?.toLowerCase().includes('high demand') ||
      err.message?.toLowerCase().includes('unavailable');

    if (isQuotaOrBusy) {
      res.status(200).json({
        reply:
          'The AI assistant is temporarily busy or experiencing high demand. Please try again in a moment.',
      });
      return;
    }

    console.error(`[chat] Unexpected error for user ${chatUser.username}:`, err);
    res.status(200).json({
      reply: `Sorry, an error occurred: ${err.message || 'Please try again later.'}`,
    });
  }
});

// ─── POST /api/chat/confirm-action ──────────────────────────────────────────

router.post('/confirm-action', async (req: ChatRequest, res: Response): Promise<void> => {
  const chatUser = req.chatUser!;
  const { actionId } = req.body as { actionId?: string };

  if (!actionId || typeof actionId !== 'string') {
    res.status(400).json({ error: 'actionId is required.' });
    return;
  }

  // 1. Look up action in pendingActionStore
  const action = getPendingAction(actionId);
  if (!action) {
    res.status(400).json({
      error: 'Appointment confirmation request has expired or is invalid. Please request a new appointment.',
    });
    return;
  }

  // 2. Ownership check: Must match the authenticated user
  if (action.userId !== chatUser.id) {
    res.status(403).json({
      error: 'You do not have permission to confirm this appointment.',
    });
    return;
  }

  // 3. Role check: Verify role is permitted to book
  const normalizedRole = (chatUser.role || '').toLowerCase();
  const canBook = ['administrator', 'admin', 'doctor', 'nurse', 'receptionist'].includes(normalizedRole);
  if (!canBook) {
    res.status(403).json({
      error: `Role '${chatUser.role}' is not authorized to finalize appointment bookings.`,
    });
    return;
  }

  // 4. Double-booking guard: Re-check that slot is still free
  const { data: existingBooking } = await supabaseAdmin
    .from('appointments')
    .select('id')
    .eq('doctor_id', action.doctorId)
    .eq('date', action.date)
    .eq('time', action.time)
    .neq('status', 'Cancelled')
    .maybeSingle();

  if (existingBooking) {
    deletePendingAction(actionId);
    res.status(409).json({
      error: `The slot ${action.time} on ${action.date} was just booked by another staff member. Please select another time.`,
    });
    return;
  }

  // 5. Insert confirmed appointment into database
  const { data: newApt, error: insertError } = await supabaseAdmin
    .from('appointments')
    .insert({
      patient_id: action.patientId,
      doctor_id: action.doctorId,
      department_id: action.departmentId || null,
      date: action.date,
      time: action.time,
      status: 'Scheduled',
      visit_type: 'New Visit',
      notes: `Booked via AI Assistant by ${chatUser.username} (${chatUser.role})`,
    })
    .select('id')
    .single();

  if (insertError) {
    console.error('[confirmAction] Database error creating appointment:', insertError.message);
    res.status(500).json({
      error: `Failed to record appointment in database: ${insertError.message}`,
    });
    return;
  }

  // 6. Delete action from memory
  deletePendingAction(actionId);

  // 7. Write audit log entry
  try {
    await supabaseAdmin.from('ai_chat_audit').insert({
      user_id: chatUser.id,
      role: chatUser.role,
      user_message: `Confirmed booking for patient ${action.patientName} with ${action.doctorName} on ${action.date} at ${action.time}`,
      tool_name: 'confirm_appointment',
      tool_args: {
        actionId,
        patientId: action.patientId,
        doctorId: action.doctorId,
        date: action.date,
        time: action.time,
        appointmentId: newApt?.id,
      },
      patient_id: action.patientId,
      status: 'ok',
    });
  } catch (auditErr: any) {
    console.warn('[confirmAction] Audit log write warning:', auditErr.message);
  }

  console.log(
    `[confirmAction] Appointment successfully booked: ID ${newApt?.id} for patient ${action.patientName}`
  );

  res.json({
    success: true,
    message: `Appointment successfully booked for ${action.patientName} with ${action.doctorName} on ${action.date} at ${action.time}.`,
    appointmentId: newApt?.id,
  });
});

export default router;
