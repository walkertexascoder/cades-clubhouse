import Image from "next/image";

interface ClubhouseViewProps {
  onTripleClick: () => void;
  onTitleTripleClick?: () => void;
}

export default function ClubhouseView({ onTripleClick, onTitleTripleClick }: ClubhouseViewProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <h1
        className="mb-8 text-center text-6xl font-extrabold tracking-tight text-purple-700 drop-shadow-lg sm:text-7xl md:text-8xl"
        onClick={onTitleTripleClick}
      >
        Cade&apos;s Clubhouse
      </h1>
      <Image
        src="/clubhouse.png"
        alt="A castle-treehouse growing out of the world"
        width={600}
        height={600}
        priority
        className="rounded-3xl shadow-2xl cursor-pointer"
        onClick={onTripleClick}
      />
    </div>
  );
}
