// In-memory store for Stock Repuestos
// Uses a simple pub/sub pattern for reactivity with useSyncExternalStore

export interface Sector {
  id: string
  nombre: string
  posiciones: string[]
}

export interface Product {
  id: string
  nombre: string
  caracteristicas: string
  precio: number
  stock: number
  minStock?: number
  ubicacion?: string
  imagen?: string
  createdAt: Date
}

export type MovementType = "ALTA_INICIAL" | "INGRESO_COMPRA" | "VENTA"

export interface Movement {
  id: string
  productId: string
  productName: string
  tipo: MovementType
  cantidad: number
  observacion: string
  fecha: Date
}

export interface Sale {
  id: string
  items: {
    productId: string
    productName: string
    cantidad: number
    precioUnitario: number
    subtotal: number
  }[]
  total: number
  cliente: string
  observacion: string
  fecha: Date
}

export type PreSaleStatus = "PENDIENTE" | "CONFIRMADA" | "RECHAZADA"

export interface PreSale {
  id: string
  items: {
    productId: string
    productName: string
    cantidad: number
    precioUnitario: number
    subtotal: number
  }[]
  total: number
  contacto: string
  fecha: Date
  estado: PreSaleStatus
  motivoRechazo?: string
}

export interface AppSettings {
  minStockGlobal: number
}

let nextProductId = 16
let nextMovementId = 30
let nextSaleId = 6
let nextSectorId = 5
let nextPreSaleId = 4

const initialSectors: Sector[] = [
  { id: "1", nombre: "SECTOR A", posiciones: ["A1", "A2", "A3", "A4"] },
  { id: "2", nombre: "SECTOR B", posiciones: ["B1", "B2", "B3"] },
  { id: "3", nombre: "SECTOR C", posiciones: ["C1", "C2", "C3"] },
  { id: "4", nombre: "SECTOR D", posiciones: ["D1", "D2"] },
]

