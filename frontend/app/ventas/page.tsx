"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Receipt,
  ShoppingCart,
  ChevronDown,
  ChevronUp,
  User,
  Clock,
  Check,
  X,
  AlertTriangle,
  Pencil,
  ExternalLink,
  Minus,
  Plus,
  Trash2,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useSales, usePreSales, useProducts } from "@/hooks/use-store";
import { store, type PreSale } from "@/lib/store";
import { formatPrice, formatDateFull, formatDateShort } from "@/lib/format";
import { toast } from "sonner";

// ✅ PDF (etiqueta)
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";

type Tab = "ventas" | "preventas";

/* =========================
   PDF - Etiqueta Envío
========================= */

const labelStyles = StyleSheet.create({
  page: { padding: 18, fontSize: 11 },
  title: { fontSize: 14, marginBottom: 10 },
  box: { border: "1px solid #ddd", padding: 10, borderRadius: 6 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  muted: { color: "#666" },
  strong: { fontWeight: 700 },
  footer: { marginTop: 10, fontSize: 9, color: "#666" },
});

function EtiquetaEnvioPDF({ data }: { data: any }) {
  const envio = data?.envio || {};

  return (
    <Document>
      {/* A6 suele ser cómodo para etiqueta */}
      <Page size="A6" style={labelStyles.page}>
        <Text style={labelStyles.title}>Etiqueta de Envío</Text>

        <View style={labelStyles.box}>
          <View style={labelStyles.row}>
            <Text style={labelStyles.muted}>Pedido</Text>
            <Text style={labelStyles.strong}>#{data?.id ?? "-"}</Text>
          </View>

          <View style={labelStyles.row}>
            <Text style={labelStyles.muted}>Cliente</Text>
            <Text style={labelStyles.strong}>
              {data?.cliente || data?.contacto || "—"}
            </Text>
          </View>

          <View style={labelStyles.row}>
            <Text style={labelStyles.muted}>Tipo</Text>
            <Text style={labelStyles.strong}>{envio?.tipo ?? "—"}</Text>
          </View>

          {envio?.tipo === "interior" && (
            <>
              <View style={labelStyles.row}>
                <Text style={labelStyles.muted}>Nombre</Text>
                <Text style={labelStyles.strong}>{envio?.nombre ?? "—"}</Text>
              </View>
              <View style={labelStyles.row}>
                <Text style={labelStyles.muted}>CI</Text>
                <Text style={labelStyles.strong}>{envio?.cedula ?? "—"}</Text>
              </View>
              <View style={labelStyles.row}>
                <Text style={labelStyles.muted}>Tel</Text>
                <Text style={labelStyles.strong}>{envio?.telefono ?? "—"}</Text>
              </View>
              <View style={labelStyles.row}>
                <Text style={labelStyles.muted}>Localidad</Text>
                <Text style={labelStyles.strong}>
                  {envio?.localidad ?? "—"}
                </Text>
              </View>
              <View style={labelStyles.row}>
                <Text style={labelStyles.muted}>Empresa</Text>
                <Text style={labelStyles.strong}>
                  {envio?.empresaEnvio ?? "—"}
                </Text>
              </View>
            </>
          )}
        </View>

        <Text style={labelStyles.footer}>Imprimir y pegar en el paquete.</Text>
      </Page>
    </Document>
  );
}

async function descargarEtiquetaPDF(data: any) {
  try {
    const blob = await pdf(<EtiquetaEnvioPDF data={data} />).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `etiqueta-${data?.id ?? "venta"}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    toast.error("No se pudo generar el PDF");
  }
}

/* =========================
   UI helpers
========================= */

function EnviosBox({ envio }: { envio: any }) {
  if (!envio) return null;

  return (
    <div className="mt-2 rounded-lg bg-muted/30 p-2.5 ring-1 ring-border/50">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        Datos de envío
      </p>

      <div className="mt-1 text-xs text-foreground">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Tipo</span>
          <span className="font-medium">{envio.tipo}</span>
        </div>

        {envio.tipo === "interior" && (
          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Cédula</span>
              <span className="font-medium">{envio.cedula}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Nombre</span>
              <span className="font-medium">{envio.nombre}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Teléfono</span>
              <span className="font-medium">{envio.telefono}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Localidad</span>
              <span className="font-medium">{envio.localidad}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Empresa</span>
              <span className="font-medium">{envio.empresaEnvio}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================
   Cards
========================= */

function SaleCard({ sale }: { sale: ReturnType<typeof useSales>[number] }) {
  const [expanded, setExpanded] = useState(false);

  const envio = (sale as any)?.envio;

  return (
    <div className="rounded-2xl bg-card shadow-sm ring-1 ring-border overflow-hidden">
      <button
        type="button"
        className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-muted/20 active:bg-muted/30"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Receipt className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground truncate">
              {sale.cliente || "Venta mostrador"}
            </p>
            <Badge className="bg-primary/10 text-primary border-transparent text-[10px] shrink-0">
              {sale.items.length} item{sale.items.length !== 1 ? "s" : ""}
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground tabular-nums mt-0.5">
            <span className="hidden sm:inline">
              {formatDateFull(sale.fecha)}
            </span>
            <span className="sm:hidden">{formatDateShort(sale.fecha)}</span>
            {sale.observacion && (
              <span className="text-muted-foreground/60">
                {" \u00B7 "}
                {sale.observacion}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-base font-bold tabular-nums text-foreground">
            ${formatPrice(sale.total)}
          </span>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border px-4 py-3">
          {sale.cliente && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2.5">
              <User className="h-3 w-3" />
              {sale.cliente}
            </div>
          )}

          {/* ✅ Datos de envío */}
          <EnviosBox envio={envio} />

          {/* ✅ Botón PDF (solo interior) */}
          {envio?.tipo === "interior" && (
            <Button
              size="sm"
              variant="outline"
              className="mt-2 h-9 gap-1.5 rounded-lg"
              onClick={() => descargarEtiquetaPDF(sale)}
            >
              <FileText className="h-3.5 w-3.5" />
              Generar etiqueta PDF
            </Button>
          )}

          <div className="mt-3 flex flex-col gap-1.5">
            {sale.items
              .filter((i) => i.cantidad > 0)
              .map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="h-5 w-5 flex items-center justify-center rounded bg-muted text-[10px] font-bold text-muted-foreground tabular-nums shrink-0">
                      {item.cantidad}
                    </span>
                    <span className="text-foreground truncate">
                      {item.productName}
                    </span>
                  </div>
                  <span className="shrink-0 font-medium tabular-nums text-muted-foreground ml-3">
                    ${formatPrice(item.subtotal)}
                  </span>
                </div>
              ))}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5">
            <span className="text-xs font-medium text-muted-foreground">
              Total
            </span>
            <span className="text-sm font-bold tabular-nums text-foreground">
              ${formatPrice(sale.total)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function PreSaleCard({ preSale }: { preSale: PreSale }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const products = useProducts();

  const envio = (preSale as any)?.envio;

  // Editable items (for modify before confirm)
  const [editItems, setEditItems] = useState(
    preSale.items.map((i) => ({ ...i }))
  );

  function updateItemQty(idx: number, qty: number) {
    setEditItems(
      editItems.map((item, i) => {
        if (i !== idx) return item;
        const newQty = Math.max(0, qty);
        return {
          ...item,
          cantidad: newQty,
          subtotal: item.precioUnitario * newQty,
        };
      })
    );
  }

  function removeEditItem(idx: number) {
    setEditItems(editItems.filter((_, i) => i !== idx));
  }

  const editTotal = editItems.reduce((sum, i) => sum + i.subtotal, 0);

  function handleConfirm() {
    const items = editing ? editItems.filter((i) => i.cantidad > 0) : undefined;
    const result = store.confirmPreSale(preSale.id, items);
    if (result) {
      toast.success(`Venta confirmada por $${formatPrice(result.total)}`);
      setEditing(false);
    } else {
      toast.error("Error: stock insuficiente para alguno de los productos");
    }
  }

  function handleReject() {
    store.rejectPreSale(
      preSale.id,
      motivoRechazo.trim() || "Rechazada por el administrador"
    );
    toast.success("Pre-venta rechazada");
    setRejecting(false);
  }

  const statusConfig = {
    PENDIENTE: {
      color: "bg-chart-3/10 text-chart-3",
      icon: Clock,
      label: "Pendiente",
    },
    CONFIRMADA: {
      color: "bg-accent/10 text-accent",
      icon: Check,
      label: "Confirmada",
    },
    RECHAZADA: {
      color: "bg-destructive/10 text-destructive",
      icon: X,
      label: "Rechazada",
    },
  } as const;

  const status = statusConfig[preSale.estado];
  const StatusIcon = status.icon;

  return (
    <div className="rounded-2xl bg-card shadow-sm ring-1 ring-border overflow-hidden">
      <button
        type="button"
        className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-muted/20 active:bg-muted/30"
        onClick={() => setExpanded(!expanded)}
      >
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${status.color}`}
        >
          <StatusIcon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground truncate">
              {preSale.contacto}
            </p>
            <Badge
              className={`${status.color} border-transparent text-[10px] shrink-0`}
            >
              {status.label}
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground tabular-nums mt-0.5">
            <span className="hidden sm:inline">
              {formatDateFull(preSale.fecha)}
            </span>
            <span className="sm:hidden">{formatDateShort(preSale.fecha)}</span>
            <span className="text-muted-foreground/60">
              {" \u00B7 "}#{preSale.id} {" \u00B7 "}
              {preSale.items.length} item{preSale.items.length !== 1 ? "s" : ""}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-base font-bold tabular-nums text-foreground">
            ${formatPrice(preSale.total)}
          </span>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border px-4 py-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2.5">
            <User className="h-3 w-3" />
            {preSale.contacto}
            {preSale.estado === "PENDIENTE" && (
              <span className="text-chart-3 ml-1">
                - Pedido desde catalogo web
              </span>
            )}
          </div>

          {/* ✅ Datos de envío */}
          <EnviosBox envio={envio} />

          {/* ✅ Botón PDF (solo interior) */}
          {envio?.tipo === "interior" && (
            <Button
              size="sm"
              variant="outline"
              className="mt-2 h-9 gap-1.5 rounded-lg"
              onClick={() => descargarEtiquetaPDF(preSale)}
            >
              <FileText className="h-3.5 w-3.5" />
              Generar etiqueta PDF
            </Button>
          )}

          {preSale.motivoRechazo && (
            <div className="flex items-start gap-2 rounded-lg bg-destructive/5 p-2.5 mb-3 ring-1 ring-destructive/20">
              <AlertTriangle className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
              <p className="text-xs text-destructive">
                {preSale.motivoRechazo}
              </p>
            </div>
          )}

          {/* Items list */}
          {editing ? (
            <div className="flex flex-col gap-2 mb-3">
              {editItems.map((item, idx) => {
                const product = products.find((p) => p.id === item.productId);
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded-lg bg-muted/30 p-2 ring-1 ring-border/50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        {item.productName}
                      </p>
                      <p className="text-[10px] text-muted-foreground tabular-nums">
                        ${formatPrice(item.precioUnitario)} c/u
                        {product && <span> - Stock: {product.stock}</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateItemQty(idx, item.cantidad - 1)}
                        className="flex h-6 w-6 items-center justify-center rounded bg-card text-foreground ring-1 ring-border"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold tabular-nums">
                        {item.cantidad}
                      </span>
                      <button
                        onClick={() => updateItemQty(idx, item.cantidad + 1)}
                        className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground"
                        disabled={
                          product ? item.cantidad >= product.stock : false
                        }
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <span className="text-xs font-bold tabular-nums w-16 text-right">
                      ${formatPrice(item.subtotal)}
                    </span>
                    <button
                      onClick={() => removeEditItem(idx)}
                      className="text-destructive hover:text-destructive/80"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
              <div className="flex items-center justify-between border-t border-border pt-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Nuevo total
                </span>
                <span className="text-sm font-bold tabular-nums text-foreground">
                  ${formatPrice(editTotal)}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 mb-3">
              {preSale.items
                .filter((i) => i.cantidad > 0)
                .map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="h-5 w-5 flex items-center justify-center rounded bg-muted text-[10px] font-bold text-muted-foreground tabular-nums shrink-0">
                        {item.cantidad}
                      </span>
                      <span className="text-foreground truncate">
                        {item.productName}
                      </span>
                    </div>
                    <span className="shrink-0 font-medium tabular-nums text-muted-foreground ml-3">
                      ${formatPrice(item.subtotal)}
                    </span>
                  </div>
                ))}
              <div className="flex items-center justify-between border-t border-border pt-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Total
                </span>
                <span className="text-sm font-bold tabular-nums text-foreground">
                  ${formatPrice(preSale.total)}
                </span>
              </div>
            </div>
          )}

          {/* Actions for PENDIENTE */}
          {preSale.estado === "PENDIENTE" && !rejecting && (
            <div className="flex flex-col gap-2 pt-1">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="flex-1 h-9 gap-1.5 rounded-lg shadow-sm"
                  onClick={handleConfirm}
                  disabled={
                    editing &&
                    editItems.filter((i) => i.cantidad > 0).length === 0
                  }
                >
                  <Check className="h-3.5 w-3.5" />
                  {editing ? "Confirmar con cambios" : "Confirmar venta"}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-9 gap-1.5 rounded-lg"
                  onClick={() => {
                    setRejecting(true);
                    setEditing(false);
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                  Rechazar
                </Button>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-9 gap-1.5 rounded-lg"
                onClick={() => {
                  if (editing)
                    setEditItems(preSale.items.map((i) => ({ ...i })));
                  setEditing(!editing);
                }}
              >
                <Pencil className="h-3.5 w-3.5" />
                {editing ? "Cancelar edicion" : "Modificar antes de confirmar"}
              </Button>
            </div>
          )}

          {/* Reject form */}
          {rejecting && (
            <div className="flex flex-col gap-2 pt-1">
              <Textarea
                placeholder="Motivo del rechazo (opcional)..."
                value={motivoRechazo}
                onChange={(e) => setMotivoRechazo(e.target.value)}
                rows={2}
                className="rounded-lg text-sm"
              />
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1 h-9 gap-1.5 rounded-lg"
                  onClick={handleReject}
                >
                  Confirmar rechazo
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 rounded-lg"
                  onClick={() => {
                    setRejecting(false);
                    setMotivoRechazo("");
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* =========================
   Page
========================= */

export default function VentasPage() {
  const sales = useSales();
  const preSales = usePreSales();
  const [tab, setTab] = useState<Tab>("preventas");

  const pendingCount = preSales.filter(
    (ps) => ps.estado === "PENDIENTE"
  ).length;
  const totalVentas = sales.reduce((sum, s) => sum + s.total, 0);

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Ventas</h2>
          <p className="text-sm text-muted-foreground">
            Gestiona ventas y pedidos del catalogo
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/catalogo" target="_blank">
            <Button size="sm" variant="outline" className="rounded-lg gap-1.5">
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Catalogo</span>
            </Button>
          </Link>
          <Link href="/vender">
            <Button size="sm" className="rounded-lg shadow-sm gap-1.5">
              <ShoppingCart className="h-3.5 w-3.5" />
              Vender
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-xl bg-muted/50 p-1 ring-1 ring-border">
        <button
          onClick={() => setTab("preventas")}
          className={`relative flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
            tab === "preventas"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Pre-ventas
          {pendingCount > 0 && (
            <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-chart-3 px-1 text-[10px] font-bold text-chart-3-foreground tabular-nums">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("ventas")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
            tab === "ventas"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Ventas confirmadas
        </button>
      </div>

      {/* Summary */}
      {tab === "ventas" && sales.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Total vendido
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
              ${formatPrice(totalVentas)}
            </p>
          </div>
          <div className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Cantidad de ventas
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
              {sales.length}
            </p>
          </div>
        </div>
      )}

      {tab === "preventas" && preSales.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Pendientes
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums text-chart-3">
              {preSales.filter((ps) => ps.estado === "PENDIENTE").length}
            </p>
          </div>
          <div className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Confirmadas
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums text-accent">
              {preSales.filter((ps) => ps.estado === "CONFIRMADA").length}
            </p>
          </div>
          <div className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Rechazadas
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums text-destructive">
              {preSales.filter((ps) => ps.estado === "RECHAZADA").length}
            </p>
          </div>
        </div>
      )}

      {/* Content */}
      {tab === "ventas" ? (
        sales.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <Receipt className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Sin ventas
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Las ventas apareceran cuando registres o confirmes una operacion
              </p>
            </div>
            <Link href="/vender">
              <Button className="rounded-xl shadow-sm gap-1.5">
                <ShoppingCart className="h-4 w-4" />
                Registrar venta
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {sales.map((sale) => (
              <SaleCard key={sale.id} sale={sale} />
            ))}
          </div>
        )
      ) : preSales.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <Clock className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Sin pre-ventas
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Cuando los clientes hagan pedidos desde el catalogo, apareceran
              aca
            </p>
          </div>
          <Link href="/catalogo" target="_blank">
            <Button variant="outline" className="rounded-xl gap-1.5">
              <ExternalLink className="h-4 w-4" />
              Ver catalogo
            </Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {preSales.map((preSale) => (
            <PreSaleCard key={preSale.id} preSale={preSale} />
          ))}
        </div>
      )}
    </div>
  );
}
