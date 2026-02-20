// lib/store.ts
// Store in-memory con pub/sub (useSyncExternalStore)
// Sin datos hardcodeados: se hidrata desde el backend.

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
  ubicacion?: string;
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

  const ubicacion =
    p?.ubicacionId?.sector && p?.ubicacionId?.codigo
      ? `${p.ubicacionId.sector} - ${p.ubicacionId.codigo}`
      : p?.ubicacion ?? undefined;

  return {
    id: String(p._id ?? p.id),
    nombre: p.nombre ?? "",
    caracteristicas: p.caracteristicas ?? p.descripcion ?? "",
    precio: Number(p.precio ?? 0),
    stock: Number(p.stock ?? 0),
    minStock: p.minStock ?? p.stockMinimo ?? undefined,
    ubicacion,
    imagen,
    createdAt: toDate(p.createdAt ?? p.updatedAt),
  };
}

// JSON real de movimientos:
// { _id, productoId, tipo: "venta"|"ingreso", cantidad: -N|+N, observaciones, createdAt }
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

function mapApiSector(s: any): Sector {
  return {
    id: String(s?._id ?? s?.id),
    nombre: String(s?.nombre ?? "").toUpperCase(),
    posiciones: Array.isArray(s?.posiciones)
      ? s.posiciones.map((p: any) => String(p).toUpperCase())
      : [],
  };
}

type Snapshot = {
  sectors: Sector[];
  products: Product[];
  movements: Movement[];
  settings: AppSettings;
};

let state: Snapshot = {
  sectors: [],
  products: [],
  movements: [],
  settings: { minStockGlobal: 5 },
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

async function fetchJsonOptional(path: string) {
  const res = await fetch(`${API_URL}${path}`, { cache: "no-store" });
  if (!res.ok) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
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
  getSectorForUbicacion(ubicacion: string): Sector | undefined {
    // ubicacion viene como "SECTOR - CODIGO"
    const parts = String(ubicacion)
      .split("-")
      .map((s) => s.trim());
    const sector = (parts[0] || "").toUpperCase();
    if (!sector) return undefined;
    return state.sectors.find((s) => s.nombre === sector || s.id === sector);
  },
  getProductById(id: string): Product | undefined {
    return state.products.find((p) => p.id === id);
  },
  getSettings(): AppSettings {
    return state.settings;
  },

  isLowStock(product: { stock: number; minStock?: number }): boolean {
    const threshold = product.minStock ?? state.settings.minStockGlobal;
    return Number(product.stock ?? 0) <= threshold;
  },

  async sellStock(data: {
    productId: string;
    cantidad: number;
    observacion: string;
  }) {
    // cantidad debe ser positiva en la UI; acá la mandamos negativa al backend
    const qty = Number(data.cantidad);
    if (!Number.isFinite(qty) || qty <= 0) {
      throw new Error("Cantidad inválida para venta");
    }

    const res = await fetch(
      `${API_URL}/api/productos/${encodeURIComponent(data.productId)}/stock`,
      {
        method: "PATCH",
        headers: adminHeaders(),
        body: JSON.stringify({
          cantidad: -Math.abs(qty), // ✅ venta = negativo
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
      // 0) Sectores (desde ubicaciones)
      //    Armamos Sector[] agrupando por "sector" y listando los "codigo"
      //    Mantiene el shape esperado por el front: { id, nombre, posiciones[] }
      const jsonU = await fetchJsonOptional(`/api/ubicaciones?activo=true`);
      const ubicaciones = (jsonU?.data ?? []) as any[];

      const bySector = new Map<string, Set<string>>();
      for (const u of ubicaciones) {
        const sector = String(u?.sector ?? "").trim();
        const codigo = String(u?.codigo ?? "").trim();
        if (!sector || !codigo) continue;

        const key = sector.toUpperCase();
        if (!bySector.has(key)) bySector.set(key, new Set());
        bySector.get(key)!.add(codigo.toUpperCase());
      }

      const sectors: Sector[] = Array.from(bySector.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([sector, codigos]) => ({
          id: sector, // id estable (string)
          nombre: sector,
          posiciones: Array.from(codigos).sort((a, b) => a.localeCompare(b)),
        }));

      // 1) Productos (este tiene que existir)
      const jsonP = await fetchJson(`/api/productos?activo=true`);
      const dataP = (jsonP?.data ?? []) as any[];
      const products = dataP.map(mapApiProducto);

      const productNameById = new Map<string, string>();
      for (const p of products) productNameById.set(p.id, p.nombre);

      // 2) Movimientos por producto
      //    Endpoint: /api/productos/:productoId/movimientos?limit=50
      const movementResponses = await Promise.all(
        products.map(async (p) => {
          const jm = await fetchJsonOptional(
            `/api/productos/${encodeURIComponent(p.id)}/movimientos?limit=50`
          );
          const dataM = (jm?.data ?? []) as any[];
          return dataM;
        })
      );

      const mergedRaw = movementResponses.flat();
      const movements = mergedRaw
        .map((m) => mapApiMovimiento(m, productNameById))
        .sort((a, b) => b.fecha.getTime() - a.fecha.getTime());

      state = {
        ...state,
        sectors,
        products,
        movements,
      };

      store._hydrated = true;
      emitChange();
    } finally {
      store._hydrating = false;
    }
  },

  // =========================
  // Mutations -> BACKEND
  // (mantiene API esperada por componentes)
  // =========================

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

  async moveProduct(productId: string, newUbicacion: string) {
    const res = await fetch(
      `${API_URL}/api/productos/${encodeURIComponent(productId)}`,
      {
        method: "PATCH",
        headers: adminHeaders(),
        body: JSON.stringify({ ubicacion: newUbicacion }),
      }
    );

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Error moviendo producto: HTTP ${res.status} ${txt}`);
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
      ubicacion?: string;
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
          ubicacionId: data.ubicacion,
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
