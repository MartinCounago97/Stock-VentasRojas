"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { store } from "@/lib/store"
import { LocationPicker } from "@/components/location-picker"
import { ProductImageUpload } from "@/components/product-image-upload"
import { toast } from "sonner"

export default function NuevoProductoPage() {
  const router = useRouter()
  const [nombre, setNombre] = useState("")
  const [caracteristicas, setCaracteristicas] = useState("")
  const [precio, setPrecio] = useState("")
  const [stockInicial, setStockInicial] = useState("")
  const [minStock, setMinStock] = useState("")
  const [ubicacion, setUbicacion] = useState("")
  const [imagen, setImagen] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) {
      toast.error("El nombre es obligatorio")
      return
    }
    store.addProduct({
      nombre: nombre.trim(),
      caracteristicas: caracteristicas.trim(),
      precio: Number(precio) || 0,
      stockInicial: Number(stockInicial) || 0,
      minStock: minStock ? Number(minStock) : undefined,
      ubicacion: ubicacion || undefined,
      imagen: imagen || undefined,
    })
    toast.success("Producto creado exitosamente")
    router.push("/productos")
  }

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-8 lg:max-w-xl">
      <div className="flex items-center gap-3">
        <Link href="/productos">
          <Button variant="ghost" size="sm" className="h-8 w-8 rounded-lg p-0">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Volver</span>
          </Button>
        </Link>
        <div>
          <h2 className="text-xl font-bold text-foreground">Alta de producto</h2>
          <p className="text-sm text-muted-foreground">
            Agrega un nuevo producto al inventario
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border lg:p-6">
        <div className="mb-5 flex items-center gap-3 rounded-xl bg-primary/5 p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Nuevo producto
            </p>
            <p className="text-xs text-muted-foreground">
              Completa los datos del producto
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nombre" className="text-sm font-medium">
              Nombre de producto
            </Label>
            <Input
              id="nombre"
              placeholder="Ej: Filtro de aceite"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="h-11 rounded-xl"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="caracteristicas" className="text-sm font-medium">
              Caracteristicas
            </Label>
            <Textarea
              id="caracteristicas"
              placeholder="Marca, modelo compatible, medidas..."
              value={caracteristicas}
              onChange={(e) => setCaracteristicas(e.target.value)}
              rows={3}
              className="rounded-xl"
            />
          </div>

          <ProductImageUpload value={imagen} onChange={setImagen} />

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="precio" className="text-sm font-medium">
                Precio
              </Label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  $
                </span>
                <Input
                  id="precio"
                  type="number"
                  placeholder="0"
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                  className="h-11 rounded-xl pl-7"
                  min={0}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="stockInicial" className="text-sm font-medium">
                Stock inicial
              </Label>
              <Input
                id="stockInicial"
                type="number"
                placeholder="0"
                value={stockInicial}
                onChange={(e) => setStockInicial(e.target.value)}
                className="h-11 rounded-xl"
                min={0}
              />
            </div>
          </div>

          <LocationPicker value={ubicacion} onChange={setUbicacion} />

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="minStock" className="text-sm font-medium">
              Stock minimo{" "}
              <span className="font-normal text-muted-foreground">
                (opcional)
              </span>
            </Label>
            <Input
              id="minStock"
              type="number"
              placeholder="Usar global"
              value={minStock}
              onChange={(e) => setMinStock(e.target.value)}
              className="h-11 rounded-xl"
              min={0}
            />
            <p className="text-xs text-muted-foreground">
              Si se deja vacio, se usa el minimo global configurado en Ajustes
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-3">
            <Button type="submit" className="h-12 rounded-xl text-base shadow-sm">
              Guardar producto
            </Button>
            <Link href="/productos">
              <Button
                type="button"
                variant="ghost"
                className="w-full h-10 rounded-xl"
              >
                Cancelar
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
