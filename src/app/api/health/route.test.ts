// @vitest-environment node
import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("GET /api/health", () => {
  it("renvoie 200 et { status: ok } sans backend", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
  });
});
