import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetImageBase64 = vi.fn();

vi.mock("@/lib/db", () => ({
  getImageBase64: (...args: unknown[]) => mockGetImageBase64(...args),
}));

import { GET } from "./route";

function makeRequest(date: string) {
  return [
    new Request(`http://localhost/api/fact-image/${date}`),
    { params: Promise.resolve({ date }) },
  ] as const;
}

describe("GET /api/fact-image/[date]", () => {
  beforeEach(() => {
    mockGetImageBase64.mockReset();
  });

  it("returns 400 for invalid date format", async () => {
    const res = await GET(...makeRequest("not-a-date"));
    expect(res.status).toBe(400);
  });

  it("returns 404 when image not found", async () => {
    mockGetImageBase64.mockResolvedValue(null);

    const res = await GET(...makeRequest("2026-02-21"));
    expect(res.status).toBe(404);
  });

  it("returns image with correct headers", async () => {
    const fakeBase64 = Buffer.from("fake-png-data").toString("base64");
    mockGetImageBase64.mockResolvedValue(fakeBase64);

    const res = await GET(...makeRequest("2026-02-21"));

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/png");
    expect(res.headers.get("Cache-Control")).toBe(
      "public, max-age=86400, immutable"
    );

    const body = await res.arrayBuffer();
    expect(Buffer.from(body).toString()).toBe("fake-png-data");
  });
});
