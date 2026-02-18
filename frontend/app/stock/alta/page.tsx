import { Suspense } from "react"
import { AltaStockForm } from "@/components/alta-stock-form"

export default function AltaStockPage() {
  return (
    <Suspense>
      <AltaStockForm />
    </Suspense>
  )
}
