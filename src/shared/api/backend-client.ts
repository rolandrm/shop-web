import "server-only";

import type { z } from "zod";

import { serverEnv } from "@/shared/config/env.server";
import { err, ok, type Result } from "@/shared/lib/result";

export const BACKEND_TIMEOUT_MS = 5000;

export type BackendError = { code: string; status: number };

export type BackendRequestOptions<T> = {
  schema: z.ZodType<T>;
  locale: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  requestId?: string;
  timeoutMs?: number;
};

function isTimeout(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "TimeoutError" || error.name === "AbortError")
  );
}

async function readErrorCode(response: Response): Promise<string> {
  try {
    const payload: unknown = await response.json();
    if (typeof payload === "object" && payload !== null && "code" in payload) {
      const { code } = payload as { code: unknown };
      if (typeof code === "string" && code.length > 0) return code;
    }
  } catch {
    // Corps absent ou illisible : code générique.
  }
  return "BACKEND_ERROR";
}

export async function backendRequest<T>(
  path: string,
  options: BackendRequestOptions<T>,
): Promise<Result<T, BackendError>> {
  const {
    schema,
    locale,
    method = "GET",
    body,
    requestId = crypto.randomUUID(),
    timeoutMs = BACKEND_TIMEOUT_MS,
  } = options;

  const headers: Record<string, string> = {
    Accept: "application/json",
    "Accept-Language": locale,
    "X-Request-Id": requestId,
  };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  try {
    const response = await fetch(new URL(path, serverEnv.BACKEND_API_URL), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      const code = await readErrorCode(response);
      return err({ code, status: response.status });
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch (error) {
      if (isTimeout(error)) throw error;
      return err({ code: "INVALID_BACKEND_RESPONSE", status: 502 });
    }

    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      return err({ code: "INVALID_BACKEND_RESPONSE", status: 502 });
    }
    return ok(parsed.data);
  } catch (error) {
    if (isTimeout(error)) return err({ code: "BACKEND_TIMEOUT", status: 504 });
    return err({ code: "BACKEND_UNAVAILABLE", status: 503 });
  }
}
