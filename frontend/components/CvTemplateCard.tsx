/*
 * From Uiverse.io by Tiagoadag - https://uiverse.io/Tiagoadag/cuddly-catfish-6
 * MIT License, Copyright (c) Tiagoadag
 */
"use client";

import { cn } from "@/lib/utils";
import { CheckCircle } from "lucide-react";
import styles from "./CvTemplateCard.module.css";

interface CvTemplateCardProps {
  id: string;
  name: string;
  description: string;
  accentColor: string;
  isSelected: boolean;
  onSelect: (id: string) => void;
  preview: React.ReactNode;
}

const CvTemplateCard = ({
  id,
  name,
  description,
  accentColor,
  isSelected,
  onSelect,
  preview,
}: CvTemplateCardProps) => {
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      aria-pressed={isSelected}
      className={cn("group", styles.outerCard)}
    >
      <div
        className={cn(
          styles.innerCard,
          isSelected && styles.innerCardSelected
        )}
      >
        {/* Template visual preview */}
        <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden bg-white/5 flex items-stretch">
          {preview}
          {isSelected && (
            <div className="absolute inset-0 bg-indigo-500/10 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-indigo-400 drop-shadow-lg" />
            </div>
          )}
        </div>

        {/* Accent bar */}
        <div
          className="w-full h-1 rounded-full opacity-80"
          style={{ background: accentColor }}
        />

        <div className="flex flex-col gap-0.5">
          <span
            className={cn(
              "font-semibold text-sm",
              isSelected ? "text-indigo-300" : "text-white"
            )}
          >
            {name}
          </span>
          <span className="text-white/40 text-xs">{description}</span>
        </div>
      </div>
    </button>
  );
};

export default CvTemplateCard;
