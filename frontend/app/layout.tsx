import type { Metadata } from "next";
import { Mona_Sans, JetBrains_Mono } from "next/font/google";

import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { LanguageProvider } from "@/contexts/LanguageContext";

const monaSans = Mona_Sans({
  variable: "--font-mona-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "DevCareer AI — Entrevistas, CV & Empleabilidad con IA",
  description:
    "Plataforma impulsada por IA para entrevistas de voz, análisis ATS de CV, retos de código SOLID y búsqueda inteligente de empleo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`dark ${monaSans.variable} ${jetbrainsMono.variable}`}
    >
      <body className={`${monaSans.className} antialiased pattern selection:bg-primary-200/25 selection:text-primary-100`}>
        <LanguageProvider>
          {children}

          <Toaster />
        </LanguageProvider>
      </body>
    </html>
  );
}
