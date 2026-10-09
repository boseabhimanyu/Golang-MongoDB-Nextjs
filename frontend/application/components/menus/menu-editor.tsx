"use client";

import {
  AlertCircle,
  CheckCircle2,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DragDropProvider } from "@dnd-kit/react";
import {
  isSortable,
} from "@dnd-kit/react/sortable";

import api from "@/lib/api";

import MenuItemTree from "./menu-item-tree";
import type { MenuItem } from "./sortable-menu-item";
import MenuItemForm from "./menu-item-form";

type AdminMenu = {
  id: string;
  name: string;
  location: "top" | "left" | "bottom";
  status: boolean;
  items: MenuItem[];
};

type MenuEditorProps = {
  menuId: string;
};

type ApiResponse<T> = {
  data: T;
};

type MenuGroupOption = {
  id: string;
  label: string;
};

function collectGroups(items: MenuItem[]): MenuItem[] {
  const groups: MenuItem[] = [];

  function visit(nodes: MenuItem[]) {
    for (const item of nodes) {
      if (item.type === "group") {
        groups.push(item);
      }

      if (item.children?.length) {
        visit(item.children);
      }
    }
  }

  visit(items);
  return groups;
}

function extractMenu<T>(response: ApiResponse<T> | T): T {
  if (
    response &&
    typeof response === "object" &&
    "data" in response
  ) {
    return (response as ApiResponse<T>).data;
  }

  return response as T;
}

function cloneItems(items: MenuItem[]): MenuItem[] {
  return items.map((item) => ({
    ...item,
    children: cloneItems(item.children ?? []),
  }));
}

function reorder<T>(
  items: T[],
  fromIndex: number,
  toIndex: number,
): T[] {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= items.length ||
    toIndex >= items.length ||
    fromIndex === toIndex
  ) {
    return items;
  }

  const next = [...items];

  const [moved] = next.splice(fromIndex, 1);

  if (moved === undefined) {
    return items;
  }

  next.splice(toIndex, 0, moved);

  return next;
}

function reorderGroup(
  items: MenuItem[],
  group: string | number | undefined,
  fromIndex: number,
  toIndex: number,
): MenuItem[] {
  const normalizedGroup =
    group == null
      ? "root"
      : String(group);

  if (normalizedGroup === "root") {
    return reorder(
      items,
      fromIndex,
      toIndex,
    );
  }

  if (!normalizedGroup.startsWith("parent:")) {
    return items;
  }

  const parentId =
    normalizedGroup.slice("parent:".length);

  return items.map((item) => {
    if (item.id !== parentId) {
      return item;
    }

    return {
      ...item,
      children: reorder(
        item.children ?? [],
        fromIndex,
        toIndex,
      ),
    };
  });
}

function collectOrderChanges(
  items: MenuItem[],
) {
  const changes: Array<{
    itemId: string;
    order: number;
  }> = [];

  function visit(
    siblings: MenuItem[],
  ) {
    siblings.forEach((item, index) => {
      changes.push({
        itemId: item.id,
        order: index + 1,
      });

      if (item.children?.length) {
        visit(item.children);
      }
    });
  }

  visit(items);

  return changes;
}

function flattenItems(
  items: MenuItem[],
): MenuItem[] {
  const result: MenuItem[] = [];

  function visit(
    current: MenuItem[],
  ) {
    current.forEach((item) => {
      result.push(item);

      if (item.children?.length) {
        visit(item.children);
      }
    });
  }

  visit(items);

  return result;
}

