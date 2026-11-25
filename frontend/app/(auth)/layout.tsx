import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/api.server";
import { DiagonalShutterProvider } from "@/components/DiagonalShutterTransition";

const AuthLayout = async ({ children }: { children: ReactNode }) => {
  try {
    const isUserAuthenticated = await isAuthenticated();
    if (isUserAuthenticated) redirect("/dashboard");
  } catch {
    // Si falla la verificación, mostrar el login de todas formas
  }

  return (
    <DiagonalShutterProvider primaryColor="#2426d8" accentColor="#a78bfa">
      {children}
    </DiagonalShutterProvider>
  );
};

export default AuthLayout;