"use client";

import { useCallback, useEffect, useState } from "react";

import api from "@/lib/api";
import MenuList, {
  type AdminMenu,
} from "@/components/menus/menu-list";

export default function MenusSettingsPage() {
  const [menus, setMenus] =
    useState<AdminMenu[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const loadMenus =
    useCallback(async () => {
      setLoading(true);
      setError(null);

      try {
       const response = await api.get("/admin/menus");

console.log("Menus API URL:", response.config.baseURL, response.config.url);
console.log("Menus API response:", response.data);

const data = response.data;

const loadedMenus = Array.isArray(data?.menus)
  ? data.menus
  : Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
      ? data.data
      : null;

if (!loadedMenus) {
  console.error("Unexpected menus API response:", data);
  throw new Error("Invalid menus response format");
}

setMenus(loadedMenus);
      } catch (err) {
        console.error(err);

        setError(
          "Unable to load menus.",
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadMenus();
  }, [loadMenus]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">
          Menus
        </h1>

        <p className="mt-1 text-sm text-zinc-500">
          Manage the navigation menus used by
          the website.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-8">
          <p className="text-sm text-zinc-500">
            Loading menus...
          </p>
        </div>
      ) : (
        <MenuList
          menus={menus}
          onChanged={loadMenus}
        />
      )}
    </div>
  );
}