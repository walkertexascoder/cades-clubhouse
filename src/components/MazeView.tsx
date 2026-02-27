"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const ROWS = 15;
const COLS = 15;

// walls[0]=N, walls[1]=E, walls[2]=S, walls[3]=W
type Cell = {
  walls: [boolean, boolean, boolean, boolean];
  visited: boolean;
};

function generateMaze(rows: number, cols: number): Cell[][] {
  const grid: Cell[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      walls: [true, true, true, true] as [boolean, boolean, boolean, boolean],
      visited: false,
    }))
  );

  // Iterative DFS (recursive backtracker)
  const stack: [number, number][] = [];
  grid[0][0].visited = true;
  stack.push([0, 0]);

  // [dr, dc, wallOfCurrent, wallOfNeighbor]
  const directions: Array<[number, number, number, number]> = [
    [-1, 0, 0, 2], // N: remove N of current, S of neighbor
    [0, 1, 1, 3],  // E: remove E of current, W of neighbor
    [1, 0, 2, 0],  // S: remove S of current, N of neighbor
    [0, -1, 3, 1], // W: remove W of current, E of neighbor
  ];

  while (stack.length > 0) {
    const [r, c] = stack[stack.length - 1];
    const neighbors = directions
      .map(([dr, dc, wa, wb]) => {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !grid[nr][nc].visited) {
          return { nr, nc, wa, wb };
        }
        return null;
      })
      .filter((n): n is NonNullable<typeof n> => n !== null);

    if (neighbors.length === 0) {
      stack.pop();
    } else {
      const pick = neighbors[Math.floor(Math.random() * neighbors.length)];
      grid[r][c].walls[pick.wa] = false;
      grid[pick.nr][pick.nc].walls[pick.wb] = false;
      grid[pick.nr][pick.nc].visited = true;
      stack.push([pick.nr, pick.nc]);
    }
  }

  return grid;
}

function drawMaze(
  ctx: CanvasRenderingContext2D,
  maze: Cell[][],
  cellSize: number,
  playerPos: [number, number],
) {
  const rows = maze.length;
  const cols = maze[0].length;
  const W = cols * cellSize;
  const H = rows * cellSize;

  // Background
  ctx.fillStyle = "#e0f2fe"; // sky-100
  ctx.fillRect(0, 0, W, H);

  // Goal cell highlight
  const goalR = rows - 1;
  const goalC = cols - 1;
  ctx.fillStyle = "#fef9c3"; // yellow-100
  ctx.fillRect(goalC * cellSize + 1, goalR * cellSize + 1, cellSize - 2, cellSize - 2);

  // Player cell highlight
  const [pr, pc] = playerPos;
  ctx.fillStyle = "#ede9fe"; // violet-100
  ctx.fillRect(pc * cellSize + 1, pr * cellSize + 1, cellSize - 2, cellSize - 2);

  // Walls
  ctx.strokeStyle = "#6d28d9"; // violet-700
  ctx.lineWidth = 2;
  ctx.lineCap = "square";

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * cellSize;
      const y = r * cellSize;
      const { walls } = maze[r][c];

      if (walls[0]) {
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + cellSize, y); ctx.stroke();
      }
      if (walls[1]) {
        ctx.beginPath(); ctx.moveTo(x + cellSize, y); ctx.lineTo(x + cellSize, y + cellSize); ctx.stroke();
      }
      if (walls[2]) {
        ctx.beginPath(); ctx.moveTo(x + cellSize, y + cellSize); ctx.lineTo(x, y + cellSize); ctx.stroke();
      }
      if (walls[3]) {
        ctx.beginPath(); ctx.moveTo(x, y + cellSize); ctx.lineTo(x, y); ctx.stroke();
      }
    }
  }

  // Outer border
  ctx.strokeStyle = "#5b21b6"; // violet-800
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, W, H);

  // Characters
  const emojiSize = Math.max(10, cellSize - 8);
  const half = cellSize / 2;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Goal: ⚔️ and 🧙 side by side
  ctx.font = `${Math.floor(emojiSize * 0.58)}px serif`;
  ctx.fillText("⚔️", goalC * cellSize + half * 0.65, goalR * cellSize + half);
  ctx.fillText("🧙", goalC * cellSize + half * 1.35, goalR * cellSize + half);

  // Player: 🎩
  ctx.font = `${emojiSize}px serif`;
  ctx.fillText("🎩", pc * cellSize + half, pr * cellSize + half);
}

interface MazeViewProps {
  onBack: () => void;
}

