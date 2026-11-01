
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Home,
  LayoutDashboard,
  UserRound,
  Shield,
  Users,
  FileText,
  Settings,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";

type DashboardNavigationProps = {
  isAdmin: boolean;
};

type NavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
};

export default function DashboardNavigation({
  isAdmin,
}: DashboardNavigationProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigationItems: NavigationItem[] = [
    {
      label: "Frontpage",
      href: "/",
      icon: Home,
    },
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "My profile",
      href: "/dashboard/profile",
      icon: UserRound,
    },
    {
      label: "Security",
      href: "/dashboard/security",
      icon: Shield,
    },
    {
      label: "Customers",
      href: "/dashboard/customers",
      icon: Users,
      adminOnly: true,
    },
    {
      label: "Pages",
      href: "/dashboard/pages",
      icon: FileText,
      adminOnly: true,
    },
    {
      label: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
      adminOnly: true,
    },
    {
      label: "Menu Settings",
      href: "/dashboard/menus",
      icon: Menu,
      adminOnly: true,
    },
  ];

  const visibleItems = navigationItems.filter(
    (item) => !item.adminOnly || isAdmin
  );

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }

    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const renderNavigation = (compact = false) => (
    <nav className="p-3">
      <div className="space-y-1">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          const isNested =
            item.href === "/dashboard/profile" ||
            item.href === "/dashboard/security";

          return (
            <Link
              key={item.href}
              href={item.href}
              title={compact ? item.label : undefined}
              className={[
                "flex items-center rounded-xl transition-colors",
                compact
                  ? "justify-center px-2 py-3"
                  : "gap-3 px-3 py-2.5",
                isNested && !compact ? "ml-3 text-sm" : "text-sm",
                active
                  ? "bg-white/70 font-semibold text-zinc-900 shadow-sm"
                  : "font-medium text-zinc-600 hover:bg-white/50 hover:text-zinc-900",
              ].join(" ")}
            >
              <Icon
                size={19}
                className="shrink-0"
              />

              {!compact && (
                <span className="truncate">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
  type="button"
  onClick={() => setMobileMenuOpen(true)}
  aria-label="Open navigation menu"
  aria-expanded={mobileMenuOpen}
  className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/60 bg-white/80 shadow-sm backdrop-blur-md transition hover:bg-white md:hidden"
>
  <Menu size={21} />
</button>

      {/* Desktop: Full sidebar */}
      <aside className="glass hidden w-60 shrink-0 rounded-2xl lg:block">
        {renderNavigation()}
      </aside>

      {/* Tablet: Icon-only sidebar */}
      <aside className="glass hidden w-[68px] shrink-0 rounded-2xl md:block lg:hidden">
        {renderNavigation(true)}
      </aside>

      {/* Mobile: Slide-out drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setMobileMenuOpen(false)}
            className="absolute inset-0 h-full w-full bg-black/40 backdrop-blur-[2px]"
          />

          {/* Drawer */}
          <aside className="glass-strong absolute inset-y-0 left-0 z-10 w-[280px] max-w-[85vw] overflow-y-auto rounded-r-2xl shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-200/60 px-4 py-4">
              <p className="text-sm font-semibold text-zinc-900">
                Navigation
              </p>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation menu"
                className="rounded-lg p-2 transition hover:bg-white/60"
              >
                <X size={20} />
              </button>
            </div>

            {renderNavigation()}
          </aside>
        </div>
      )}
    </>
  );
}
