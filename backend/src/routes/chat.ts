/**
 * routes/chat.ts
 *
 * Registers the AI Chat Assistant routes.
 * Both /api/chat and /api/chat/confirm-action are protected by resolveChatUser,
 * which resolves the real user role from the database (ignoring any role in the token).
 *
 * Note: authenticateJWT (the existing middleware) is intentionally NOT used here.
 * resolveChatUser is a chat-specific security layer that solves the forged-role
 * problem specific to supabaseAdmin usage. See resolveChatUser.ts for details.
 */
import { Router } from 'express';
import { resolveChatUser } from '../modules/chat/resolveChatUser';
import chatController from '../modules/chat/chat.controller';

const router = Router();

// Apply resolveChatUser to all /api/chat routes
router.use(resolveChatUser);

// Mount controller (handles POST / and POST /confirm-action)
router.use('/', chatController);

export default router;

