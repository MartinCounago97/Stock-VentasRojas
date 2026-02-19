"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
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
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { formatPrice, formatDateFull, formatDateShort } from "@/lib/format";

import {
  listarVentas,
  confirmarVenta,
  actualizarVentaPendiente,
  rechazarVenta,
  type VentaAPI,
  type EnvioPayload,
} from "@/lib/api/ventas";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";

import {
  fetchCatalogoProductos,
  type CatalogoProducto,
} from "@/lib/api/catalogo";

type Tab = "pendientes" | "confirmadas";

const ticketStyles = StyleSheet.create({
  page: { padding: 14, fontSize: 10 },
  title: { fontSize: 13, marginBottom: 8 },
  box: { border: "1px solid #ddd", padding: 10, borderRadius: 6 },
  section: { marginBottom: 10 },

  row: { flexDirection: "row", marginBottom: 6, alignItems: "flex-start" },
  k: { width: 62, color: "#666" },
  v: { flexGrow: 1, fontWeight: 700 },

  hr: { marginTop: 8, borderTop: "1px solid #eee" },

  th: {
    flexDirection: "row",
    borderBottom: "1px solid #ddd",
    paddingBottom: 4,
    marginBottom: 6,
  },
  td: { flexDirection: "row", marginBottom: 4 },

  colName: { flexGrow: 1, paddingRight: 6 },
  colQty: { width: 28, textAlign: "right" },
  colSub: { width: 52, textAlign: "right" },

  footer: { marginTop: 10, fontSize: 8, color: "#666" },
});

function TicketPDF({ venta }: { venta: VentaAPI }) {
  const envio = venta?.envio;

  return (
    <Document>
      {/* A6 para etiqueta. Si querés A4: size="A4" */}
      <Page size="A6" style={ticketStyles.page}>
        <Text style={ticketStyles.title}>Ticket / Etiqueta</Text>

        <View style={[ticketStyles.box, ticketStyles.section]}>
          <View style={ticketStyles.row}>
            <Text style={ticketStyles.k}>Venta</Text>
            <Text style={ticketStyles.v}>#{venta?._id ?? "-"}</Text>
          </View>

          <View style={ticketStyles.row}>
            <Text style={ticketStyles.k}>Fecha</Text>
            <Text style={ticketStyles.v}>
              {new Date(venta.createdAt).toLocaleString()}
            </Text>
          </View>

          <View style={ticketStyles.row}>
            <Text style={ticketStyles.k}>Cliente</Text>
            <Text style={ticketStyles.v}>{venta.cliente || "Mostrador"}</Text>
          </View>

          <View style={ticketStyles.row}>
            <Text style={ticketStyles.k}>Origen</Text>
            <Text style={ticketStyles.v}>{venta.origen}</Text>
          </View>

          {!!envio?.tipo && (
            <>
              <View style={ticketStyles.hr} />
              <View style={ticketStyles.row}>
                <Text style={ticketStyles.k}>Envío</Text>
                <Text style={ticketStyles.v}>{envio.tipo}</Text>
              </View>

              {envio.tipo === "interior" && (
                <>
                  <View style={ticketStyles.row}>
                    <Text style={ticketStyles.k}>Nombre</Text>
                    <Text style={ticketStyles.v}>{envio.nombre || "—"}</Text>
                  </View>
                  <View style={ticketStyles.row}>
                    <Text style={ticketStyles.k}>CI</Text>
                    <Text style={ticketStyles.v}>{envio.cedula || "—"}</Text>
                  </View>
                  <View style={ticketStyles.row}>
                    <Text style={ticketStyles.k}>Tel</Text>
                    <Text style={ticketStyles.v}>{envio.telefono || "—"}</Text>
                  </View>
                  <View style={ticketStyles.row}>
                    <Text style={ticketStyles.k}>Localidad</Text>
                    <Text style={ticketStyles.v}>{envio.localidad || "—"}</Text>
                  </View>
                  <View style={ticketStyles.row}>
                    <Text style={ticketStyles.k}>Empresa</Text>
                    <Text style={ticketStyles.v}>
                      {envio.empresaEnvio || "—"}
                    </Text>
                  </View>
                </>
              )}
            </>
          )}
        </View>

        <View style={[ticketStyles.box, ticketStyles.section]}>
          <View style={ticketStyles.th}>
            <Text style={[ticketStyles.colName, { fontWeight: 700 }]}>
              Producto
            </Text>
            <Text style={[ticketStyles.colQty, { fontWeight: 700 }]}>Cant</Text>
            <Text style={[ticketStyles.colSub, { fontWeight: 700 }]}>Subt</Text>
          </View>

          {venta.items.map((it, idx) => (
            <View key={idx} style={ticketStyles.td}>
              <Text style={ticketStyles.colName}>{it.nombreProducto}</Text>
              <Text style={ticketStyles.colQty}>{it.cantidad}</Text>
              <Text style={ticketStyles.colSub}>
                ${formatPrice(it.subtotal)}
              </Text>
            </View>
          ))}

          <View style={ticketStyles.hr} />
          <View style={ticketStyles.row}>
            <Text style={ticketStyles.k}>TOTAL</Text>
            <Text style={ticketStyles.v}>${formatPrice(venta.total)}</Text>
          </View>
        </View>

        <Text style={ticketStyles.footer}>
          Imprimir y pegar en el paquete (si corresponde).
        </Text>
      </Page>
    </Document>
  );
}

