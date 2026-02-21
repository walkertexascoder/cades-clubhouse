import OpenAI from "openai";
import { NextResponse } from "next/server";
import { getTodayCentral, getYesterdayCentral } from "@/lib/date";
import { getFactForDate, storeFactForDate, updateIndex } from "@/lib/db";
import { FACT_SYSTEM_PROMPT, FACT_USER_PROMPT } from "@/lib/prompts";
import type { DailyFact } from "@/lib/types";

export async function GET() {
  const today = getTodayCentral();

  // Try today's cached fact
  const todayFact = await getFactForDate(today);
  if (todayFact) {
    return NextResponse.json(todayFact, {
      headers: {
        "Cache-Control": "s-maxage=300, stale-while-revalidate=60",
      },
    });
  }

  // Fallback: yesterday's fact
  const yesterday = getYesterdayCentral();
  const yesterdayFact = await getFactForDate(yesterday);
  if (yesterdayFact) {
    return NextResponse.json(yesterdayFact, {
      headers: {
        "Cache-Control": "s-maxage=60, stale-while-revalidate=30",
      },
    });
  }

  // Last resort: generate on-demand
  try {
    const openai = new OpenAI();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: FACT_SYSTEM_PROMPT },
        { role: "user", content: FACT_USER_PROMPT },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 502 }
      );
    }

    const parsed = JSON.parse(content);

    const imageResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: parsed.imagePrompt,
      n: 1,
      size: "1024x1024",
      response_format: "b64_json",
    });

    const b64 = imageResponse.data?.[0]?.b64_json;
    if (!b64) {
      return NextResponse.json(
        { error: "No image generated" },
        { status: 502 }
      );
    }

    const imageBuffer = Buffer.from(b64, "base64");

    const fact: DailyFact = {
      date: today,
      fact: parsed.fact,
      starWars: parsed.starWars,
      imagePrompt: parsed.imagePrompt,
      imageUrl: "",
      generatedAt: new Date().toISOString(),
    };

    await storeFactForDate(today, fact, imageBuffer);
    await updateIndex(today);

    return NextResponse.json(fact, {
      headers: {
        "Cache-Control": "s-maxage=300, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("On-demand fact generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate fact" },
      { status: 500 }
    );
  }
}
