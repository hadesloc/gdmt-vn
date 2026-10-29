/**
 * GDMT-VN AI Client (DeepSeek V4.1 qua OpenCode Go / OpenAI-compatible)
 *
 * Ported and adapted from: on-call/tools/ai/client.ts
 *
 * Key: biến môi trường OPENCODE_API_KEY, fallback ~/.local/share/opencode/auth.json ["opencode-go"].key
 * KHÔNG BAO GIỜ in, log hoặc ghi key ra file.
 */

import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

export const AI_BASE_URL =
  process.env.GDMT_AI_BASE_URL ??
  process.env.ONCALL_AI_BASE_URL ??
  'https://opencode.ai/zen/go/v1';

export const AI_MODEL =
  process.env.GDMT_AI_MODEL ??
  process.env.ONCALL_AI_MODEL ??
  'deepseek-v4.1-flash';

export const AI_SESSION =
  process.env.GDMT_AI_SESSION ??
  process.env.ONCALL_AI_SESSION ??
  `gdmt-kb-${randomUUID()}`;

export function loadApiKey(): string | null {
  const env = process.env.OPENCODE_API_KEY?.trim();
  if (env) return env;

  const candidates = [
    join(homedir(), '.local', 'share', 'opencode', 'auth.json'),
    join(process.env.APPDATA ?? '', 'opencode', 'auth.json'),
  ];

  for (const p of candidates) {
    try {
      if (!existsSync(p)) continue;
      const j = JSON.parse(readFileSync(p, 'utf8')) as Record<string, { type?: string; key?: string }>;
      const k = j['opencode-go']?.key?.trim();
      if (k) return k;
    } catch {
      /* bỏ qua */
    }
  }

  return null;
}

/** Che mọi chuỗi giống key trong thông báo lỗi trước khi in */
export function redact(text: string, key: string | null): string {
  let out = text;
  if (key) out = out.split(key).join('[REDACTED]');
  return out.replace(/(sk|key)[-_][A-Za-z0-9_-]{12,}/g, '[REDACTED]');
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatResult {
  ok: boolean;
  content: string;
  error?: string;
  failure?: 'missing_credentials' | 'http' | 'invalid_response' | 'network' | 'unknown';
  httpStatus?: number;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
  finishReason?: string;
  ms: number;
}

export async function chat(
  messages: ChatMessage[],
  opts: {
    temperature?: number;
    maxTokens?: number;
    timeoutMs?: number;
    retries?: number;
    session?: string;
  } = {}
): Promise<ChatResult> {
  const key = loadApiKey();
  const t0 = Date.now();

  if (!key) {
    return {
      ok: false,
      content: '',
      error: 'Không tìm thấy API key (OPENCODE_API_KEY hoặc auth.json).',
      failure: 'missing_credentials',
      ms: 0,
    };
  }

  const retries = opts.retries ?? 2;
  let lastErr = '';
  let lastFailure: ChatResult['failure'] = 'unknown';
  let lastHttpStatus: number | undefined;

  for (let attempt = 0; attempt <= retries; attempt++) {
    lastHttpStatus = undefined;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 180_000);

    try {
      const res = await fetch(`${AI_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${key}`,
          'x-opencode-session': opts.session ?? AI_SESSION,
        },
        body: JSON.stringify({
          model: AI_MODEL,
          messages,
          temperature: opts.temperature ?? 0.2,
          max_tokens: opts.maxTokens ?? 8000,
        }),
        signal: ctrl.signal,
      });

      const text = await res.text();
      if (!res.ok) {
        lastErr = `HTTP ${res.status}: ${redact(text.slice(0, 400), key)}`;
        lastFailure = 'http';
        lastHttpStatus = res.status;
        if (res.status === 401 || res.status === 403 || res.status === 404) break;
        await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
        continue;
      }

      const j = JSON.parse(text);
      const content = j.choices?.[0]?.message?.content;
      const finish: string | undefined = j.choices?.[0]?.finish_reason;

      if (typeof content !== 'string' || !content.trim()) {
        lastErr = `Phản hồi rỗng (finish_reason=${finish ?? '?'})`;
        lastFailure = 'invalid_response';
        continue;
      }

      return {
        ok: true,
        content,
        usage: j.usage,
        finishReason: finish,
        ms: Date.now() - t0,
      };
    } catch (e) {
      lastErr = redact(String((e as Error).message ?? e), key);
      lastFailure = e instanceof SyntaxError ? 'invalid_response' : 'network';
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    ok: false,
    content: '',
    error: lastErr,
    failure: lastFailure,
    httpStatus: lastHttpStatus,
    ms: Date.now() - t0,
  };
}

/**
 * Trích xuất JSON từ phản hồi LLM
 */
export function extractJson<T = unknown>(text: string): T | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(body.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}
