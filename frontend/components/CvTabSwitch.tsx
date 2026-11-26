/*
 * From Uiverse.io by victoryamaykin - https://uiverse.io/victoryamaykin/funny-rabbit-33
 * MIT License, Copyright (c) victoryamaykin (Victor Yamaykin)
 */
"use client";

import React from "react";
import { AlignLeft, FileText, Search, Upload } from "lucide-react";
import styles from "./CvTabSwitch.module.css";

export type CvHubTab = "creator" | "analyzer";
export type AtsCvInputMode = "file" | "text";

interface CvTabSwitchProps {
  activeTab: CvHubTab;
  onChange: (tab: CvHubTab) => void;
}

export default function CvTabSwitch({ activeTab, onChange }: CvTabSwitchProps) {
  const isAnalyzer = activeTab === "analyzer";

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      onChange("creator");
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      onChange("analyzer");
    }
  };

  return (
    <div
      className={styles.switchRoot}
      role="tablist"
      aria-label="Secciones de CV y ATS"
      onKeyDown={handleKeyDown}
    >
      <input
        type="checkbox"
        checked={isAnalyzer}
        readOnly
        tabIndex={-1}
        aria-hidden="true"
        className={styles.stateInput}
      />

      <div className={styles.sliderTrack}>
        <div className={styles.sliderInner}>
          {/* Animated colored capsule slider */}
          <span aria-hidden="true" className={styles.activePill} />

          {/* Signature sliding white circular knob */}
          <span aria-hidden="true" className={styles.knobCarrier}>
            <span className={styles.knob} />
          </span>

          <button
            type="button"
            role="tab"
            aria-selected={!isAnalyzer}
            onClick={() => onChange("creator")}
            className={`${styles.tabButton} ${styles.tabLeft} ${
              !isAnalyzer ? styles.tabButtonActive : ""
            }`}
          >
            <span
              aria-hidden="true"
              className={`${styles.iconSlot} ${styles.iconSlotLeft} ${
                !isAnalyzer ? styles.iconCreatorActive : ""
              }`}
            >
              <FileText className={styles.icon} />
            </span>
            <span>Constructor &amp; Perfil</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={isAnalyzer}
            onClick={() => onChange("analyzer")}
            className={`${styles.tabButton} ${styles.tabRight} ${
              isAnalyzer ? styles.tabButtonActive : ""
            }`}
          >
            <span>Diagnóstico &amp; Escáner ATS</span>
            <span
              aria-hidden="true"
              className={`${styles.iconSlot} ${styles.iconSlotRight} ${
                isAnalyzer ? styles.iconAnalyzerActive : ""
              }`}
            >
              <Search className={styles.icon} />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

interface AtsInputModeSwitchProps {
  mode: AtsCvInputMode;
  onChange: (mode: AtsCvInputMode) => void;
}

export function AtsInputModeSwitch({ mode, onChange }: AtsInputModeSwitchProps) {
  const isText = mode === "text";

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      onChange("file");
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      onChange("text");
    }
  };

  return (
    <div
      className={`${styles.switchRoot} ${styles.atsRoot}`}
      role="tablist"
      aria-label="Modo de entrada del currículum"
      onKeyDown={handleKeyDown}
    >
      <input
        type="checkbox"
        checked={isText}
        readOnly
        tabIndex={-1}
        aria-hidden="true"
        className={styles.stateInput}
      />

      <div className={styles.sliderTrack}>
        <div className={styles.sliderInner}>
          <span aria-hidden="true" className={styles.activePill} />

          <span aria-hidden="true" className={styles.knobCarrier}>
            <span className={styles.knob} />
          </span>

          <button
            type="button"
            role="tab"
            aria-selected={!isText}
            onClick={() => onChange("file")}
            className={`${styles.tabButton} ${styles.tabLeft} ${
              !isText ? styles.tabButtonActive : ""
            }`}
          >
            <span
              aria-hidden="true"
              className={`${styles.iconSlot} ${styles.iconSlotLeft} ${
                !isText ? styles.iconAtsFileActive : ""
              }`}
            >
              <Upload className={styles.icon} />
            </span>
            <span>Subir PDF</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={isText}
            onClick={() => onChange("text")}
            className={`${styles.tabButton} ${styles.tabRight} ${
              isText ? styles.tabButtonActive : ""
            }`}
          >
            <span>Pegar texto</span>
            <span
              aria-hidden="true"
              className={`${styles.iconSlot} ${styles.iconSlotRight} ${
                isText ? styles.iconAtsTextActive : ""
              }`}
            >
              <AlignLeft className={styles.icon} />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
