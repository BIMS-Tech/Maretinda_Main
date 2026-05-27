import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6" style={{ background: "#2A1B3E" }}>
      <div className="text-8xl mb-6">404</div>
      <h1 className="text-white text-4xl font-bold mb-4">Page Not Found</h1>
      <p className="text-white/60 text-lg mb-8">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link
        href="/"
        className="font-bold px-8 py-3.5 rounded-full text-[#2A1B3E]"
        style={{ background: "linear-gradient(135deg,#FFC533,#F2B230)" }}
      >
        Back to Home
      </Link>
    </div>
  );
}
