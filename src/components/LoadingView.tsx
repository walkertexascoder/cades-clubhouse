export default function LoadingView() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="animate-bounce text-7xl" aria-hidden="true">
        🔍
      </div>
      <p className="mt-6 animate-pulse text-2xl font-bold text-purple-700">
        Discovering a secret...
      </p>
    </div>
  );
}
