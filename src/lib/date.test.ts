import { describe, it, expect, vi, afterEach } from "vitest";
import { getTodayCentral, getYesterdayCentral } from "./date";

afterEach(() => {
  vi.useRealTimers();
});

describe("getTodayCentral", () => {
  it("returns a YYYY-MM-DD string", () => {
    const result = getTodayCentral();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("returns the correct date in Central Time", () => {
    // 2026-03-15 02:00 UTC = 2026-03-14 21:00 CDT (UTC-5 during DST)
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-15T02:00:00Z"));

    const result = getTodayCentral();
    expect(result).toBe("2026-03-14");
  });
});

describe("getYesterdayCentral", () => {
  it("returns a YYYY-MM-DD string", () => {
    const result = getYesterdayCentral();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("returns the day before today in Central Time", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-15T02:00:00Z"));

    const result = getYesterdayCentral();
    expect(result).toBe("2026-03-13");
  });
});
