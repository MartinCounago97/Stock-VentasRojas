"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  X,
  Send,
  Package,
  Wrench,
  Filter,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";
import { toast } from "sonner";
import {
  fetchCatalogoProductos,
  crearPedidoPendiente,
  type CatalogoProducto,
  type EnvioPayload,
} from "@/lib/api/catalogo";

interface CartItem {
  productId: string;
  cantidad: number;
}

const WA_NUMBER = "59897933160";

function buildWhatsAppMessage(
  items: CartItem[],
  products: CatalogoProducto[],
  contacto: string,
  envio?: any
) {
  let msg = `Hola! Soy *${contacto}*.\nSolicito los siguientes productos:\n\n`;
  let total = 0;

  items.forEach((item, i) => {
    const product = products.find((p) => p.id === item.productId);
    if (!product) return;

    const subtotal = product.precio * item.cantidad;
    total += subtotal;

    msg += `${i + 1}. *${product.nombre}*\n   Cantidad: ${
      item.cantidad
    }\n   Precio unit.: $${formatPrice(
      product.precio
    )}\n   Subtotal: $${formatPrice(subtotal)}\n\n`;
  });
  if (envio?.tipo === "interior") {
    msg += `\n📦 *Envío al interior*\n`;
    msg += `CI: ${envio.cedula}\n`;
    msg += `Nombre: ${envio.nombre}\n`;
    msg += `Localidad: ${envio.localidad}\n`;
    msg += `Empresa: ${envio.empresaEnvio}\n`;
    msg += `Teléfono: ${envio.telefono}\n`;
  }
  msg += `---\n*TOTAL: $${formatPrice(
    total
  )}*\n\nAguardo confirmacion. Gracias!`;

  return msg;
}

