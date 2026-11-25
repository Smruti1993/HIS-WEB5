<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/f55bae96-6410-4cb7-b895-4efc43150312

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`


---

# ✨ AI Chat Assistant for Hospital Management Dashboard

A floating natural-language AI assistant powered by Google Gemini (free-tier Flash models), allowing clinic staff to interact with hospital records securely via function calling and server-side RBAC.

## Architecture

```
✨ Chat Widget (Frontend: React 19 / Tailwind)
   │
   ▼ POST /api/chat  (Headers: Authorization: Bearer demo-token:<user>:<role>)
resolveChatUser Middleware
   │  - Ignores client-supplied role
   │  - Queries `app_users` server-side to resolve real ID and role
   ▼
Chat Controller & Rate Limiter (20 msg/min per user)
   │
   ▼ Tool Execution Loop (Max 5 iterations)
llmClient.generate(history + system prompt + tool declarations)
   │  <- Gemini returns text OR tool call(s)
   ▼
toolExecutor
   │  - Enforces server-side RBAC (field-stripping & tool denial)
   │  - 30s in-memory cache for read-only queries
   │  - Executes tool via parameterized queries (`supabaseAdmin`)
   │  - Writes audit record to `ai_chat_audit` (including denied attempts)
   ▼
Gemini receives tool results (with sanitized free-text in `[DATA: ...]`)
   │  <- Produces final text response (+ pendingAction card if booking)
   ▼
Returned to client widget
```

## Security & Compliance Highlights

1. **Role Forgery Mitigation (`resolveChatUser`)**: The role inside client tokens is completely ignored. The backend retrieves the user's authentic role directly from `app_users`.
2. **Zero Text-to-SQL**: The model only invokes predefined, typed function declarations. All database access uses parameterized queries via the Supabase client.
3. **Server-Side Field Stripping**:
   - **Receptionists**: Cannot see clinical notes, symptoms, or diagnoses on visit histories; vital signs are restricted to BP, pulse, and temperature only.
   - **Doctors & Nurses**: Full access to clinical notes, diagnoses, and vitals.
   - **Administrators**: Full access including operational breakdowns.
4. **Prompt Injection Defense**: All free-text database fields (`notes`, `symptoms`, `reaction`) are truncated to 500 characters and wrapped in `[DATA: ...]` tags.
5. **Two-Step Appointment Booking**:
   - `prepare_appointment` validates slots and returns a pending action object. **No database write occurs.**
   - Booking is finalized only when the user clicks **Confirm** in the UI, invoking `POST /api/chat/confirm-action` with an 8-step verification process (slot re-validation, role check, ownership check, 5-minute TTL).
6. **Isolated Provider Module**: `@google/genai` is imported strictly inside `backend/src/modules/chat/llmClient.ts`. Swapping providers requires no changes to tools or UI.

## Environment Variables (`backend/.env`)

```env
# Google Gemini API Key from Google AI Studio
GEMINI_API_KEY=your_key_here

# Model name: Recommended current Flash-class model
GEMINI_MODEL=gemini-2.0-flash

# Feature toggle
AI_CHAT_ENABLED=true

# History depth sent to Gemini (conserves quota)
AI_CHAT_MAX_HISTORY=10

# Maximum tool loop round-trips per request
AI_CHAT_MAX_TOOL_LOOPS=5
```

## Database Migration

The audit log table is created via `backend/migrations/20261125_create_ai_chat_audit.sql`. Row Level Security (RLS) is enabled with no anon access; only the backend service role can read and write audit entries.

## ⚠️ Production Checklist (Before Real Patient Data)

- [ ] Replace `demo-token` auth with cryptographically verified JWT tokens (e.g., Supabase Auth JWT).
- [ ] Move the pending action store, rate limiter, and cache from in-memory Maps to Redis or database tables.
- [ ] Switch from the free-tier Gemini API to a paid compliant tier or local model (e.g. Ollama) after reviewing DPDP Act / HIPAA data processing agreements.
- [ ] Implement an audit log retention and access policy on `ai_chat_audit`.
