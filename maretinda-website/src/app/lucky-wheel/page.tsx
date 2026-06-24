"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FiLock, FiMail, FiArrowRight, FiPlus, FiTrash2, FiList,
  FiRotateCw, FiX, FiAward, FiShuffle, FiUsers, FiEyeOff, FiEye,
} from "react-icons/fi";

/* ──────────────────────────────────────────────────────────────────
   Client-side gate. This is *light* protection only — anyone who reads
   the bundle can find these. It just keeps the page out of casual hands.
   ────────────────────────────────────────────────────────────────── */
const ACCESS_EMAIL = "host@maretinda.ph";
const ACCESS_PASSWORD = "Spin2026!";
const SESSION_KEY = "mt_wheel_auth";

/* Segment colours pulled from the Maretinda brand palette. */
const SEGMENT_COLORS = [
  "#432C63", "#FFC533", "#5C3E88", "#F2B230",
  "#6D3FA5", "#FFD45E", "#2A1B3E", "#9B80D2",
];
const textColorFor = (bg: string) =>
  ["#FFC533", "#F2B230", "#FFD45E", "#9B80D2"].includes(bg) ? "#2A1B3E" : "#FFFFFF";

const DEFAULT_NAMES = [
  "Maria", "Juan", "Andrea", "Jose", "Sofia", "Miguel",
];

/* The Maretinda 4-petal flower (same art as src/app/icon.svg, 32×32 space).
   Drawn as crisp vector so it never distorts or blurs at any wheel size.
   Path2D is created lazily inside the fn — it only exists in the browser. */
const PETAL_D = "M16,17 C12.5,14 11,7.5 16,5 C21,7.5 19.5,14 16,17Z";
function drawFlower(ctx: CanvasRenderingContext2D, cx: number, cy: number, reach: number, color: string) {
  const petal = new Path2D(PETAL_D);
  // `reach` = pixel distance from centre to a petal tip (≈11 units in the 32 space)
  const s = reach / 11;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.translate(-16, -16);
  ctx.fillStyle = color;
  for (const deg of [45, 135, 225, 315]) {
    ctx.save();
    ctx.translate(16, 16);
    ctx.rotate((deg * Math.PI) / 180);
    ctx.translate(-16, -16);
    ctx.fill(petal);
    ctx.restore();
  }
  ctx.restore();
}

/* ══════════════════════════════════════════════════════════════════ */
export default function LuckyWheelPage() {
  const [authed, setAuthed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_KEY) === "1") setAuthed(true);
    } catch {}
    setReady(true);
  }, []);

  const handleAuthed = () => {
    try { sessionStorage.setItem(SESSION_KEY, "1"); } catch {}
    setAuthed(true);
  };

  if (!ready) return <div className="min-h-screen bg-brand-purple-deep" />;
  return authed ? <Wheel onSignOut={() => { try { sessionStorage.removeItem(SESSION_KEY); } catch {}; setAuthed(false); }} /> : <Gate onSuccess={handleAuthed} />;
}

/* ══════════════════════════════════════════════════════════════════
   Login gate
   ══════════════════════════════════════════════════════════════════ */