const initialProducts: Product[] = [
  { id: "1", nombre: "Filtro de aceite Mann W712", caracteristicas: "Marca Mann, compatible con motores 1.6 y 2.0 TSI", precio: 3500, stock: 12, ubicacion: "A1", imagen: "/images/products/filtro-aceite.jpg", createdAt: new Date("2026-01-05") },
  { id: "2", nombre: "Pastillas de freno Ferodo", caracteristicas: "Delanteras, para Peugeot 208/308 y Citroen C4", precio: 12000, stock: 4, minStock: 6, ubicacion: "A2", imagen: "/images/products/pastillas-freno.jpg", createdAt: new Date("2026-01-08") },
  { id: "3", nombre: "Bujias NGK Iridium (x4)", caracteristicas: "Rosca 14mm, para motores nafteros 1.4-2.0", precio: 4800, stock: 20, ubicacion: "A3", imagen: "/images/products/bujias.jpg", createdAt: new Date("2026-01-10") },
  { id: "4", nombre: "Correa de distribucion Gates", caracteristicas: "Kit completo con tensor, VW Gol/Trend 1.6", precio: 28000, stock: 3, ubicacion: "B1", imagen: "/images/products/correa-distribucion.jpg", createdAt: new Date("2026-01-12") },
  { id: "5", nombre: "Amortiguador Monroe del.", caracteristicas: "Delantero derecho, Toyota Corolla 2014-2019", precio: 45000, stock: 2, minStock: 4, ubicacion: "C1", imagen: "/images/products/amortiguador.jpg", createdAt: new Date("2026-01-15") },
  { id: "6", nombre: "Aceite Castrol 5W30 (4L)", caracteristicas: "Sintetico, API SN, ACEA C3, bidones 4 litros", precio: 18000, stock: 8, ubicacion: "A4", imagen: "/images/products/aceite-motor.jpg", createdAt: new Date("2026-01-18") },
  { id: "7", nombre: "Discos de freno Fremax", caracteristicas: "Ventilados delanteros, Ford Focus III / Mondeo", precio: 22000, stock: 5, ubicacion: "A2", imagen: "/images/products/discos-freno.jpg", createdAt: new Date("2026-01-22") },
  { id: "8", nombre: "Bateria Moura 12x65", caracteristicas: "65Ah, libre mantenimiento, para autos medianos", precio: 85000, stock: 3, ubicacion: "D1", imagen: "/images/products/bateria.jpg", createdAt: new Date("2026-01-25") },
  { id: "9", nombre: "Bomba de agua Dolz", caracteristicas: "Renault Clio/Kangoo/Logan K4M 1.6 16v", precio: 15500, stock: 6, ubicacion: "B2", imagen: "/images/products/bomba-agua.jpg", createdAt: new Date("2026-02-01") },
  { id: "10", nombre: "Juego de escobillas Bosch", caracteristicas: "Aerofit 22/18 pulgadas, enganche universal J-Hook", precio: 7500, stock: 14, ubicacion: "C2", imagen: "/images/products/escobillas.jpg", createdAt: new Date("2026-02-05") },
  { id: "11", nombre: "Termostato Wahler", caracteristicas: "88 grados C, Chevrolet Cruze/Tracker 1.8", precio: 9200, stock: 7, ubicacion: "B3", imagen: "/images/products/termostato.jpg", createdAt: new Date("2026-02-07") },
  { id: "12", nombre: "Kit de embrague Valeo", caracteristicas: "Disco + prensa + ruleman, VW Gol Power 1.4", precio: 52000, stock: 2, ubicacion: "C3", imagen: "/images/products/kit-embrague.jpg", createdAt: new Date("2026-02-09") },
  { id: "13", nombre: "Radiador Denso", caracteristicas: "Toyota Hilux 2.5 TD 2005-2015, aluminio/plastico", precio: 68000, stock: 1, ubicacion: "D2", imagen: "/images/products/radiador.jpg", createdAt: new Date("2026-02-10") },
  { id: "14", nombre: "Filtro de aire Mahle", caracteristicas: "Panel, compatible con VW Vento/Golf VII 1.4 TSI", precio: 5600, stock: 18, ubicacion: "A1", imagen: "/images/products/filtro-aire.jpg", createdAt: new Date("2026-02-11") },
  { id: "15", nombre: "Tensor de distribucion SKF", caracteristicas: "Con rodamiento, Fiat Palio/Siena 1.3-1.6 16v", precio: 11000, stock: 4, ubicacion: "B1", imagen: "/images/products/tensor-distribucion.jpg", createdAt: new Date("2026-02-12") },
]

