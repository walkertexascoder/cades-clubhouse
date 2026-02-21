"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { DailyFact } from "@/lib/types";

export default function ArchiveList() {
  const [facts, setFacts] = useState<DailyFact[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadFacts = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/archive?page=${p}&limit=10`);
      const data = await res.json();
      setFacts((prev) => (p === 1 ? data.facts : [...prev, ...data.facts]));
      setTotalCount(data.totalCount);
      setPage(p);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFacts(1);
  }, [loadFacts]);

  const hasMore = facts.length < totalCount;

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/"
        className="mb-8 inline-block rounded-full bg-purple-600 px-6 py-2 font-bold text-white shadow-lg transition hover:bg-purple-700"
      >
        Back to Clubhouse
      </Link>

      {facts.length === 0 && !loading && (
        <p className="text-center text-xl text-gray-600">
          No facts yet! Check back tomorrow.
        </p>
      )}

      <div className="space-y-6">
        {facts.map((fact) => (
          <div
            key={fact.date}
            className="rounded-3xl bg-white/80 p-6 shadow-xl backdrop-blur"
          >
            <p className="mb-2 text-sm font-semibold text-purple-500">
              {fact.date}
            </p>
            <p className="mb-3 text-lg leading-relaxed text-gray-800">
              {fact.fact}
            </p>
            <p className="mb-4 text-base font-semibold italic text-indigo-600">
              {fact.starWars}
            </p>
            {fact.imageUrl && (
              <img
                src={fact.imageUrl}
                alt={`Illustration for ${fact.date}`}
                className="h-48 w-48 rounded-2xl object-cover shadow-lg"
              />
            )}
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="mt-8 text-center">
          <button
            onClick={() => loadFacts(page + 1)}
            disabled={loading}
            className="rounded-full bg-yellow-400 px-8 py-3 font-bold text-purple-900 shadow-lg transition hover:bg-yellow-300 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}
