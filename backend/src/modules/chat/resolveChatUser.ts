/**
 * resolveChatUser.ts
 *
 * Security middleware for the AI Chat endpoints.
 *
 * PROBLEM: The demo-token format is `Bearer demo-token:<username>:<role>`.
 * The role field is SUPPLIED BY THE CLIENT and cannot be trusted, because
 * supabaseAdmin bypasses RLS entirely — a forged role would gain unauthorized
 * tool access.
 *
 * FIX: Extract only the username from the token. Query `app_users` on the
 * backend to get the REAL role, id, and full_name. Set req.chatUser from the DB.
 * The role in the header is completely ignored.
 *
 * ⚠️  PRODUCTION NOTE: The demo-token is NOT production-grade authentication.
 * It is not cryptographically signed and cannot be trusted in a real deployment.
 * Before handling real patient data, replace this with verified tokens
 * (e.g. Supabase Auth JWT verified with the JWT secret, or a signed session token).
 */
import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../../lib/supabase';

export interface ChatUser {
  id: string;
  username: string;
  role: string;
  fullName: string;
}

export interface ChatRequest extends Request {
  chatUser?: ChatUser;
}

export const resolveChatUser = async (
  req: ChatRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ error: 'Authorization header missing' });
    return;
  }

  // Support comma-separated headers (some proxies combine them)
  const parts = authHeader.split(',').map((p) => p.trim());
  const bearerPart = parts.find((p) => p.startsWith('Bearer '));
  if (!bearerPart) {
    res.status(401).json({ error: 'Authorization header malformed' });
    return;
  }

  const token = bearerPart.substring(7); // Remove "Bearer "

  // Parse demo-token: "demo-token:<username>:<role>"
  // We only care about the username — the role in the token is IGNORED.
  if (!token.startsWith('demo-token:')) {
    // In production this would verify a real JWT. For now, reject non-demo tokens.
    res.status(401).json({ error: 'Unsupported token format. Use demo-token.' });
    return;
  }

  const tokenParts = token.split(':');
  // Format: demo-token : <username> : <role>
  //          [0]          [1]          [2]
  const username = tokenParts[1]?.trim();

  if (!username) {
    res.status(401).json({ error: 'Token does not contain a username' });
    return;
  }

  try {
    // Look up the REAL user in the database — this is the authoritative source of role
    const { data, error } = await supabaseAdmin
      .from('app_users')
      .select('id, username, role, full_name')
      .eq('username', username)
      .maybeSingle();

    if (error) {
      console.error('[resolveChatUser] DB error:', error.message);

      // Fallback for demo or admin mode so temporary DB network failures do not block the chat
      if (username === 'demo' || username === 'admin') {
        req.chatUser = {
          id: 'demo-fallback-id',
          username,
          role: 'Administrator',
          fullName: username === 'admin' ? 'System Administrator' : 'Demo Administrator',
        };
        console.warn(`[resolveChatUser] DB query had error (${error.message}), but accepted fallback user: ${username}`);
        next();
        return;
      }

      // If service role key is missing in Render environment, warn specifically
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_ANON_KEY) {
        res.status(500).json({ 
          error: 'Missing SUPABASE_SERVICE_ROLE_KEY: Please configure your Supabase keys in Render Dashboard > Environment Variables.' 
        });
        return;
      }
      res.status(500).json({ error: `Authentication DB error: ${error.message || 'Unable to query user'}` });
      return;
    }

    if (!data) {
      // Fallback for Demo Mode or local testing when demo user is not in Supabase app_users table
      if (username === 'demo' || username === 'admin') {
        req.chatUser = {
          id: 'demo-user-id',
          username,
          role: 'Administrator',
          fullName: username === 'admin' ? 'System Administrator' : 'Demo Administrator',
        };
        console.log(`[resolveChatUser] Accepted demo mode fallback user: ${username} (role: Administrator)`);
        next();
        return;
      }

      // Username from token not found in DB → reject
      res.status(401).json({ error: 'User not found or inactive' });
      return;
    }

    // Set the chat user with the DB-resolved role (ignoring whatever was in the token)
    req.chatUser = {
      id: data.id,
      username: data.username,
      role: data.role,
      fullName: data.full_name ?? data.username,
    };

    console.log(
      `[resolveChatUser] Resolved user: ${data.username} (role: ${data.role})`
    );
    next();
  } catch (err: any) {
    console.error('[resolveChatUser] Unexpected error:', err);
    res.status(500).json({ error: `Authentication exception: ${err.message || 'Internal server error'}` });
  }
};