const initialMovements: Movement[] = [
  { id: "1", productId: "1", productName: "Filtro de aceite Mann W712", tipo: "ALTA_INICIAL", cantidad: 15, observacion: "Stock inicial", fecha: new Date("2026-01-05") },
  { id: "2", productId: "2", productName: "Pastillas de freno Ferodo", tipo: "ALTA_INICIAL", cantidad: 8, observacion: "Stock inicial", fecha: new Date("2026-01-08") },
  { id: "3", productId: "3", productName: "Bujias NGK Iridium (x4)", tipo: "ALTA_INICIAL", cantidad: 20, observacion: "Stock inicial", fecha: new Date("2026-01-10") },
  { id: "4", productId: "4", productName: "Correa de distribucion Gates", tipo: "ALTA_INICIAL", cantidad: 5, observacion: "Stock inicial", fecha: new Date("2026-01-12") },
  { id: "5", productId: "5", productName: "Amortiguador Monroe del.", tipo: "ALTA_INICIAL", cantidad: 4, observacion: "Stock inicial", fecha: new Date("2026-01-15") },
  { id: "6", productId: "6", productName: "Aceite Castrol 5W30 (4L)", tipo: "ALTA_INICIAL", cantidad: 10, observacion: "Stock inicial", fecha: new Date("2026-01-18") },
  { id: "7", productId: "7", productName: "Discos de freno Fremax", tipo: "ALTA_INICIAL", cantidad: 6, observacion: "Stock inicial", fecha: new Date("2026-01-22") },
  { id: "8", productId: "8", productName: "Bateria Moura 12x65", tipo: "ALTA_INICIAL", cantidad: 3, observacion: "Stock inicial", fecha: new Date("2026-01-25") },
  { id: "9", productId: "9", productName: "Bomba de agua Dolz", tipo: "ALTA_INICIAL", cantidad: 6, observacion: "Stock inicial", fecha: new Date("2026-02-01") },
  { id: "10", productId: "10", productName: "Juego de escobillas Bosch", tipo: "ALTA_INICIAL", cantidad: 14, observacion: "Stock inicial", fecha: new Date("2026-02-05") },
  { id: "11", productId: "11", productName: "Termostato Wahler", tipo: "ALTA_INICIAL", cantidad: 7, observacion: "Stock inicial", fecha: new Date("2026-02-07") },
  { id: "12", productId: "12", productName: "Kit de embrague Valeo", tipo: "ALTA_INICIAL", cantidad: 2, observacion: "Stock inicial", fecha: new Date("2026-02-09") },
  { id: "13", productId: "13", productName: "Radiador Denso", tipo: "ALTA_INICIAL", cantidad: 1, observacion: "Stock inicial", fecha: new Date("2026-02-10") },
  { id: "14", productId: "14", productName: "Filtro de aire Mahle", tipo: "ALTA_INICIAL", cantidad: 18, observacion: "Stock inicial", fecha: new Date("2026-02-11") },
  { id: "15", productId: "15", productName: "Tensor de distribucion SKF", tipo: "ALTA_INICIAL", cantidad: 4, observacion: "Stock inicial", fecha: new Date("2026-02-12") },
  { id: "16", productId: "1", productName: "Filtro de aceite Mann W712", tipo: "VENTA", cantidad: 3, observacion: "Venta mostrador", fecha: new Date("2026-01-20") },
  { id: "17", productId: "2", productName: "Pastillas de freno Ferodo", tipo: "VENTA", cantidad: 2, observacion: "Venta taller Gomez", fecha: new Date("2026-01-28") },
  { id: "18", productId: "5", productName: "Amortiguador Monroe del.", tipo: "VENTA", cantidad: 2, observacion: "Venta taller Sur", fecha: new Date("2026-02-02") },
  { id: "19", productId: "4", productName: "Correa de distribucion Gates", tipo: "VENTA", cantidad: 2, observacion: "Venta mostrador", fecha: new Date("2026-02-04") },
  { id: "20", productId: "6", productName: "Aceite Castrol 5W30 (4L)", tipo: "VENTA", cantidad: 2, observacion: "Venta taller norte", fecha: new Date("2026-02-06") },
  { id: "21", productId: "7", productName: "Discos de freno Fremax", tipo: "VENTA", cantidad: 1, observacion: "Venta mostrador", fecha: new Date("2026-02-07") },
  { id: "22", productId: "2", productName: "Pastillas de freno Ferodo", tipo: "VENTA", cantidad: 2, observacion: "Venta cliente particular", fecha: new Date("2026-02-10") },
  { id: "23", productId: "1", productName: "Filtro de aceite Mann W712", tipo: "INGRESO_COMPRA", cantidad: 5, observacion: "Compra proveedor Dist. Norte - Factura #A0042", fecha: new Date("2026-02-08") },
  { id: "24", productId: "3", productName: "Bujias NGK Iridium (x4)", tipo: "INGRESO_COMPRA", cantidad: 10, observacion: "Compra proveedor NGK directo - Factura #B0015", fecha: new Date("2026-02-12") },
]

