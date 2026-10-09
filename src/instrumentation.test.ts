// @vitest-environment node
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from "vitest";

async function loadRegister() {
  vi.resetModules();
  const { register } = await import("./instrumentation");
  return register;
}

let exitSpy: MockInstance<typeof process.exit>;
let writeSpy: MockInstance<typeof process.stderr.write>;

function stderrOutput(): string {
  return writeSpy.mock.calls.map((call) => String(call[0])).join("");
}

beforeEach(() => {
  vi.unstubAllEnvs();
  exitSpy = vi
    .spyOn(process, "exit")
    .mockImplementation((() => undefined) as never);
  writeSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
});

afterEach(() => {
  vi.unstubAllEnvs();
  exitSpy.mockRestore();
  writeSpy.mockRestore();
});

describe("register", () => {
  it("(a) runtime Node sans BACKEND_API_URL : exit(1) et journal nommant la variable", async () => {
    vi.stubEnv("NEXT_RUNTIME", "nodejs");
    vi.stubEnv("BACKEND_API_URL", undefined);
    const register = await loadRegister();
    await register();
    expect(exitSpy).toHaveBeenCalledTimes(1);
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(writeSpy).toHaveBeenCalledTimes(1);
    expect(stderrOutput()).toContain("Invalid server environment");
    expect(stderrOutput()).toContain("BACKEND_API_URL");
    expect(stderrOutput().endsWith("\n")).toBe(true);
  });

  it("runtime Node avec une valeur invalide : journal sans la valeur", async () => {
    vi.stubEnv("NEXT_RUNTIME", "nodejs");
    vi.stubEnv("BACKEND_API_URL", "pas-une-url-valeur-secrete");
    const register = await loadRegister();
    await register();
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(stderrOutput()).toContain("BACKEND_API_URL");
    expect(stderrOutput()).not.toContain("pas-une-url-valeur-secrete");
  });

  it("(a) runtime Node avec BACKEND_API_URL : résolue, sans arrêt", async () => {
    vi.stubEnv("NEXT_RUNTIME", "nodejs");
    vi.stubEnv("BACKEND_API_URL", "http://localhost:8080");
    const register = await loadRegister();
    await expect(register()).resolves.toBeUndefined();
    expect(exitSpy).not.toHaveBeenCalled();
    expect(writeSpy).not.toHaveBeenCalled();
  });

  it("runtime edge sans BACKEND_API_URL : résolue, sans arrêt", async () => {
    vi.stubEnv("NEXT_RUNTIME", "edge");
    vi.stubEnv("BACKEND_API_URL", undefined);
    const register = await loadRegister();
    await expect(register()).resolves.toBeUndefined();
    expect(exitSpy).not.toHaveBeenCalled();
    expect(writeSpy).not.toHaveBeenCalled();
  });
});
