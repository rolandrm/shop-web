import { isNodeRuntime } from "@/shared/config/runtime";

export async function register(): Promise<void> {
  if (!isNodeRuntime()) return;
  const { getServerEnv } = await import("@/shared/config/env.server");
  getServerEnv();
}