const initialSales: Sale[] = [
  { id: "1", items: [{ productId: "1", productName: "Filtro de aceite Mann W712", cantidad: 2, precioUnitario: 3500, subtotal: 7000 }, { productId: "6", productName: "Aceite Castrol 5W30 (4L)", cantidad: 1, precioUnitario: 18000, subtotal: 18000 }], total: 25000, cliente: "Taller Gomez", observacion: "Service completo Corolla", fecha: new Date("2026-01-20") },
  { id: "2", items: [{ productId: "2", productName: "Pastillas de freno Ferodo", cantidad: 2, precioUnitario: 12000, subtotal: 24000 }, { productId: "7", productName: "Discos de freno Fremax", cantidad: 1, precioUnitario: 22000, subtotal: 22000 }], total: 46000, cliente: "Taller Sur Automotor", observacion: "Tren delantero Peugeot 308", fecha: new Date("2026-01-28") },
  { id: "3", items: [{ productId: "5", productName: "Amortiguador Monroe del.", cantidad: 2, precioUnitario: 45000, subtotal: 90000 }], total: 90000, cliente: "Cliente particular", observacion: "", fecha: new Date("2026-02-02") },
  { id: "4", items: [{ productId: "4", productName: "Correa de distribucion Gates", cantidad: 2, precioUnitario: 28000, subtotal: 56000 }], total: 56000, cliente: "Taller Norte", observacion: "Kit de distribucion VW Gol", fecha: new Date("2026-02-04") },
  { id: "5", items: [{ productId: "1", productName: "Filtro de aceite Mann W712", cantidad: 1, precioUnitario: 3500, subtotal: 3500 }, { productId: "6", productName: "Aceite Castrol 5W30 (4L)", cantidad: 1, precioUnitario: 18000, subtotal: 18000 }, { productId: "2", productName: "Pastillas de freno Ferodo", cantidad: 2, precioUnitario: 12000, subtotal: 24000 }], total: 45500, cliente: "Mecanica Express", observacion: "Service + frenos Focus III", fecha: new Date("2026-02-10") },
]

const initialPreSales: PreSale[] = [
  { id: "1", items: [{ productId: "3", productName: "Bujias NGK Iridium (x4)", cantidad: 2, precioUnitario: 4800, subtotal: 9600 }, { productId: "6", productName: "Aceite Castrol 5W30 (4L)", cantidad: 1, precioUnitario: 18000, subtotal: 18000 }], total: 27600, contacto: "Martin Lopez", fecha: new Date("2026-02-14T10:30:00"), estado: "PENDIENTE" },
  { id: "2", items: [{ productId: "8", productName: "Bateria Moura 12x65", cantidad: 1, precioUnitario: 85000, subtotal: 85000 }], total: 85000, contacto: "Carlos Mendez", fecha: new Date("2026-02-13T15:20:00"), estado: "CONFIRMADA" },
  { id: "3", items: [{ productId: "13", productName: "Radiador Denso", cantidad: 2, precioUnitario: 68000, subtotal: 136000 }], total: 136000, contacto: "Taller Ramos", fecha: new Date("2026-02-12T09:45:00"), estado: "RECHAZADA", motivoRechazo: "Sin stock suficiente" },
]

let sectors: Sector[] = [...initialSectors]
let products: Product[] = [...initialProducts]
let movements: Movement[] = [...initialMovements]
let sales: Sale[] = [...initialSales]
let preSales: PreSale[] = [...initialPreSales]
let settings: AppSettings = { minStockGlobal: 5 }
let listeners: Set<() => void> = new Set()

function emitChange() {
  listeners.forEach((listener) => listener())
}

