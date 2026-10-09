import { isNodeRuntime } from "@/shared/config/runtime";

const ERROR_PREFIX = "Invalid server environment: ";

function invalidVariableNames(error: unknown): string[] {
  const message = error instanceof Error ? error.message : "";
  const details = message.startsWith(ERROR_PREFIX)
    ? message.slice(ERROR_PREFIX.length)
    : message;
  return details
    .split("; ")
    .map((detail) => detail.split(":")[0]?.trim() ?? "")
    .filter((name) => name.length > 0);
}

export async function register(): Promise<void> {
  if (!isNodeRuntime()) return;
  const { getServerEnv } = await import("@/shared/config/env.server");
  try {
    getServerEnv();
  } catch (error) {
    const line = JSON.stringify({
      level: "fatal",
      msg: "Invalid server environment",
      variables: invalidVariableNames(error),
    });
    process.stderr.write(`${line}\n`);
    process.exit(1);
  }
}
