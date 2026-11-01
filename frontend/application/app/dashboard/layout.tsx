import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { getCurrentUser } from "@/lib/auth";
import LogoutButton from "@/components/auth/logout-button";
import DashboardNavigation from "./dashboard-navigation";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Determine current pathname using headers to check route protection
  const headersList = await headers();
  const pathname = headersList.get("x-invoke-path") || headersList.get("referer") || "";
  
  // Define routes that require admin privileges
  const adminOnlyRoutes = [
    "/dashboard/customers", 
    "/dashboard/pages", 
    "/dashboard/settings", 
    "/dashboard/menus"
  ];

  // If the user is trying to access an admin route but is not an admin, redirect them
  const isAdmin = user.role?.toLowerCase() === "admin";
  const isTryingAccessAdminRoute = adminOnlyRoutes.some((route) => pathname.includes(route));

  if (isTryingAccessAdminRoute && !isAdmin) {
    redirect("/dashboard");
  }

  const fullName =
    `${user.firstName} ${user.lastName}`.trim();

  return (
    <div className="min-h-screen">
      <header className="glass-strong sticky top-4 z-40 mx-4 rounded-2xl sm:mx-6 lg:mx-8">
        <div className="flex min-h-16 items-center justify-between gap-4 pl-14 pr-4 sm:px-6 md:pl-6">
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

      <div className="flex min-h-[calc(100vh-2rem)] flex-col gap-3 p-4 sm:gap-6 sm:p-6 md:flex-row lg:gap-8 lg:p-8">
        <DashboardNavigation isAdmin={isAdmin} />

        <main className="min-w-0 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}