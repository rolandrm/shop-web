// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { parseServerEnv } from "./env.server";

async function loadModule() {
  vi.resetModules();
  return import("./env.server");
}

beforeEach(() => {
  vi.unstubAllEnvs();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("parseServerEnv", () => {
  it("renvoie l'objet typé pour une source valide", () => {
    const env = parseServerEnv({
      BACKEND_API_URL: "http://localhost:8080",
      NODE_ENV: "test",
    });
    expect(env.BACKEND_API_URL).toBe("http://localhost:8080");
    expect(env.NODE_ENV).toBe("test");
  });

  it("lève une erreur nommant BACKEND_API_URL si absente", () => {
    expect(() => parseServerEnv({})).toThrow(/BACKEND_API_URL/);
  });
});

describe("getServerEnv", () => {
  it("T1 : renvoie BACKEND_API_URL quand elle est valide", async () => {
    vi.stubEnv("BACKEND_API_URL", "http://localhost:8080");
    const { getServerEnv } = await loadModule();
    expect(getServerEnv().BACKEND_API_URL).toBe("http://localhost:8080");
  });

  it("T2 : lève une erreur nommant BACKEND_API_URL si absente", async () => {
    vi.stubEnv("BACKEND_API_URL", undefined);
    const { getServerEnv } = await loadModule();
    expect(() => getServerEnv()).toThrow(/BACKEND_API_URL/);
  });

  it("T2 : lève une erreur nommant BACKEND_API_URL si ce n'est pas une URL", async () => {
    vi.stubEnv("BACKEND_API_URL", "pas une url");
    const { getServerEnv } = await loadModule();
    expect(() => getServerEnv()).toThrow(/BACKEND_API_URL/);
  });

  it("mémorise : même objet, sans revalidation après changement", async () => {
    vi.stubEnv("BACKEND_API_URL", "http://localhost:8080");
    const { getServerEnv } = await loadModule();
    const first = getServerEnv();
    vi.stubEnv("BACKEND_API_URL", "http://autre.test");
    const second = getServerEnv();
    expect(second).toBe(first);
    expect(second.BACKEND_API_URL).toBe("http://localhost:8080");
  });

  it("n'échoue pas au chargement du module sans BACKEND_API_URL", async () => {
    vi.stubEnv("BACKEND_API_URL", undefined);
    await expect(loadModule()).resolves.toBeDefined();
  });
});
