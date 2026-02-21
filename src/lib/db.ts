import { createClient } from "@libsql/client";
import type { DailyFact } from "./types";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL ?? "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const initialized = db.execute(`
  CREATE TABLE IF NOT EXISTS daily_facts (
    date TEXT PRIMARY KEY,
    fact TEXT NOT NULL,
    star_wars TEXT NOT NULL,
    image_prompt TEXT NOT NULL,
    image_base64 TEXT,
    generated_at TEXT NOT NULL
  )
`);

async function ensureTable() {
  await initialized;
}

export async function getFactForDate(
  date: string
): Promise<DailyFact | null> {
  await ensureTable();
  const result = await db.execute({
    sql: "SELECT date, fact, star_wars, image_prompt, generated_at FROM daily_facts WHERE date = ?",
    args: [date],
  });
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    date: row.date as string,
    fact: row.fact as string,
    starWars: row.star_wars as string,
    imagePrompt: row.image_prompt as string,
    imageUrl: `/api/fact-image/${row.date}`,
    generatedAt: row.generated_at as string,
  };
}

export async function storeFactForDate(
  date: string,
  fact: DailyFact,
  imageBuffer: Buffer
): Promise<string> {
  await ensureTable();
  const imageBase64 = imageBuffer.toString("base64");
  await db.execute({
    sql: `INSERT OR REPLACE INTO daily_facts (date, fact, star_wars, image_prompt, image_base64, generated_at)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [date, fact.fact, fact.starWars, fact.imagePrompt, imageBase64, fact.generatedAt],
  });
  const imageUrl = `/api/fact-image/${date}`;
  fact.imageUrl = imageUrl;
  return imageUrl;
}

interface FactIndex {
  dates: string[];
}

export async function getIndex(): Promise<FactIndex> {
  await ensureTable();
  const result = await db.execute(
    "SELECT date FROM daily_facts ORDER BY date DESC"
  );
  return { dates: result.rows.map((row) => row.date as string) };
}

export async function updateIndex(_date: string): Promise<void> {
  // No-op: dates are derived from the daily_facts table
}

export async function getImageBase64(date: string): Promise<string | null> {
  await ensureTable();
  const result = await db.execute({
    sql: "SELECT image_base64 FROM daily_facts WHERE date = ?",
    args: [date],
  });
  if (result.rows.length === 0) return null;
  return (result.rows[0].image_base64 as string) ?? null;
}
