import { describe, expect, it } from "vitest";
import { formatMoney } from "./money";

function normalize(value: string): string {
  return value.replace(/[  ]/g, " ");
}

describe("formatMoney", () => {
  it("formate en français", () => {
    expect(normalize(formatMoney("1234.50", "EUR", "fr"))).toBe("1 234,50 €");
  });

  it("formate en anglais", () => {
    expect(normalize(formatMoney("1234.50", "EUR", "en"))).toBe("€1,234.50");
  });
});
