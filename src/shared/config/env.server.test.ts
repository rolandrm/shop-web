// @vitest-environment node
import { describe, expect, it } from "vitest";

import { parseServerEnv } from "./env.server";

describe("parseServerEnv", () => {
  it("T1 : renvoie l'objet typé pour une source valide", () => {
    const env = parseServerEnv({
      BACKEND_API_URL: "http://localhost:8080",
      NODE_ENV: "test",
    });
    expect(env.BACKEND_API_URL).toBe("http://localhost:8080");
    expect(env.NODE_ENV).toBe("test");
  });

  it("T2 : lève une erreur nommant BACKEND_API_URL si absente", () => {
    expect(() => parseServerEnv({})).toThrow(/BACKEND_API_URL/);
  });

  it("T2 : lève une erreur nommant BACKEND_API_URL si ce n'est pas une URL", () => {
    expect(() => parseServerEnv({ BACKEND_API_URL: "pas une url" })).toThrow(
      /BACKEND_API_URL/,
    );
  });
});
