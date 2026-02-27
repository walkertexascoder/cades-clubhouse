import Link from "next/link";

interface FactsViewProps {
  fact: string;
  starWars: string;
  imageUrl: string | null;
  date?: string;
  onTripleClick: () => void;
  onBack: () => void;
}

export default function FactsView({
  fact,
  starWars,
  imageUrl,
  date,
  onTripleClick,
  onBack,
}: FactsViewProps) {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-6 py-12 cursor-pointer"
      onClick={onTripleClick}
    >
      <h2 className="mb-6 text-center text-5xl font-extrabold text-yellow-500 drop-shadow-lg">
        Did You Know?
      </h2>

      {date && (
        <p className="mb-4 text-sm font-semibold text-purple-500">{date}</p>
      )}

      <div className="max-w-lg rounded-3xl bg-white/80 p-8 shadow-2xl backdrop-blur">
        <p className="mb-4 text-xl leading-relaxed text-gray-800">{fact}</p>
        <p className="text-lg font-semibold italic text-indigo-600">
          {starWars}
        </p>
      </div>

      <div className="mt-8 h-72 w-72 overflow-hidden rounded-3xl shadow-2xl">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="AI illustration of the George Washington fact"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-purple-100">
            <span className="animate-pulse text-5xl" aria-hidden="true">
              🎨
            </span>
          </div>
        )}
      </div>

      <div className="mt-6 flex gap-3">
        <Link
          href="/archive"
          className="px-4 py-2 rounded-xl bg-purple-100 text-purple-700 font-semibold hover:bg-purple-200 transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          See past facts
        </Link>
        <button
          onClick={(e) => { e.stopPropagation(); onBack(); }}
          className="px-4 py-2 rounded-xl bg-gray-100 text-gray-600 font-semibold hover:bg-gray-200 transition-all"
        >
          ← Back
        </button>
      </div>
    </div>
  );
}
