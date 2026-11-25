"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import AiLoader from "@/components/AiLoader";

function getRouteLoadingText(targetPath: string): { label: string; sublabel: string } {
  if (targetPath.startsWith("/jobs")) {
    return {
      label: "Cargando Empleos & Match...",
      sublabel: "Preparando vacantes activas y puntajes de compatibilidad",
    };
  }
  if (targetPath.startsWith("/analytics")) {
    return {
      label: "Cargando Progreso & Analytics...",
      sublabel: "Recopilando radar de competencias e historial de desempeño",
    };
  }
  if (targetPath.startsWith("/profile")) {
    return {
      label: "Cargando Mi Perfil...",
      sublabel: "Obteniendo tu perfil profesional y habilidades registradas",
    };
  }
  if (targetPath.startsWith("/cv")) {
    return {
      label: "Cargando CV & ATS Hub...",
      sublabel: "Preparando constructor de currículum y analizador ATS",
    };
  }
  if (targetPath.startsWith("/code-challenge")) {
    return {
      label: "Cargando Retos & Patrones...",
      sublabel: "Inicializando entorno de algoritmos y patrones GoF/SOLID",
    };
  }
  if (targetPath.startsWith("/interview")) {
    return {
      label: "Preparando Entrevista con IA...",
      sublabel: "Configurando la sala de práctica y evaluación",
    };
  }
  if (targetPath.startsWith("/dashboard")) {
    return {
      label: "Cargando Panel de Entrevistas...",
      sublabel: "Actualizando tu historial y simulacros disponibles",
    };
  }
  return {
    label: "Cargando módulo...",
    sublabel: "Preparando tu espacio de trabajo en DevCareer AI",
  };
}

export default function RouteTransitionLoader() {
  const pathname = usePathname();
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const prevPathnameRef = useRef<string>(pathname);
  const startedAtRef = useRef<number>(0);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Dismiss loader only after pathname actually transitions to the new route
  useEffect(() => {
    if (pathname === prevPathnameRef.current) return;
    prevPathnameRef.current = pathname;

    const elapsed = Date.now() - startedAtRef.current;
    const minDwellMs = 320;
    const remaining = Math.max(0, minDwellMs - elapsed);

    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setNavigatingTo(null);
      if (safetyTimerRef.current) {
        clearTimeout(safetyTimerRef.current);
        safetyTimerRef.current = null;
      }
    }, remaining);

    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [pathname]);

  useEffect(() => {
    const handleDocumentClick = (ev: MouseEvent) => {
      if (
        ev.defaultPrevented ||
        ev.button !== 0 ||
        ev.metaKey ||
        ev.ctrlKey ||
        ev.shiftKey ||
        ev.altKey
      ) {
        return;
      }

      const target = ev.target as HTMLElement | null;
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }

      if (url.origin !== window.location.origin) return;
      if (url.pathname === pathname) return;
      // Ignore auth or external API links
      if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/sign-")) return;

      startedAtRef.current = Date.now();
      setNavigatingTo(url.pathname);

      if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = setTimeout(() => {
        setNavigatingTo(null);
      }, 10000);
    };

    document.addEventListener("click", handleDocumentClick, true);
    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
    };
  }, [pathname]);

  if (!navigatingTo) return null;

  const { label, sublabel } = getRouteLoadingText(navigatingTo);

  return (
    <div className="fixed inset-0 md:left-64 z-30 flex items-center justify-center bg-[#020408]/90 backdrop-blur-md p-6">
      <AiLoader size={0.95} label={label} sublabel={sublabel} />
    </div>
  );
}