export default function CatalogoPage() {
  const [products, setProducts] = useState<CatalogoProducto[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [ci, setCi] = useState("");
  const [localidad, setLocalidad] = useState("");
  const [empresaEnvio, setEmpresaEnvio] = useState("");
  const [telefonoContacto, setTelefonoContacto] = useState("");

  const [envioInterior, setEnvioInterior] = useState(false);

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

  const [search, setSearch] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [contacto, setContacto] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<"nombre" | "precio-asc" | "precio-desc">(
    "nombre"
  );

  const inStockProducts = products.filter((p) => p.stock > 0);
  const envio: EnvioPayload = envioInterior
    ? {
        tipo: "interior",
        cedula: ci.trim(),
        nombre: contacto.trim(),
        localidad: localidad.trim(),
        empresaEnvio,
        telefono: telefonoContacto.trim(),
      }
    : {
        tipo: "retiro",
      };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();

    let result = inStockProducts.filter((p) => {
      const nombre = (p.nombre || "").toLowerCase();
      const carac = (p.caracteristicas || "").toLowerCase(); // ✅ fallback
      return nombre.includes(q) || carac.includes(q);
    });

    switch (sortBy) {
      case "precio-asc":
        result = [...result].sort((a, b) => a.precio - b.precio);
        break;
      case "precio-desc":
        result = [...result].sort((a, b) => b.precio - a.precio);
        break;
      default:
        result = [...result].sort((a, b) => a.nombre.localeCompare(b.nombre));
    }
    return result;
  }, [inStockProducts, search, sortBy]);

  const cartCount = cart.reduce((sum, i) => sum + i.cantidad, 0);

  const cartTotal = cart.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.productId);
    return sum + (product ? product.precio * item.cantidad : 0);
  }, 0);

  function getCartQty(productId: string) {
    return cart.find((i) => i.productId === productId)?.cantidad || 0;
  }

  function addToCart(productId: string) {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const existing = cart.find((i) => i.productId === productId);

    if (existing) {
      if (existing.cantidad >= product.stock) {
        toast.error("No hay mas stock disponible");
        return;
      }
      setCart(
        cart.map((i) =>
          i.productId === productId ? { ...i, cantidad: i.cantidad + 1 } : i
        )
      );
    } else {
      setCart([...cart, { productId, cantidad: 1 }]);
    }
  }

  function removeFromCart(productId: string) {
    const existing = cart.find((i) => i.productId === productId);
    if (!existing) return;

    if (existing.cantidad <= 1) {
      setCart(cart.filter((i) => i.productId !== productId));
    } else {
      setCart(
        cart.map((i) =>
          i.productId === productId ? { ...i, cantidad: i.cantidad - 1 } : i
        )
      );
    }
  }

  function deleteFromCart(productId: string) {
    setCart(cart.filter((i) => i.productId !== productId));
  }

  // ✅ AHORA CREA PEDIDO EN BACKEND ANTES DE ABRIR WHATSAPP
  async function handleCheckout() {
    if (sending) return;

    if (!contacto.trim()) {
      toast.error("Ingresa tu nombre de contacto");
      return;
    }
    if (cart.length === 0) return;

    setSending(true);
    try {
      // 1) crear venta/pedido PENDIENTE en backend (NO descuenta stock)
      await crearPedidoPendiente({
        cliente: contacto.trim(),
        origen: "catalogo_web",
        observacion: "Pedido desde catálogo web (WhatsApp)",
        envio,
        items: cart.map((i) => ({
          productoId: i.productId,
          cantidad: i.cantidad,
        })),
      });

      // 2) abrir whatsapp con el detalle (tu flujo actual)
      const msg = buildWhatsAppMessage(cart, products, contacto.trim(), envio);

      const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
      window.open(url, "_blank");

      toast.success("Pedido enviado! Te redirigimos a WhatsApp");
      setCart([]);
      setContacto("");
      setCartOpen(false);
    } catch (e: any) {
      toast.error(
        e?.message || "No se pudo crear el pedido. Intenta nuevamente."
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4 lg:h-16 lg:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Wrench className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="leading-none">
              <span className="text-sm font-bold text-foreground">
                Stock Repuestos
              </span>
              <span className="hidden sm:block text-[10px] text-muted-foreground leading-tight">
                Catalogo online
              </span>
            </div>
          </div>
          <div className="ml-auto">
            <button
              onClick={() => setCartOpen(true)}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors hover:bg-primary/20 active:scale-95"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground tabular-nums">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Search + Filters */}
      <div className="sticky top-14 z-30 border-b border-border bg-background/90 backdrop-blur-xl lg:top-16">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-3 lg:px-6">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar repuesto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 rounded-xl bg-card pl-9"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                showFilters
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground ring-1 ring-border"
              }`}
            >
              <Filter className="h-4 w-4" />
            </button>
          </div>

          {showFilters && (
            <div className="flex items-center gap-2 pb-1">
              {(
                [
                  { value: "nombre", label: "A-Z" },
                  { value: "precio-asc", label: "Menor precio" },
                  { value: "precio-desc", label: "Mayor precio" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSortBy(opt.value)}
                  className={`inline-flex h-7 items-center rounded-full px-3 text-xs font-medium transition-colors ${
                    sortBy === opt.value
                      ? "bg-foreground text-background"
                      : "bg-card text-muted-foreground ring-1 ring-border"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            {filtered.length} producto{filtered.length !== 1 ? "s" : ""}{" "}
            disponible{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Product Grid */}
      <div className="mx-auto max-w-5xl px-4 py-4 lg:px-6 lg:py-6">
        {loading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Cargando productos...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Sin resultados
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {search
                  ? `No encontramos productos para "${search}"`
                  : "No hay productos disponibles"}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((product) => {
              const qty = getCartQty(product.id);
              return (
                <div
                  key={product.id}
                  className="group flex flex-col rounded-2xl bg-card shadow-sm ring-1 ring-border transition-shadow hover:shadow-md overflow-hidden"
                >
                  <div className="relative aspect-[4/3] w-full bg-muted">
                    {product.imagen ? (
                      <Image
                        src={product.imagen}
                        alt={product.nombre}
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Package className="h-10 w-10 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col gap-1.5 p-4 pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-foreground leading-snug">
                        {product.nombre}
                      </h3>
                      {product.ubicacion && (
                        <Badge
                          variant="secondary"
                          className="shrink-0 text-[10px] font-bold"
                        >
                          {product.ubicacion}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {product.caracteristicas}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-border px-4 py-3">
                    <div>
                      <p className="text-lg font-bold tabular-nums text-foreground">
                        ${formatPrice(product.precio)}
                      </p>
                      <p className="text-[10px] text-muted-foreground tabular-nums">
                        {product.stock} disponible
                        {product.stock !== 1 ? "s" : ""}
                      </p>
                    </div>

                    {qty === 0 ? (
                      <Button
                        size="sm"
                        className="h-9 gap-1.5 rounded-xl text-xs shadow-sm"
                        onClick={() => addToCart(product.id)}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Agregar
                      </Button>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => removeFromCart(product.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-foreground transition-colors hover:bg-destructive/10 hover:text-destructive active:scale-95"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-bold tabular-nums text-foreground">
                          {qty}
                        </span>
                        <button
                          onClick={() => addToCart(product.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 active:scale-95 disabled:opacity-50"
                          disabled={qty >= product.stock}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating cart bar on mobile */}
      {cartCount > 0 && !cartOpen && (
        <div className="fixed inset-x-0 bottom-0 z-40 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <button
            onClick={() => setCartOpen(true)}
            className="flex w-full items-center gap-3 rounded-2xl bg-primary p-4 text-primary-foreground shadow-lg transition-all active:scale-[0.98]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/20">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold">
                {cartCount} producto{cartCount !== 1 ? "s" : ""} en el carrito
              </p>
              <p className="text-xs text-primary-foreground/70 tabular-nums">
                Total: ${formatPrice(cartTotal)}
              </p>
            </div>
            <span className="text-base font-bold tabular-nums">
              ${formatPrice(cartTotal)}
            </span>
          </button>
        </div>
      )}

      {/* Cart Drawer */}
      {cartOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setCartOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-card shadow-2xl">
            {/* Cart Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">
                    Tu pedido
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {cartCount} producto{cartCount !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* ✅ Scroll area: items + form */}
            <div className="flex-1 overflow-y-auto px-4 py-3 pb-44">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-16 text-center">
                  <Package className="h-12 w-12 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">
                    El carrito esta vacio
                  </p>
                </div>
              ) : (
                <>
                  {/* Items */}
                  <div className="flex flex-col gap-2.5">
                    {cart.map((item) => {
                      const product = products.find(
                        (p) => p.id === item.productId
                      );
                      if (!product) return null;
                      const subtotal = product.precio * item.cantidad;

                      return (
                        <div
                          key={item.productId}
                          className="flex items-center gap-3 rounded-xl bg-muted/30 p-3 ring-1 ring-border/50"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {product.nombre}
                            </p>
                            <p className="text-xs text-muted-foreground tabular-nums">
                              ${formatPrice(product.precio)} c/u
                            </p>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => removeFromCart(item.productId)}
                              className="flex h-7 w-7 items-center justify-center rounded-md bg-card text-foreground ring-1 ring-border transition-colors hover:bg-muted active:scale-95"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-7 text-center text-xs font-bold tabular-nums">
                              {item.cantidad}
                            </span>
                            <button
                              onClick={() => addToCart(item.productId)}
                              className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground transition-colors hover:bg-primary/90 active:scale-95 disabled:opacity-50"
                              disabled={item.cantidad >= product.stock}
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>

                          <div className="flex flex-col items-end gap-0.5 shrink-0 ml-1">
                            <span className="text-sm font-bold tabular-nums text-foreground">
                              ${formatPrice(subtotal)}
                            </span>
                            <button
                              onClick={() => deleteFromCart(item.productId)}
                              className="text-[10px] text-destructive hover:underline"
                            >
                              Quitar
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* ✅ Form */}
                  <div className="mt-4 flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="contacto"
                        className="text-sm font-medium text-foreground"
                      >
                        Nombre completo{" "}
                        <span className="text-destructive">*</span>
                      </label>
                      <Input
                        id="contacto"
                        placeholder="Nombre para identificarte..."
                        value={contacto}
                        onChange={(e) => setContacto(e.target.value)}
                        className="h-11 rounded-xl"
                      />
                    </div>

                    {/* Envío interior */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="envioInterior"
                        checked={envioInterior}
                        onChange={(e) => {
                          const next = e.target.checked;
                          setEnvioInterior(next);
                          if (!next) {
                            setCi("");
                            setLocalidad("");
                            setEmpresaEnvio("");
                            setTelefonoContacto("");
                          }
                        }}
                        className="h-4 w-4 rounded border-border"
                      />
                      <label
                        htmlFor="envioInterior"
                        className="text-sm font-medium text-foreground"
                      >
                        Envío al interior
                      </label>
                    </div>

                    {envioInterior && (
                      <div className="flex flex-col gap-3 rounded-xl bg-muted/30 p-3 ring-1 ring-border">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-sm font-medium">
                            CI <span className="text-destructive">*</span>
                          </label>
                          <Input
                            value={ci}
                            onChange={(e) => setCi(e.target.value)}
                            placeholder="Ej: 4.123.456-7"
                            className="h-10 rounded-lg"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-sm font-medium">
                            Localidad{" "}
                            <span className="text-destructive">*</span>
                          </label>
                          <Input
                            value={localidad}
                            onChange={(e) => setLocalidad(e.target.value)}
                            placeholder="Ciudad / Departamento"
                            className="h-10 rounded-lg"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-sm font-medium">
                            Empresa de envío{" "}
                            <span className="text-destructive">*</span>
                          </label>
                          <select
                            value={empresaEnvio}
                            onChange={(e) => setEmpresaEnvio(e.target.value)}
                            className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
                          >
                            <option value="">Seleccionar empresa</option>
                            <option value="DAC">DAC</option>
                            <option value="UES">UES</option>
                            <option value="Mirtrans">Mirtrans</option>
                            <option value="Agencia Central">
                              Agencia Central
                            </option>
                            <option value="Otra">Otra</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-sm font-medium">
                            Teléfono de contacto{" "}
                            <span className="text-destructive">*</span>
                          </label>
                          <Input
                            value={telefonoContacto}
                            onChange={(e) =>
                              setTelefonoContacto(e.target.value)
                            }
                            placeholder="Ej: 099123456"
                            className="h-10 rounded-lg"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* ✅ Sticky Footer: total + botón */}
            {cart.length > 0 && (
              <div className="sticky bottom-0 border-t border-border bg-card/95 backdrop-blur px-4 py-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">
                    Total del pedido
                  </span>
                  <span className="text-xl font-bold tabular-nums text-foreground">
                    ${formatPrice(cartTotal)}
                  </span>
                </div>

                <Button
                  onClick={handleCheckout}
                  disabled={
                    !contacto.trim() ||
                    sending ||
                    (envioInterior &&
                      (!ci.trim() ||
                        !localidad.trim() ||
                        !empresaEnvio ||
                        !telefonoContacto.trim()))
                  }
                  className="h-12 w-full gap-2 rounded-xl text-base shadow-sm bg-[#25D366] hover:bg-[#1fb855] text-white"
                >
                  <Send className="h-4 w-4" />
                  {sending
                    ? "Enviando..."
                    : envioInterior
                    ? "Enviar pedido con envío"
                    : "Enviar pedido por WhatsApp"}
                </Button>

                <p className="mt-2 text-center text-[10px] text-muted-foreground">
                  Se abrira WhatsApp con el detalle de tu pedido
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
