// lib/store.ts
// Store in-memory con pub/sub (useSyncExternalStore)
// Sin datos hardcodeados: se hidrata desde el backend.

import { get } from "http";

export interface Sector {
  id: string;
  nombre: string;
  posiciones: string[];
}

export interface Product {
  id: string;
  nombre: string;
  caracteristicas: string;
  precio: number;
  stock: number;
  minStock?: number;
  ubicacion?: string; // codigo (ej: "A1")
  ubicacionId?: string; // _id real de Ubicacion
  imagen?: string;
  createdAt: Date;
}

export type MovementType = "ALTA_INICIAL" | "INGRESO_COMPRA" | "VENTA";

export interface Movement {
  id: string;
  productId: string;
  productName: string;
  tipo: MovementType;
  cantidad: number; // positiva
  observacion: string;
  fecha: Date;
}

export interface AppSettings {
  minStockGlobal: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "";

function toDate(v: any): Date {
  if (!v) return new Date();
  if (v instanceof Date) return v;
  return new Date(v);
}

function mapApiProducto(p: any): Product {
  const imagen = p?.foto?.url
    ? `${API_URL}${p.foto.url}`
    : p?.imagen ?? undefined;

  const ubicacion = p?.ubicacionId?.codigo
    ? String(p.ubicacionId.codigo).toUpperCase()
    : p?.ubicacion ?? undefined;

  const ubicacionId = p?.ubicacionId?._id
    ? String(p.ubicacionId._id)
    : undefined;

  return {
    id: String(p._id ?? p.id),
    nombre: p.nombre ?? "",
    caracteristicas: p.caracteristicas ?? p.descripcion ?? "",
    precio: Number(p.precio ?? 0),
    stock: Number(p.stock ?? 0),
    minStock: p.minStock ?? p.stockMinimo ?? undefined,
    ubicacion,
    ubicacionId,
    imagen,
    createdAt: toDate(p.createdAt ?? p.updatedAt),
  };
}

function mapApiMovimiento(
  m: any,
  productNameById: Map<string, string>
): Movement {
  const rawTipo = String(m?.tipo ?? "")
    .toLowerCase()
    .trim();
  const rawCantidad = Number(m?.cantidad ?? 0);

  const isAltaInicial =
    rawTipo === "ingreso" &&
    String(m?.observaciones ?? "")
      .toLowerCase()
      .includes("stock inicial");

  const tipo: MovementType = isAltaInicial
    ? "ALTA_INICIAL"
    : rawTipo === "venta"
    ? "VENTA"
    : "INGRESO_COMPRA";

  const productId = String(m?.productoId ?? "");
  const productName = productNameById.get(productId) ?? "Producto";

  return {
    id: String(m?._id ?? m?.id),
    productId,
    productName,
    tipo,
    cantidad: Math.abs(rawCantidad),
    observacion: m?.observaciones ?? "",
    fecha: toDate(m?.createdAt),
  };
}

type Snapshot = {
  sectors: Sector[];
  products: Product[];
  movements: Movement[];
  settings: AppSettings;

  // ✅ extras internos para resolver codigo <-> ubicacionId
  ubicacionesByCodigo: Map<string, string>; // "A1" -> ubicacionId
  ubicacionesById: Map<string, { sector: string; codigo: string }>; // ubicacionId -> {sector,codigo}
};

let state: Snapshot = {
  sectors: [],
  products: [],
  movements: [],
  settings: { minStockGlobal: 5 },
  ubicacionesByCodigo: new Map(),
  ubicacionesById: new Map(),
};

let listeners: Set<() => void> = new Set();

function emitChange() {
  listeners.forEach((l) => l());
}

async function fetchJson(path: string) {
  const res = await fetch(`${API_URL}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return await res.json();
}

async function fetchJsonOptional(path: string) {
  const res = await fetch(`${API_URL}${path}`, { cache: "no-store" });
  if (!res.ok) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function adminHeaders() {
  if (!ADMIN_PASSWORD) {
    throw new Error(
      "Falta NEXT_PUBLIC_ADMIN_PASSWORD en el front (.env.local)."
    );
  }
  return {
    "Content-Type": "application/json",
    "x-admin-password": ADMIN_PASSWORD,
  };
}

export const store = {
  _hydrating: false as boolean,
  _hydrated: false as boolean,

  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getSectors(): Sector[] {
    return state.sectors;
  },
  getProducts(): Product[] {
    return state.products;
  },
  getMovements(): Movement[] {
    return state.movements;
  },

  getProductById(id: string): Product | undefined {
    return state.products.find((p) => p.id === id);
  },

  getSettings(): AppSettings {
    return state.settings;
  },

  async refreshProductsOnly() {
    const jsonP = await fetchJson(`/api/productos?activo=true`);
    const dataP = (jsonP?.data ?? []) as any[];
    const products = dataP.map(mapApiProducto);

    state = {
      ...state,
      products,
    };

    emitChange();
  },

  isLowStock(product: { stock: number; minStock?: number }): boolean {
    const threshold = product.minStock ?? state.settings.minStockGlobal;
    return Number(product.stock ?? 0) <= threshold;
  },

  // =========================
  // ✅ Métodos que faltaban para /mas/ubicaciones
  // =========================

  getProductsAtPosition(posicion: string): Product[] {
    const pos = String(posicion ?? "")
      .trim()
      .toUpperCase();
    if (!pos) return [];
    return state.products.filter(
      (p) => (p.ubicacion ?? "").toUpperCase() === pos
    );
  },

  getAllPositions(): Array<{ sectorId: string; posicion: string }> {
    // La UI espera { sectorId, posicion } donde posicion es "A1"
    return state.sectors.flatMap((s) =>
      s.posiciones.map((pos) => ({ sectorId: s.id, posicion: pos }))
    );
  },

  getSectorForUbicacion(ubicacion: string): Sector | undefined {
    const codigo = String(ubicacion ?? "")
      .trim()
      .toUpperCase();
    if (!codigo) return undefined;

    // Como ahora ubicacion = CODIGO (A1/B2/...), buscamos el sector
    // que tenga esa posición en su lista.
    return state.sectors.find((s) =>
      (s.posiciones ?? []).some((p) => String(p).toUpperCase() === codigo)
    );
  },

  async addSector(sectorName: string) {
    const name = String(sectorName ?? "")
      .trim()
      .toUpperCase();
    if (!name) return;

    const res = await fetch(`${API_URL}/api/ubicaciones`, {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({
        sector: name,
        codigo: "SIN-UBICACION",
        descripcion: "Ubicación inicial",
        activo: true,
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Error creando sector: HTTP ${res.status} ${txt}`);
    }

