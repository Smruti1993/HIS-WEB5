/**
 * llmClient.ts  — THE ONLY FILE that imports @google/genai.
 * All other modules call generate() and helpers from here.
 * To swap providers (Ollama, Claude, etc.), replace only this file.
 */
import {
  GoogleGenAI,
  createPartFromFunctionResponse,
  type Content,
  type Part,
  type Tool,
} from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

// ─── Public types ─────────────────────────────────────────────────────────────

export type { Content, Part, Tool };

export interface LlmResult {
  /** Final text reply (present when the model returns text, no tool call). */
  text?: string;
  /** Tool calls the model wants to make. */
  toolCalls?: Array<{ id?: string; name: string; args: Record<string, unknown> }>;
  /** Raw candidate content — append to history before sending tool responses back. */
  rawContent?: Content;
}

// ─── Singleton ────────────────────────────────────────────────────────────────

let _ai: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!_ai) {
    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    if (!apiKey) throw new Error('[llmClient] GEMINI_API_KEY is not set.');
    // Function calling requires apiVersion: 'v1beta'
    _ai = new GoogleGenAI({
      apiKey,
      apiVersion: 'v1beta',
    });
  }
  return _ai;
}

// ─── Helper for Function Response Parts ───────────────────────────────────────

/**
 * Creates a Part object containing the tool execution result.
 * Encapsulates GenAI-specific representation so outside modules don't import @google/genai.
 */
export function createToolResponsePart(
  id: string,
  name: string,
  response: Record<string, unknown>
): Part {
  return createPartFromFunctionResponse(id, name, response);
}

// ─── Main API ─────────────────────────────────────────────────────────────────

/**
 * Call Gemini with a fully-managed content array.
 * Includes automatic model fallback (e.g. if a model encounters 503 high demand or 404).
 *
 * @param contents  Full conversation history (user/model turns + function call/response turns).
 * @param tools     Tool declarations. Pass [] for a plain text call.
 * @param systemInstruction  Optional system prompt.
 */
export async function generate(
  contents: Content[],
  tools: Tool[],
  systemInstruction?: string
): Promise<LlmResult> {
  const configuredModel = (process.env.GEMINI_MODEL || 'gemini-3.5-flash').trim();
  const fallbackModel = 'gemini-3.5-flash';
  const ai = getClient();

  // Helper to run a generation attempt with a specific model
  async function attempt(modelToUse: string) {
    return await ai.models.generateContent({
      model: modelToUse,
      contents,
      config: {
        systemInstruction: systemInstruction,
        tools: tools.length > 0 ? tools : undefined,
      },
    });
  }

  let response;
  try {
    response = await attempt(configuredModel);
  } catch (err: any) {
    // If configured model hits 503 (high demand), 404 (not found), or 429 (quota exhausted on that model)
    const shouldFallback =
      configuredModel !== fallbackModel &&
      (err.status === 503 ||
        err.status === 404 ||
        err.status === 429 ||
        err.message?.includes('503') ||
        err.message?.includes('404') ||
        err.message?.includes('429') ||
        err.message?.toLowerCase().includes('demand') ||
        err.message?.toLowerCase().includes('quota'));

    if (shouldFallback) {
      console.warn(
        `[llmClient] Model '${configuredModel}' returned ${err.status || 'error'}. Falling back to '${fallbackModel}'...`
      );
      response = await attempt(fallbackModel);
    } else {
      throw err;
    }
  }

  const functionCalls = response.functionCalls;
  if (functionCalls && functionCalls.length > 0) {
    return {
      toolCalls: functionCalls.map((fc) => ({
        id: fc.id || `call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: fc.name ?? '',
        args: (fc.args as Record<string, unknown>) ?? {},
      })),
      rawContent: response.candidates?.[0]?.content,
    };
  }

  return {
    text: response.text ?? '',
    rawContent: response.candidates?.[0]?.content,
  };
}
