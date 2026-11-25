import React from "react";
import AiLoader from "@/components/AiLoader";

export default function Loading() {
  return (
    <div className="min-h-[65vh] w-full flex items-center justify-center p-6">
      <AiLoader
        size={0.95}
        label="Cargando espacio de trabajo..."
        sublabel="Preparando tus datos y módulos de DevCareer AI"
      />
    </div>
  );
}
