"use client";

import React, { useEffect } from "react";
import ErrorFaceScreen from "@/components/ErrorFaceScreen";

export default function DashboardSectionError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[DevCareer Section Error]", error);
  }, [error]);

  return (
    <ErrorFaceScreen
      code="500"
      badge="DevCareer AI · Error de Módulo"
      title="No pudimos cargar esta sección"
      description="Hubo un problema al procesar los datos de esta pantalla. Intenta recargar o vuelve a tu panel de inicio."
      detail={error?.digest ? `Referencia: ${error.digest}` : undefined}
      onRetry={reset}
      backHref="/dashboard"
      backLabel="Volver al panel"
    />
  );
}
