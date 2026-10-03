import "server-only";

import { z } from "zod";

const serverEnvSchema = z.object({
  BACKEND_API_URL: z.url(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function parseServerEnv(
  source: Record<string, string | undefined>,
): ServerEnv {
  const result = serverEnvSchema.safeParse(source);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid server environment: ${details}`);
  }
  return result.data;
}

export const serverEnv: ServerEnv = parseServerEnv(process.env);
