"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  ArrowRightLeft,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSectors, useProducts } from "@/hooks/use-store";
import { store } from "@/lib/store";
import { toast } from "sonner";

export default function UbicacionesPage() {
  const sectors = useSectors();
  const products = useProducts();
  const [newSectorName, setNewSectorName] = useState("");
  const [newPositions, setNewPositions] = useState<Record<string, string>>({});
  const [expandedSectors, setExpandedSectors] = useState<Set<string>>(
    new Set(sectors.map((s) => s.id))
  );
  const [movingProduct, setMovingProduct] = useState<string | null>(null);
  const [moveTarget, setMoveTarget] = useState("");

  function toggleSector(id: string) {
    setExpandedSectors((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleAddSector(e: React.FormEvent) {
    e.preventDefault();
    if (!newSectorName.trim()) return;
    store.addSector(newSectorName.trim());
    setNewSectorName("");
    toast.success("Sector creado");
  }

  function handleAddPosition(sectorId: string) {
    const pos = newPositions[sectorId]?.trim();
    if (!pos) return;
    // Check for duplicates
    const allPositions = store.getAllPositions();
    if (allPositions.some((p) => p.posicion === pos.toUpperCase())) {
      toast.error(`La posicion ${pos.toUpperCase()} ya existe`);
      return;
    }
    store.addPosition(sectorId, pos);
    setNewPositions((prev) => ({ ...prev, [sectorId]: "" }));
    toast.success(`Posicion ${pos.toUpperCase()} agregada`);
  }

  function handleRemovePosition(sectorId: string, posicion: string) {
    const productsAtPos = store.getProductsAtPosition(posicion);
    if (productsAtPos.length > 0) {
      toast.error(
        `No se puede eliminar: hay ${productsAtPos.length} producto(s) en ${posicion}`
      );
      return;
    }
    store.removePosition(sectorId, posicion);
    toast.success(`Posicion ${posicion} eliminada`);
  }

  function handleRemoveSector(sectorId: string) {
    const sector = sectors.find((s) => s.id === sectorId);
    if (!sector) return;
    const productsInSector = sector.posiciones.flatMap((pos) =>
      store.getProductsAtPosition(pos)
    );
    if (productsInSector.length > 0) {
      toast.error(
        `No se puede eliminar: hay ${productsInSector.length} producto(s) en este sector`
      );
      return;
    }
    store.removeSector(sectorId);
    toast.success(`${sector.nombre} eliminado`);
  }

  function handleMoveProduct(productId: string) {
    if (!moveTarget) return;
    store.moveProduct(productId, moveTarget);
    setMovingProduct(null);
    setMoveTarget("");
    const product = store.getProductById(productId);
    toast.success(`${product?.nombre} movido a ${moveTarget}`);
  }

  function handleClearLocation(productId: string) {
    store.moveProduct(productId, "");
    const product = store.getProductById(productId);
    toast.success(`Ubicacion de ${product?.nombre} eliminada`);
  }

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-8 lg:max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/mas">
          <Button variant="ghost" size="sm" className="h-8 w-8 rounded-lg p-0">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Volver</span>
          </Button>
        </Link>
        <div>
          <h2 className="text-xl font-bold text-foreground">Ubicaciones</h2>
          <p className="text-sm text-muted-foreground">
            Administra sectores, posiciones y mover productos
          </p>
        </div>
      </div>

      {/* Add Sector */}
      <form
        onSubmit={handleAddSector}
        className="flex items-end gap-3 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border"
      >
        <div className="flex-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            Nuevo sector
          </p>
          <Input
            placeholder="Ej: SECTOR E"
            value={newSectorName}
            onChange={(e) => setNewSectorName(e.target.value)}
            className="h-10 rounded-xl"
          />
        </div>
        <Button type="submit" size="sm" className="h-10 rounded-xl">
          <Plus className="mr-1.5 h-4 w-4" />
          Agregar
        </Button>
      </form>

      {/* Sectors list */}
      <div className="flex flex-col gap-4">
        {sectors.map((sector) => {
          const isExpanded = expandedSectors.has(sector.id);
          const productsInSector = sector.posiciones.flatMap((pos) =>
            store.getProductsAtPosition(pos)
          );

          return (
            <div
              key={sector.id}
              className="rounded-2xl bg-card shadow-sm ring-1 ring-border overflow-hidden"
            >
              {/* Sector Header */}
              {/* Sector Header */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => toggleSector(sector.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ")
                    toggleSector(sector.id);
                }}
                className="flex w-full items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors cursor-pointer"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-chart-1/10">
                  <MapPin className="h-5 w-5 text-chart-1" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">
                    {sector.nombre}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {sector.posiciones.length} posicion(es) ·{" "}
                    {productsInSector.length} producto(s)
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveSector(sector.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="sr-only">Eliminar sector</span>
                  </Button>

                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-border">
                  {/* Positions */}
                  {sector.posiciones.map((pos) => {
                    const productsHere = store.getProductsAtPosition(pos);
                    return (
                      <div
                        key={pos}
                        className="border-b border-border last:border-b-0"
                      >
                        <div className="flex items-center gap-3 px-4 py-3">
                          <span
                            className={`flex h-8 shrink-0 items-center justify-center rounded-lg bg-chart-1/10 text-xs font-black font-mono text-chart-1 whitespace-nowrap ${
                              String(pos).length > 3 ? "px-2 min-w-8" : "w-8"
                            }`}
                            title={pos}
                          >
                            {pos}
                          </span>
                          <div className="flex-1 min-w-0">
                            {productsHere.length === 0 ? (
                              <p className="text-xs text-muted-foreground italic">
                                Vacio
                              </p>
                            ) : (
                              <div className="flex flex-wrap gap-1.5">
                                {productsHere.map((p) => (
                                  <div
                                    key={p.id}
                                    className="flex items-center gap-1"
                                  >
                                    <Badge
                                      variant="secondary"
                                      className="text-[10px] font-medium gap-1"
                                    >
                                      <Package className="h-2.5 w-2.5" />
                                      {p.nombre.length > 20
                                        ? p.nombre.slice(0, 20) + "..."
                                        : p.nombre}
                                    </Badge>
                                    {movingProduct === p.id ? (
                                      <div className="flex items-center gap-1 ml-1">
                                        <Select
                                          value={moveTarget}
                                          onValueChange={setMoveTarget}
                                        >
                                          <SelectTrigger className="h-7 w-20 text-[10px] rounded-lg">
                                            <SelectValue placeholder="A..." />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {store
                                              .getAllPositions()
                                              .filter((x) => x.posicion !== pos)
                                              .map((x) => (
                                                <SelectItem
                                                  key={x.posicion}
                                                  value={x.posicion}
                                                >
                                                  <span className="font-mono font-bold">
                                                    {x.posicion}
                                                  </span>
                                                </SelectItem>
                                              ))}
                                          </SelectContent>
                                        </Select>
                                        <Button
                                          size="sm"
                                          className="h-7 px-2 text-[10px] rounded-lg"
                                          onClick={() =>
                                            handleMoveProduct(p.id)
                                          }
                                          disabled={!moveTarget}
                                        >
                                          Ok
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 px-2 text-[10px] rounded-lg"
                                          onClick={() => {
                                            setMovingProduct(null);
                                            setMoveTarget("");
                                          }}
                                        >
                                          X
                                        </Button>
                                      </div>
                                    ) : (
                                      <div className="flex gap-0.5">
                                        <button
                                          onClick={() => setMovingProduct(p.id)}
                                          className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                          title="Mover producto"
                                        >
                                          <ArrowRightLeft className="h-3 w-3" />
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleClearLocation(p.id)
                                          }
                                          className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                                          title="Quitar ubicacion"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleRemovePosition(sector.id, pos)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Add Position */}
                  <div className="flex items-center gap-2 px-4 py-3 bg-muted/20">
                    <Input
                      placeholder="Ej: A5"
                      value={newPositions[sector.id] || ""}
                      onChange={(e) =>
                        setNewPositions((prev) => ({
                          ...prev,
                          [sector.id]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddPosition(sector.id);
                        }
                      }}
                      className="h-8 flex-1 rounded-lg text-xs"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-lg text-xs"
                      onClick={() => handleAddPosition(sector.id)}
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      Posicion
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {sectors.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <MapPin className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Sin sectores
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Crea tu primer sector para organizar productos
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Unassigned products */}
      {(() => {
        const unassigned = products.filter((p) => !p.ubicacion);
        if (unassigned.length === 0) return null;
        return (
          <div className="rounded-2xl bg-card shadow-sm ring-1 ring-border overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/20">
              <p className="text-sm font-bold text-foreground">
                Productos sin ubicacion
              </p>
              <p className="text-xs text-muted-foreground">
                {unassigned.length} producto(s) sin posicion asignada
              </p>
            </div>
            <div className="divide-y divide-border">
              {unassigned.map((p) => (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="flex-1 min-w-0 text-sm text-foreground truncate">
                    {p.nombre}
                  </p>
                  {movingProduct === p.id ? (
                    <div className="flex items-center gap-1">
                      <Select value={moveTarget} onValueChange={setMoveTarget}>
                        <SelectTrigger className="h-7 w-20 text-[10px] rounded-lg">
                          <SelectValue placeholder="A..." />
                        </SelectTrigger>
                        <SelectContent>
                          {store.getAllPositions().map((x) => (
                            <SelectItem key={x.posicion} value={x.posicion}>
                              <span className="font-mono font-bold">
                                {x.posicion}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        className="h-7 px-2 text-[10px] rounded-lg"
                        onClick={() => handleMoveProduct(p.id)}
                        disabled={!moveTarget}
                      >
                        Ok
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-[10px] rounded-lg"
                        onClick={() => {
                          setMovingProduct(null);
                          setMoveTarget("");
                        }}
                      >
                        X
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[10px] rounded-lg"
                      onClick={() => setMovingProduct(p.id)}
                    >
                      <ArrowRightLeft className="mr-1 h-3 w-3" />
                      Asignar
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
