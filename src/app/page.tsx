import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-sky-300 via-sky-100 to-green-200 px-6 py-12">
      <h1 className="mb-8 text-center text-6xl font-extrabold tracking-tight text-purple-700 drop-shadow-lg sm:text-7xl md:text-8xl">
        Cade&apos;s Clubhouse
      </h1>
      <Image
        src="/clubhouse.png"
        alt="A castle-treehouse growing out of the world"
        width={600}
        height={600}
        priority
        className="rounded-3xl shadow-2xl"
      />
    </div>
  );
}
