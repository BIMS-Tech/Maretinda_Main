"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6" style={{ background: "#2A1B3E" }}>
      <div className="text-8xl mb-6">500</div>
      <h1 className="text-white text-4xl font-bold mb-4">Something went wrong</h1>
      <p className="text-white/60 text-lg mb-8">An unexpected error occurred. Please try again.</p>
      <button
        onClick={reset}
        className="font-bold px-8 py-3.5 rounded-full text-[#2A1B3E]"
        style={{ background: "linear-gradient(135deg,#FFC533,#F2B230)" }}
      >
        Try Again
      </button>
    </div>
  );
}
