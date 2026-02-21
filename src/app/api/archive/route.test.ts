import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetIndex = vi.fn();
const mockGetFactForDate = vi.fn();

vi.mock("@/lib/db", () => ({
  getIndex: () => mockGetIndex(),
  getFactForDate: (...args: unknown[]) => mockGetFactForDate(...args),
}));

import { GET } from "./route";

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL("http://localhost/api/archive");
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return new Request(url.toString());
}

const makeFact = (date: string) => ({
  date,
  fact: `Fact for ${date}`,
  starWars: "Star Wars ref",
  imagePrompt: "prompt",
  imageUrl: `https://blob.example.com/${date}/image.png`,
  generatedAt: `${date}T06:00:00Z`,
});

describe("GET /api/archive", () => {
  beforeEach(() => {
    mockGetIndex.mockReset();
    mockGetFactForDate.mockReset();
  });

  it("returns empty array when no facts exist", async () => {
    mockGetIndex.mockResolvedValue({ dates: [] });

    const res = await GET(makeRequest());
    const data = await res.json();

    expect(data.facts).toEqual([]);
    expect(data.totalCount).toBe(0);
    expect(data.page).toBe(1);
  });

  it("returns paginated facts", async () => {
    const dates = ["2026-02-21", "2026-02-20", "2026-02-19"];
    mockGetIndex.mockResolvedValue({ dates });
    mockGetFactForDate.mockImplementation((date: string) =>
      Promise.resolve(makeFact(date))
    );

    const res = await GET(makeRequest({ page: "1", limit: "2" }));
    const data = await res.json();

    expect(data.facts).toHaveLength(2);
    expect(data.facts[0].date).toBe("2026-02-21");
    expect(data.facts[1].date).toBe("2026-02-20");
    expect(data.totalCount).toBe(3);
  });

  it("returns second page correctly", async () => {
    const dates = ["2026-02-21", "2026-02-20", "2026-02-19"];
    mockGetIndex.mockResolvedValue({ dates });
    mockGetFactForDate.mockImplementation((date: string) =>
      Promise.resolve(makeFact(date))
    );

    const res = await GET(makeRequest({ page: "2", limit: "2" }));
    const data = await res.json();

    expect(data.facts).toHaveLength(1);
    expect(data.facts[0].date).toBe("2026-02-19");
    expect(data.page).toBe(2);
  });

  it("clamps limit to max 50", async () => {
    mockGetIndex.mockResolvedValue({ dates: [] });

    const res = await GET(makeRequest({ limit: "100" }));
    const data = await res.json();

    expect(data.totalCount).toBe(0);
  });
});