function Gate({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim().toLowerCase() === ACCESS_EMAIL && password === ACCESS_PASSWORD) {
      setError("");
      onSuccess();
    } else {
      setError("Incorrect email or password. Please try again.");
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center px-5 overflow-hidden"
      style={{ background: "radial-gradient(circle at 30% 20%, #5C3E88 0%, #2A1B3E 55%, #1A1228 100%)" }}>
      {/* floating orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="float-orb absolute -top-10 -left-10 w-72 h-72 rounded-full blur-3xl" style={{ background: "rgba(155,128,210,.25)" }} />
        <div className="float-orb-rev absolute bottom-0 right-0 w-80 h-80 rounded-full blur-3xl" style={{ background: "rgba(255,197,51,.16)" }} />
      </div>

      <form
        onSubmit={submit}
        className={`relative w-full max-w-[400px] rounded-3xl p-8 sm:p-9 ${shake ? "animate-[shake_.4s]" : ""}`}
        style={{ background: "rgba(255,255,255,.06)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,.14)", boxShadow: "0 30px 80px rgba(0,0,0,.45)" }}
      >
        <div className="flex justify-center mb-6">
          <Image src="/Logo-maretinda-white.svg" alt="Maretinda" width={170} height={34} className="h-8 w-auto" priority />
        </div>

        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ background: "linear-gradient(135deg,#FFC533,#F2B230)", boxShadow: "0 8px 24px rgba(255,197,51,.4)" }}>
            <FiLock size={22} className="text-[#2A1B3E]" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">Lucky Wheel</h1>
          <p className="text-white/55 text-sm mt-1.5">Protected event tool — sign in to continue</p>
        </div>

        <label className="block mb-4">
          <span className="text-white/70 text-xs font-medium ml-1">Email</span>
          <div className="relative mt-1.5">
            <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" size={16} />
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus
              placeholder="you@maretinda.ph"
              className="w-full rounded-xl bg-white/5 border border-white/15 text-white placeholder:text-white/30 text-sm pl-10 pr-3.5 py-3 outline-none focus:border-brand-yellow focus:bg-white/10 transition"
            />
          </div>
        </label>

        <label className="block mb-2">
          <span className="text-white/70 text-xs font-medium ml-1">Password</span>
          <div className="relative mt-1.5">
            <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" size={16} />
            <input
              type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl bg-white/5 border border-white/15 text-white placeholder:text-white/30 text-sm pl-10 pr-10 py-3 outline-none focus:border-brand-yellow focus:bg-white/10 transition"
            />
            <button type="button" onClick={() => setShow((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition">
              {show ? <FiEyeOff size={16} /> : <FiEye size={16} />}
            </button>
          </div>
        </label>

        {error && <p className="text-[13px] text-[#FF9B9B] mt-3 ml-1">{error}</p>}

        <button type="submit"
          className="mt-6 w-full flex items-center justify-center gap-2 font-semibold text-[15px] py-3.5 rounded-xl text-[#2A1B3E] transition-all hover:-translate-y-0.5 hover:shadow-xl"
          style={{ background: "linear-gradient(135deg,#FFC533,#F2B230)", boxShadow: "0 6px 20px rgba(255,197,51,.35)" }}>
          Unlock Wheel <FiArrowRight size={16} />
        </button>
      </form>

      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}`}</style>
    </main>
  );
}

/* ══════════════════════════════════════════════════════════════════
   The wheel
   ══════════════════════════════════════════════════════════════════ */
type Confetti = { x: number; y: number; vx: number; vy: number; rot: number; vr: number; color: string; size: number; };

function Wheel({ onSignOut }: { onSignOut: () => void }) {
  const [names, setNames] = useState<string[]>(DEFAULT_NAMES);
  const [rotation, setRotation] = useState(0);          // current angle in radians
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [single, setSingle] = useState("");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotRef = useRef(0);
  const rafRef = useRef<number>(0);

  // confetti
  const confettiCanvas = useRef<HTMLCanvasElement>(null);
  const confettiRef = useRef<Confetti[]>([]);
  const confettiRaf = useRef<number>(0);

  const seg = names.length;
  const arc = seg > 0 ? (Math.PI * 2) / seg : 0;

  /* ── draw the wheel at a given rotation ── */
  const draw = useCallback((angle: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const size = canvas.clientWidth;
    if (canvas.width !== size * dpr) { canvas.width = size * dpr; canvas.height = size * dpr; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);

    const cx = size / 2, cy = size / 2;
    const r = size / 2 - 10;

    if (seg === 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,.06)";
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.5)";
      ctx.font = "600 16px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Add names to begin", cx, cy);
      return;
    }

    const segArc = (Math.PI * 2) / seg;

    for (let i = 0; i < seg; i++) {
      const start = angle + i * segArc;
      const end = start + segArc;
      const color = SEGMENT_COLORS[i % SEGMENT_COLORS.length];

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, end);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(255,255,255,.10)";
      ctx.stroke();

      // label
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(start + segArc / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = textColorFor(color);
      const fs = Math.max(12, Math.min(20, (segArc * r) / 2.4));
      ctx.font = `600 ${fs}px Inter, system-ui, sans-serif`;
      const label = names[i].length > 16 ? names[i].slice(0, 15) + "…" : names[i];
      ctx.fillText(label, r - 18, fs / 3);
      ctx.restore();
    }

    // outer ring
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.lineWidth = 8;
    ctx.strokeStyle = "#FFC533";
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255,197,51,.35)";
    ctx.stroke();

    // hub — white disc, soft shadow, gold ring, then the brand flower
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,.25)";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(cx, cy, 40, 0, Math.PI * 2);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    ctx.restore();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#FFC533";
    ctx.beginPath();
    ctx.arc(cx, cy, 40, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(67,44,99,.12)";
    ctx.beginPath();
    ctx.arc(cx, cy, 33, 0, Math.PI * 2);
    ctx.stroke();
    drawFlower(ctx, cx, cy, 24, "#432C63");
  }, [seg, names]);

  /* redraw on names change */
  useEffect(() => { draw(rotRef.current); }, [draw]);
  useEffect(() => {
    const onResize = () => draw(rotRef.current);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [draw]);

  /* ── spin ── */
  const spin = () => {
    if (spinning || seg === 0) return;
    setWinner(null);
    setSpinning(true);

    const segArc = (Math.PI * 2) / seg;
    const winIndex = Math.floor(Math.random() * seg);
    // pointer sits at top (-90° = -PI/2). We want centre of winning segment there.
    const target =
      (Math.PI * 2 * (4 + Math.floor(Math.random() * 3))) +       // 4–6 full turns
      (-Math.PI / 2 - (winIndex * segArc + segArc / 2));
    const startRot = rotRef.current;
    const delta = target - startRot;
    const duration = 4200 + Math.random() * 800;
    const startTime = performance.now();
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 4);

    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      const angle = startRot + delta * easeOut(t);
      rotRef.current = angle;
      draw(angle);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rotRef.current = target % (Math.PI * 2);
        setRotation(rotRef.current);
        setSpinning(false);
        setWinner(names[winIndex]);
        // remove the winner from the wheel so they can't be drawn again
        setNames((n) => n.filter((_, i) => i !== winIndex));
        fireConfetti();
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => () => { cancelAnimationFrame(rafRef.current); cancelAnimationFrame(confettiRaf.current); }, []);

  /* ── confetti ── */
  const fireConfetti = () => {
    const canvas = confettiCanvas.current;
    if (!canvas) return;
    const w = (canvas.width = canvas.clientWidth);
    const h = (canvas.height = canvas.clientHeight);
    const colors = ["#FFC533", "#9B80D2", "#5C3E88", "#F2B230", "#FFFFFF", "#6D3FA5"];
    confettiRef.current = Array.from({ length: 140 }, () => ({
      x: w / 2 + (Math.random() - 0.5) * 120,
      y: h / 2,
      vx: (Math.random() - 0.5) * 14,
      vy: Math.random() * -16 - 4,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.4,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 5 + Math.random() * 7,
    }));
    cancelAnimationFrame(confettiRaf.current);
    const ctx = canvas.getContext("2d")!;
    const run = () => {
      ctx.clearRect(0, 0, w, h);
      let alive = false;
      confettiRef.current.forEach((p) => {
        p.vy += 0.5; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.vx *= 0.99;
        if (p.y < h + 40) alive = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });
      if (alive) confettiRaf.current = requestAnimationFrame(run);
      else ctx.clearRect(0, 0, w, h);
    };
    run();
  };

  /* ── name management ── */
  const applyBulk = () => {
    const list = bulkText
      .split(/[\n,]/).map((s) => s.trim()).filter(Boolean);
    if (list.length) {
      setNames(list);
      setWinner(null);
      rotRef.current = 0; setRotation(0);
    }
  };
  const addSingle = () => {
    const v = single.trim();
    if (!v) return;
    setNames((n) => [...n, v]);
    setSingle("");
  };
  const removeName = (idx: number) => {
    setNames((n) => n.filter((_, i) => i !== idx));
    setWinner(null);
  };
  const shuffle = () => {
    setNames((n) => [...n].sort(() => Math.random() - 0.5));
    setWinner(null);
  };
  const clearAll = () => { setNames([]); setWinner(null); };

  const wheelSize = useMemo(() => "min(86vw, 520px)", []);

  return (
    <main className="relative min-h-screen overflow-hidden"
      style={{ background: "radial-gradient(circle at 25% 15%, #5C3E88 0%, #2A1B3E 50%, #160E22 100%)" }}>
      {/* ambient */}
      <div className="pointer-events-none absolute inset-0">
        <div className="float-orb absolute -top-20 -left-16 w-96 h-96 rounded-full blur-3xl" style={{ background: "rgba(155,128,210,.18)" }} />
        <div className="float-orb-rev absolute bottom-[-60px] right-[-40px] w-[26rem] h-[26rem] rounded-full blur-3xl" style={{ background: "rgba(255,197,51,.12)" }} />
        <div className="absolute inset-0 dot-grid opacity-[.04]" />
      </div>

      {/* confetti overlay */}
      <canvas ref={confettiCanvas} className="pointer-events-none fixed inset-0 w-full h-full z-[60]" />

      {/* header */}
      <header className="relative z-10 max-w-[1180px] mx-auto px-6 h-[72px] flex items-center justify-between">
        <Image src="/Logo-maretinda-white.svg" alt="Maretinda" width={160} height={32} className="h-7 w-auto" priority />
        <button onClick={onSignOut}
          className="text-white/60 hover:text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-white/10 transition flex items-center gap-2">
          <FiEyeOff size={15} /> Sign out
        </button>
      </header>

      <div className="relative z-10 max-w-[1180px] mx-auto px-6 pb-16 grid lg:grid-cols-[1fr_400px] gap-10 lg:gap-12 items-start">
        {/* ── Wheel column ── */}
        <section className="flex flex-col items-center pt-2">
          <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide uppercase text-brand-yellow/90 bg-brand-yellow/10 border border-brand-yellow/20 px-3.5 py-1.5 rounded-full mb-4">
            <FiAward size={13} /> Maretinda Lucky Wheel
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white text-center mb-1">
            Spin to pick a winner
          </h1>
          <p className="text-white/50 text-sm mb-7 flex items-center gap-1.5">
            <FiUsers size={14} /> {seg} {seg === 1 ? "name" : "names"} on the wheel
          </p>

          {/* wheel + pointer */}
          <div className="relative" style={{ width: wheelSize, height: wheelSize }}>
            {/* pointer */}
            <div className="absolute left-1/2 -translate-x-1/2 -top-1 z-20"
              style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,.4))" }}>
              <div style={{
                width: 0, height: 0,
                borderLeft: "16px solid transparent",
                borderRight: "16px solid transparent",
                borderTop: "28px solid #FFC533",
              }} />
            </div>
            <canvas ref={canvasRef} className="w-full h-full"
              style={{ filter: "drop-shadow(0 24px 60px rgba(0,0,0,.5))" }} />
          </div>

          <button onClick={spin} disabled={spinning || seg === 0}
            className="mt-9 group relative flex items-center gap-2.5 font-bold text-lg px-12 py-4 rounded-full text-[#2A1B3E] transition-all enabled:hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg,#FFC533,#F2B230)", boxShadow: "0 10px 30px rgba(255,197,51,.4)" }}>
            <FiRotateCw size={20} className={spinning ? "animate-spin" : "transition-transform group-hover:rotate-180 duration-500"} />
            {spinning ? "Spinning…" : winner ? "Spin Again" : "SPIN"}
          </button>
        </section>

        {/* ── Control column ── */}
        <aside className="w-full rounded-3xl p-6 sm:p-7"
          style={{ background: "rgba(255,255,255,.05)", backdropFilter: "blur(18px)", border: "1px solid rgba(255,255,255,.12)" }}>
          {/* toggle add-list form */}
          <button onClick={() => setShowForm((v) => !v)}
            className="w-full flex items-center justify-between text-white font-semibold text-[15px] mb-1 group">
            <span className="flex items-center gap-2.5"><FiList size={17} className="text-brand-yellow" /> Bulk add names</span>
            <span className={`grid place-items-center w-7 h-7 rounded-lg bg-white/8 transition-transform ${showForm ? "rotate-45" : ""}`}>
              <FiPlus size={16} className="text-white/70" />
            </span>
          </button>
          <p className="text-white/40 text-xs mb-3">Paste a list — one name per line or comma separated.</p>

          <div className={`grid transition-all duration-300 ${showForm ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
            <div className="overflow-hidden">
              <textarea
                value={bulkText} onChange={(e) => setBulkText(e.target.value)}
                rows={5} placeholder={"Maria\nJuan\nAndrea\n…"}
                className="w-full rounded-xl bg-white/5 border border-white/15 text-white placeholder:text-white/30 text-sm p-3.5 outline-none focus:border-brand-yellow resize-none transition"
              />
              <button onClick={applyBulk}
                className="mt-2.5 mb-5 w-full flex items-center justify-center gap-2 font-semibold text-sm py-3 rounded-xl text-[#2A1B3E] transition hover:-translate-y-0.5"
                style={{ background: "linear-gradient(135deg,#FFC533,#F2B230)" }}>
                Set wheel to this list <FiArrowRight size={15} />
              </button>
            </div>
          </div>

          {/* add single */}
          <div className="flex gap-2 mt-1">
            <input
              value={single} onChange={(e) => setSingle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSingle()}
              placeholder="Add a single name…"
              className="flex-1 rounded-xl bg-white/5 border border-white/15 text-white placeholder:text-white/30 text-sm px-3.5 py-2.5 outline-none focus:border-brand-yellow transition"
            />
            <button onClick={addSingle}
              className="grid place-items-center w-11 rounded-xl text-[#2A1B3E] transition hover:-translate-y-0.5"
              style={{ background: "linear-gradient(135deg,#FFC533,#F2B230)" }}>
              <FiPlus size={18} />
            </button>
          </div>

          {/* list */}
          <div className="flex items-center justify-between mt-6 mb-2.5">
            <span className="text-white/50 text-xs font-semibold uppercase tracking-wide">Entries ({seg})</span>
            <div className="flex gap-1">
              <button onClick={shuffle} disabled={seg < 2}
                className="text-white/55 hover:text-white text-xs flex items-center gap-1 px-2 py-1 rounded-md hover:bg-white/10 transition disabled:opacity-30">
                <FiShuffle size={12} /> Shuffle
              </button>
              <button onClick={clearAll} disabled={seg === 0}
                className="text-[#FF9B9B]/70 hover:text-[#FF9B9B] text-xs flex items-center gap-1 px-2 py-1 rounded-md hover:bg-white/10 transition disabled:opacity-30">
                <FiTrash2 size={12} /> Clear
              </button>
            </div>
          </div>

          <ul className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
            {names.length === 0 && (
              <li className="text-white/35 text-sm text-center py-6 border border-dashed border-white/15 rounded-xl">
                No names yet — add some above.
              </li>
            )}
            {names.map((n, i) => (
              <li key={`${n}-${i}`}
                className="group flex items-center gap-3 bg-white/5 hover:bg-white/10 rounded-xl px-3.5 py-2.5 transition">
                <span className="grid place-items-center w-6 h-6 rounded-md text-[11px] font-bold flex-shrink-0"
                  style={{ background: SEGMENT_COLORS[i % SEGMENT_COLORS.length], color: textColorFor(SEGMENT_COLORS[i % SEGMENT_COLORS.length]) }}>
                  {i + 1}
                </span>
                <span className="flex-1 text-white/90 text-sm truncate">{n}</span>
                <button onClick={() => removeName(i)}
                  className="text-white/30 hover:text-[#FF9B9B] opacity-0 group-hover:opacity-100 transition">
                  <FiTrash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      {/* winner modal */}
      {winner && !spinning && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-5"
          style={{ background: "rgba(22,14,34,.6)", backdropFilter: "blur(6px)" }}
          onClick={() => setWinner(null)}>
          <div onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[420px] rounded-3xl p-9 text-center animate-[pop_.35s_cubic-bezier(.2,1.3,.4,1)]"
            style={{ background: "linear-gradient(160deg,#fff,#FDF2FF)", boxShadow: "0 40px 100px rgba(0,0,0,.5)" }}>
            <button onClick={() => setWinner(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition">
              <FiX size={20} />
            </button>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
              style={{ background: "linear-gradient(135deg,#FFC533,#F2B230)", boxShadow: "0 10px 30px rgba(255,197,51,.5)" }}>
              <FiAward size={28} className="text-[#2A1B3E]" />
            </div>
            <p className="text-brand-purple/60 text-xs font-bold uppercase tracking-widest mb-1">We have a winner</p>
            <h2 className="font-display text-4xl font-bold gradient-text mb-2 break-words">{winner}</h2>
            <p className="text-gray-500 text-sm mb-6">Congratulations! 🎉</p>
            <div className="flex gap-3">
              <button onClick={() => setWinner(null)}
                className="flex-1 font-semibold text-sm py-3 rounded-xl border border-brand-purple/20 text-brand-purple hover:bg-brand-purple-pale transition">
                Close
              </button>
              <button onClick={() => { setWinner(null); setTimeout(spin, 150); }}
                className="flex-1 flex items-center justify-center gap-2 font-semibold text-sm py-3 rounded-xl text-[#2A1B3E] transition hover:-translate-y-0.5"
                style={{ background: "linear-gradient(135deg,#FFC533,#F2B230)" }}>
                <FiRotateCw size={15} /> Spin again
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes pop{0%{transform:scale(.8);opacity:0}100%{transform:scale(1);opacity:1}}`}</style>
    </main>
  );
}
