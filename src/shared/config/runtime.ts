export function isNodeRuntime(): boolean {
  return process.env.NEXT_RUNTIME === "nodejs";
}