export const store = {
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },

  getProducts(): Product[] { return products },
  getMovements(): Movement[] { return movements },
  getSales(): Sale[] { return sales },
  getPreSales(): PreSale[] { return preSales },
  getSettings(): AppSettings { return settings },
  getSectors(): Sector[] { return sectors },

  getProductById(id: string): Product | undefined {
    return products.find((p) => p.id === id)
  },

  isLowStock(product: Product): boolean {
    const threshold = product.minStock ?? settings.minStockGlobal
    return product.stock <= threshold
  },

  getLowStockCount(): number {
    return products.filter((p) => store.isLowStock(p)).length
  },

  getSectorForUbicacion(ubicacion: string): Sector | undefined {
    return sectors.find((s) => s.posiciones.includes(ubicacion))
  },

  getProductsAtPosition(posicion: string): Product[] {
    return products.filter((p) => p.ubicacion === posicion)
  },

  getAllPositions(): { posicion: string; sector: string }[] {
    const result: { posicion: string; sector: string }[] = []
    for (const s of sectors) {
      for (const p of s.posiciones) {
        result.push({ posicion: p, sector: s.nombre })
      }
    }
    return result
  },

  addProduct(data: {
    nombre: string
    caracteristicas: string
    precio: number
    stockInicial: number
    minStock?: number
    ubicacion?: string
    imagen?: string
  }): Product {
    const id = String(nextProductId++)
    const product: Product = {
      id,
      nombre: data.nombre,
      caracteristicas: data.caracteristicas,
      precio: data.precio,
      stock: data.stockInicial,
      minStock: data.minStock,
      ubicacion: data.ubicacion || undefined,
      imagen: data.imagen || undefined,
      createdAt: new Date(),
    }
    products = [...products, product]

    if (data.stockInicial > 0) {
      const movement: Movement = {
        id: String(nextMovementId++),
        productId: id,
        productName: product.nombre,
        tipo: "ALTA_INICIAL",
        cantidad: data.stockInicial,
        observacion: "Stock inicial",
        fecha: new Date(),
      }
      movements = [movement, ...movements]
    }

    emitChange()
    return product
  },

  updateProduct(id: string, data: { nombre: string; caracteristicas: string; precio: number; minStock?: number; ubicacion?: string; imagen?: string }) {
    products = products.map((p) => p.id === id ? { ...p, ...data } : p)
    emitChange()
  },

  moveProduct(productId: string, newUbicacion: string) {
    products = products.map((p) => p.id === productId ? { ...p, ubicacion: newUbicacion || undefined } : p)
    emitChange()
  },

  addStock(data: { productId: string; cantidad: number; observacion: string }) {
    const product = products.find((p) => p.id === data.productId)
    if (!product) return
    products = products.map((p) => p.id === data.productId ? { ...p, stock: p.stock + data.cantidad } : p)
    const movement: Movement = {
      id: String(nextMovementId++),
      productId: data.productId,
      productName: product.nombre,
      tipo: "INGRESO_COMPRA",
      cantidad: data.cantidad,
      observacion: data.observacion || "Compra de stock",
      fecha: new Date(),
    }
    movements = [movement, ...movements]
    emitChange()
  },

  sellProducts(data: { items: { productId: string; cantidad: number }[]; cliente: string; observacion: string }): Sale | null {
    const saleItems: Sale["items"] = []
    for (const item of data.items) {
      const product = products.find((p) => p.id === item.productId)
      if (!product || product.stock < item.cantidad) return null
      saleItems.push({ productId: product.id, productName: product.nombre, cantidad: item.cantidad, precioUnitario: product.precio, subtotal: product.precio * item.cantidad })
    }
    for (const item of data.items) {
      const product = products.find((p) => p.id === item.productId)!
      products = products.map((p) => p.id === item.productId ? { ...p, stock: p.stock - item.cantidad } : p)
      const movement: Movement = { id: String(nextMovementId++), productId: item.productId, productName: product.nombre, tipo: "VENTA", cantidad: item.cantidad, observacion: data.cliente ? `Venta a ${data.cliente}` : "Venta mostrador", fecha: new Date() }
      movements = [movement, ...movements]
    }
    const sale: Sale = { id: String(nextSaleId++), items: saleItems, total: saleItems.reduce((sum, i) => sum + i.subtotal, 0), cliente: data.cliente, observacion: data.observacion, fecha: new Date() }
    sales = [sale, ...sales]
    emitChange()
    return sale
  },

  // ---- Pre-Sales ----
  createPreSale(data: { items: { productId: string; cantidad: number }[]; contacto: string }): PreSale {
    const preSaleItems: PreSale["items"] = []
    for (const item of data.items) {
      const product = products.find((p) => p.id === item.productId)
      if (!product) continue
      preSaleItems.push({ productId: product.id, productName: product.nombre, cantidad: item.cantidad, precioUnitario: product.precio, subtotal: product.precio * item.cantidad })
    }
    const preSale: PreSale = {
      id: String(nextPreSaleId++),
      items: preSaleItems,
      total: preSaleItems.reduce((sum, i) => sum + i.subtotal, 0),
      contacto: data.contacto,
      fecha: new Date(),
      estado: "PENDIENTE",
    }
    preSales = [preSale, ...preSales]
    emitChange()
    return preSale
  },

  confirmPreSale(id: string, modifiedItems?: PreSale["items"]): Sale | null {
    const preSale = preSales.find((ps) => ps.id === id)
    if (!preSale || preSale.estado !== "PENDIENTE") return null

    const itemsToUse = modifiedItems || preSale.items

    // Check stock
    for (const item of itemsToUse) {
      const product = products.find((p) => p.id === item.productId)
      if (!product || product.stock < item.cantidad) return null
    }

    // Deduct stock and create movements
    for (const item of itemsToUse) {
      const product = products.find((p) => p.id === item.productId)!
      products = products.map((p) => p.id === item.productId ? { ...p, stock: p.stock - item.cantidad } : p)
      const movement: Movement = { id: String(nextMovementId++), productId: item.productId, productName: product.nombre, tipo: "VENTA", cantidad: item.cantidad, observacion: `Pre-venta #${preSale.id} - ${preSale.contacto}`, fecha: new Date() }
      movements = [movement, ...movements]
    }

    // Create sale
    const sale: Sale = {
      id: String(nextSaleId++),
      items: itemsToUse,
      total: itemsToUse.reduce((sum, i) => sum + i.subtotal, 0),
      cliente: preSale.contacto,
      observacion: `Desde pre-venta #${preSale.id}`,
      fecha: new Date(),
    }
    sales = [sale, ...sales]

    // Update pre-sale status
    preSales = preSales.map((ps) => ps.id === id ? { ...ps, estado: "CONFIRMADA" as PreSaleStatus, items: itemsToUse, total: itemsToUse.reduce((sum, i) => sum + i.subtotal, 0) } : ps)

    emitChange()
    return sale
  },

  rejectPreSale(id: string, motivo: string) {
    preSales = preSales.map((ps) => ps.id === id ? { ...ps, estado: "RECHAZADA" as PreSaleStatus, motivoRechazo: motivo } : ps)
    emitChange()
  },

  updateSettings(newSettings: Partial<AppSettings>) {
    settings = { ...settings, ...newSettings }
    emitChange()
  },

  // ---- Sectors ----
  addSector(nombre: string): Sector {
    const id = String(nextSectorId++)
    const sector: Sector = { id, nombre: nombre.toUpperCase(), posiciones: [] }
    sectors = [...sectors, sector]
    emitChange()
    return sector
  },

  addPosition(sectorId: string, posicion: string) {
    sectors = sectors.map((s) => s.id === sectorId ? { ...s, posiciones: [...s.posiciones, posicion.toUpperCase()] } : s)
    emitChange()
  },

  removePosition(sectorId: string, posicion: string) {
    products = products.map((p) => p.ubicacion === posicion ? { ...p, ubicacion: undefined } : p)
    sectors = sectors.map((s) => s.id === sectorId ? { ...s, posiciones: s.posiciones.filter((p) => p !== posicion) } : s)
    emitChange()
  },

  removeSector(sectorId: string) {
    const sector = sectors.find((s) => s.id === sectorId)
    if (!sector) return
    for (const pos of sector.posiciones) {
      products = products.map((p) => p.ubicacion === pos ? { ...p, ubicacion: undefined } : p)
    }
    sectors = sectors.filter((s) => s.id !== sectorId)
    emitChange()
  },
}
