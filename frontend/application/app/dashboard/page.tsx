import LogoutButton from "@/components/auth/logout-button";

export default function DashboardPage() {
  return (
    <main className="min-h-screen p-8">
      <h1>Dashboard</h1>

      <p className="mt-2">
        Authentication successful.
      </p>

      <div className="mt-6">
        <LogoutButton />
      </div>
    </main>
  );
}