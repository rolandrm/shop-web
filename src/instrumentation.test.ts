// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

async function loadRegister() {
  vi.resetModules();
  const { register } = await import("./instrumentation");
  return register;
}

beforeEach(() => {
  vi.unstubAllEnvs();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("register", () => {
  it("(a) runtime Node sans BACKEND_API_URL : rejetée en nommant la variable", async () => {
    vi.stubEnv("NEXT_RUNTIME", "nodejs");
    vi.stubEnv("BACKEND_API_URL", undefined);
    const register = await loadRegister();
    await expect(register()).rejects.toThrow(/BACKEND_API_URL/);
  });

  it("(a) runtime Node avec BACKEND_API_URL : résolue", async () => {
    vi.stubEnv("NEXT_RUNTIME", "nodejs");
    vi.stubEnv("BACKEND_API_URL", "http://localhost:8080");
    const register = await loadRegister();
    await expect(register()).resolves.toBeUndefined();
  });

  it("runtime edge sans BACKEND_API_URL : résolue", async () => {
    vi.stubEnv("NEXT_RUNTIME", "edge");
    vi.stubEnv("BACKEND_API_URL", undefined);
    const register = await loadRegister();
    await expect(register()).resolves.toBeUndefined();
  });
});
