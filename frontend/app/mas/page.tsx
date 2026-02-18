"use client"

import Link from "next/link"
import {
  Package,
  PackagePlus,
  ArrowUpDown,
  ChevronRight,
  Settings,
  Receipt,
  ShoppingCart,
  MapPin,
  ExternalLink,
} from "lucide-react"

const menuItems = [
  {
    href: "/catalogo",
    icon: ExternalLink,
    label: "Catalogo online",
    description: "Pagina publica para que los clientes hagan pedidos",
    color: "bg-[#25D366]/10 text-[#25D366]",
    external: true,
  },
  {
    href: "/productos",
    icon: Package,
    label: "Productos",
    description: "Gestionar catalogo de productos",
    color: "bg-primary/10 text-primary",
  },
  {
    href: "/stock/alta",
    icon: PackagePlus,
    label: "Alta de stock",
    description: "Agregar stock a productos existentes",
    color: "bg-accent/10 text-accent",
  },
  {
    href: "/vender",
    icon: ShoppingCart,
    label: "Nueva venta",
    description: "Registrar una venta de productos",
    color: "bg-chart-3/10 text-chart-3",
  },
  {
    href: "/ventas",
    icon: Receipt,
    label: "Historial de ventas",
    description: "Ver todas las ventas registradas",
    color: "bg-chart-3/10 text-chart-3",
  },
  {
    href: "/mas/ubicaciones",
    icon: MapPin,
    label: "Ubicaciones",
    description: "Administrar sectores y mover productos",
    color: "bg-chart-1/10 text-chart-1",
  },
  {
    href: "/movimientos",
    icon: ArrowUpDown,
    label: "Movimientos",
    description: "Historial de ingresos y egresos de stock",
    color: "bg-secondary text-secondary-foreground",
  },
  {
    href: "/mas/ajustes",
    icon: Settings,
    label: "Ajustes",
    description: "Configurar stock minimo y preferencias",
    color: "bg-muted text-muted-foreground",
  },
]

export default function MasPage() {
  return (
    <div className="flex flex-col gap-6 p-4 lg:p-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Mas opciones</h2>
        <p className="text-sm text-muted-foreground">
          Administra tu inventario
        </p>
      </div>

      <div className="flex flex-col gap-2.5">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            {...("external" in item && item.external ? { target: "_blank" } : {})}
          >
            <div className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border transition-all hover:shadow-md active:scale-[0.98]">
              <div
                className={
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl " +
                  item.color
                }
              >
                <item.icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {item.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.description}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground/50" />
            </div>
          </Link>
        ))}
      </div>

      <div className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          Stock Repuestos
        </p>
        <p className="text-sm text-muted-foreground">
          Sistema de inventario para autopartes v1.0
        </p>
      </div>
    </div>
  )
}
