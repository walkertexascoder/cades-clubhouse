import ArchiveList from "@/components/ArchiveList";

export default function ArchivePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-300 via-sky-100 to-green-200 px-6 py-12">
      <h1 className="mb-8 text-center text-5xl font-extrabold text-purple-700 drop-shadow-lg sm:text-6xl">
        Fact Archive
      </h1>
      <ArchiveList />
    </div>
  );
}
