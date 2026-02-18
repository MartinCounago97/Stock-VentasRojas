"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus, Search, Eye, Pencil, PackageOpen, AlertTriangle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useProducts } from "@/hooks/use-store"
import { store } from "@/lib/store"
import { formatPrice } from "@/lib/format"
import { LocationBadge } from "@/components/location-picker"
import { ProductThumbnail } from "@/components/product-image-upload"

export default function ProductosPage() {
  const products = useProducts()
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"todos" | "bajo">("todos")

  const lowStockCount = products.filter((p) => store.isLowStock(p)).length

  const filtered = products
    .filter(
      (p) =>
        p.nombre.toLowerCase().includes(search.toLowerCase()) ||
        p.caracteristicas.toLowerCase().includes(search.toLowerCase())
    )
    .filter((p) => (filter === "bajo" ? store.isLowStock(p) : true))

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Productos</h2>
          <p className="text-sm text-muted-foreground">
            {products.length} producto{products.length !== 1 ? "s" : ""} en
            total
          </p>
        </div>
        <Link href="/productos/nuevo">
          <Button className="shadow-sm">
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Nuevo producto</span>
            <span className="sm:hidden">Nuevo</span>
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre o codigo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 rounded-xl bg-card pl-10 shadow-sm ring-1 ring-border focus-visible:ring-2 focus-visible:ring-primary"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter("todos")}
            className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-xs font-medium transition-colors ${
              filter === "todos"
                ? "bg-foreground text-background shadow-sm"
                : "bg-card text-muted-foreground ring-1 ring-border hover:bg-muted"
            }`}
          >
            Todos
            <span className={`tabular-nums ${filter === "todos" ? "text-background/60" : "text-muted-foreground/60"}`}>
              {products.length}
            </span>
          </button>
          <button
            onClick={() => setFilter("bajo")}
            className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-xs font-medium transition-colors ${
              filter === "bajo"
                ? "bg-destructive text-destructive-foreground shadow-sm"
                : "bg-card text-muted-foreground ring-1 ring-border hover:bg-muted"
            }`}
          >
            <AlertTriangle className="h-3 w-3" />
            Stock bajo
            <span className={`tabular-nums ${filter === "bajo" ? "text-destructive-foreground/70" : "text-muted-foreground/60"}`}>
              {lowStockCount}
            </span>
          </button>
        </div>
        <Link
          href="/movimientos"
          className="shrink-0 text-xs font-medium text-primary hover:underline"
        >
          Ver movimientos
        </Link>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <PackageOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          {products.length === 0 ? (
            <>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Sin productos
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Crea tu primer producto para empezar
                </p>
              </div>
              <Link href="/productos/nuevo">
                <Button className="shadow-sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Crear primer producto
                </Button>
              </Link>
            </>
          ) : filter === "bajo" && lowStockCount === 0 ? (
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Todo en orden
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                No hay productos con stock bajo
              </p>
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Sin resultados
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                No se encontraron productos para &quot;{search}&quot;
              </p>
            </div>
          )}
        </div>
      )}

      {/* Desktop Table */}
      {filtered.length > 0 && (
        <div className="hidden overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border lg:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="w-16 px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Foto
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Nombre
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Caracteristicas
                </th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Ubicacion
                </th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Precio
                </th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Stock
                </th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((product) => (
                <tr
                  key={product.id}
                  className="transition-colors hover:bg-muted/30"
                >
                  <td className="px-3 py-3.5">
                    <ProductThumbnail src={product.imagen} alt={product.nombre} size="sm" />
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-medium text-foreground">
                      {product.nombre}
                    </span>
                  </td>
                  <td className="max-w-xs truncate px-5 py-3.5 text-muted-foreground">
                    {product.caracteristicas}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <LocationBadge ubicacion={product.ubicacion} />
                  </td>
                  <td className="px-5 py-3.5 text-right font-medium tabular-nums text-foreground">
                    ${formatPrice(product.precio)}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="font-bold tabular-nums text-foreground">
                        {product.stock}
                      </span>
                      {store.isLowStock(product) && (
                        <Badge variant="destructive" className="text-[10px]">
                          Bajo
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/productos/${product.id}`}>
                        <Button variant="ghost" size="sm" className="h-8">
                          <Eye className="mr-1.5 h-3.5 w-3.5" />
                          Ver
                        </Button>
                      </Link>
                      <Link href={`/productos/${product.id}/editar`}>
                        <Button variant="ghost" size="sm" className="h-8">
                          <Pencil className="mr-1.5 h-3.5 w-3.5" />
                          Editar
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile Cards */}
      {filtered.length > 0 && (
        <div className="flex flex-col gap-2.5 lg:hidden">
          {filtered.map((product) => (
            <div
              key={product.id}
              className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border"
            >
              <div className="flex items-start gap-3">
                <ProductThumbnail src={product.imagen} alt={product.nombre} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {product.nombre}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground truncate">
                        {product.caracteristicas}
                      </p>
                    </div>
                    {store.isLowStock(product) && (
                      <Badge
                        variant="destructive"
                        className="shrink-0 text-[10px]"
                      >
                        Bajo
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1">
                    <LocationBadge ubicacion={product.ubicacion} />
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-end justify-between">
                <div className="flex items-center gap-5">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Precio
                    </p>
                    <p className="text-sm font-bold tabular-nums text-foreground">
                      ${formatPrice(product.precio)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Stock
                    </p>
                    <p className="text-sm font-bold tabular-nums text-foreground">
                      {product.stock}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <Link href={`/productos/${product.id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 rounded-lg shadow-sm"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span className="sr-only">Ver</span>
                    </Button>
                  </Link>
                  <Link href={`/productos/${product.id}/editar`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 rounded-lg shadow-sm"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      <span className="sr-only">Editar</span>
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
