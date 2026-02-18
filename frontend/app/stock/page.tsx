"use client"

import Link from "next/link"
import { PackagePlus, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useProducts } from "@/hooks/use-store"
import { store } from "@/lib/store"
import { formatPrice } from "@/lib/format"

export default function StockPage() {
  const products = useProducts()

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Stock</h2>
          <p className="text-sm text-muted-foreground">
            Vista general de tu inventario
          </p>
        </div>
        <Link href="/stock/alta">
          <Button size="sm" className="rounded-lg shadow-sm">
            <PackagePlus className="mr-2 h-4 w-4" />
            Alta
          </Button>
        </Link>
      </div>

      {/* Desktop Table */}
      <div className="hidden overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border lg:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Producto
              </th>
              <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Precio
              </th>
              <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Stock
              </th>
              <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Estado
              </th>
              <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.map((product) => (
              <tr
                key={product.id}
                className="transition-colors hover:bg-muted/30"
              >
                <td className="px-5 py-3.5">
                  <p className="font-medium text-foreground">
                    {product.nombre}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {product.caracteristicas}
                  </p>
                </td>
                <td className="px-5 py-3.5 text-right font-medium tabular-nums text-foreground">
                  ${formatPrice(product.precio)}
                </td>
                <td className="px-5 py-3.5 text-right font-bold tabular-nums text-foreground">
                  {product.stock}
                </td>
                <td className="px-5 py-3.5 text-right">
                  {store.isLowStock(product) ? (
                    <Badge variant="destructive">Bajo</Badge>
                  ) : (
                    <Badge className="bg-accent/10 text-accent border-transparent">
                      Ok
                    </Badge>
                  )}
                </td>
                <td className="px-5 py-3.5 text-right">
                  <Link href={`/stock/alta?producto=${product.id}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1.5 rounded-lg text-xs text-primary hover:text-primary hover:bg-primary/10"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Agregar
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="flex flex-col gap-2.5 lg:hidden">
        {products.map((product) => (
          <div
            key={product.id}
            className="flex flex-col gap-3 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border"
          >
            <div className="flex items-center gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">
                  {product.nombre}
                </p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  ${formatPrice(product.precio)}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <p className="text-lg font-bold tabular-nums text-foreground leading-none">
                    {product.stock}
                  </p>
                  <p className="text-[10px] text-muted-foreground">unidades</p>
                </div>
                {store.isLowStock(product) ? (
                  <div className="h-2 w-2 rounded-full bg-destructive" />
                ) : (
                  <div className="h-2 w-2 rounded-full bg-accent" />
                )}
              </div>
            </div>
            <Link href={`/stock/alta?producto=${product.id}`}>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-full gap-1.5 rounded-lg text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                Agregar stock
              </Button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
