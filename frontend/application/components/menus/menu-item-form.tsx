"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import api from "@/lib/api";

import type {
  MenuItem,
  MenuItemType,
} from "./sortable-menu-item";

type PageOption = {
  id: string;
  title: string;
  slug: string;
};

type MenuItemFormProps = {
  menuId: string;
  item?: MenuItem | null;
  groups: MenuItem[];
  onClose: () => void;
  onSaved: () => void;
};

type FormState = {
  label: string;
  type: MenuItemType;
  pageId: string;
  url: string;
  parentId: string;
  displayStatus: boolean;
};

function initialState(item?: MenuItem | null): FormState {
  return {
    label: item?.label ?? "",
    type: item?.type ?? "group",
    pageId: item?.pageId ?? "",
    url: item?.url ?? "",
    parentId: "",
    displayStatus: item?.displayStatus ?? true,
  };
}

export default function MenuItemForm({
  menuId,
  item,
  groups,
  onClose,
  onSaved,
}: MenuItemFormProps) {
  const [form, setForm] = useState<FormState>(initialState(item));
  const [pages, setPages] = useState<PageOption[]>([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const editing = Boolean(item);

  useEffect(() => {
    setForm(initialState(item));
  }, [item]);

  useEffect(() => {
    if (form.type !== "page") {
      return;
    }

    let cancelled = false;

    async function loadPages() {
      try {
        setLoadingPages(true);

        const response = await api.get("/admin/pages");

        const payload = response.data;

        const rawPages =
          payload?.pages ??
          payload?.data ??
          payload?.items ??
          [];

        const normalized: PageOption[] = Array.isArray(rawPages)
          ? rawPages.map((page: any) => ({
              id: page.id,
              title: page.title ?? "",
              slug: page.slug ?? "",
            }))
          : [];

        if (!cancelled) {
          setPages(normalized);
        }
      } catch {
        if (!cancelled) {
          setPages([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingPages(false);
        }
      }
    }

    loadPages();

    return () => {
      cancelled = true;
    };
  }, [form.type]);

  function update<K extends keyof FormState>(
    key: K,
    value: FormState[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");

    if (!form.label.trim()) {
      setError("Label is required.");
      return;
    }

    if (form.type === "page" && !form.pageId) {
      setError("Please select a page.");
      return;
    }

    if (form.type === "url" && !form.url.trim()) {
      setError("URL is required.");
      return;
    }

    try {
      setSaving(true);

      const payload: Record<string, unknown> = {
        label: form.label.trim(),
        type: form.type,
      };

      if (form.type === "page") {
        payload.pageId = form.pageId;
      }

      if (form.type === "url") {
        payload.url = form.url.trim();
      }

      if (form.displayStatus !== true) {
        payload.displayStatus = form.displayStatus;
      }

      if (!editing && form.parentId) {
        payload.parentId = form.parentId;
      }

      if (editing) {
        await api.patch(
          `/admin/menus/${menuId}/items/${item!.id}`,
          payload,
        );
      } else {
        await api.post(
          `/admin/menus/${menuId}/items`,
          payload,
        );
      }

      onSaved();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          "Unable to save the menu item.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">
              {editing ? "Edit Menu Item" : "Add Menu Item"}
            </h2>

            <p className="mt-1 text-xs text-zinc-500">
              Add a group, page, or external URL.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-800">
              Label
            </label>

            <input
              value={form.label}
              onChange={(event) =>
                update("label", event.target.value)
              }
              className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
              placeholder="About Us"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-800">
              Type
            </label>

            <select
              value={form.type}
              disabled={editing}
              onChange={(event) =>
                update(
                  "type",
                  event.target.value as MenuItemType,
                )
              }
              className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 disabled:bg-zinc-100"
            >
              <option value="group">Group</option>
              <option value="page">Page</option>
              <option value="url">URL</option>
            </select>
          </div>

          {!editing && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-800">
                Parent group
              </label>

              <select
                value={form.parentId}
                onChange={(event) =>
                  update("parentId", event.target.value)
                }
                className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
              >
                <option value="">Top level</option>

                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.label}
                  </option>
                ))}
              </select>

              <p className="mt-1.5 text-xs text-zinc-500">
                Child items can only belong to a group in this menu.
              </p>
            </div>
          )}

          {form.type === "page" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-800">
                Page
              </label>

              <select
                value={form.pageId}
                onChange={(event) =>
                  update("pageId", event.target.value)
                }
                disabled={loadingPages}
                className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 disabled:bg-zinc-100"
              >
                <option value="">
                  {loadingPages
                    ? "Loading pages..."
                    : "Select a page"}
                </option>

                {pages.map((page) => (
                  <option key={page.id} value={page.id}>
                    {page.title}
                    {page.slug ? ` (${page.slug})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {form.type === "url" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-800">
                URL
              </label>

              <input
                type="url"
                value={form.url}
                onChange={(event) =>
                  update("url", event.target.value)
                }
                className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
                placeholder="https://example.com"
              />
            </div>
          )}

          <label className="flex items-center gap-3 rounded-xl border border-zinc-200 p-3">
            <input
              type="checkbox"
              checked={form.displayStatus}
              onChange={(event) =>
                update(
                  "displayStatus",
                  event.target.checked,
                )
              }
              className="h-4 w-4 rounded border-zinc-300"
            />

            <span>
              <span className="block text-sm font-medium text-zinc-800">
                Display item
              </span>
              <span className="block text-xs text-zinc-500">
                Hidden items remain in the menu but are not displayed.
              </span>
            </span>
          </label>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-zinc-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : editing
                  ? "Save Changes"
                  : "Add Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}