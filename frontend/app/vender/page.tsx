"use client";

import { useEffect, useState } from "react";
import { store } from "@/lib/store";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShoppingCart,
  Plus,
  Trash2,
  ArrowRight,
  PackageOpen,
} from "lucide-react";
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
import { formatPrice } from "@/lib/format";
import { toast } from "sonner";
import { crearVenta, confirmarVenta } from "@/lib/api/ventas";
import {
  fetchCatalogoProductos,
  type CatalogoProducto,
} from "@/lib/api/catalogo";

interface SaleItem {
  productId: string;
  cantidad: string;
}

export default function VenderPage() {
  const router = useRouter();

  // ✅ Productos reales desde backend (no useProducts mock)
  const [products, setProducts] = useState<CatalogoProducto[]>([]);
  const [loading, setLoading] = useState(true);

  const [items, setItems] = useState<SaleItem[]>([
    { productId: "", cantidad: "1" },
  ]);
  const [cliente, setCliente] = useState("");
  const [observacion, setObservacion] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const data = await fetchCatalogoProductos();
        if (mounted) setProducts(data);
      } catch (e: any) {
        toast.error(e?.message || "Error cargando productos");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  function addItem() {
    setItems([...items, { productId: "", cantidad: "1" }]);
  }

  function removeItem(index: number) {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof SaleItem, value: string) {
    setItems(
      items.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  const resolvedItems = items.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    const cantidad = Number(item.cantidad) || 0;
    return {
      ...item,
      product,
      cantidad,
      subtotal: product ? product.precio * cantidad : 0,
      valid: !!product && cantidad > 0 && cantidad <= (product?.stock || 0),
    };
  });

  const total = resolvedItems.reduce((sum, i) => sum + i.subtotal, 0);

  const allValid =
    resolvedItems.length > 0 &&
    resolvedItems.some((i) => i.productId) &&
    resolvedItems.filter((i) => i.productId).every((i) => i.valid);

  const selectedIds = items.map((i) => i.productId).filter(Boolean);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!allValid || creating) return;

    const validItems = resolvedItems.filter((i) => i.productId && i.valid);

    setCreating(true);
    try {
      // 1) Crear venta (pendiente)
      const created = await crearVenta({
        cliente: cliente.trim(),
        origen: "admin",
        observacion: observacion.trim(),
        items: validItems.map((i) => ({
          productoId: i.productId,
          cantidad: i.cantidad,
        })),
      });

      const ventaId = created?.data?._id;
      if (!ventaId) throw new Error("No se pudo obtener el ID de la venta");

      // 2) Confirmar (confirmada + descuenta stock + movimientos)
      const confirmed = await confirmarVenta(ventaId);
      await store.refresh();

      toast.success(
        `Venta confirmada por $${formatPrice(confirmed?.data?.total ?? total)}`
      );
      router.push("/ventas");
    } catch (err: any) {
      toast.error(err?.message || "Error confirmando la venta");
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
        Cargando productos...
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <PackageOpen className="h-8 w-8 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Sin productos
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Primero necesitas crear productos para vender
          </p>
        </div>
        <Link href="/productos/nuevo">
          <Button className="rounded-xl shadow-sm">Crear producto</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-8 lg:max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Nueva venta</h2>
        <p className="text-sm text-muted-foreground">
          Selecciona los productos vendidos y registra la operacion
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Sale Items */}
        <div className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <ShoppingCart className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Productos</p>
              <p className="text-xs text-muted-foreground">
                Agrega los items de la venta
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {items.map((item, index) => {
              const resolved = resolvedItems[index];
              const availableProducts = products.filter(
                (p) => p.id === item.productId || !selectedIds.includes(p.id)
              );

              return (
                <div
                  key={index}
                  className="flex flex-col gap-3 rounded-xl bg-muted/30 p-3 ring-1 ring-border/50"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 flex flex-col gap-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">
                        Producto
                      </Label>
                      <Select
                        value={item.productId}
                        onValueChange={(v) => updateItem(index, "productId", v)}
                      >
                        <SelectTrigger className="h-10 rounded-lg bg-card">
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableProducts.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              <span className="flex items-center gap-2">
                                <span>{p.nombre}</span>
                                <span className="text-muted-foreground text-xs">
                                  (stock: {p.stock})
                                </span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="mt-6 h-10 w-10 p-0 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Quitar</span>
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">
                        Cantidad
                      </Label>
                      <Input
                        type="number"
                        value={item.cantidad}
                        onChange={(e) =>
                          updateItem(index, "cantidad", e.target.value)
                        }
                        min={1}
                        className={`h-10 rounded-lg bg-card ${
                          resolved.product &&
                          resolved.productId &&
                          (resolved.cantidad <= 0 ||
                            resolved.cantidad > resolved.product.stock)
                            ? "ring-1 ring-destructive focus-visible:ring-destructive"
                            : ""
                        }`}
                      />

                      {resolved.product &&
                        resolved.cantidad > resolved.product.stock && (
                          <p className="text-xs text-destructive font-medium">
                            No podés vender más que el stock. Disponible:{" "}
                            {resolved.product.stock}
                          </p>
                        )}

                      {resolved.product && resolved.cantidad <= 0 && (
                        <p className="text-xs text-destructive font-medium">
                          La cantidad debe ser mayor a 0
                        </p>
                      )}

                      {resolved.product && (
                        <span className="text-[10px] text-muted-foreground">
                          Disponible: {resolved.product.stock}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">
                        Subtotal
                      </Label>
                      <div className="flex h-10 items-center rounded-lg bg-muted/50 px-3 text-sm font-semibold tabular-nums text-foreground ring-1 ring-border/50">
                        ${formatPrice(resolved.subtotal)}
                      </div>
                      {resolved.product && (
                        <span className="text-[10px] text-muted-foreground">
                          Precio unit: ${formatPrice(resolved.product.precio)}
                        </span>
                      )}
                    </div>
                  </div>

                  {resolved.product &&
                    resolved.cantidad > resolved.product.stock && (
                      <p className="text-xs text-destructive font-medium">
                        Stock insuficiente (disponible: {resolved.product.stock}
                        )
                      </p>
                    )}
                </div>
              );
            })}

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 rounded-lg self-start"
              onClick={addItem}
            >
              <Plus className="h-3.5 w-3.5" />
              Agregar producto
            </Button>
          </div>
        </div>

        {/* Client + Observation */}
        <div className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cliente" className="text-sm font-medium">
                Cliente{" "}
                <span className="font-normal text-muted-foreground">
                  (opcional)
                </span>
              </Label>
              <Input
                id="cliente"
                placeholder="Nombre del cliente o taller..."
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="obs" className="text-sm font-medium">
                Observacion{" "}
                <span className="font-normal text-muted-foreground">
                  (opcional)
                </span>
              </Label>
              <Textarea
                id="obs"
                placeholder="Detalle de la venta..."
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
                rows={2}
                className="rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Total + Submit */}
        <div className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-muted-foreground">
              Total de la venta
            </span>
            <span className="text-2xl font-bold tabular-nums text-foreground">
              ${formatPrice(total)}
            </span>
          </div>
          <Button
            type="submit"
            className="h-12 w-full rounded-xl text-base shadow-sm gap-2"
            disabled={!allValid || creating}
          >
            {creating ? "Confirmando..." : "Confirmar venta"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
