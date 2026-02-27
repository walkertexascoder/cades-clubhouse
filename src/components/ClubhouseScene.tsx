"use client";

import { useCallback, useRef, useState } from "react";
import ClubhouseView from "./ClubhouseView";
import FactsView from "./FactsView";
import LoadingView from "./LoadingView";
import MazeView from "./MazeView";

type ViewState = "clubhouse" | "loading" | "facts" | "maze";

export default function ClubhouseScene() {
  const [view, setView] = useState<ViewState>("clubhouse");
  const [fact, setFact] = useState("");
  const [starWars, setStarWars] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [date, setDate] = useState<string | undefined>(undefined);

  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const titleClickCountRef = useRef(0);
  const titleClickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTripleClick = useCallback(
    (onTriggered: () => void) => {
      clickCountRef.current += 1;

      if (clickCountRef.current === 3) {
        clickCountRef.current = 0;
        if (clickTimerRef.current) {
          clearTimeout(clickTimerRef.current);
          clickTimerRef.current = null;
        }
        onTriggered();
        return;
      }

      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
      }
      clickTimerRef.current = setTimeout(() => {
        clickCountRef.current = 0;
        clickTimerRef.current = null;
      }, 500);
    },
    []
  );

  const handleClubhouseTripleClick = useCallback(() => {
    handleTripleClick(async () => {
      setView("loading");
      setImageUrl(null);

      try {
        const res = await fetch("/api/daily-fact");
        const data = await res.json();

        setFact(data.fact);
        setStarWars(data.starWars);
        setImageUrl(data.imageUrl || null);
        setDate(data.date);
        setView("facts");
      } catch (error) {
        console.error("Failed to load fact:", error);
        setView("clubhouse");
      }
    });
  }, [handleTripleClick]);

  const handleFactsTripleClick = useCallback(() => {
    handleTripleClick(() => {
      setView("clubhouse");
    });
  }, [handleTripleClick]);

  const handleTitleTripleClick = useCallback(() => {
    titleClickCountRef.current += 1;
    if (titleClickCountRef.current === 3) {
      titleClickCountRef.current = 0;
      if (titleClickTimerRef.current) {
        clearTimeout(titleClickTimerRef.current);
        titleClickTimerRef.current = null;
      }
      setView("maze");
      return;
    }
    if (titleClickTimerRef.current) clearTimeout(titleClickTimerRef.current);
    titleClickTimerRef.current = setTimeout(() => {
      titleClickCountRef.current = 0;
      titleClickTimerRef.current = null;
    }, 500);
  }, []);

  const showFacts = view === "facts";

  if (view === "maze") {
    return <MazeView onBack={() => setView("clubhouse")} />;
  }

  return (
    <div className="relative overflow-hidden">
      <div
        className={`flex w-[200%] transition-transform duration-700 ease-in-out ${
          showFacts ? "-translate-x-1/2" : "translate-x-0"
        }`}
      >
        <div className="w-1/2">
          {view === "loading" ? (
            <LoadingView />
          ) : (
            <ClubhouseView
              onTripleClick={handleClubhouseTripleClick}
              onTitleTripleClick={handleTitleTripleClick}
            />
          )}
        </div>
        <div className="w-1/2">
          {view === "facts" && (
            <FactsView
              fact={fact}
              starWars={starWars}
              imageUrl={imageUrl}
              date={date}
              onTripleClick={handleFactsTripleClick}
              onBack={() => setView("clubhouse")}
            />
          )}
        </div>
      </div>
    </div>
  );
}
