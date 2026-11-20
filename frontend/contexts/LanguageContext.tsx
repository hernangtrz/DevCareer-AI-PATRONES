"use client";

import React, { createContext, useContext, useState } from "react";
import { translations } from "@/lib/translations";

/**
 * Filtro global de diagnóstico WASM/TFLite para evitar que logs informativos
 * de WebAssembly dirigidos a stderr disparen falsos errores en Next.js Dev Overlay.
 */
if (typeof window !== "undefined" && !(window as unknown as { __wasm_diag_filtered__?: boolean }).__wasm_diag_filtered__) {
  (window as unknown as { __wasm_diag_filtered__?: boolean }).__wasm_diag_filtered__ = true;
  const isHarmlessWasm = (args: unknown[]): boolean => {
    const text = args
      .map((a) => (typeof a === "string" ? a : a instanceof Error ? a.message : String(a ?? "")))
      .join(" ");
    return (
      text.includes("INFO:") ||
      text.includes("TensorFlow Lite") ||
      text.includes("XNNPACK delegate") ||
      text.includes("FaceBlendshapesGraph") ||
      text.includes("face_landmarker_graph") ||
      text.includes("OpenGL error checking") ||
      text.includes("gl_context") ||
      text.includes("vision_wasm_internal") ||
      /^[IWE]\d{4}\s/i.test(text.trim())
    );
  };

  const origError = console.error;
  console.error = function (...args: unknown[]) {
    if (isHarmlessWasm(args)) {
      console.info("[WASM Engine Info]", ...args);
      return;
    }
    origError.apply(console, args);
  };
}

type Language = "es" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations.es) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("app_language") as Language;
      if (stored === "es" || stored === "en") {
        return stored;
      }
    }
    return "es";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("app_language", lang);
    if (typeof window !== "undefined") {
      document.cookie = `app_language=${lang}; path=/; max-age=31536000; SameSite=Lax`;
      window.location.reload();
    }
  };

  const t = (key: keyof typeof translations.es): string => {
    const dict = translations[language] || translations.es;
    return dict[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
