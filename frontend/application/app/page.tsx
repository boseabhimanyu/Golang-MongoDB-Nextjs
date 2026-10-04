import api from "@/lib/api";

type SettingsResponse = {
  registration_enabled: boolean;
  login_hint: string;
};

export default async function Home() {
  const response = await api.get<SettingsResponse>("/settings");
  const settings = response.data;

  return (
    <main className="p-8">
      <h1>Next.js Application</h1>

      <p>Registration enabled: {String(settings.registration_enabled)}</p>
      <p>Login hint: {settings.login_hint}</p>
    </main>
  );
}