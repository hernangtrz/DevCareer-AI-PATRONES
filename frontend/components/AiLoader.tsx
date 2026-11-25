/*
 * From Uiverse.io by andrew-manzyk - https://uiverse.io/andrew-manzyk/young-walrus-64
 * MIT License, Copyright (c) andrew-manzyk (Andrew Manzyk)
 */

"use client";

import React, { useId } from "react";
import styles from "./AiLoader.module.css";

interface AiLoaderProps {
  /** Scale multiplier applied to the 100x100px orb (default: 1). */
  size?: number;
  /** Optional visible title shown below the loader. */
  label?: string;
  /** Optional supporting caption shown below the label. */
  sublabel?: string;
  className?: string;
}

export default function AiLoader({
  size = 1,
  label,
  sublabel,
  className = "",
}: AiLoaderProps) {
  const rawId = useId();
  const maskId = `ai-loader-clipping-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const sizeStyle = { "--size": size } as React.CSSProperties;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`${styles.container} ${className}`.trim()}
    >
      <div className={styles.stage} style={sizeStyle} aria-hidden="true">
        <div className={styles.loader}>
          <svg
            width="100"
            height="100"
            viewBox="0 0 100 100"
            className={styles.svg}
          >
            <defs>
              <mask id={maskId} className={styles.clipping}>
                <polygon points="0,0 100,0 100,100 0,100" fill="black" />
                <polygon points="25,25 75,25 50,75" fill="white" />
                <polygon points="50,25 75,75 25,75" fill="white" />
                <polygon points="35,35 65,35 50,65" fill="white" />
                <polygon points="35,35 65,35 50,65" fill="white" />
                <polygon points="35,35 65,35 50,65" fill="white" />
                <polygon points="35,35 65,35 50,65" fill="white" />
              </mask>
            </defs>
          </svg>
          <div
            className={styles.box}
            style={{
              mask: `url(#${maskId})`,
              WebkitMask: `url(#${maskId})`,
            }}
          />
        </div>
      </div>

      {label ? (
        <div className="flex flex-col items-center gap-1.5 text-center">
          <p className="text-sm sm:text-base font-semibold text-white">
            {label}
          </p>
          {sublabel && (
            <p className="text-xs text-zinc-400 max-w-sm leading-relaxed">
              {sublabel}
            </p>
          )}
        </div>
      ) : (
        <span className="sr-only">Cargando...</span>
      )}
    </div>
  );
}
