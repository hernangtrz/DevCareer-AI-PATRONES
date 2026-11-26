"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./GlidingFooter.module.css";

interface GlidingFooterProps {
  userAuthenticated: boolean;
}

export default function GlidingFooter({ userAuthenticated }: GlidingFooterProps) {
  const links = [
    { id: "features", label: "Módulos", href: "#features" },
    { id: "how-it-works", label: "Cómo funciona", href: "#how-it-works" },
    { id: "testimonials", label: "Testimonios", href: "#testimonials" },
    ...(userAuthenticated
      ? [{ id: "dashboard", label: "Mi Panel", href: "/dashboard" }]
      : [
          { id: "sign-in", label: "Iniciar sesión", href: "/sign-in" },
          { id: "sign-up", label: "Crear cuenta", href: "/sign-up" },
        ]),
  ];

  const [activeId, setActiveId] = useState<string>(links[0].id);
  const [indicatorVisible, setIndicatorVisible] = useState<boolean>(false);

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <Image src="/logo.svg" alt="DevCareer AI" width={28} height={28} />
          <span className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-violet-300">
            DevCareer AI
          </span>
        </Link>

        {/* Single-row navigation with gliding underline */}
        <nav
          aria-label="Navegación del pie de página"
          onMouseLeave={() => setIndicatorVisible(false)}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
              setIndicatorVisible(false);
            }
          }}
        >
          <ul
            className={`${styles.navList}${
              indicatorVisible ? ` ${styles.navListVisible}` : ""
            }`}
          >
            {links.map((item) => {
              const isActive = activeId === item.id;
              return (
                <li
                  key={item.id}
                  className={`${styles.navItem}${
                    isActive ? ` ${styles.navItemActive}` : ""
                  }`}
                  onMouseEnter={() => {
                    setActiveId(item.id);
                    setIndicatorVisible(true);
                  }}
                >
                  {item.href.startsWith("#") ? (
                    <a
                      href={item.href}
                      className={styles.navLink}
                      onFocus={() => {
                        setActiveId(item.id);
                        setIndicatorVisible(true);
                      }}
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      href={item.href}
                      className={styles.navLink}
                      onFocus={() => {
                        setActiveId(item.id);
                        setIndicatorVisible(true);
                      }}
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Copyright */}
        <p className="text-white/35 text-xs sm:text-sm shrink-0">
          © {new Date().getFullYear()} DevCareer AI. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
