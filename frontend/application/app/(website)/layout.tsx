import DynamicMenus from "@/components/menus/DynamicMenus";
import { fetchMenu } from "@/components/menus/menu-api";

export const dynamic = "force-dynamic";

export default async function WebsiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [top, left, bottom] = await Promise.all([
    fetchMenu("top"),
    fetchMenu("left"),
    fetchMenu("bottom"),
  ]);

  return (
    <DynamicMenus
      initialMenus={{ top, left, bottom }}
    >
      {children}
    </DynamicMenus>
  );
}