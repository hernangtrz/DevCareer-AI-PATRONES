/*
 * From Uiverse.io by andrew-demchenk0 - https://uiverse.io/andrew-demchenk0/soft-baboon-41
 * MIT License, Copyright (c) andrew-demchenk0, andrew-demchenk0 (A), andrew-demchenk0 (A)
 */

import React from "react";
import Link from "next/link";
import styles from "./RetakeInterviewButton.module.css";

interface RetakeInterviewButtonProps {
  href: string;
  label: string;
}

export default function RetakeInterviewButton({
  href,
  label,
}: RetakeInterviewButtonProps) {
  return (
    <Link href={href} className={styles.retakeButton} aria-label={label}>
      <span className={styles.retakeIcon} aria-hidden="true">
        <svg
          className={styles.retakeSvg}
          height="48"
          viewBox="0 0 48 48"
          width="48"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M35.3 12.7c-2.89-2.9-6.88-4.7-11.3-4.7-8.84 0-15.98 7.16-15.98 16s7.14 16 15.98 16c7.45 0 13.69-5.1 15.46-12h-4.16c-1.65 4.66-6.07 8-11.3 8-6.63 0-12-5.37-12-12s5.37-12 12-12c3.31 0 6.28 1.38 8.45 3.55l-6.45 6.45h14v-14l-4.7 4.7z" />
          <path d="M0 0h48v48h-48z" fill="none" />
        </svg>
      </span>
      <span className={styles.retakeTextWrap}>
        <span className={styles.retakeText}>{label}</span>
      </span>
    </Link>
  );
}
