"use client";

import React, { useEffect } from "react";
import ErrorFaceScreen from "@/components/ErrorFaceScreen";

export default function RootErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[DevCareer Error Boundary]", error);
  }, [error]);

  return (
    <ErrorFaceScreen
      fullViewport
      code="500"
      badge="DevCareer AI · Error Inesperado"
      title="Ocurrió un error al cargar la aplicación"
      description="Detectamos una interrupción inesperada. Puedes volver a intentarlo o regresar al panel principal."
      detail={error?.digest ? `Referencia: ${error.digest}` : undefined}
      onRetry={reset}
      backHref="/dashboard"
      backLabel="Ir al panel principal"
    />
  );
}
