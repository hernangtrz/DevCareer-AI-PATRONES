"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Mic,
  FileText,
  Code2,
  Briefcase,
  BarChart3,
  Sparkles,
  Menu,
  X,
  User,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import UserMenu from "@/components/UserMenu";
import NewInterviewGlowButton from "@/components/NewInterviewGlowButton";
import {
  MOTION_SPRING,
  MOTION_TRANSITION,
  resolveMotionTransition,
} from "@/lib/motion-tokens";

interface AppSidebarProps {
  userName: string;
  userEmail?: string;
}

interface SidebarNavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  badge: string | null;
}

export default function AppSidebar({ userName, userEmail }: AppSidebarProps) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const pillSpring = resolveMotionTransition(
    prefersReducedMotion,
    MOTION_SPRING.snappy
  );
  const drawerTransition = resolveMotionTransition(
    prefersReducedMotion,
    MOTION_TRANSITION.smooth
  );

  const mainNavLinks: SidebarNavItem[] = [
    {
      href: "/dashboard",
      label: t("nav_interviews") || "Entrevistas de Voz",
      icon: <Mic className="w-[17px] h-[17px]" strokeWidth={1.85} />,
      active: pathname === "/dashboard" || pathname.startsWith("/interview"),
      badge: null,
    },
    {
      href: "/cv",
      label: t("nav_cv_hub") || "CV & ATS Hub",
      icon: <FileText className="w-[17px] h-[17px]" strokeWidth={1.85} />,
      active: pathname.startsWith("/cv"),
      badge: null,
    },
    {
      href: "/code-challenge",
      label: t("nav_code_arena") || "Retos & Patrones",
      icon: <Code2 className="w-[17px] h-[17px]" strokeWidth={1.85} />,
      active: pathname.startsWith("/code-challenge"),
      badge: "SOLID",
    },
  ];

  const placementNavLinks: SidebarNavItem[] = [
    {
      href: "/jobs",
      label: t("nav_jobs") || "Smart Job Portal",
      icon: <Briefcase className="w-[17px] h-[17px]" strokeWidth={1.85} />,
      active: pathname.startsWith("/jobs"),
      badge: "Match",
    },
    {
      href: "/analytics",
      label: t("nav_analytics") || "Progreso & Analytics",
      icon: <BarChart3 className="w-[17px] h-[17px]" strokeWidth={1.85} />,
      active: pathname.startsWith("/analytics"),
      badge: null,
    },
    {
      href: "/profile",
      label: t("nav_profile") || "Mi Perfil",
      icon: <User className="w-[17px] h-[17px]" strokeWidth={1.85} />,
      active: pathname.startsWith("/profile"),
      badge: null,
    },
  ];

  const renderNavSection = (
    title: string,
    links: SidebarNavItem[],
    pillGroupId: string
  ) => (
    <div className="flex flex-col gap-1.5">
      <span className="px-3 text-[10px] font-medium text-zinc-500 uppercase tracking-[0.09em]">
        {title}
      </span>
      <nav className="flex flex-col gap-0.5" aria-label={title}>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setMobileOpen(false)}
            aria-current={link.active ? "page" : undefined}
            className={`group relative flex items-center justify-between px-3 py-2.5 rounded-[14px] text-[13px] tracking-[-0.01em] transition-colors ${
              link.active
                ? "text-white font-medium"
                : "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.035] font-normal"
            }`}
          >
            {/* Animated Apple Minimal Active Glass Pill */}
            {link.active && (
              <motion.span
                layoutId={pillGroupId}
                transition={pillSpring}
                aria-hidden="true"
                className="absolute inset-0 rounded-[14px] bg-white/[0.075] border border-white/[0.11] shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_8px_22px_-12px_rgba(99,102,241,0.6)]"
              />
            )}

            {/* Subtle Left Specular Accent Bar */}
            {link.active && (
              <span
                aria-hidden="true"
                className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[2.5px] rounded-r-full bg-gradient-to-b from-indigo-300 via-indigo-400 to-violet-400 shadow-[0_0_10px_rgba(129,140,248,0.8)]"
              />
            )}

            <div className="relative z-10 flex items-center gap-3 min-w-0">
              <span
                className={`transition-colors shrink-0 ${
                  link.active
                    ? "text-indigo-300"
                    : "text-zinc-500 group-hover:text-zinc-200"
                }`}
              >
                {link.icon}
              </span>
              <span className="truncate">{link.label}</span>
            </div>

            {link.badge && (
              <span
                className={`relative z-10 px-2 py-0.5 rounded-full text-[9.5px] font-medium tracking-[0.02em] leading-none shrink-0 border transition-colors ${
                  link.active
                    ? "bg-indigo-500/20 text-indigo-200 border-indigo-400/30"
                    : "bg-white/[0.04] text-zinc-400 border-white/[0.07] group-hover:text-zinc-200 group-hover:border-white/[0.12]"
                }`}
              >
                {link.badge}
              </span>
            )}
          </Link>
        ))}
      </nav>
    </div>
  );

  const renderSidebarContent = (pillGroupId: string) => (
    <div className="relative flex flex-col justify-between h-full px-3.5 py-4 select-none overflow-visible">
      {/* Subtle top ambient indigo glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-36 rounded-full bg-indigo-500/[0.09] blur-[70px]"
      />

      {/* ── Top Branding, Primary CTA & Navigation ── */}
      <div className="relative z-10 flex flex-col gap-5">
        {/* Brand Identity */}
        <Link
          href="/dashboard"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 px-2 py-1.5 rounded-[16px] hover:bg-white/[0.04] transition-colors group"
        >
          <div className="relative flex items-center justify-center w-9 h-9 rounded-[11px] bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 ring-1 ring-inset ring-white/25 shadow-[0_10px_24px_-8px_rgba(99,102,241,0.75)] text-white shrink-0 overflow-hidden">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-1 top-0.5 h-3 rounded-full bg-gradient-to-b from-white/30 to-transparent"
            />
            <Sparkles className="w-[18px] h-[18px]" strokeWidth={2} />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-white tracking-[-0.02em] text-[14px] group-hover:text-indigo-100 transition-colors">
                DevCareer AI
              </span>
              <span className="px-1.5 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.11] text-indigo-200 text-[9px] font-semibold tracking-[0.08em] uppercase leading-none">
                PRO
              </span>
            </div>
            <span className="text-[11px] text-zinc-500 tracking-[-0.01em]">
              Career Prep Platform
            </span>
          </div>
        </Link>

        {/* Primary Action Button */}
        <NewInterviewGlowButton
          href="/interview"
          label="Nueva Entrevista"
          onClick={() => setMobileOpen(false)}
        />

        {/* Navigation Groups */}
        <div className="flex flex-col gap-5">
          {renderNavSection(
            "Preparación & Práctica",
            mainNavLinks,
            pillGroupId
          )}
          <div
            aria-hidden="true"
            className="mx-3 h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent"
          />
          {renderNavSection(
            "Empleabilidad & Métricas",
            placementNavLinks,
            pillGroupId
          )}
        </div>
      </div>

      {/* ── Bottom Section: Frosted User Profile Card ── */}
      <div className="relative z-10 pt-4 mt-4 border-t border-white/[0.06]">
        <UserMenu
          name={userName}
          email={userEmail}
          direction="up"
          variant="full-card"
        />
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop Permanent Dark Glass Sidebar ── */}
      <aside className="hidden md:flex flex-col w-64 h-screen fixed top-0 left-0 bg-gradient-to-b from-[#0a0c15]/96 via-[#070910]/97 to-[#05060b]/98 border-r border-white/[0.07] z-40 backdrop-blur-2xl no-print">
        {renderSidebarContent("sidebar-desktop-active-pill")}
      </aside>

      {/* ── Mobile Frosted Top Bar ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#070910]/85 border-b border-white/[0.07] px-4 flex items-center justify-between z-40 backdrop-blur-2xl no-print">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-[10px] bg-gradient-to-tr from-indigo-600 to-violet-500 ring-1 ring-inset ring-white/25 text-white shadow-md shadow-indigo-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-semibold tracking-[-0.02em] text-white text-sm">
            DevCareer AI
          </span>
        </Link>

        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
          className="p-2 rounded-full bg-white/[0.05] border border-white/[0.09] text-zinc-200 hover:bg-white/[0.10] hover:text-white transition cursor-pointer"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* ── Animated Mobile Drawer ── */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={drawerTransition}
              className="fixed inset-0 bg-black/70 backdrop-blur-md"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: -288 }}
              animate={{ x: 0 }}
              exit={{ x: -288 }}
              transition={drawerTransition}
              className="relative flex flex-col w-72 h-full bg-gradient-to-b from-[#0a0c15] via-[#070910] to-[#05060b] border-r border-white/[0.08] z-50 shadow-2xl"
            >
              {renderSidebarContent("sidebar-mobile-active-pill")}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
