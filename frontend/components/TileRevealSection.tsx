"use client";

import React, { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  Code2,
  FileCheck2,
  Mic,
  ShieldCheck,
  Sparkles,
  Trophy,
} from "lucide-react";

interface TileRevealSectionProps {
  userAuthenticated: boolean;
}

interface RevealTileConfig {
  id: string;
  positionClass: string;
  hideOnMobile?: boolean;
  /** Starting offset (px) before scroll flies the tile into its resting position */
  fromX: number;
  fromY: number;
  fromRotate: number;
  toRotate: number;
  /** Scroll progress window [enterStart, enterEnd] */
  enterRange: [number, number];
  /** Subtle exit drift on late scroll */
  exitX: number;
  exitY: number;
  accentBorder: string;
  accentGlow: string;
  content: React.ReactNode;
}

const REVEAL_TILES: RevealTileConfig[] = [
  {
    id: "voice-ai",
    positionClass: "top-[7%] left-[3%] sm:left-[6%] lg:left-[8%] w-40 sm:w-52 lg:w-56",
    fromX: -260,
    fromY: -180,
    fromRotate: -18,
    toRotate: -4,
    enterRange: [0.02, 0.44],
    exitX: -48,
    exitY: -36,
    accentBorder: "border-indigo-400/35",
    accentGlow: "from-indigo-500/25 via-indigo-950/80 to-[#0a0c16]",
    content: (
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-300">
            <Mic className="w-3 h-3" /> Voz en Vivo
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
        </div>
        <div className="relative h-20 sm:h-24 rounded-xl overflow-hidden bg-indigo-950/60 border border-white/10 flex items-center justify-center">
          <Image
            src="/ai-avatar_v3.png"
            alt="Entrevistador IA DevCareer"
            fill
            sizes="220px"
            className="object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#090b14]/90 via-transparent to-transparent" />
          <div className="absolute bottom-2 inset-x-2 flex items-end justify-center gap-1 h-5">
            {[45, 90, 65, 100, 75, 50, 85, 60].map((h, idx) => (
              <span
                key={idx}
                className="w-1 rounded-full bg-indigo-300/90"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
        <p className="text-[11px] font-semibold text-white leading-tight">
          LiveKit + Gemini Voice
        </p>
      </div>
    ),
  },
  {
    id: "ats-scanner",
    positionClass: "top-[6%] right-[3%] sm:right-[6%] lg:right-[9%] w-40 sm:w-52 lg:w-56",
    fromX: 260,
    fromY: -190,
    fromRotate: 16,
    toRotate: 4,
    enterRange: [0.06, 0.48],
    exitX: 52,
    exitY: -36,
    accentBorder: "border-fuchsia-400/35",
    accentGlow: "from-fuchsia-500/20 via-purple-950/75 to-[#0b0a14]",
    content: (
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-fuchsia-300">
            <FileCheck2 className="w-3 h-3" /> Escáner ATS
          </span>
          <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
            96%
          </span>
        </div>
        <div className="rounded-xl bg-black/35 border border-white/10 p-2.5 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[10px] text-zinc-300">
            <span>Keywords Match</span>
            <span className="font-mono text-fuchsia-300">18/19</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
            <div className="h-full w-[94%] rounded-full bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-emerald-400" />
          </div>
          <div className="flex flex-wrap gap-1 pt-0.5">
            {["React", "TypeScript", "SOLID"].map((kw) => (
              <span
                key={kw}
                className="px-1.5 py-0.5 rounded bg-fuchsia-500/15 border border-fuchsia-400/25 text-[9px] text-fuchsia-200 font-medium"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
        <p className="text-[11px] font-semibold text-white leading-tight">
          CV Optimizado por Plantilla
        </p>
      </div>
    ),
  },
  {
    id: "code-arena",
    positionClass: "top-[40%] left-[2%] lg:left-[4%] w-48 lg:w-52",
    hideOnMobile: true,
    fromX: -320,
    fromY: 20,
    fromRotate: -14,
    toRotate: -3,
    enterRange: [0.1, 0.52],
    exitX: -65,
    exitY: 12,
    accentBorder: "border-cyan-400/35",
    accentGlow: "from-cyan-500/20 via-slate-950/85 to-[#090d14]",
    content: (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-cyan-300">
            <Code2 className="w-3 h-3" /> Arena SOLID
          </span>
          <span className="text-[10px] font-mono text-cyan-300/80">O(n log n)</span>
        </div>
        <div className="rounded-xl bg-[#070b12] border border-cyan-500/20 p-2.5 font-mono text-[10px] leading-relaxed text-zinc-300">
          <div>
            <span className="text-violet-400">class</span>{" "}
            <span className="text-cyan-300">LRUCache</span> {"{"}
          </div>
          <div className="pl-2 text-zinc-400">get(key): O(1) ✓</div>
          <div className="pl-2 text-emerald-400">12/12 tests passed</div>
          <div>{"}"}</div>
        </div>
        <p className="text-[11px] font-semibold text-white leading-tight">
          Retos GoF &amp; Algoritmos
        </p>
      </div>
    ),
  },
  {
    id: "top-companies",
    positionClass: "top-[38%] right-[2%] lg:right-[4%] w-48 lg:w-52",
    hideOnMobile: true,
    fromX: 320,
    fromY: 30,
    fromRotate: 14,
    toRotate: 3,
    enterRange: [0.12, 0.54],
    exitX: 65,
    exitY: 14,
    accentBorder: "border-violet-400/35",
    accentGlow: "from-violet-500/20 via-indigo-950/80 to-[#0a0b16]",
    content: (
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-violet-300">
            <Briefcase className="w-3 h-3" /> Smart Match
          </span>
          <span className="text-[10px] font-mono text-emerald-300 font-bold">Top Fit</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { src: "/covers/amazon.png", alt: "Amazon" },
            { src: "/covers/spotify.png", alt: "Spotify" },
            { src: "/covers/adobe.png", alt: "Adobe" },
            { src: "/covers/tiktok.png", alt: "TikTok" },
          ].map((brand) => (
            <div
              key={brand.alt}
              className="relative aspect-square rounded-lg bg-white/10 border border-white/10 overflow-hidden p-1"
            >
              <Image
                src={brand.src}
                alt={brand.alt}
                fill
                sizes="44px"
                className="object-contain p-1"
              />
            </div>
          ))}
        </div>
        <p className="text-[11px] font-semibold text-white leading-tight">
          Simulaciones a Medida por Vacante
        </p>
      </div>
    ),
  },
  {
    id: "analytics-radar",
    positionClass: "bottom-[8%] left-[3%] sm:left-[7%] lg:left-[11%] w-40 sm:w-52 lg:w-56",
    fromX: -240,
    fromY: 200,
    fromRotate: 15,
    toRotate: 3,
    enterRange: [0.14, 0.56],
    exitX: -46,
    exitY: 42,
    accentBorder: "border-emerald-400/30",
    accentGlow: "from-emerald-500/18 via-zinc-900/90 to-[#090c14]",
    content: (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
            <BarChart3 className="w-3 h-3" /> Progreso IA
          </span>
          <span className="text-[10px] font-mono text-emerald-300">+24 pts</span>
        </div>
        <div className="h-14 rounded-xl bg-black/35 border border-white/10 px-2.5 py-2 flex items-end gap-1.5">
          {[38, 48, 44, 62, 74, 82, 92].map((val, idx) => (
            <div
              key={idx}
              className="flex-1 rounded-t bg-gradient-to-t from-indigo-500 via-violet-400 to-emerald-300"
              style={{ height: `${val}%` }}
            />
          ))}
        </div>
        <p className="text-[11px] font-semibold text-white leading-tight">
          Radar &amp; Curva de Evolución
        </p>
      </div>
    ),
  },
  {
    id: "robot-coach",
    positionClass: "bottom-[7%] right-[3%] sm:right-[7%] lg:right-[11%] w-40 sm:w-52 lg:w-56",
    fromX: 240,
    fromY: 210,
    fromRotate: -16,
    toRotate: -3,
    enterRange: [0.16, 0.58],
    exitX: 48,
    exitY: 44,
    accentBorder: "border-amber-400/30",
    accentGlow: "from-indigo-500/20 via-violet-950/75 to-[#0b0a14]",
    content: (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
            <Trophy className="w-3 h-3" /> Feedback 360°
          </span>
          <span className="text-[10px] font-mono text-indigo-200">CEFR C1</span>
        </div>
        <div className="flex items-center gap-2.5 rounded-xl bg-black/35 border border-white/10 p-2">
          <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-indigo-500/20 shrink-0">
            <Image
              src="/Robotv3.png"
              alt="Coach IA DevCareer"
              fill
              sizes="44px"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[10px] font-bold text-white truncate">
              Evaluación Facial &amp; Voz
            </span>
            <span className="text-[9px] text-zinc-400 leading-tight">
              Claridad, confianza y rigor técnico
            </span>
          </div>
        </div>
      </div>
    ),
  },
];

function FlyingTile({
  tile,
  progress,
}: {
  tile: RevealTileConfig;
  progress: MotionValue<number>;
}) {
  const [start, end] = tile.enterRange;

  const x = useTransform(
    progress,
    [0, start, end, 0.8, 1],
    [tile.fromX, tile.fromX, 0, 0, tile.exitX]
  );
  const y = useTransform(
    progress,
    [0, start, end, 0.8, 1],
    [tile.fromY, tile.fromY, 0, 0, tile.exitY]
  );
  const rotate = useTransform(
    progress,
    [start, end, 1],
    [tile.fromRotate, tile.toRotate, tile.toRotate * 1.4]
  );
  const scale = useTransform(progress, [start, end, 0.82, 1], [0.58, 1, 1, 1.05]);
  const opacity = useTransform(progress, [start, start + 0.14, 0.88, 1], [0, 1, 1, 0.65]);

  return (
    <motion.div
      style={{ x, y, rotate, scale, opacity }}
      className={`pointer-events-none absolute ${tile.positionClass} ${
        tile.hideOnMobile ? "hidden md:block" : "block"
      } rounded-2xl border ${tile.accentBorder} bg-gradient-to-br ${tile.accentGlow} p-3 sm:p-3.5 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.85)] backdrop-blur-xl will-change-transform`}
    >
      {tile.content}
    </motion.div>
  );
}

export default function TileRevealSection({
  userAuthenticated,
}: TileRevealSectionProps) {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 115,
    damping: 26,
    mass: 0.35,
  });

  const headlineOpacity = useTransform(smoothProgress, [0.22, 0.48, 0.88, 1], [0, 1, 1, 0.72]);
  const headlineY = useTransform(smoothProgress, [0.22, 0.5], [42, 0]);
  const headlineScale = useTransform(smoothProgress, [0.22, 0.52], [0.92, 1]);
  const glowScale = useTransform(smoothProgress, [0.1, 0.55, 1], [0.7, 1.15, 0.95]);
  const glowOpacity = useTransform(smoothProgress, [0.05, 0.45, 0.95], [0.2, 0.85, 0.35]);

  if (prefersReducedMotion) {
    return (
      <section className="relative py-24 px-6 md:px-12 border-y border-white/[0.06] bg-[#04050a]">
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-12">
          <div className="text-center max-w-2xl">
            <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/12 border border-indigo-400/25 text-indigo-300 text-xs font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
              Ecosistema DevCareer AI · 360°
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              Entrena, optimiza y{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-violet-300 to-fuchsia-400">
                consigue tu próximo rol tech
              </span>
            </h2>
            <p className="text-white/55 text-sm sm:text-base mt-4 leading-relaxed">
              Entrevistas por voz en tiempo real, escáner ATS de CV, arena de código SOLID y Smart Job Portal integrados en una sola experiencia.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
            {REVEAL_TILES.map((tile) => (
              <div
                key={tile.id}
                className={`rounded-2xl border ${tile.accentBorder} bg-gradient-to-br ${tile.accentGlow} p-4 shadow-xl`}
              >
                {tile.content}
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      aria-label="Experiencia interactiva DevCareer AI"
      className="relative h-[220vh] w-full border-y border-white/[0.06] bg-[#04050a]"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center px-4 sm:px-8">
        {/* Ambient radial depth behind the converging tiles */}
        <motion.div
          aria-hidden="true"
          style={{ scale: glowScale, opacity: glowOpacity }}
          className="pointer-events-none absolute w-[680px] h-[680px] rounded-full"
        >
          <div
            className="w-full h-full rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(99, 102, 241, 0.22) 0%, rgba(168, 85, 247, 0.12) 42%, rgba(217, 70, 239, 0) 72%)",
            }}
          />
        </motion.div>

        {/* Subtle grid horizon */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(148, 163, 184, 0.16) 1px, transparent 1px), linear-gradient(to bottom, rgba(148, 163, 184, 0.16) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse 68% 62% at 50% 50%, #000 35%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 68% 62% at 50% 50%, #000 35%, transparent 100%)",
          }}
        />

        {/* Scroll-driven flying tiles framing the headline */}
        <div className="absolute inset-0 max-w-7xl mx-auto">
          {REVEAL_TILES.map((tile) => (
            <FlyingTile key={tile.id} tile={tile} progress={smoothProgress} />
          ))}
        </div>

        {/* Center revealed headline */}
        <motion.div
          style={{
            opacity: headlineOpacity,
            y: headlineY,
            scale: headlineScale,
          }}
          className="relative z-20 max-w-xl sm:max-w-2xl mx-auto text-center px-6 py-7 rounded-3xl bg-[#04050a]/72 backdrop-blur-md border border-white/[0.08] shadow-[0_24px_80px_-20px_rgba(0,0,0,0.9)]"
        >
          <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-400/30 text-indigo-300 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
            <span>Ecosistema DevCareer AI · 360°</span>
          </span>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-[1.1]">
            Entrena, optimiza y{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-violet-300 to-fuchsia-400">
              consigue tu próximo rol tech
            </span>
          </h2>

          <p className="text-zinc-300/80 text-xs sm:text-sm md:text-base mt-4 leading-relaxed max-w-lg mx-auto">
            Entrevistas de voz en vivo con IA, currículums blindados para filtros ATS, retos de código SOLID y analíticas interactivas trabajando juntos.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={userAuthenticated ? "/dashboard" : "/sign-up"}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs sm:text-sm font-bold shadow-[0_0_28px_rgba(99,102,241,0.45)] transition"
            >
              <span>{userAuthenticated ? "Ir a mi Panel" : "Comenzar gratis ahora"}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-300/90 font-medium px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              ATS + Voz + Código
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
