"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Code2,
  Filter,
  Shuffle,
  ChevronLeft,
  Layers,
} from "lucide-react";
import {
  PROBLEMS,
  getAllProblems,
  DIFFICULTY_LABELS,
  type Difficulty,
  type Problem,
} from "@/lib/problems";
import { useRouter } from "next/navigation";
import CodeChallengeCard from "@/components/CodeChallengeCard";
import GlitterWarpBackdrop from "@/components/GlitterWarpBackdrop";
import CodeChallengeMidnightHeader from "@/components/CodeChallengeMidnightHeader";

export default function CodeChallengePage() {
  const router = useRouter();
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [problemsList, setProblemsList] = useState<Problem[]>(PROBLEMS);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        setProblemsList(getAllProblems());
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const allCategories = useMemo(() => {
    return Array.from(new Set(problemsList.flatMap((p) => p.category))).sort();
  }, [problemsList]);

  const filtered = useMemo(() => {
    return problemsList.filter((p) => {
      const matchDiff = difficultyFilter === "all" || p.difficulty === difficultyFilter;
      const matchCat = categoryFilter === "all" || p.category.includes(categoryFilter);
      return matchDiff && matchCat;
    });
  }, [problemsList, difficultyFilter, categoryFilter]);

  const handleRandom = () => {
    const random = filtered[Math.floor(Math.random() * filtered.length)];
    if (random) router.push(`/code-challenge/${random.id}`);
  };

  return (
    <div className="relative min-h-screen pb-16">
      <GlitterWarpBackdrop
        mode={categoryFilter === "Patrones de Diseño" ? "patterns" : "all"}
      />

      <div className="relative z-10 flex flex-col gap-8">
        <CodeChallengeMidnightHeader
          mode={categoryFilter === "Patrones de Diseño" ? "patterns" : "all"}
        >
        {/* Header */}
      <div className="flex flex-col gap-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-sm transition-colors w-fit font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          Volver al panel
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Code2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-white text-2xl font-bold tracking-tight">
                  Retos de Código y Patrones de Diseño
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 text-xs font-semibold">
                  Arena & SOLID
                </span>
              </div>
              <p className="text-zinc-400 text-sm mt-1">
                Practica algoritmos de entrevista y refactoriza código aplicando patrones GoF evaluados por IA.
              </p>
            </div>
          </div>

          <button
            onClick={handleRandom}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 hover:bg-cyan-500/20 transition-all text-sm font-semibold cursor-pointer"
          >
            <Shuffle className="w-4 h-4" />
            Problema aleatorio
          </button>
        </div>
      </div>

      {/* Quick Filter Tabs: All vs Design Patterns */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => {
            setCategoryFilter("all");
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            categoryFilter === "all"
              ? "bg-cyan-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)]"
              : "bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:text-white"
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>Todos los Retos ({PROBLEMS.length})</span>
        </button>

        <button
          onClick={() => {
            setCategoryFilter("Patrones de Diseño");
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            categoryFilter === "Patrones de Diseño"
              ? "bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]"
              : "bg-zinc-900/60 border border-zinc-800 text-indigo-400 hover:text-white"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>✨ Patrones de Diseño & Refactoring</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-zinc-400">
          <Filter className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Dificultad:</span>
        </div>

        {/* Dificultad */}
        <div className="flex items-center gap-1.5 bg-zinc-900/80 border border-zinc-800 rounded-xl p-1">
          {(["all", "easy", "medium", "hard"] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDifficultyFilter(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                difficultyFilter === d
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {d === "all" ? "Todas" : DIFFICULTY_LABELS[d]}
            </button>
          ))}
        </div>

        {/* Categoría dropdown */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 outline-none focus:border-zinc-700 transition-colors cursor-pointer"
        >
          <option value="all">Todas las categorías</option>
          {allCategories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <span className="text-zinc-500 text-xs ml-auto">
          Mostrando {filtered.length} reto{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>
        </CodeChallengeMidnightHeader>

      {/* Grid de problemas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((problem) => (
          <CodeChallengeCard key={problem.id} problem={problem} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Code2 className="w-10 h-10 text-zinc-600" />
          <p className="text-zinc-400 text-sm">
            No hay problemas con los filtros seleccionados.
          </p>
          <button
            onClick={() => {
              setDifficultyFilter("all");
              setCategoryFilter("all");
            }}
            className="text-cyan-400 text-sm hover:text-cyan-300 transition-colors cursor-pointer"
          >
            Limpiar filtros
          </button>
        </div>
      )}
      </div>
    </div>
  );
}
