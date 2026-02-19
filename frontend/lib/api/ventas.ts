const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "";

export type EnvioPayload = {
  tipo: "retiro" | "montevideo" | "interior";
  cedula?: string;
  nombre?: string;
  telefono?: string;
  localidad?: string;
  empresaEnvio?: string;
};

export type CrearVentaInput = {
  cliente?: string;
  origen: "admin" | "catalogo_web" | "whatsapp";
  observacion?: string;
  envio?: EnvioPayload;
  items: { productoId: string; cantidad: number }[];
};

export type ActualizarVentaPendienteInput = {
  cliente?: string;
  observacion?: string;
  envio?: EnvioPayload;
  items?: { productoId: string; cantidad: number }[];
};

export type VentaEstado = "pendiente" | "confirmada" | "rechazada" | "anulada";

export type VentaAPI = {
  _id: string;
  cliente?: string;
  origen: "admin" | "catalogo_web" | "whatsapp";
  observacion?: string;
  envio?: EnvioPayload;
  estado: VentaEstado;
  total: number;
  moneda?: "UYU" | "USD";
  items: Array<{
    productoId: string;
    // según tu back puede ser productName o nombreProducto: ajustamos luego si hace falta
    productName?: string;
    nombreProducto?: string;
    cantidad: number;
    precioUnitario?: number;
    subtotal: number;
  }>;
  createdAt: string;
  updatedAt: string;
};

export async function readError(res: Response) {
  const txt = await res.text();
  try {
    const json = JSON.parse(txt);
    return json?.error || json?.message || txt;
  } catch {
    return txt;
  }
}

function adminHeaders() {
  if (!ADMIN_PASSWORD) {
    throw new Error(
      "Falta NEXT_PUBLIC_ADMIN_PASSWORD en frontend/.env.local (reinicia npm run dev)"
    );
  }
  return {
    "Content-Type": "application/json",
    "x-admin-password": ADMIN_PASSWORD,
  };
}

/* =========================
   Acciones existentes (OK)
========================= */

export async function crearVenta(input: CrearVentaInput) {
  const res = await fetch(`${API_URL}/api/ventas`, {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify(input),
  });

  if (!res.ok) throw new Error(await readError(res));
  return await res.json(); // { data: venta }
}

export async function confirmarVenta(ventaId: string) {
  const res = await fetch(`${API_URL}/api/ventas/${ventaId}/confirmar`, {
    method: "POST",
    headers: adminHeaders(),
  });

  if (!res.ok) throw new Error(await readError(res));
  return await res.json(); // { data: venta }
}

/* =========================
   Nuevas (para listado admin)
========================= */

export async function listarVentas(params?: {
  estado?: VentaEstado;
  origen?: "admin" | "catalogo_web" | "whatsapp";
  q?: string;
  limit?: number;
}) {
  const usp = new URLSearchParams();
  if (params?.estado) usp.set("estado", params.estado);
  if (params?.origen) usp.set("origen", params.origen);
  if (params?.q) usp.set("q", params.q);
  if (params?.limit) usp.set("limit", String(params.limit));

  const res = await fetch(`${API_URL}/api/ventas?${usp.toString()}`, {
    method: "GET",
    headers: adminHeaders(),
    cache: "no-store",
  });

  if (!res.ok) throw new Error(await readError(res));
  const json = await res.json();
  return (json?.data ?? []) as VentaAPI[];
}

export async function obtenerVenta(ventaId: string) {
  const res = await fetch(`${API_URL}/api/ventas/${ventaId}`, {
    method: "GET",
    headers: adminHeaders(),
    cache: "no-store",
  });

  if (!res.ok) throw new Error(await readError(res));
  const json = await res.json();
  return json?.data as VentaAPI;
}

export async function actualizarVentaPendiente(
  ventaId: string,
  input: ActualizarVentaPendienteInput
) {
  const res = await fetch(`${API_URL}/api/ventas/${ventaId}`, {
    method: "PUT",
    headers: adminHeaders(),
    body: JSON.stringify(input),
  });

  if (!res.ok) throw new Error(await readError(res));
  return await res.json(); // { data: venta }
}

export async function rechazarVenta(ventaId: string, motivo?: string) {
  const res = await fetch(`${API_URL}/api/ventas/${ventaId}/rechazar`, {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify({ motivo: motivo ?? "" }),
  });

  if (!res.ok) throw new Error(await readError(res));
  return await res.json(); // { data: venta }
}
