"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="grid h-dvh place-items-center bg-zinc-50 p-8 text-center">
      <div className="max-w-md space-y-3">
        <h1 className="text-base font-semibold">Something went wrong</h1>
        <p className="text-sm text-zinc-600">{error.message}</p>
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
