import { readError } from "./ventas";

export type CatalogoProducto = {
  id: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  moneda: "UYU" | "USD";
  stock: number;
  stockMinimo?: number;
  imagen?: string | null;
  ubicacion?: string | null;
  caracteristicas?: string;
};

export type EnvioPayload = {
  tipo: "retiro" | "montevideo" | "interior";
  cedula?: string;
  nombre?: string;
  telefono?: string;
  localidad?: string;
  empresaEnvio?: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";

function mapProducto(p: any): CatalogoProducto {
  const imagen = p?.foto?.url ? `${API_URL}${p.foto.url}` : null;

  const ubicacion =
    p?.ubicacionId?.sector && p?.ubicacionId?.codigo
      ? `${p.ubicacionId.sector} - ${p.ubicacionId.codigo}`
      : null;

  return {
    id: p._id,
    nombre: p.nombre,
    descripcion: p.descripcion || "",
    caracteristicas: p.descripcion || "",
    precio: Number(p.precio ?? 0),
    moneda: p.moneda,
    stock: Number(p.stock ?? 0),
    stockMinimo: p.stockMinimo ?? 0,
    imagen,
    ubicacion,
  };
}

export async function fetchCatalogoProductos(): Promise<CatalogoProducto[]> {
  // Usamos /api/productos?activo=true
  const res = await fetch(`${API_URL}/api/productos?activo=true`, {
    cache: "no-store",
  });

  if (!res.ok) {
    const msg = await readError(res);
    throw new Error(msg || `HTTP ${res.status}`);
  }

  const json = await res.json();
  const data = json?.data ?? [];
  return data.map(mapProducto);
}

export async function crearPedidoPendiente(input: {
  cliente: string;
  origen: "catalogo_web" | "whatsapp" | "admin";
  observacion?: string;
  envio?: EnvioPayload;
  items: { productoId: string; cantidad: number }[];
}) {
  const res = await fetch(`${API_URL}/api/ventas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Error creando pedido: ${res.status} ${txt}`);
  }

  return await res.json();
}
