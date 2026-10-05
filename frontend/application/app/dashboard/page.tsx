import BackupCodesWarning from "@/components/dashboard/backup-codes-warning";

export default function DashboardPage() {
  return (
    
    <main className="p-4 sm:p-6 lg:p-8">
  <div className="mx-auto max-w-7xl">
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">
        Dashboard
      </h1>

      <p className="mt-1 text-sm text-zinc-600">
        Welcome back. Here’s an overview of your application.
      </p>
    </div>

    <div className="mt-6">
      <BackupCodesWarning />
    </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardCard
            title="Users"
            value="—"
            description="Total registered users"
          />

          <DashboardCard
            title="Pages"
            value="—"
            description="Published CMS pages"
          />

          <DashboardCard
            title="Menus"
            value="—"
            description="Configured navigation menus"
          />

          <DashboardCard
            title="System"
            value="Online"
            description="Application status"
          />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="glass rounded-2xl p-6">
            <h2 className="text-base font-semibold">
              Recent activity
            </h2>

            <p className="mt-2 text-sm text-zinc-500">
              Recent application activity will appear here.
            </p>
          </div>

          <div className="glass rounded-2xl p-6">
            <h2 className="text-base font-semibold">
              Quick actions
            </h2>

            <p className="mt-2 text-sm text-zinc-500">
              Common administrative actions will appear here.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

type DashboardCardProps = {
  title: string;
  value: string;
  description: string;
};

function DashboardCard({
  title,
  value,
  description,
}: DashboardCardProps) {
  return (
   <div className="glass rounded-2xl p-5">
      <p className="text-sm font-medium text-zinc-500">
        {title}
      </p>

      <p className="mt-3 text-3xl font-semibold tracking-tight">
        {value}
      </p>

      <p className="mt-1 text-xs text-zinc-500">
        {description}
      </p>
    </div>
  );
}