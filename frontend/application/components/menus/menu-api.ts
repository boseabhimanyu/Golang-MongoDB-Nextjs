import type { Menu, MenuResponse } from "./menu-types"; 
import api from "@/lib/api";

const API_BASE = api.defaults.baseURL;

export type InitialMenus = { top: Menu | null; left: Menu | null; bottom: Menu | null; };

export async function fetchMenus(

): Promise<InitialMenus> {
   try {
     const response = await fetch(
      `${API_BASE}/menus`,
   { cache: "no-store" }
  );

if (!response.ok) {
  throw new Error(`Failed to fetch menus: ${response.status}`);
}

const data: MenuResponse = await response.json();

return {
  top: data.menus?.top ?? null,
  left: data.menus?.left ?? null,
  bottom: data.menus?.bottom ?? null,
};


} catch (error) { console.error("Error fetching menus:", error);

return {
  top: null,
  left: null,
  bottom: null,
};


} }