import type { Metadata } from "next";
import "./globals.css"; // Asegúrate de que este archivo exista en la carpeta app

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
        {/* El favicon.ico debe estar en la carpeta 'public' */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body>{children}</body>
    </html>
  );
}