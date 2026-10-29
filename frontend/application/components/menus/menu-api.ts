import type { Menu, MenuResponse } from "./menu-types";
import api from "@/lib/api";

const API_BASE = api.defaults.baseURL;

export async function fetchMenu(
  location: "top" | "left" | "bottom"
): Promise<Menu | null> {
  try {
    const response = await fetch(
      `${API_BASE}/menus`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch ${location} menu`);
    }

    const data: MenuResponse = await response.json();

    return data.menus?.[location] ?? null;
  } catch (error) {
    console.error(`Error fetching ${location} menu:`, error);
    return null;
  }
}