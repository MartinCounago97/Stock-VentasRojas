"use client"

import Link from "next/link"
import { ArrowLeft, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useMovements } from "@/hooks/use-store"
import { formatDateFull } from "@/lib/format"

const typeLabels: Record<string, string> = {
  ALTA_INICIAL: "Alta inicial",
  INGRESO_COMPRA: "Compra",
  VENTA: "Venta",
}

const typeStyles: Record<string, string> = {
  ALTA_INICIAL: "bg-primary/10 text-primary border-transparent",
  INGRESO_COMPRA: "bg-accent/10 text-accent border-transparent",
  VENTA: "bg-destructive/10 text-destructive border-transparent",
}

export default function MovimientosPage() {
  const movements = useMovements()

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-8">
      <div className="flex items-center gap-3">
        <Link href="/productos">
          <Button variant="ghost" size="sm" className="h-8 w-8 rounded-lg p-0">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Volver</span>
          </Button>
        </Link>
        <div>
          <h2 className="text-xl font-bold text-foreground">Movimientos</h2>
          <p className="text-sm text-muted-foreground">
            Historial de ingresos y movimientos de stock
          </p>
        </div>
      </div>

      {movements.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <ArrowUpDown className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Sin movimientos
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Los movimientos apareceran cuando crees productos o agregues stock
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border lg:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Fecha
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Producto
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Tipo
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Cantidad
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Observacion
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {movements.map((m) => (
                  <tr
                    key={m.id}
                    className="transition-colors hover:bg-muted/30"
                  >
                    <td className="px-5 py-3.5 text-muted-foreground tabular-nums">
                      {formatDateFull(m.fecha)}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-foreground">
                      {m.productName}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge className={typeStyles[m.tipo]}>
                        {typeLabels[m.tipo]}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold tabular-nums text-foreground">
                      {m.tipo === "VENTA" ? "-" : "+"}
                      {m.cantidad}
                    </td>
                    <td className="max-w-xs truncate px-5 py-3.5 text-muted-foreground">
                      {m.observacion || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="flex flex-col gap-2.5 lg:hidden">
            {movements.map((m) => (
              <div
                key={m.id}
                className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {m.productName}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">
                      {formatDateFull(m.fecha)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className={typeStyles[m.tipo] + " text-[10px]"}>
                      {typeLabels[m.tipo]}
                    </Badge>
                    <span
                      className={
                        "text-sm font-bold tabular-nums " +
                        (m.tipo === "VENTA"
                          ? "text-destructive"
                          : "text-accent")
                      }
                    >
                      {m.tipo === "VENTA" ? "-" : "+"}
                      {m.cantidad}
                    </span>
                  </div>
                </div>
                {m.observacion && (
                  <p className="mt-2 text-xs text-muted-foreground truncate">
                    {m.observacion}
                  </p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
