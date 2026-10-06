import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import LogoutButton from "@/components/auth/logout-button";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const fullName =
    `${user.firstName} ${user.lastName}`.trim();

  return (
    <div className="min-h-screen">
      <header className="glass-strong sticky top-4 z-40 mx-4 rounded-2xl sm:mx-6 lg:mx-8">
        <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {fullName || user.username}
            </p>

            <p className="truncate text-xs text-zinc-500">
              {user.email}
            </p>
          </div>

          <LogoutButton />
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-2rem)] gap-4 p-4 sm:gap-6 sm:p-6 lg:gap-8 lg:p-8">
        <aside className="glass hidden w-60 shrink-0 rounded-2xl lg:block">
          <nav className="p-3">
  <div className="space-y-1">
    <Link
      href="/dashboard"
      className="block rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-white/50"
    >
      Dashboard
    </Link>

    <div className="ml-3 space-y-1 pl-3">
      <Link
        href="/dashboard/profile"
        className="block rounded-xl px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-white/50 hover:text-zinc-900"
      >
        My profile
      </Link>

      <Link
        href="/dashboard/security"
        className="block rounded-xl px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-white/50 hover:text-zinc-900"
      >
        Security
      </Link>
    </div>

{user.role === "admin" && (    <Link
      href="/dashboard/customers"
      className="block rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-white/50"
    >
      Customers
    </Link>
)}
    {user?.role === "admin" && (
  <Link
    href="/dashboard/settings"
    className="block rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-white/50"
  >
    Settings
  </Link>
)}
  </div>
</nav>
        </aside>

        <main className="min-w-0 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}