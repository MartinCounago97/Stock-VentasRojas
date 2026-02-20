"use client";

import Link from "next/link";
import {
  Package,
  TrendingUp,
  AlertTriangle,
  Plus,
  PackagePlus,
  ShoppingCart,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProducts, useMovements } from "@/hooks/use-store";
import { store } from "@/lib/store";
import { formatDateShort } from "@/lib/format";

export default function HomePage() {
  const products = useProducts();
  const movements = useMovements();

  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + Number(p.stock ?? 0), 0);

  // ✅ Back usa stockMinimo, store usa minStock => normalizamos acá sin romper tipos
  const lowStock = products.filter((p: any) =>
    store.isLowStock({
      stock: Number(p.stock ?? 0),
      minStock: p.minStock ?? p.stockMinimo, // soporta ambos nombres
    })
  ).length;

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-8">
      {/* Greeting */}
      <div>
        <h2 className="text-2xl font-bold text-foreground text-balance">
          Bienvenido de nuevo
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Resumen de tu inventario de repuestos
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
        <div className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">
            {totalProducts}
          </p>
          <p className="text-xs text-muted-foreground">Productos</p>
        </div>

        <div className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
            <TrendingUp className="h-5 w-5 text-accent" />
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">
            {totalStock}
          </p>
          <p className="text-xs text-muted-foreground">Unidades totales</p>
        </div>

        <div className="col-span-2 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border lg:col-span-1">
          <div className="flex items-center gap-3 lg:flex-col lg:items-start">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div className="lg:mt-3">
              <p className="text-2xl font-bold tracking-tight text-foreground">
                {lowStock}
              </p>
              <p className="text-xs text-muted-foreground">Stock bajo</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        <Link href="/productos/nuevo" className="block">
          <div className="group flex flex-col gap-3 rounded-2xl bg-primary p-4 text-primary-foreground shadow-sm transition-all hover:shadow-md active:scale-[0.98]">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/20">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Nuevo</p>
              <p className="text-xs text-primary-foreground/70">Producto</p>
            </div>
          </div>
        </Link>

        <Link href="/stock/alta" className="block">
          <div className="group flex flex-col gap-3 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border transition-all hover:shadow-md active:scale-[0.98]">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
              <PackagePlus className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Alta stock
              </p>
              <p className="text-xs text-muted-foreground">Sumar uds.</p>
            </div>
          </div>
        </Link>

        <Link href="/vender" className="block">
          <div className="group flex flex-col gap-3 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border transition-all hover:shadow-md active:scale-[0.98]">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-chart-3/10">
              <ShoppingCart className="h-5 w-5 text-chart-3" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Vender</p>
              <p className="text-xs text-muted-foreground">Registrar venta</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Movements */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            Ultimos movimientos
          </h3>
          <Link
            href="/movimientos"
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            Ver todos
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="rounded-2xl bg-card shadow-sm ring-1 ring-border overflow-hidden divide-y divide-border">
          {movements.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-sm text-muted-foreground">
                Sin movimientos todavia
              </p>
            </div>
          ) : (
            movements.slice(0, 5).map((m: any) => (
              <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                <div
                  className={
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold " +
                    (m.tipo === "VENTA"
                      ? "bg-destructive/10 text-destructive"
                      : m.tipo === "INGRESO_COMPRA"
                      ? "bg-accent/10 text-accent"
                      : "bg-primary/10 text-primary")
                  }
                >
                  {m.tipo === "VENTA" ? "-" : "+"}
                  {m.cantidad}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {m.productName}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {m.tipo === "ALTA_INICIAL"
                      ? "Alta inicial"
                      : m.tipo === "INGRESO_COMPRA"
                      ? "Compra"
                      : "Venta"}
                  </p>
                </div>

                <span className="shrink-0 text-[11px] text-muted-foreground">
                  {formatDateShort(
                    m.fecha instanceof Date ? m.fecha : new Date(m.fecha)
                  )}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStock > 0 && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">
                {lowStock} producto{lowStock !== 1 ? "s" : ""} con stock bajo
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Revisa tu inventario para reabastecer
              </p>
              <Link href="/stock">
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2.5 h-8 text-xs border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  Ver productos
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