export default function MenuEditor({
  menuId,
}: MenuEditorProps) {
  const [menu, setMenu] =
    useState<AdminMenu | null>(null);

  const [serverItems, setServerItems] =
    useState<MenuItem[]>([]);

  const [draftItems, setDraftItems] =
    useState<MenuItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [dirty, setDirty] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [saveMessage, setSaveMessage] =
    useState<string | null>(null);

  const [showItemForm, setShowItemForm] =
    useState(false);

  const [editingItem, setEditingItem] =
    useState<MenuItem | null>(null);

  const [deleting, setDeleting] =
    useState(false);

  const [activeDragId, setActiveDragId] =
    useState<string | null>(null);

  async function loadMenu() {
    setLoading(true);
    setError(null);

    try {
      const response =
        await api.get(
          `/admin/menus/${menuId}`,
        );

      const loadedMenu =
        extractMenu<AdminMenu>(
          response,
        );

      const items =
        loadedMenu.items ?? [];

      setMenu(loadedMenu);
      setServerItems(
        cloneItems(items),
      );
      setDraftItems(
        cloneItems(items),
      );
      setDirty(false);
      setSaveMessage(null);
    } catch (err) {
      console.error(err);

      setError(
        "Unable to load this menu.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMenu();
  }, [menuId]);

  const flatDraftItems = useMemo(
    () => flattenItems(draftItems),
    [draftItems],
  );

  const groups = useMemo(
  () => collectGroups(draftItems),
  [draftItems],
);

  function handleDragStart(event: any) {
    const source =
      event.operation?.source;

    if (source?.id != null) {
      setActiveDragId(
        String(source.id),
      );
    }

    setSaveMessage(null);
  }

  function handleDragEnd(event: any) {
    setActiveDragId(null);

    if (event.canceled) {
      return;
    }

    const source =
      event.operation?.source;

    const target =
      event.operation?.target;

    if (!source || !target) {
      return;
    }

    if (
      !isSortable(source) ||
      !isSortable(target)
    ) {
      return;
    }

    const sourceGroup =
      source.group == null
        ? "root"
        : String(source.group);

    const targetGroup =
      target.group == null
        ? "root"
        : String(target.group);

    /*
     * IMPORTANT:
     * A menu item is only allowed to move
     * inside its existing sibling group.
     *
     * This prevents:
     *
     * Level 2 -> Level 1
     *
     * and therefore prevents accidental
     * re-parenting.
     */
    if (
      sourceGroup !== targetGroup
    ) {
      return;
    }

    const fromIndex =
      source.initialIndex;

    const toIndex =
      source.index;

    if (
      fromIndex == null ||
      toIndex == null ||
      fromIndex === toIndex
    ) {
      return;
    }

    setDraftItems((current) => {
      return reorderGroup(
        current,
        sourceGroup,
        fromIndex,
        toIndex,
      );
    });

    setDirty(true);
    setSaveMessage(null);
  }

  function discardChanges() {
    if (saving) {
      return;
    }

    setDraftItems(
      cloneItems(serverItems),
    );

    setDirty(false);
    setSaveMessage(
      "Changes discarded.",
    );
    setError(null);
  }

  async function saveChanges() {
    if (!menu || saving || !dirty) {
      return;
    }

    setSaving(true);
    setError(null);
    setSaveMessage(null);

    try {
      const changes =
        collectOrderChanges(
          draftItems,
        );

      /*
       * Send the final sibling positions.
       *
       * The backend order endpoint recalculates
       * sibling order.
       */
      for (const change of changes) {
        await api.patch(
          `/admin/menus/${menu.id}/items/${change.itemId}/order`,
          {
            order: change.order,
          },
        );
      }

      /*
       * Always reload from the server after save.
       * The server is now the source of truth.
       */
      const response =
        await api.get(
          `/admin/menus/${menu.id}`,
        );

      const freshMenu =
        extractMenu<AdminMenu>(
          response,
        );

      const freshItems =
        freshMenu.items ?? [];

      setMenu(freshMenu);

      setServerItems(
        cloneItems(freshItems),
      );

      setDraftItems(
        cloneItems(freshItems),
      );

      setDirty(false);

      setSaveMessage(
        "Menu order saved successfully.",
      );
    } catch (err) {
      console.error(err);

      setError(
        "Unable to save the menu order. Your changes are still present.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleMenuStatus() {
    if (!menu || saving) {
      return;
    }

    const nextStatus =
      !menu.status;

    setSaving(true);
    setError(null);
    setSaveMessage(null);

    try {
      const response =
        await api.patch(
          `/admin/menus/${menu.id}`,
          {
            status: nextStatus,
          },
        );

      const updatedMenu =
        extractMenu<AdminMenu>(
          response,
        );

      setMenu(
        updatedMenu,
      );

      setSaveMessage(
        nextStatus
          ? "Menu activated."
          : "Menu deactivated.",
      );
    } catch (err) {
      console.error(err);

      setError(
        "Unable to change the menu status.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteMenu() {
    if (!menu || deleting) {
      return;
    }

    const confirmed =
      window.confirm(
        `Delete "${menu.name}"?\n\nThis will permanently delete this menu.`,
      );

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      await api.delete(
        `/admin/menus/${menu.id}`,
      );

      window.location.href =
        "/settings/menus";
    } catch (err) {
      console.error(err);

      setError(
        "Unable to delete this menu.",
      );
    } finally {
      setDeleting(false);
    }
  }

  function openEditForm(
    item: MenuItem,
  ) {
    setEditingItem(item);
    setShowItemForm(true);
  }

  function openCreateForm() {
    setEditingItem(null);
    setShowItemForm(true);
  }

  function closeItemForm() {
    setShowItemForm(false);
    setEditingItem(null);
  }

  /*
   * The existing MenuItemForm can remain responsible
   * for creating/updating an item through the backend.
   *
   * After it completes, reload the menu so the tree
   * is never manually reconstructed from stale data.
   */
  async function handleItemSaved() {
    closeItemForm();
    await loadMenu();
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-8">
        <p className="text-sm text-zinc-500">
          Loading menu...
        </p>
      </div>
    );
  }

  if (!menu) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8">
        <p className="text-sm text-red-700">
          {error ?? "Menu not found."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold text-zinc-900">
              {menu.name}
            </h1>

            <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-600">
              {menu.location}
            </span>

            <span
              className={[
                "rounded-full px-2.5 py-1 text-xs",
                menu.status
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-zinc-100 text-zinc-500",
              ].join(" ")}
            >
              {menu.status
                ? "Active"
                : "Inactive"}
            </span>
          </div>

          <p className="mt-2 text-sm text-zinc-500">
            Arrange the menu items using the
            drag handles. Items can only be
            reordered within their current
            parent.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={toggleMenuStatus}
            className={[
              "inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition",
              menu.status
                ? "border-amber-300 text-amber-700 hover:bg-amber-50"
                : "border-emerald-300 text-emerald-700 hover:bg-emerald-50",
            ].join(" ")}
          >
            {menu.status
              ? "Deactivate"
              : "Activate"}
          </button>

          <button
            type="button"
            disabled={
              deleting || saving
            }
            onClick={deleteMenu}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />

            {deleting
              ? "Deleting..."
              : "Delete"}
          </button>
        </div>
      </div>

      {/* Save bar */}
      <div
        className={[
          "sticky top-4 z-20 flex flex-col gap-3 rounded-2xl border p-4 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between",
          dirty
            ? "border-amber-200 bg-amber-50/95"
            : "border-emerald-200 bg-emerald-50/95",
        ].join(" ")}
      >
        <div className="flex items-start gap-3">
          {dirty ? (
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          ) : (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          )}

          <div>
            <p
              className={[
                "text-sm font-semibold",
                dirty
                  ? "text-amber-800"
                  : "text-emerald-800",
              ].join(" ")}
            >
              {dirty
                ? "Unsaved changes"
                : "All changes saved"}
            </p>

            <p className="text-xs text-zinc-600">
              {saveMessage ??
                (dirty
                  ? "Save your changes when you are happy with the order."
                  : "The menu matches the server.")}
            </p>

            {activeDragId && (
              <p className="mt-1 text-xs text-blue-600">
                Dragging menu item...
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={!dirty || saving}
            onClick={discardChanges}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-4 w-4" />
            Discard
          </button>

          <button
            type="button"
            disabled={!dirty || saving}
            onClick={saveChanges}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save className="h-4 w-4" />

            {saving
              ? "Saving..."
              : "Save changes"}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

          <p className="text-sm text-red-700">
            {error}
          </p>
        </div>
      )}

      {/* Item controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">
            Menu items
          </h2>

          <p className="text-sm text-zinc-500">
            {flatDraftItems.length} item
            {flatDraftItems.length === 1
              ? ""
              : "s"}
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
        >
          <Plus className="h-4 w-4" />
          Add menu item
        </button>
      </div>

      {/* Tree */}
      <DragDropProvider
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <MenuItemTree
          items={draftItems}
          onEdit={openEditForm}
        />
      </DragDropProvider>

      {/* Existing item form */}
      {showItemForm && (
        <MenuItemForm
  menuId={menu.id}
  item={editingItem}
  groups={groups}
  onClose={closeItemForm}
  onSaved={handleItemSaved}
/>
      )}
    </div>
  );
}
