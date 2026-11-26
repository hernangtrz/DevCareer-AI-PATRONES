"use client";

import React, { useEffect } from "react";
import ErrorFaceScreen from "@/components/ErrorFaceScreen";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[DevCareer Global Error]", error);
  }, [error]);

  return (
    <html lang="es" className="dark">
      <body className="bg-[#020408] text-white antialiased">
        <ErrorFaceScreen
          fullViewport
          code="500"
          badge="DevCareer AI · Error Crítico"
          title="Algo salió mal en DevCareer AI"
          description="El sistema encontró un fallo inesperado. Puedes reintentar cargar la aplicación o regresar al inicio."
          detail={error?.digest ? `Referencia: ${error.digest}` : undefined}
          onRetry={reset}
          backHref="/dashboard"
          backLabel="Volver al inicio"
        />
      </body>
    </html>
  );
}
