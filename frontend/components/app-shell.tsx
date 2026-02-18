"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  ShoppingCart,
  Package,
  Receipt,
  MoreHorizontal,
  Wrench,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/vender", label: "Vender", icon: ShoppingCart },
  { href: "/stock", label: "Stock", icon: Package },
  { href: "/ventas", label: "Ventas", icon: Receipt },
  { href: "/mas", label: "Mas", icon: MoreHorizontal },
]

function NavIcon({
  item,
  isActive,
}: {
  item: (typeof navItems)[0]
  isActive: boolean
}) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      className={cn(
        "flex flex-col items-center gap-0.5 rounded-xl px-4 py-1.5 text-[11px] font-medium transition-all",
        isActive
          ? "text-primary"
          : "text-muted-foreground active:scale-95"
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-xl transition-all",
          isActive && "bg-primary/10"
        )}
      >
        <Icon
          className={cn("h-[18px] w-[18px]", isActive && "stroke-[2.5]")}
        />
      </div>
      <span>{item.label}</span>
    </Link>
  )
}

function DesktopNavItem({
  item,
  isActive,
}: {
  item: (typeof navItems)[0]
  isActive: boolean
}) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
        isActive
          ? "bg-sidebar-primary/15 text-sidebar-primary-foreground"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
    >
      <Icon className={cn("h-[18px] w-[18px]", isActive && "stroke-[2.5]")} />
      <span>{item.label}</span>
    </Link>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Public catalog page has its own standalone layout
  if (pathname.startsWith("/catalogo")) {
    return <>{children}</>
  }

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-[260px] lg:shrink-0 lg:flex-col lg:border-r lg:border-sidebar-border lg:bg-sidebar">
        <div className="flex h-16 items-center gap-2.5 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sidebar-primary">
            <Wrench className="h-4.5 w-4.5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <span className="text-sm font-bold text-sidebar-accent-foreground leading-none">
              Stock Repuestos
            </span>
            <span className="block text-[10px] text-sidebar-foreground/50 leading-tight">
              Inventario
            </span>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 px-3 pt-2">
          {navItems.map((item) => (
            <DesktopNavItem
              key={item.href}
              item={item}
              isActive={isActive(item.href)}
            />
          ))}
        </nav>
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-primary text-xs font-bold text-sidebar-primary-foreground">
              JD
            </div>
            <div>
              <p className="text-sm font-medium text-sidebar-accent-foreground leading-none">
                Juan D.
              </p>
              <p className="text-[11px] text-sidebar-foreground/50 leading-tight mt-0.5">
                Administrador
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col pb-[72px] lg:pb-0">
        {/* Mobile Header */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur-xl lg:h-16 lg:border-none lg:bg-transparent lg:px-8">
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Wrench className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-[15px] font-bold text-foreground">
              Stock Repuestos
            </span>
          </div>
          <div className="hidden lg:block">
            <h1 className="text-lg font-semibold text-foreground">
              {navItems.find((i) => isActive(i.href))?.label ||
                "Stock Repuestos"}
            </h1>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground lg:hidden">
              JD
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1">{children}</main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-border bg-card/80 pb-[env(safe-area-inset-bottom)] pt-1.5 pb-2 backdrop-blur-xl lg:hidden">
        {navItems.map((item) => (
          <NavIcon
            key={item.href}
            item={item}
            isActive={isActive(item.href)}
          />
        ))}
      </nav>
    </div>
  )
}
