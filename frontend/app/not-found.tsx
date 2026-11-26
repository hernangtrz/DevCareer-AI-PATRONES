import React from "react";
import ErrorFaceScreen from "@/components/ErrorFaceScreen";

export default function NotFoundPage() {
  return (
    <ErrorFaceScreen
      fullViewport
      code="404"
      badge="DevCareer AI · Ruta No Encontrada"
      title="No encontramos la página que buscas"
      description="Es posible que el enlace haya cambiado, la sesión haya expirado o la ruta no exista en tu espacio de trabajo."
      backHref="/dashboard"
      backLabel="Volver al inicio"
    />
  );
}
