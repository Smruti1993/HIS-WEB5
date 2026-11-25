/**
 * useChatApi.ts
 *
 * Client-side communication hook for the AI Chat Assistant.
 * Connects to:
 *   POST /api/chat
 *   POST /api/chat/confirm-action
 *
 * Uses:
 *   getAuthToken() from supabaseClient
 *   BACKEND_URL from supabaseClient
 *
 * Keeps all conversation state strictly in memory (no localStorage).
 */
import { useState, useCallback } from 'react';
import { BACKEND_URL, getAuthToken } from '../../services/supabaseClient';

export interface ChatMessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  pendingAction?: {
    actionId: string;
    patientName?: string;
    doctorName?: string;
    department?: string;
    date?: string;
    time?: string;
    details?: Record<string, unknown>;
  };
}

export function useChatApi() {
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      const userMessageId = `user_${Date.now()}`;
      const userMessage: ChatMessageItem = {
        id: userMessageId,
        role: 'user',
        content: trimmed,
        timestamp: new Date(),
      };

      // In-memory update
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      try {
        const token = await getAuthToken();
        const endpoint = `${BACKEND_URL}/api/chat`;

        // Format history for the server
        const historyPayload = [...messages, userMessage].map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ messages: historyPayload }),
        });

        if (response.status === 401) {
          throw new Error('Authentication failed. Please verify your login session.');
        }

        if (response.status === 429) {
          throw new Error('The assistant is currently busy. Please wait a moment and try again.');
        }

        if (response.status === 503) {
          throw new Error('The AI Assistant is currently disabled by administrator.');
        }

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Server responded with status ${response.status}`);
        }

        const data = await response.json();

        const assistantMessage: ChatMessageItem = {
          id: `asst_${Date.now()}`,
          role: 'assistant',
          content: data.reply || 'No response received.',
          timestamp: new Date(),
          pendingAction: data.pendingAction,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err: any) {
        console.error('[useChatApi] Error sending message:', err);
        const errMsg = err.message || 'Network error occurred. Please try again.';
        setError(errMsg);

        const errorMessage: ChatMessageItem = {
          id: `err_${Date.now()}`,
          role: 'assistant',
          content: `⚠️ ${errMsg}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading]
  );

  const confirmAction = useCallback(async (actionId: string): Promise<{ success: boolean; message: string }> => {
    try {
      const token = await getAuthToken();
      const endpoint = `${BACKEND_URL}/api/chat/confirm-action`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ actionId }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        return {
          success: false,
          message: data.error || `Action failed (${response.status})`,
        };
      }

      return {
        success: true,
        message: data.message || 'Appointment confirmed successfully!',
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Network error confirming action.',
      };
    }
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    confirmAction,
  };
}

