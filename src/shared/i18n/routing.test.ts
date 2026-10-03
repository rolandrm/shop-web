import { describe, expect, it } from "vitest";
import { routing } from "./routing";

describe("routing", () => {
  it("declares exactly fr and en, with fr as default", () => {
    expect([...routing.locales]).toEqual(["fr", "en"]);
    expect(routing.defaultLocale).toBe("fr");
  });
});
