const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "";

export type CrearVentaInput = {
  cliente?: string;
  origen: "admin" | "catalogo_web" | "whatsapp";
  observacion?: string;
  envio?: {
    tipo: "retiro" | "montevideo" | "interior";
    cedula?: string;
    nombre?: string;
    telefono?: string;
    localidad?: string;
    empresaEnvio?: string;
  };
  items: { productoId: string; cantidad: number }[];
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
    // Si confirmás sin esto, siempre te va a dar 401
    throw new Error(
      "Falta NEXT_PUBLIC_ADMIN_PASSWORD en frontend/.env.local (reinicia npm run dev)"
    );
  }

  return {
    "Content-Type": "application/json",
    "x-admin-password": ADMIN_PASSWORD,
  };
}

export async function crearVenta(input: CrearVentaInput) {
  // Para admin, mandamos auth (aunque el POST esté abierto, no molesta)
  const res = await fetch(`${API_URL}/api/ventas`, {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    throw new Error(await readError(res));
  }

  return await res.json(); // { data: venta }
}

export async function confirmarVenta(ventaId: string) {
  const res = await fetch(`${API_URL}/api/ventas/${ventaId}/confirmar`, {
    method: "POST",
    headers: adminHeaders(),
  });

  if (!res.ok) {
    throw new Error(await readError(res));
  }

  return await res.json(); // { data: venta }
}
