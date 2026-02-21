import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { AppShell } from "@/components/app-shell";

import "./globals.css";

const _inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TSI Parts - Importador de repuestos",
  description:
    "Sistema de inventario para repuestos de autos. Gestion de productos, stock y ventas.",
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="font-sans antialiased">
        <AppShell>{children}</AppShell>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
