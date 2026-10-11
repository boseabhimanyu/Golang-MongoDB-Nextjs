import type { Menu, MenuResponse } from "./menu-types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:5000/api/v1";

export async function fetchMenu(
  location: "top" | "left" | "bottom"
): Promise<Menu | null> {
  try {
    const response = await fetch(
      `${API_BASE}/menus/${location}`,
      { cache: "no-store" }
    );

    if (!response.ok) return null;

    const data: MenuResponse = await response.json();

    if (
      !data.menu ||
      data.menu.status !== true ||
      !Array.isArray(data.menu.items)
    ) {
      return null;
    }

    return data.menu;
  } catch {
    return null;
  }
}