import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css"; 

export const metadata: Metadata = {
  title: "Vaultum Protocol",
  description: "La Bóveda Descentralizada",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body>
        {children}
        {/* Componente de Vercel para registrar el tráfico en tiempo real */}
        <Analytics />
      </body>
    </html>
  );
}