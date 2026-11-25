/*
 * From Uiverse.io by vinodjangid07 - https://uiverse.io/vinodjangid07/smart-emu-83
 * MIT License, Copyright (c) vinodjangid07 (Vinod Jangid)
 */

"use client";

import React from "react";
import styles from "./DeleteInterviewButton.module.css";

interface DeleteInterviewButtonProps {
  onClick: () => void;
  disabled?: boolean;
  /** Visible pill label revealed on hover/focus. */
  label?: string;
  /** Accessible name announced by screen readers. */
  ariaLabel?: string;
  title?: string;
}

export default function DeleteInterviewButton({
  onClick,
  disabled = false,
  label = "Eliminar",
  ariaLabel = "Eliminar entrevista",
  title = "Eliminar entrevista",
}: DeleteInterviewButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      title={title}
      data-label={label}
      className={styles.deleteButton}
    >
      <svg
        viewBox="0 0 448 512"
        className={styles.svgIcon}
        aria-hidden="true"
        focusable="false"
      >
        <path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z" />
      </svg>
    </button>
  );
}