async function descargarTicketPDF(venta: VentaAPI) {
  try {
    const blob = await pdf(<TicketPDF venta={venta} />).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ticket-${venta?._id ?? "venta"}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  } catch {
    toast.error("No se pudo generar el PDF");
  }
}

function EnviosBox({ envio }: { envio?: EnvioPayload }) {
  if (!envio) return null;

  const isInterior = envio.tipo === "interior";

  return (
    <div className="mt-3 rounded-xl bg-muted/30 p-3 ring-1 ring-border/60">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold text-foreground">Envío</p>
        <Badge variant="secondary" className="text-[10px]">
          {envio.tipo}
        </Badge>
      </div>

      {isInterior ? (
        <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
          <div>
            <p className="text-[10px] text-muted-foreground">Nombre</p>
            <p className="font-medium text-foreground truncate">
              {envio.nombre || "—"}
            </p>
          </div>

          <div>
            <p className="text-[10px] text-muted-foreground">CI</p>
            <p className="font-medium text-foreground">{envio.cedula || "—"}</p>
          </div>

          <div>
            <p className="text-[10px] text-muted-foreground">Teléfono</p>
            <p className="font-medium text-foreground">
              {envio.telefono || "—"}
            </p>
          </div>

          <div>
            <p className="text-[10px] text-muted-foreground">Empresa</p>
            <p className="font-medium text-foreground">
              {envio.empresaEnvio || "—"}
            </p>
          </div>

          <div className="col-span-2">
            <p className="text-[10px] text-muted-foreground">Localidad</p>
            <p className="font-medium text-foreground">
              {envio.localidad || "—"}
            </p>
          </div>
        </div>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">
          {envio.tipo === "retiro" ? "Retiro en local" : "Entrega Montevideo"}
        </p>
      )}
    </div>
  );
}

type EditItem = { productoId: string; cantidad: number };