    await store.refresh();
  },

  async removeSector(sectorId: string) {
    // sectorId en tu store es el nombre del sector (ej: "SECTOR A")
    const sectorName = String(sectorId ?? "")
      .trim()
      .toUpperCase();
    if (!sectorName) return;

    // Borramos (baja lógica) todas las ubicaciones del sector
    const jsonU = await fetchJsonOptional(
      `/api/ubicaciones?activo=true&sector=${encodeURIComponent(sectorName)}`
    );
    const ubicaciones = (jsonU?.data ?? []) as any[];

    for (const u of ubicaciones) {
      const id = String(u?._id ?? "");
      if (!id) continue;

      const res = await fetch(
        `${API_URL}/api/ubicaciones/${encodeURIComponent(id)}`,
        {
          method: "DELETE",
          headers: adminHeaders(),
        }
      );

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Error eliminando sector: HTTP ${res.status} ${txt}`);
      }
    }

    await store.refresh();
  },

  async addPosition(sectorId: string, pos: string) {
    const sectorName = String(sectorId ?? "")
      .trim()
      .toUpperCase();
    const codigo = String(pos ?? "")
      .trim()
      .toUpperCase();
    if (!sectorName || !codigo) return;

    const res = await fetch(`${API_URL}/api/ubicaciones`, {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({
        sector: sectorName,
        codigo,
        descripcion: "",
        activo: true,
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Error agregando posición: HTTP ${res.status} ${txt}`);
    }

    await store.refresh();
  },

  async removePosition(sectorId: string, posicion: string) {
    const sectorName = String(sectorId ?? "")
      .trim()
      .toUpperCase();
    const codigo = String(posicion ?? "")
      .trim()
      .toUpperCase();
    if (!sectorName || !codigo) return;

    // Necesitamos el _id real de la ubicación
    const ubicacionId = state.ubicacionesByCodigo.get(codigo);
    if (!ubicacionId) {
      throw new Error(`No se encontró la ubicación ${codigo}`);
    }

    const res = await fetch(
      `${API_URL}/api/ubicaciones/${encodeURIComponent(ubicacionId)}`,
      {
        method: "DELETE",
        headers: adminHeaders(),
      }
    );

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Error eliminando posición: HTTP ${res.status} ${txt}`);
    }

    await store.refresh();
  },

  async moveProduct(productId: string, newUbicacion: string) {
    // newUbicacion llega como "A1" desde la UI (posicion/codigo)
    const codigo = String(newUbicacion ?? "")
      .trim()
      .toUpperCase();

    // Si viene vacío: el backend lo transforma a default (por lo que implementaste)
    const ubicacionId = codigo ? state.ubicacionesByCodigo.get(codigo) : "";

    if (codigo && !ubicacionId) {
      throw new Error(`Ubicación inválida: ${codigo}`);
    }

    const res = await fetch(
      `${API_URL}/api/productos/${encodeURIComponent(productId)}`,
      {
        method: "PUT", // tu backend usa PUT /api/productos/:id
        headers: adminHeaders(),
        body: JSON.stringify({
          ubicacionId: ubicacionId || "", // "" => default en backend
        }),
      }
    );

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Error moviendo producto: HTTP ${res.status} ${txt}`);
    }

    await store.refresh();
  },

  // =========================
  // Existing methods
  // =========================

  async sellStock(data: {
    productId: string;
    cantidad: number;
    observacion: string;
  }) {
    const qty = Number(data.cantidad);
    if (!Number.isFinite(qty) || qty <= 0)
      throw new Error("Cantidad inválida para venta");

    const res = await fetch(
      `${API_URL}/api/productos/${encodeURIComponent(data.productId)}/stock`,
      {
        method: "PATCH",
        headers: adminHeaders(),
        body: JSON.stringify({
          cantidad: -Math.abs(qty),
          observaciones: data.observacion || "Venta",
        }),
      }
    );

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Error venta: HTTP ${res.status} ${txt}`);
    }

    await store.refresh();
  },

  async hydrateFromApi(force = false) {
    if (store._hydrating) return;
    if (store._hydrated && !force) return;

    store._hydrating = true;

    try {
      // 0) Ubicaciones (para sectores + resolver codigo <-> id)
      const jsonU = await fetchJsonOptional(`/api/ubicaciones?activo=true`);
      const ubicaciones = (jsonU?.data ?? []) as any[];

      const bySector = new Map<string, Set<string>>();
      const byCodigo = new Map<string, string>();
      const byId = new Map<string, { sector: string; codigo: string }>();

      for (const u of ubicaciones) {
        const sector = String(u?.sector ?? "").trim();
        const codigo = String(u?.codigo ?? "").trim();
        const id = String(u?._id ?? "").trim();
        if (!sector || !codigo || !id) continue;

        const sKey = sector.toUpperCase();
        const cKey = codigo.toUpperCase();

        if (!bySector.has(sKey)) bySector.set(sKey, new Set());
        bySector.get(sKey)!.add(cKey);

        byCodigo.set(cKey, id);
        byId.set(id, { sector: sKey, codigo: cKey });
      }

      const sectors: Sector[] = Array.from(bySector.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([sector, codigos]) => ({
          id: sector,
          nombre: sector,
          posiciones: Array.from(codigos).sort((a, b) => a.localeCompare(b)),
        }));

      // 1) Productos
      const jsonP = await fetchJson(`/api/productos?activo=true`);
      const dataP = (jsonP?.data ?? []) as any[];
      const products = dataP.map(mapApiProducto);

      const productNameById = new Map<string, string>();
      for (const p of products) productNameById.set(p.id, p.nombre);

      // 2) Movimientos
      const movementResponses = await Promise.all(
        products.map(async (p) => {
          const jm = await fetchJsonOptional(
            `/api/productos/${encodeURIComponent(p.id)}/movimientos?limit=50`
          );
          return (jm?.data ?? []) as any[];
        })
      );

      const movements = movementResponses
        .flat()
        .map((m) => mapApiMovimiento(m, productNameById))
        .sort((a, b) => b.fecha.getTime() - a.fecha.getTime());

      state = {
        ...state,
        sectors,
        products,
        movements,
        ubicacionesByCodigo: byCodigo,
        ubicacionesById: byId,
      };

      store._hydrated = true;
      emitChange();
    } finally {
      store._hydrating = false;
    }
  },

  async addStock(data: {
    productId: string;
    cantidad: number;
    observacion: string;
  }) {
    const res = await fetch(
      `${API_URL}/api/productos/${encodeURIComponent(data.productId)}/stock`,
      {
        method: "PATCH",
        headers: adminHeaders(),
        body: JSON.stringify({
          cantidad: Number(data.cantidad),
          observaciones: data.observacion || "Alta de stock",
        }),
      }
    );

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Error alta stock: HTTP ${res.status} ${txt}`);
    }

    await store.refresh();
  },

  async updateProduct(
    id: string,
    data: {
      nombre: string;
      caracteristicas: string;
      precio: number;
      minStock?: number;
      ubicacion?: string; // acá es ubicacionId o "" por tu flujo
      imagen?: string;
    }
  ) {
    const res = await fetch(
      `${API_URL}/api/productos/${encodeURIComponent(id)}`,
      {
        method: "PUT",
        headers: adminHeaders(),
        body: JSON.stringify({
          nombre: data.nombre,
          descripcion: data.caracteristicas,
          precio: data.precio,
          stockMinimo: data.minStock,
          ubicacionId: data.ubicacion, // "" => default en backend
        }),
      }
    );

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Error actualizando producto: HTTP ${res.status} ${txt}`);
    }

    await store.refresh();
  },

  async refresh() {
    await store.hydrateFromApi(true);
  },
};
