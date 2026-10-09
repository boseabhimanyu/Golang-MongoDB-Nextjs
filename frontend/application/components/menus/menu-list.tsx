"use client";

import Link from "next/link";
import {
  ChevronRight,
  Menu as MenuIcon,
  Power,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import api from "@/lib/api";

export type AdminMenu = {
  id: string;
  name: string;
  location: "top" | "left" | "bottom";
  status: boolean;
};

type MenuListProps = {
  menus: AdminMenu[];
  onChanged?: () => void;
};

const menuInfo = {
  top: {
    title: "Header Menu",
    description:
      "Navigation displayed in the site header.",
  },
  left: {
    title: "Sidebar Menu",
    description:
      "Navigation displayed in the left sidebar.",
  },
  bottom: {
    title: "Footer Menu",
    description:
      "Navigation displayed in the site footer.",
  },
};

const locations: Array<
  AdminMenu["location"]
> = [
  "top",
  "left",
  "bottom",
];

export default function MenuList({
  menus,
  onChanged,
}: MenuListProps) {
  const [busyId, setBusyId] =
    useState<string | null>(null);

  async function toggleStatus(
    menu: AdminMenu,
  ) {
    setBusyId(menu.id);

    try {
      await api.patch(
        `/admin/menus/${menu.id}`,
        {
          status: !menu.status,
        },
      );

      onChanged?.();
    } catch (error) {
      console.error(error);

      window.alert(
        "Unable to change the menu status.",
      );
    } finally {
      setBusyId(null);
    }
  }


  async function initializeMenu(
    location: AdminMenu["location"],
  ) {
    setBusyId(location);

    try {
      const info = menuInfo[location];

      await api.post("/admin/menus", {
        name: info.title,
        location,
        status: true,
      });

      await onChanged?.();
    } catch (error) {
      console.error("Unable to initialize menu:", error);

      window.alert(
        `Unable to initialize the ${menuInfo[location].title}.`,
      );
    } finally {
      setBusyId(null);
    }
  }

  async function deleteMenu(
    menu: AdminMenu,
  ) {
    const confirmed =
      window.confirm(
        `Delete "${menu.name}"?\n\nThis will permanently delete the menu.`,
      );

    if (!confirmed) {
      return;
    }

    setBusyId(menu.id);

    try {
      await api.delete(
        `/admin/menus/${menu.id}`,
      );

      onChanged?.();
    } catch (error) {
      console.error(error);

      window.alert(
        "Unable to delete the menu.",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      {locations.map((location) => {
        const menu =
          menus.find(
            (item) =>
              item.location === location,
          );

        const info =
          menuInfo[location];

        return (
          <div
            key={location}
            className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <div className="rounded-xl bg-zinc-100 p-3">
                  <MenuIcon className="h-5 w-5 text-zinc-700" />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-medium text-zinc-900">
                      {menu?.name ??
                        info.title}
                    </h2>

                    <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-600">
                      {location}
                    </span>

                    {menu && (
                      <span
                        className={[
                          "rounded-full px-2 py-1 text-xs",
                          menu.status
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-zinc-100 text-zinc-500",
                        ].join(" ")}
                      >
                        {menu.status
                          ? "Active"
                          : "Inactive"}
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-sm text-zinc-500">
                    {info.description}
                  </p>
                </div>
              </div>

              {menu ? (
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/settings/menus/${menu.id}`}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
                  >
                    Manage
                    <ChevronRight className="h-4 w-4" />
                  </Link>

                  <button
                    type="button"
                    disabled={
                      busyId === menu.id
                    }
                    onClick={() =>
                      toggleStatus(menu)
                    }
                    className={[
                      "inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium",
                      menu.status
                        ? "border-amber-300 text-amber-700 hover:bg-amber-50"
                        : "border-emerald-300 text-emerald-700 hover:bg-emerald-50",
                    ].join(" ")}
                  >
                    <Power className="h-4 w-4" />

                    {menu.status
                      ? "Deactivate"
                      : "Activate"}
                  </button>

                  <button
                    type="button"
                    disabled={
                      busyId === menu.id
                    }
                    onClick={() =>
                      deleteMenu(menu)
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              ) : (
    <button
      type="button"
      disabled={busyId === location}
      onClick={() => initializeMenu(location)}
      className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {busyId === location
        ? "Initializing..."
        : "Initialize Menu"}
    </button>
  )}
            </div>
          </div>
        );
      })}
    </div>
  );
}