function EditVentaModal({
  open,
  onClose,
  venta,
  productos,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  venta: VentaAPI | null;
  productos: CatalogoProducto[];
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);

  const [cliente, setCliente] = useState(venta?.cliente ?? "");
  const [observacion, setObservacion] = useState(venta?.observacion ?? "");

  const [envioTipo, setEnvioTipo] = useState<EnvioPayload["tipo"]>(
    venta?.envio?.tipo ?? "retiro"
  );
  const [cedula, setCedula] = useState(venta?.envio?.cedula ?? "");
  const envioNombreDerivado = useMemo(() => cliente.trim(), [cliente]);
  const [telefono, setTelefono] = useState(venta?.envio?.telefono ?? "");
  const [localidad, setLocalidad] = useState(venta?.envio?.localidad ?? "");
  const [empresaEnvio, setEmpresaEnvio] = useState(
    venta?.envio?.empresaEnvio ?? ""
  );

  const [items, setItems] = useState<EditItem[]>(
    (venta?.items ?? []).map((it) => ({
      productoId: String(it.productoId),
      cantidad: it.cantidad,
    }))
  );

  // Reset cuando cambia venta
  if (open && venta && cliente === "" && (venta.cliente ?? "") !== "") {
    // nada, evita loop raro si tu app re-renderiza distinto
  }

  const selectedIds = useMemo(
    () => items.map((it) => it.productoId).filter(Boolean),
    [items]
  );

  function optionsForRow(currentId: string) {
    return productos.filter(
      (p) => p.id === currentId || !selectedIds.includes(p.id)
    );
  }

  const itemsResolved = useMemo(() => {
    return items.map((it) => {
      const p = productos.find((x) => x.id === it.productoId);
      const stock = p?.stock ?? 0;
      const ok = !!p && it.cantidad > 0 && it.cantidad <= stock;
      return { ...it, product: p, stock, ok };
    });
  }, [items, productos]);

  const allOk =
    itemsResolved.length > 0 &&
    itemsResolved.every((i) => i.product && i.cantidad > 0 && i.ok);

  function addItem() {
    setItems([...items, { productoId: "", cantidad: 1 } as any]);
  }

  function removeItem(idx: number) {
    setItems(items.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, patch: Partial<EditItem>) {
    setItems(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  async function handleSave() {
    if (!venta) return;
    if (!allOk) {
      toast.error("Revisá items: cantidad inválida o stock insuficiente.");
      return;
    }

    // armar envio
    const envio: EnvioPayload =
      envioTipo === "interior"
        ? {
            tipo: "interior",
            cedula: cedula.trim(),
            nombre: envioNombreDerivado,
            telefono: telefono.trim(),
            localidad: localidad.trim(),
            empresaEnvio: empresaEnvio.trim(),
          }
        : { tipo: envioTipo };

    // validar interior
    if (envio.tipo === "interior") {
      const missing = [
        "cedula",
        "telefono",
        "localidad",
        "empresaEnvio",
      ].filter((k) => !(envio as any)[k]);
      if (missing.length) {
        toast.error(`Faltan datos de envío: ${missing.join(", ")}`);
        return;
      }
    }

    setSaving(true);
    try {
      await actualizarVentaPendiente(venta._id, {
        cliente: cliente.trim(),
        observacion: observacion.trim(),
        envio,
        items: itemsResolved.map((i) => ({
          productoId: i.product!.id,
          cantidad: i.cantidad,
        })),
      });

      toast.success("Venta actualizada");
      onSaved();
      onClose();
    } catch (e: any) {
      toast.error(e?.message || "No se pudo actualizar");
    } finally {
      setSaving(false);
    }
  }

  if (!open || !venta) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[80] bg-foreground/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-x-0 bottom-0 z-[90] max-h-[85vh] overflow-y-auto rounded-t-2xl bg-card p-4 shadow-2xl ring-1 ring-border sm:inset-y-0 sm:right-0 sm:left-auto sm:w-full sm:max-w-xl sm:rounded-none">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Modificar venta</p>
            <p className="text-xs text-muted-foreground">
              Solo ventas pendientes
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg"
            onClick={onClose}
          >
            Cerrar
          </Button>
        </div>

        <div className="mt-4 space-y-4">
          <div className="rounded-xl bg-muted/30 p-3 ring-1 ring-border/50 space-y-3">
            <div className="space-y-1.5">
              <Label>Cliente</Label>
              <Input
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                className="h-10 rounded-lg bg-card"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Observación</Label>
              <Textarea
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
                rows={2}
                className="rounded-lg bg-card"
              />
            </div>
          </div>

          <div className="rounded-xl bg-muted/30 p-3 ring-1 ring-border/50 space-y-3">
            <div className="space-y-1.5">
              <Label>Tipo de envío</Label>
              <select
                value={envioTipo}
                onChange={(e) => setEnvioTipo(e.target.value as any)}
                className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
              >
                <option value="retiro">Retiro</option>
                <option value="montevideo">Montevideo</option>
                <option value="interior">Interior</option>
              </select>
            </div>

            {envioTipo === "interior" && (
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1.5">
                  <Label>CI *</Label>
                  <Input
                    value={cedula}
                    onChange={(e) => setCedula(e.target.value)}
                    className="h-10 rounded-lg bg-card"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Teléfono *</Label>
                  <Input
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="h-10 rounded-lg bg-card"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Localidad *</Label>
                  <Input
                    value={localidad}
                    onChange={(e) => setLocalidad(e.target.value)}
                    className="h-10 rounded-lg bg-card"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Empresa *</Label>
                  <Input
                    value={empresaEnvio}
                    onChange={(e) => setEmpresaEnvio(e.target.value)}
                    className="h-10 rounded-lg bg-card"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl bg-muted/30 p-3 ring-1 ring-border/50 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Productos</p>
              <Button
                size="sm"
                variant="outline"
                className="h-9 rounded-lg gap-1.5"
                onClick={addItem}
              >
                <Plus className="h-3.5 w-3.5" />
                Agregar
              </Button>
            </div>

            <div className="space-y-2">
              {itemsResolved.map((it, idx) => (
                <div
                  key={idx}
                  className="rounded-lg bg-card p-3 ring-1 ring-border/60"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">
                        Producto
                      </Label>
                      <select
                        value={it.productoId}
                        onChange={(e) =>
                          updateItem(idx, { productoId: e.target.value })
                        }
                        className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                      >
                        <option value="">Seleccionar...</option>
                        {optionsForRow(it.productoId).map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nombre} (stock: {p.stock})
                          </option>
                        ))}
                      </select>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-10 w-10 p-0 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => removeItem(idx)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Cantidad
                      </Label>
                      <Input
                        type="number"
                        value={String(it.cantidad)}
                        onChange={(e) =>
                          updateItem(idx, {
                            cantidad: Number(e.target.value || 0),
                          })
                        }
                        min={1}
                        className={`mt-1 h-10 rounded-lg bg-background ${
                          it.product && !it.ok
                            ? "ring-1 ring-destructive focus-visible:ring-destructive"
                            : ""
                        }`}
                      />
                      {it.product && !it.ok && (
                        <p className="mt-1 text-xs text-destructive font-medium">
                          No podés vender más que el stock. Disponible:{" "}
                          {it.stock}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Subtotal
                      </Label>
                      <div className="mt-1 flex h-10 items-center justify-between rounded-lg bg-muted/40 px-3 text-sm font-semibold tabular-nums ring-1 ring-border/50">
                        <span>$</span>
                        <span>
                          {it.product
                            ? formatPrice(it.product.precio * it.cantidad)
                            : "0"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {!allOk && (
              <div className="rounded-lg bg-destructive/5 p-3 ring-1 ring-destructive/20">
                <p className="text-sm font-medium text-destructive">
                  Revisá productos: hay cantidades inválidas o falta seleccionar
                  un producto.
                </p>
              </div>
            )}

            <Button
              onClick={handleSave}
              disabled={!allOk || saving}
              className="h-11 w-full rounded-xl gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

function SaleCard({
  venta,
  productos,
  onChanged,
}: {
  venta: VentaAPI;
  productos: CatalogoProducto[];
  onChanged: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [editing, setEditing] = useState(false);

  const envio = venta.envio;

  async function onConfirm() {
    if (confirming) return;
    setConfirming(true);
    try {
      await confirmarVenta(venta._id);
      toast.success("Venta confirmada");
      onChanged();
    } catch (e: any) {
      toast.error(e?.message || "No se pudo confirmar");
    } finally {
      setConfirming(false);
    }
  }

  async function onReject() {
    try {
      await rechazarVenta(venta._id, motivo.trim());
      toast.success("Venta rechazada");
      setRejecting(false);
      setMotivo("");
      onChanged();
    } catch (e: any) {
      toast.error(e?.message || "No se pudo rechazar");
    }
  }

  const isPendiente = venta.estado === "pendiente";

  return (
    <>
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
                {venta.cliente || "Venta mostrador"}
              </p>
              <Badge className="bg-primary/10 text-primary border-transparent text-[10px] shrink-0">
                {venta.items.length} item{venta.items.length !== 1 ? "s" : ""}
              </Badge>

              <Badge
                className={`border-transparent text-[10px] shrink-0 ${
                  venta.estado === "pendiente"
                    ? "bg-chart-3/10 text-chart-3"
                    : venta.estado === "confirmada"
                    ? "bg-accent/10 text-accent"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                {venta.estado}
              </Badge>
            </div>

            <p className="text-[11px] text-muted-foreground tabular-nums mt-0.5">
              <span className="hidden sm:inline">
                {formatDateFull(new Date(venta.createdAt))}
              </span>
              <span className="sm:hidden">
                {formatDateShort(new Date(venta.createdAt))}
              </span>
              {venta.observacion && (
                <span className="text-muted-foreground/60">
                  {" \u00B7 "}
                  {venta.observacion}
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-base font-bold tabular-nums text-foreground">
              ${formatPrice(venta.total)}
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
            {venta.cliente && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2.5">
                <User className="h-3 w-3" />
                {venta.cliente}
              </div>
            )}

            {/* ✅ Envío si existe */}
            {!!envio?.tipo && <EnviosBox envio={envio} />}

            {/* ✅ Items */}
            <div className="mt-3 flex flex-col gap-1.5">
              {venta.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="h-5 w-5 flex items-center justify-center rounded bg-muted text-[10px] font-bold text-muted-foreground tabular-nums shrink-0">
                      {item.cantidad}
                    </span>
                    <span className="text-foreground truncate">
                      {item.nombreProducto}
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
                ${formatPrice(venta.total)}
              </span>
            </div>

            {/* ✅ Acciones (con back) */}
            <div className="mt-3 flex flex-col gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-9 gap-1.5 rounded-lg"
                onClick={() => descargarTicketPDF(venta)}
              >
                <FileText className="h-3.5 w-3.5" />
                Exportar ticket PDF
              </Button>

              {isPendiente && !rejecting && (
                <>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="flex-1 h-9 gap-1.5 rounded-lg shadow-sm"
                      onClick={onConfirm}
                      disabled={confirming}
                    >
                      <Check className="h-3.5 w-3.5" />
                      {confirming ? "Confirmando..." : "Confirmar venta"}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-9 gap-1.5 rounded-lg"
                      onClick={() => setRejecting(true)}
                    >
                      <X className="h-3.5 w-3.5" />
                      Rechazar
                    </Button>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 gap-1.5 rounded-lg"
                    onClick={() => setEditing(true)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Modificar antes de confirmar
                  </Button>
                </>
              )}

              {rejecting && (
                <div className="flex flex-col gap-2 pt-1">
                  <Textarea
                    placeholder="Motivo del rechazo (opcional)..."
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    rows={2}
                    className="rounded-lg text-sm"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1 h-9 gap-1.5 rounded-lg"
                      onClick={onReject}
                    >
                      Confirmar rechazo
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 rounded-lg"
                      onClick={() => {
                        setRejecting(false);
                        setMotivo("");
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <EditVentaModal
        open={editing}
        onClose={() => setEditing(false)}
        venta={venta}
        productos={productos}
        onSaved={onChanged}
      />
    </>
  );
}

/* =========================
   Page
========================= */

export default function VentasPage() {
  const [tab, setTab] = useState<Tab>("pendientes");

  // productos para el modal de edición (select)
  const { data: productos = [] } = useSWR<CatalogoProducto[]>(
    "productos-catalogo",
    () => fetchCatalogoProductos(),
    { revalidateOnFocus: true }
  );

  // polling “tiempo real”
  const {
    data: pendientes = [],
    mutate: mutatePendientes,
    isLoading: loadingPendientes,
  } = useSWR<VentaAPI[]>(
    ["ventas", "pendiente"],
    () => listarVentas({ estado: "pendiente", limit: 200 }),
    { refreshInterval: 3000, revalidateOnFocus: true }
  );

  const {
    data: confirmadas = [],
    mutate: mutateConfirmadas,
    isLoading: loadingConfirmadas,
  } = useSWR<VentaAPI[]>(
    ["ventas", "confirmada"],
    () => listarVentas({ estado: "confirmada", limit: 200 }),
    { refreshInterval: 3000, revalidateOnFocus: true }
  );

  const pendingCount = pendientes.length;
  const totalVentas = confirmadas.reduce((sum, v) => sum + (v.total ?? 0), 0);

  function refreshAll() {
    mutatePendientes();
    mutateConfirmadas();
  }

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Ventas</h2>
          <p className="text-sm text-muted-foreground">
            Gestiona ventas y pedidos del catálogo (conectado al backend)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/catalogo" target="_blank">
            <Button size="sm" variant="outline" className="rounded-lg gap-1.5">
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Catálogo</span>
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
          onClick={() => setTab("pendientes")}
          className={`relative flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
            tab === "pendientes"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Pendientes
          {pendingCount > 0 && (
            <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-chart-3 px-1 text-[10px] font-bold text-chart-3-foreground tabular-nums">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("confirmadas")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
            tab === "confirmadas"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Confirmadas
        </button>
      </div>

      {/* Summary */}
      {tab === "confirmadas" && confirmadas.length > 0 && (
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
              {confirmadas.length}
            </p>
          </div>
        </div>
      )}

      {/* Content */}
      {tab === "pendientes" ? (
        loadingPendientes ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Cargando pendientes...
          </div>
        ) : pendientes.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Sin pendientes
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Cuando hagan pedidos desde el catálogo, aparecerán acá.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {pendientes.map((v) => (
              <SaleCard
                key={v._id}
                venta={v}
                productos={productos}
                onChanged={refreshAll}
              />
            ))}
          </div>
        )
      ) : loadingConfirmadas ? (
        <div className="py-10 text-center text-sm text-muted-foreground">
          Cargando confirmadas...
        </div>
      ) : confirmadas.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <Receipt className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Sin ventas confirmadas
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Las ventas aparecerán cuando confirmes operaciones.
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
          {confirmadas.map((v) => (
            <SaleCard
              key={v._id}
              venta={v}
              productos={productos}
              onChanged={refreshAll}
            />
          ))}
        </div>
      )}
    </div>
  );
}
