import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetFactForDate = vi.fn();
const mockStoreFactForDate = vi.fn();
const mockUpdateIndex = vi.fn();
const mockGetTodayCentral = vi.fn();

vi.mock("@/lib/db", () => ({
  getFactForDate: (...args: unknown[]) => mockGetFactForDate(...args),
  storeFactForDate: (...args: unknown[]) => mockStoreFactForDate(...args),
  updateIndex: (...args: unknown[]) => mockUpdateIndex(...args),
}));

vi.mock("@/lib/date", () => ({
  getTodayCentral: () => mockGetTodayCentral(),
}));

const mockChatCreate = vi.fn();
const mockImagesGenerate = vi.fn();

vi.mock("openai", () => ({
  default: class {
    chat = { completions: { create: mockChatCreate } };
    images = { generate: mockImagesGenerate };
  },
}));

import { POST } from "./route";

function makeRequest(secret: string | null = "test-secret") {
  const headers: Record<string, string> = {};
  if (secret) headers["authorization"] = `Bearer ${secret}`;
  return new Request("http://localhost/api/generate-daily-fact", {
    method: "POST",
    headers,
  });
}

describe("POST /api/generate-daily-fact", () => {
  beforeEach(() => {
    vi.stubEnv("CRON_SECRET", "test-secret");
    mockGetTodayCentral.mockReturnValue("2026-02-21");
    mockGetFactForDate.mockResolvedValue(null);
    mockStoreFactForDate.mockResolvedValue(undefined);
    mockUpdateIndex.mockResolvedValue(undefined);
    mockChatCreate.mockReset();
    mockImagesGenerate.mockReset();
  });

  it("returns 401 without authorization header", async () => {
    const res = await POST(makeRequest(null));
    expect(res.status).toBe(401);
  });

  it("returns 401 with wrong secret", async () => {
    const res = await POST(makeRequest("wrong-secret"));
    expect(res.status).toBe(401);
  });

  it("skips generation if today's fact already exists", async () => {
    mockGetFactForDate.mockResolvedValue({
      date: "2026-02-21",
      fact: "existing",
    });

    const res = await POST(makeRequest());
    const data = await res.json();
    expect(data.message).toBe("Already generated");
    expect(mockChatCreate).not.toHaveBeenCalled();
  });

  it("generates and stores a new fact", async () => {
    const factPayload = {
      fact: "GW was tall",
      starWars: "Like Chewie!",
      imagePrompt: "GW on a Star Destroyer",
    };

    mockChatCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(factPayload) } }],
    });

    mockImagesGenerate.mockResolvedValue({
      data: [{ b64_json: "AAAA" }],
    });

    const res = await POST(makeRequest());
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.message).toBe("Generated");
    expect(data.date).toBe("2026-02-21");
    expect(mockStoreFactForDate).toHaveBeenCalled();
    expect(mockUpdateIndex).toHaveBeenCalledWith("2026-02-21");
  });

  it("returns 502 when AI returns no content", async () => {
    mockChatCreate.mockResolvedValue({
      choices: [{ message: { content: null } }],
    });

    const res = await POST(makeRequest());
    expect(res.status).toBe(502);
  });

  it("returns 502 when DALL-E returns no image", async () => {
    mockChatCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              fact: "f",
              starWars: "s",
              imagePrompt: "p",
            }),
          },
        },
      ],
    });
    mockImagesGenerate.mockResolvedValue({ data: [{}] });

    const res = await POST(makeRequest());
    expect(res.status).toBe(502);
  });

  it("returns 500 when OpenAI throws", async () => {
    mockChatCreate.mockRejectedValue(new Error("API down"));

    const res = await POST(makeRequest());
    expect(res.status).toBe(500);
  });
});
