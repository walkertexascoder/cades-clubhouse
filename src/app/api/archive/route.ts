import { NextResponse } from "next/server";
import { getIndex, getFactForDate } from "@/lib/db";
import type { DailyFact } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(
    50,
    Math.max(1, parseInt(searchParams.get("limit") || "10", 10))
  );

  const index = await getIndex();
  const totalCount = index.dates.length;
  const start = (page - 1) * limit;
  const pageDates = index.dates.slice(start, start + limit);

  const facts: DailyFact[] = [];
  for (const date of pageDates) {
    const fact = await getFactForDate(date);
    if (fact) facts.push(fact);
  }

  return NextResponse.json({ facts, totalCount, page });
}
