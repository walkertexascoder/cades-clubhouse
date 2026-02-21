import OpenAI from "openai";
import { NextResponse } from "next/server";
import { getTodayCentral } from "@/lib/date";
import { getFactForDate, storeFactForDate, updateIndex } from "@/lib/db";
import { FACT_SYSTEM_PROMPT, FACT_USER_PROMPT } from "@/lib/prompts";
import type { DailyFact } from "@/lib/types";

export const maxDuration = 60;

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!authHeader || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = getTodayCentral();

  const existing = await getFactForDate(today);
  if (existing) {
    return NextResponse.json({ message: "Already generated", date: today });
  }

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

    const b64 = imageResponse.data[0]?.b64_json;
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

    return NextResponse.json({ message: "Generated", date: today, fact });
  } catch (error) {
    console.error("Daily fact generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate daily fact" },
      { status: 500 }
    );
  }
}
