"use client"

import { useSectors } from "@/hooks/use-store"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MapPin } from "lucide-react"
import { Label } from "@/components/ui/label"

interface LocationPickerProps {
  value: string
  onChange: (value: string) => void
}

export function LocationPicker({ value, onChange }: LocationPickerProps) {
  const sectors = useSectors()

  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm font-medium">
        <span className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
          Ubicacion
        </span>
      </Label>
      <Select value={value || "none"} onValueChange={(v) => onChange(v === "none" ? "" : v)}>
        <SelectTrigger className="h-11 rounded-xl">
          <SelectValue placeholder="Sin ubicacion asignada" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">
            <span className="text-muted-foreground">Sin ubicacion</span>
          </SelectItem>
          {sectors.map((sector) => (
            <div key={sector.id}>
              <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {sector.nombre}
              </div>
              {sector.posiciones.map((pos) => (
                <SelectItem key={pos} value={pos}>
                  <span className="font-mono font-semibold">{pos}</span>
                  <span className="ml-2 text-muted-foreground">
                    {sector.nombre}
                  </span>
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
  )
}

export function LocationBadge({ ubicacion }: { ubicacion?: string }) {
  if (!ubicacion) {
    return (
      <span className="inline-flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground">
        <MapPin className="h-3 w-3" />
        Sin ubicacion
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg bg-chart-1/10 px-2.5 py-1 text-xs font-bold text-chart-1">
      <MapPin className="h-3 w-3" />
      <span className="font-mono">{ubicacion}</span>
    </span>
  )
}
