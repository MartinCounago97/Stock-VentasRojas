import type { Metadata, Viewport } from "next"

export const metadata: Metadata = {
  title: "Catalogo - Stock Repuestos",
  description: "Explora nuestro catalogo de repuestos para autos. Consulta disponibilidad y envia tu pedido por WhatsApp.",
}

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
}

export default function CatalogoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
