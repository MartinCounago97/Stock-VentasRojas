"use client"

import { useRef } from "react"
import { ImagePlus, X, Package } from "lucide-react"
import Image from "next/image"

interface ProductImageUploadProps {
  value: string
  onChange: (url: string) => void
}

export function ProductImageUpload({ value, onChange }: ProductImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) return
    const url = URL.createObjectURL(file)
    onChange(url)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium">
        Foto del producto{" "}
        <span className="font-normal text-muted-foreground">(opcional)</span>
      </label>
      {value ? (
        <div className="relative w-full overflow-hidden rounded-xl ring-1 ring-border">
          <div className="relative aspect-[4/3] w-full bg-muted">
            <Image
              src={value}
              alt="Foto del producto"
              fill
              className="object-contain"
              unoptimized
            />
          </div>
          <button
            type="button"
            onClick={() => {
              onChange("")
              if (inputRef.current) inputRef.current.value = ""
            }}
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg bg-foreground/70 text-background transition-colors hover:bg-foreground/90"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute bottom-2 right-2 flex h-7 items-center gap-1.5 rounded-lg bg-foreground/70 px-2.5 text-[11px] font-medium text-background transition-colors hover:bg-foreground/90"
          >
            <ImagePlus className="h-3 w-3" />
            Cambiar
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-dashed border-border bg-muted/30 transition-colors hover:border-primary/40 hover:bg-muted/50"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
            <ImagePlus className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-xs font-medium text-foreground">Subir foto</p>
            <p className="text-[10px] text-muted-foreground">JPG, PNG o WebP</p>
          </div>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="sr-only"
      />
    </div>
  )
}

export function ProductThumbnail({
  src,
  alt,
  size = "md",
}: {
  src?: string
  alt: string
  size?: "sm" | "md" | "lg"
}) {
  const dims = {
    sm: "h-10 w-10 rounded-lg",
    md: "h-14 w-14 rounded-xl",
    lg: "h-20 w-20 rounded-2xl",
  }

  if (!src) {
    return (
      <div
        className={`${dims[size]} flex shrink-0 items-center justify-center bg-muted`}
      >
        <Package
          className={
            size === "sm"
              ? "h-4 w-4 text-muted-foreground/50"
              : size === "md"
                ? "h-6 w-6 text-muted-foreground/50"
                : "h-8 w-8 text-muted-foreground/50"
          }
        />
      </div>
    )
  }

  return (
    <div className={`${dims[size]} relative shrink-0 overflow-hidden bg-muted`}>
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        unoptimized
      />
    </div>
  )
}
