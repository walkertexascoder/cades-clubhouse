import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetFactForDate = vi.fn();
const mockStoreFactForDate = vi.fn();
const mockUpdateIndex = vi.fn();
const mockGetTodayCentral = vi.fn();
const mockGetYesterdayCentral = vi.fn();

vi.mock("@/lib/db", () => ({
  getFactForDate: (...args: unknown[]) => mockGetFactForDate(...args),
  storeFactForDate: (...args: unknown[]) => mockStoreFactForDate(...args),
  updateIndex: (...args: unknown[]) => mockUpdateIndex(...args),
}));

vi.mock("@/lib/date", () => ({
  getTodayCentral: () => mockGetTodayCentral(),
  getYesterdayCentral: () => mockGetYesterdayCentral(),
}));

const mockChatCreate = vi.fn();
const mockImagesGenerate = vi.fn();

vi.mock("openai", () => ({
  default: class {
    chat = { completions: { create: mockChatCreate } };
    images = { generate: mockImagesGenerate };
  },
}));

import { GET } from "./route";

const mockFact = {
  date: "2026-02-21",
  fact: "GW was the first president",
  starWars: "Like the first Jedi!",
  imagePrompt: "GW in Jedi robes",
  imageUrl: "https://blob.example.com/image.png",
  generatedAt: "2026-02-21T06:00:00Z",
};

describe("GET /api/daily-fact", () => {
  beforeEach(() => {
    mockGetTodayCentral.mockReturnValue("2026-02-21");
    mockGetYesterdayCentral.mockReturnValue("2026-02-20");
    mockGetFactForDate.mockResolvedValue(null);
    mockStoreFactForDate.mockResolvedValue(undefined);
    mockUpdateIndex.mockResolvedValue(undefined);
    mockChatCreate.mockReset();
    mockImagesGenerate.mockReset();
  });

  it("returns today's cached fact when available", async () => {
    mockGetFactForDate.mockResolvedValue(mockFact);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.fact).toBe(mockFact.fact);
    expect(res.headers.get("Cache-Control")).toContain("s-maxage=300");
  });

  it("falls back to yesterday when today is missing", async () => {
    const yesterdayFact = { ...mockFact, date: "2026-02-20" };
    mockGetFactForDate
      .mockResolvedValueOnce(null) // today
      .mockResolvedValueOnce(yesterdayFact); // yesterday

    const res = await GET();
    const data = await res.json();

    expect(data.date).toBe("2026-02-20");
    expect(res.headers.get("Cache-Control")).toContain("s-maxage=60");
  });

  it("generates on-demand when no cached facts exist", async () => {
    mockGetFactForDate.mockResolvedValue(null);

    mockChatCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              fact: "On-demand fact",
              starWars: "On-demand star wars",
              imagePrompt: "On-demand prompt",
            }),
          },
        },
      ],
    });

    mockImagesGenerate.mockResolvedValue({
      data: [{ b64_json: "AAAA" }],
    });

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.fact).toBe("On-demand fact");
    expect(mockStoreFactForDate).toHaveBeenCalled();
  });

  it("returns 500 when on-demand generation fails", async () => {
    mockGetFactForDate.mockResolvedValue(null);
    mockChatCreate.mockRejectedValue(new Error("API down"));

    const res = await GET();
    expect(res.status).toBe(500);
  });
});
