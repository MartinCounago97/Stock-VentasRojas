"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Package, PackagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProducts } from "@/hooks/use-store";
import { store } from "@/lib/store";
import { toast } from "sonner";

export function AltaStockForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const products = useProducts();
  const preselected = searchParams.get("producto") || "";
  const [selectedProductId, setSelectedProductId] = useState(preselected);
  const [cantidad, setCantidad] = useState("");
  const [observacion, setObservacion] = useState("");

  useEffect(() => {
    if (preselected) {
      setSelectedProductId(preselected);
    }
  }, [preselected]);

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const cantidadNum = Number(cantidad) || 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProductId || cantidadNum <= 0) return;

    try {
      await store.addStock({
        productId: selectedProductId,
        cantidad: cantidadNum,
        observacion,
      });

      toast.success(
        `Se agregaron ${cantidadNum} unidades a ${selectedProduct?.nombre}`
      );
      router.push("/productos");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "No se pudo dar de alta el stock");
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-8 lg:max-w-xl">
      <div className="flex items-center gap-3">
        <Link href="/stock">
          <Button variant="ghost" size="sm" className="h-8 w-8 rounded-lg p-0">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Volver</span>
          </Button>
        </Link>
        <div>
          <h2 className="text-xl font-bold text-foreground">Alta de stock</h2>
          <p className="text-sm text-muted-foreground">
            Suma unidades a un producto existente
          </p>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Sin productos
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Primero necesitas crear un producto
            </p>
          </div>
          <Link href="/productos/nuevo">
            <Button className="rounded-xl shadow-sm">Crear producto</Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border lg:p-6">
          <div className="mb-5 flex items-center gap-3 rounded-xl bg-accent/5 p-3 ring-1 ring-accent/15">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
              <PackagePlus className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Ingreso de stock
              </p>
              <p className="text-xs text-muted-foreground">
                Selecciona producto y cantidad
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-medium">Producto</Label>
              <Select
                value={selectedProductId}
                onValueChange={setSelectedProductId}
              >
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Seleccionar producto..." />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <span className="flex items-center gap-2">
                        <span>{p.nombre}</span>
                        <span className="text-muted-foreground">
                          (stock: {p.stock})
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cantidad" className="text-sm font-medium">
                Cantidad comprada
              </Label>
              <Input
                id="cantidad"
                type="number"
                placeholder="0"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                className="h-11 rounded-xl"
                min={1}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="observacion" className="text-sm font-medium">
                Observacion{" "}
                <span className="font-normal text-muted-foreground">
                  (opcional)
                </span>
              </Label>
              <Textarea
                id="observacion"
                placeholder="Proveedor / factura..."
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
                rows={2}
                className="rounded-xl"
              />
            </div>

            {/* Summary Card */}
            {selectedProduct && (
              <div className="rounded-xl bg-muted/50 p-4 ring-1 ring-border">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Resumen
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex-1 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Actual
                    </p>
                    <p className="mt-0.5 text-xl font-bold tabular-nums text-foreground">
                      {selectedProduct.stock}
                    </p>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center">
                    <span className="text-lg font-bold text-primary">+</span>
                  </div>
                  <div className="flex-1 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Ingreso
                    </p>
                    <p className="mt-0.5 text-xl font-bold tabular-nums text-primary">
                      {cantidadNum}
                    </p>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Nuevo
                    </p>
                    <p className="mt-0.5 text-xl font-bold tabular-nums text-accent">
                      {selectedProduct.stock + cantidadNum}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-3">
              <Button
                type="submit"
                className="h-12 w-full rounded-xl text-base shadow-sm"
                disabled={!selectedProductId || cantidadNum <= 0 || loading}
              >
                {loading ? "Confirmando..." : "Confirmar alta de stock"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
