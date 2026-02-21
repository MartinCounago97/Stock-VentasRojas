"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { MapPin } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";

type Ubicacion = {
  _id: string;
  sector: string;
  codigo: string;
  descripcion?: string;
  activo: boolean;
};

interface LocationPickerProps {
  value: string; // ✅ ubicacionId (ObjectId)
  onChange: (value: string) => void; // devuelve ubicacionId o "" si none
}

export function LocationPicker({ value, onChange }: LocationPickerProps) {
  const [loading, setLoading] = useState(true);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/ubicaciones?activo=true`, {
          cache: "no-store",
        });

        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`Error ubicaciones: HTTP ${res.status} ${txt}`);
        }

        const json = await res.json();
        const data = (json?.data ?? []) as Ubicacion[];

        if (mounted) setUbicaciones(data);
      } catch (e: any) {
        toast.error(e?.message || "Error cargando ubicaciones");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, Ubicacion[]>();

    for (const u of ubicaciones) {
      const sector = String(u?.sector ?? "")
        .toUpperCase()
        .trim();
      if (!sector) continue;

      if (!map.has(sector)) map.set(sector, []);
      map.get(sector)!.push(u);
    }

    const sectors = Array.from(map.keys()).sort((a, b) => a.localeCompare(b));

    return sectors.map((sector) => ({
      sector,
      items: map
        .get(sector)!
        .slice()
        .sort((a, b) =>
          String(a.codigo ?? "").localeCompare(String(b.codigo ?? ""))
        ),
    }));
  }, [ubicaciones]);

  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm font-medium">
        <span className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
          Ubicacion
        </span>
      </Label>

      <Select
        value={value || "none"}
        onValueChange={(v) => onChange(v === "none" ? "" : v)}
        disabled={loading}
      >
        <SelectTrigger className="h-11 rounded-xl">
          <SelectValue
            placeholder={
              loading ? "Cargando ubicaciones..." : "Sin ubicacion asignada"
            }
          />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="none">
            <span className="text-muted-foreground">Sin ubicacion</span>
          </SelectItem>

          {grouped.map((g) => (
            <div key={g.sector}>
              <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {g.sector}
              </div>

              {g.items.map((u) => (
                <SelectItem key={u._id} value={u._id}>
                  <span className="font-mono font-semibold">
                    {String(u.codigo ?? "").toUpperCase()}
                  </span>
                  <span className="ml-2 text-muted-foreground">{g.sector}</span>
                </SelectItem>
              ))}
            </div>
          ))}
        </SelectContent>
      </Select>

      <p className="text-xs text-muted-foreground">
        Sector y posicion donde se almacena el producto
      </p>
    </div>
  );
}

export function LocationBadge({ ubicacion }: { ubicacion?: string }) {
  if (!ubicacion) {
    return (
      <span className="inline-flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground">
        <MapPin className="h-3 w-3" />
        Sin ubicacion
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg bg-chart-1/10 px-2.5 py-1 text-xs font-bold text-chart-1">
      <MapPin className="h-3 w-3" />
      <span className="font-mono">{ubicacion}</span>
    </span>
  );
}
