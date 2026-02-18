"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Settings, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useSettings, useProducts } from "@/hooks/use-store"
import { store } from "@/lib/store"
import { toast } from "sonner"

export default function AjustesPage() {
  const settings = useSettings()
  const products = useProducts()
  const [minStock, setMinStock] = useState(String(settings.minStockGlobal))

  const currentThreshold = Number(minStock) || 0
  const affectedProducts = products.filter((p) => {
    if (p.minStock !== undefined) return false // has override
    return p.stock <= currentThreshold
  })

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const value = Number(minStock)
    if (value < 0) {
      toast.error("El valor minimo no puede ser negativo")
      return
    }
    store.updateSettings({ minStockGlobal: value })
    toast.success("Configuracion guardada")
  }

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-8 lg:max-w-xl">
      <div className="flex items-center gap-3">
        <Link href="/mas">
          <Button variant="ghost" size="sm" className="h-8 w-8 rounded-lg p-0">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Volver</span>
          </Button>
        </Link>
        <div>
          <h2 className="text-xl font-bold text-foreground">Ajustes</h2>
          <p className="text-sm text-muted-foreground">
            Configuracion general del sistema
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border lg:p-6">
        <div className="mb-5 flex items-center gap-3 rounded-xl bg-primary/5 p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Settings className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Stock minimo global
            </p>
            <p className="text-xs text-muted-foreground">
              Cantidad que define cuando un producto tiene stock bajo
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="minStock" className="text-sm font-medium">
              Cantidad minima global
            </Label>
            <Input
              id="minStock"
              type="number"
              value={minStock}
              onChange={(e) => setMinStock(e.target.value)}
              min={0}
              className="h-11 rounded-xl"
            />
            <p className="text-xs text-muted-foreground">
              Los productos con stock igual o menor a este numero se marcan como
              &quot;bajo stock&quot;. Los productos con minimo propio usan su
              valor individual.
            </p>
          </div>

          {/* Preview of affected products */}
          {affectedProducts.length > 0 && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                <span className="text-xs font-semibold text-destructive">
                  {affectedProducts.length} producto
                  {affectedProducts.length !== 1 ? "s" : ""} afectado
                  {affectedProducts.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                {affectedProducts.slice(0, 5).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-foreground truncate">{p.nombre}</span>
                    <span className="shrink-0 font-bold tabular-nums text-destructive ml-2">
                      {p.stock} ud
                    </span>
                  </div>
                ))}
                {affectedProducts.length > 5 && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    y {affectedProducts.length - 5} mas...
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="pt-2">
            <Button
              type="submit"
              className="h-12 w-full rounded-xl text-base shadow-sm"
            >
              Guardar configuracion
            </Button>
          </div>
        </form>
      </div>

      {/* Info about per-product overrides */}
      <div className="rounded-2xl bg-muted/50 p-4 ring-1 ring-border">
        <p className="text-xs font-semibold text-foreground mb-1">
          Minimo por producto
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Cada producto puede tener un stock minimo individual que anula el
          valor global. Esto se configura al crear o editar un producto.
        </p>
        {products.filter((p) => p.minStock !== undefined).length > 0 && (
          <div className="mt-3 flex flex-col gap-1">
            {products
              .filter((p) => p.minStock !== undefined)
              .map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-foreground">{p.nombre}</span>
                  <span className="font-medium tabular-nums text-primary">
                    min: {p.minStock}
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}
