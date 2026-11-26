"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { signOutCognito } from "@/lib/cognito";
import { LogOut, User, ChevronDown, Globe } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  MOTION_SPRING,
  MOTION_TRANSITION,
  resolveMotionTransition,
} from "@/lib/motion-tokens";

interface UserMenuProps {
  name: string;
  email?: string;
  direction?: "up" | "down";
  variant?: "button" | "full-card";
}

const UserMenu = ({
  name,
  email,
  direction = "down",
  variant = "button",
}: UserMenuProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const { language, setLanguage, t } = useLanguage();
  const prefersReducedMotion = useReducedMotion();

  // Cierra el menú al hacer clic fuera o presionar Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOutCognito();
      await fetch("/api/auth/session", { method: "DELETE" });
      router.push("/sign-in");
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    } finally {
      setLoading(false);
    }
  };

  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");

  const popoverTransition = resolveMotionTransition(
    prefersReducedMotion,
    MOTION_TRANSITION.smooth
  );
  const segmentSpring = resolveMotionTransition(
    prefersReducedMotion,
    MOTION_SPRING.snappy
  );

  return (
    <div className="relative w-full" ref={menuRef}>
      {variant === "full-card" ? (
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          aria-haspopup="menu"
          className="relative flex items-center justify-between w-full px-3 py-2.5 rounded-[18px] bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.14] transition-all group text-left cursor-pointer select-none backdrop-blur-xl"
          aria-label="Menú de usuario"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.14] to-transparent"
          />
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-9 h-9 rounded-[11px] bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 ring-1 ring-inset ring-white/25 flex items-center justify-center text-white text-xs font-semibold shrink-0 shadow-[0_8px_20px_-8px_rgba(99,102,241,0.7)] overflow-hidden">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-1 top-0.5 h-3 rounded-full bg-gradient-to-b from-white/25 to-transparent"
              />
              {initials || <User className="h-4 w-4" />}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[13px] font-medium tracking-[-0.015em] text-zinc-100 group-hover:text-white truncate">
                {name}
              </span>
              {email && (
                <span className="text-[11px] text-zinc-500 group-hover:text-zinc-400 transition-colors truncate">
                  {email}
                </span>
              )}
            </div>
          </div>
          <ChevronDown
            className={`h-3.5 w-3.5 text-zinc-500 group-hover:text-zinc-200 transition-transform duration-200 shrink-0 ml-1.5 ${
              open
                ? direction === "up"
                  ? "rotate-0"
                  : "rotate-180"
                : direction === "up"
                ? "rotate-180"
                : ""
            }`}
          />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          aria-haspopup="menu"
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.09] bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/[0.15] transition-all group cursor-pointer backdrop-blur-xl"
          aria-label="Menú de usuario"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 ring-1 ring-inset ring-white/25 flex items-center justify-center text-white text-xs font-semibold shrink-0">
            {initials || <User className="h-4 w-4" />}
          </div>
          <span className="text-xs text-zinc-200 font-medium max-sm:hidden max-w-[120px] truncate">
            {name}
          </span>
          <ChevronDown
            className={`h-3.5 w-3.5 text-zinc-400 transition-transform duration-200 max-sm:hidden ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>
      )}

      {/* Animated Apple Minimal Frosted Popover */}
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: direction === "up" ? 8 : -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: direction === "up" ? 6 : -6, scale: 0.97 }}
            transition={popoverTransition}
            className={`absolute ${
              direction === "up"
                ? "bottom-full mb-2.5 left-0 right-0"
                : "top-full mt-2 right-0 w-64"
            } rounded-[20px] border border-white/[0.10] bg-[#0c0f19]/95 shadow-[0_24px_64px_-20px_rgba(0,0,0,0.95)] backdrop-blur-2xl overflow-hidden z-50`}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.20] to-transparent"
            />

            {/* Header Info */}
            <div className="px-3.5 py-3 border-b border-white/[0.06] flex items-center gap-3">
              <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-indigo-500 to-violet-600 ring-1 ring-inset ring-white/20 flex items-center justify-center text-white text-[11px] font-semibold shrink-0">
                {initials || <User className="h-3.5 w-3.5" />}
              </div>
              <div className="flex flex-col min-w-0">
                <p className="text-xs font-semibold tracking-[-0.01em] text-white truncate">
                  {name}
                </p>
                {email && (
                  <p className="text-[11px] text-zinc-400 truncate">{email}</p>
                )}
              </div>
            </div>

            {/* Options */}
            <div className="p-2 flex flex-col gap-1.5">
              {/* Segmented Language Switcher */}
              <div className="flex items-center justify-between px-2.5 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <span className="text-xs font-medium text-zinc-300 flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{t("menu_language") || "Idioma"}</span>
                </span>
                <div className="relative flex items-center bg-black/45 rounded-full p-0.5 border border-white/[0.08]">
                  {(["es", "en"] as const).map((langOption) => {
                    const isSelected = language === langOption;
                    return (
                      <button
                        key={langOption}
                        type="button"
                        onClick={() => setLanguage(langOption)}
                        className={`relative px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide transition-colors cursor-pointer ${
                          isSelected
                            ? "text-white"
                            : "text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        {isSelected && (
                          <motion.span
                            layoutId="user-menu-lang-pill"
                            transition={segmentSpring}
                            className="absolute inset-0 rounded-full bg-indigo-500/85 ring-1 ring-inset ring-white/20"
                          />
                        )}
                        <span className="relative z-10">
                          {langOption.toUpperCase()}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Logout */}
              <button
                type="button"
                onClick={handleLogout}
                disabled={loading}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs text-zinc-300 hover:bg-rose-500/12 hover:text-rose-300 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed text-left cursor-pointer"
              >
                <div className="w-6 h-6 rounded-lg bg-white/[0.04] border border-white/[0.06] group-hover:bg-rose-500/20 group-hover:border-rose-400/25 flex items-center justify-center transition-colors shrink-0">
                  <LogOut className="h-3.5 w-3.5 text-zinc-400 group-hover:text-rose-300 transition-colors" />
                </div>
                <span className="font-medium">
                  {loading
                    ? t("menu_signingout") || "Cerrando sesión…"
                    : t("menu_signout") || "Cerrar sesión"}
                </span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserMenu;