export default function MazeView({ onBack }: MazeViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mazeGrid, setMazeGrid] = useState<Cell[][]>(() => generateMaze(ROWS, COLS));
  const [playerPos, setPlayerPos] = useState<[number, number]>([0, 0]);
  const [won, setWon] = useState(false);
  const [cellSize, setCellSize] = useState(28);
  const canvasSize = ROWS * cellSize;

  // Responsive cell size
  useEffect(() => {
    const update = () => {
      const maxDim = Math.min(
        window.innerWidth - 48,
        window.innerHeight - 280,
        480,
      );
      setCellSize(Math.max(20, Math.floor(maxDim / ROWS)));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Resize canvas when cellSize changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasSize * dpr;
    canvas.height = canvasSize * dpr;
    canvas.style.width = `${canvasSize}px`;
    canvas.style.height = `${canvasSize}px`;
  }, [canvasSize]);

  // Draw maze
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawMaze(ctx, mazeGrid, cellSize, playerPos);
  }, [mazeGrid, cellSize, playerPos, canvasSize]);

  // Check win condition
  useEffect(() => {
    const [r, c] = playerPos;
    if (r === ROWS - 1 && c === COLS - 1) {
      setWon(true);
    }
  }, [playerPos]);

  const move = useCallback(
    (dir: "N" | "E" | "S" | "W") => {
      if (won) return;
      setPlayerPos(([r, c]) => {
        const cell = mazeGrid[r][c];
        const wallIdx = { N: 0, E: 1, S: 2, W: 3 } as const;
        if (cell.walls[wallIdx[dir]]) return [r, c] as [number, number];
        let dr = 0, dc = 0;
        if (dir === "N") dr = -1;
        else if (dir === "E") dc = 1;
        else if (dir === "S") dr = 1;
        else dc = -1;
        return [r + dr, c + dc] as [number, number];
      });
    },
    [mazeGrid, won],
  );

  // Keyboard controls
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const map: Record<string, "N" | "E" | "S" | "W"> = {
        ArrowUp: "N", w: "N", W: "N",
        ArrowRight: "E", d: "E", D: "E",
        ArrowDown: "S", s: "S", S: "S",
        ArrowLeft: "W", a: "W", A: "W",
      };
      const dir = map[e.key];
      if (dir) {
        e.preventDefault();
        move(dir);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [move]);

  // Swipe support
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartRef.current.x;
    const dy = t.clientY - touchStartRef.current.y;
    touchStartRef.current = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
    if (Math.abs(dx) > Math.abs(dy)) {
      move(dx > 0 ? "E" : "W");
    } else {
      move(dy > 0 ? "S" : "N");
    }
  };

  // Prevent page scroll while touching maze
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const prevent = (e: TouchEvent) => e.preventDefault();
    canvas.addEventListener("touchmove", prevent, { passive: false });
    return () => canvas.removeEventListener("touchmove", prevent);
  }, []);

  const newMaze = () => {
    setMazeGrid(generateMaze(ROWS, COLS));
    setPlayerPos([0, 0]);
    setWon(false);
  };

  const btn =
    "flex items-center justify-center w-11 h-11 rounded-xl bg-purple-200 text-purple-800 font-bold text-xl shadow hover:bg-purple-300 active:scale-90 transition-all select-none touch-manipulation";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
      <h1 className="mb-2 text-center text-4xl font-extrabold tracking-tight text-purple-700 drop-shadow-lg sm:text-5xl">
        George&apos;s Quest!
      </h1>
      <p className="mb-4 text-sm font-semibold text-purple-500">
        Help George find Luke &amp; Obi-Wan! 🗺️
      </p>

      <div
        className="relative rounded-2xl shadow-2xl overflow-hidden border-4 border-purple-300"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <canvas ref={canvasRef} />
        {won && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-yellow-50/95 rounded-2xl">
            <p className="text-6xl mb-3">🎉</p>
            <p className="text-2xl font-extrabold text-purple-700 mb-2">
              You made it!
            </p>
            <p className="text-base text-gray-600 mb-6">
              George found Luke &amp; Obi-Wan! ⚔️🧙
            </p>
            <button
              onClick={newMaze}
              className="px-6 py-3 rounded-2xl bg-purple-600 text-white font-bold text-lg shadow-lg hover:bg-purple-700 active:scale-95 transition-all"
            >
              New Maze
            </button>
          </div>
        )}
      </div>

      {/* Arrow pad */}
      <div className="mt-5 grid grid-cols-3 grid-rows-3 gap-1.5">
        <div />
        <button className={btn} onClick={() => move("N")} aria-label="Move up">↑</button>
        <div />
        <button className={btn} onClick={() => move("W")} aria-label="Move left">←</button>
        <div className="flex items-center justify-center text-purple-300 text-lg select-none">✦</div>
        <button className={btn} onClick={() => move("E")} aria-label="Move right">→</button>
        <div />
        <button className={btn} onClick={() => move("S")} aria-label="Move down">↓</button>
        <div />
      </div>

      <div className="mt-5 flex gap-3">
        <button
          onClick={newMaze}
          className="px-4 py-2 rounded-xl bg-purple-100 text-purple-700 font-semibold hover:bg-purple-200 transition-all"
        >
          New Maze
        </button>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-gray-100 text-gray-600 font-semibold hover:bg-gray-200 transition-all"
        >
          ← Back
        </button>
      </div>
    </div>
  );
}
