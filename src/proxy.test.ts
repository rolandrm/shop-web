// @vitest-environment node
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import proxy from "./proxy";

describe("proxy", () => {
  it("redirects / to /fr", async () => {
    const response = await proxy(new NextRequest("http://localhost:3000/"));
    expect(response.status).toBeGreaterThanOrEqual(300);
    expect(response.status).toBeLessThan(400);
    const location = response.headers.get("location");
    expect(location).not.toBeNull();
    expect(new URL(location as string).pathname).toBe("/fr");
  });

  it("does not redirect /en", async () => {
    const response = await proxy(new NextRequest("http://localhost:3000/en"));
    expect(response.status).toBeLessThan(300);
    expect(response.headers.get("location")).toBeNull();
  });
});
