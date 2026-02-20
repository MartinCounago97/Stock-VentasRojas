"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Package, PackagePlus, MapPin } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { store } from "@/lib/store";
import { formatPrice } from "@/lib/format";

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  // ✅ esperar hidratación antes de decidir notFound
  const [ready, setReady] = useState(store._hydrated);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await store.hydrateFromApi();
      } finally {
        if (mounted) setReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const product = useMemo(() => store.getProductById(id), [id, ready]);

  if (!ready) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
        Cargando producto...
      </div>
    );
  }

  if (!product) {
    notFound();
  }

  const sector = product.ubicacion
    ? store.getSectorForUbicacion(product.ubicacion)
    : undefined;

  return (
    <div className="flex flex-col gap-5 p-4 lg:p-8 lg:max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/productos">
          <Button variant="ghost" size="sm" className="h-8 w-8 rounded-lg p-0">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Volver</span>
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-foreground truncate">
            {product.nombre}
          </h2>
          <p className="text-sm text-muted-foreground">Detalle del producto</p>
        </div>
        <Link href={`/productos/${id}/editar`}>
          <Button variant="outline" size="sm" className="rounded-lg shadow-sm">
            <Pencil className="mr-2 h-3.5 w-3.5" />
            Editar
          </Button>
        </Link>
      </div>

      {product.imagen ? (
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-muted ring-1 ring-border">
          <Image
            src={product.imagen}
            alt={product.nombre}
            fill
            className="object-contain"
            unoptimized
          />
        </div>
      ) : (
        <div className="flex aspect-[16/10] w-full items-center justify-center rounded-2xl bg-muted ring-1 ring-border">
          <Package className="h-16 w-16 text-muted-foreground/30" />
        </div>
      )}

      <div className="rounded-2xl bg-chart-1/5 p-5 shadow-sm ring-1 ring-chart-1/20">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-chart-1/10">
            <MapPin className="h-7 w-7 text-chart-1" />
          </div>
          <div className="min-w-0 flex-1">
            {product.ubicacion ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black font-mono tracking-tight text-chart-1">
                    {product.ubicacion}
                  </span>
                  {store.isLowStock(product) && (
                    <Badge variant="destructive">Stock bajo</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {sector?.nombre || "Sector desconocido"}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-muted-foreground">
                  Sin ubicacion asignada
                </p>
                <p className="text-xs text-muted-foreground">
                  Asigna una en{" "}
                  <Link
                    href={`/productos/${id}/editar`}
                    className="text-primary underline"
                  >
                    Editar
                  </Link>{" "}
                  o desde{" "}
                  <Link
                    href="/mas/ubicaciones"
                    className="text-primary underline"
                  >
                    Ubicaciones
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
            <Package className="h-7 w-7 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold text-foreground truncate">
              {product.nombre}
            </h3>
            <div className="mt-1">
              {store.isLowStock(product) ? (
                <Badge variant="destructive">Stock bajo</Badge>
              ) : (
                <Badge className="bg-accent/10 text-accent border-transparent">
                  Stock disponible
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Precio
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
            ${formatPrice(product.precio)}
          </p>
        </div>
        <div className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Stock actual
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
            {product.stock}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              uds
            </span>
          </p>
        </div>
      </div>

      {product.caracteristicas && (
        <div className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
            Caracteristicas
          </p>
          <p className="text-sm text-foreground leading-relaxed">
            {product.caracteristicas}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Link href={`/stock/alta?producto=${id}`}>
          <Button
            variant="outline"
            className="w-full h-12 rounded-xl shadow-sm"
          >
            <PackagePlus className="mr-2 h-4 w-4" />
            Agregar stock
          </Button>
        </Link>
        <Link href={`/productos/${id}/editar`}>
          <Button className="w-full h-12 rounded-xl shadow-sm">
            <Pencil className="mr-2 h-4 w-4" />
            Editar producto
          </Button>
        </Link>
      </div>
    </div>
  );
}
