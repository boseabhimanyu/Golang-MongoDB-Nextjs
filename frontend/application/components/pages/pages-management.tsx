"use client";

import axios from "axios";
import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import api from "@/lib/api";
import { useNotification } from "@/components/notifications/notification-provider";
import type {
  Page,
  PageVisibility,
  PagesResponse,
} from "@/lib/types";
import PageEditor from "@/components/pages/page-editor";

type PageForm = {
  title: string;
  content: string;
  visibility: PageVisibility;
  slug: string;
};

const emptyForm: PageForm = {
  title: "",
  content: "",
  visibility: "public",
  slug: "",
};

function getErrorMessage(
  error: unknown,
  fallback: string,
) {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ??
      error.response?.data?.error ??
      fallback
    );
  }

  return fallback;
}

export default function PagesManagement() {
  const { showNotification } = useNotification();

  const [viewingPage, setViewingPage] =
    useState<Page | null>(null);

  const [pages, setPages] = useState<Page[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [visibilityFilter, setVisibilityFilter] =
    useState<"" | PageVisibility>("");

  const [showEditor, setShowEditor] = useState(false);
  const [editingPage, setEditingPage] =
    useState<Page | null>(null);

  const [form, setForm] = useState<PageForm>(
    emptyForm,
  );

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  async function loadPages() {
    setLoading(true);

    try {
      const params = new URLSearchParams();

      params.set("page", String(page));
      params.set("limit", String(limit));

      if (visibilityFilter) {
        params.set(
          "visibility",
          visibilityFilter,
        );
      }

      const response =
        await api.get<PagesResponse>(
          `/admin/pages?${params.toString()}`,
        );

      setPages(response.data.pages ?? []);

      setTotalPages(
        response.data.pagination?.totalPages ?? 1,
      );
    } catch (error) {
      showNotification(
        getErrorMessage(
          error,
          "Unable to load pages.",
        ),
        "error",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPages();
  }, [page, visibilityFilter]);

  function handleViewPage(selectedPage: Page) {
    if (!selectedPage.slug) {
      showNotification(
        "This page does not have a slug.",
        "error",
      );
      return;
    }

    window.open(
      `/${selectedPage.slug}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  function openCreate() {
    setEditingPage(null);

    setForm({
      title: "",
      content: "",
      visibility: "public",
      slug: "",
    });

    setShowEditor(true);
  }

  function openEdit(selectedPage: Page) {
    setEditingPage(selectedPage);

    setForm({
      title: selectedPage.title,
      content: selectedPage.content,
      visibility: selectedPage.visibility,
      slug: selectedPage.slug,
    });

    setShowEditor(true);
  }

  function closeEditor() {
    if (saving) {
      return;
    }

    setShowEditor(false);
    setEditingPage(null);
    setForm(emptyForm);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const title = form.title.trim();

    if (!title) {
      showNotification(
        "Page title cannot be blank.",
        "error",
      );
      return;
    }

    setSaving(true);

    try {
      if (editingPage) {
        const payload: {
          title: string;
          content: string;
          visibility: PageVisibility;
          slug?: string;
        } = {
          title,
          content: form.content,
          visibility: form.visibility,
        };

        if (title !== "") {
          payload.slug = form.slug.trim();
        }

        const response = await api.patch(
          `/admin/pages/${editingPage.id}`,
          payload,
        );

        showNotification(
          response.data?.message ??
            "Page updated successfully.",
          "success",
        );
      } else {
        const response = await api.post(
          "/admin/pages",
          {
            title,
            content: form.content,
            visibility: form.visibility,
          },
        );

        showNotification(
          response.data?.message ??
            "Page created successfully.",
          "success",
        );
      }

      setShowEditor(false);
      setEditingPage(null);
      setForm(emptyForm);

      await loadPages();
    } catch (error) {
      showNotification(
        getErrorMessage(
          error,
          editingPage
            ? "Unable to update page."
            : "Unable to create page.",
        ),
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(
    selectedPage: Page,
  ) {
    const confirmed = window.confirm(
      `Delete "${selectedPage.title}"?`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(selectedPage.id);

    try {
      const response = await api.delete(
        `/admin/pages/${selectedPage.id}`,
      );

      showNotification(
        response.data?.message ??
          "Page deleted successfully.",
        "success",
      );

      if (
        pages.length === 1 &&
        page > 1
      ) {
        setPage((current) => current - 1);
      } else {
        await loadPages();
      }
    } catch (error) {
      showNotification(
        getErrorMessage(
          error,
          "Unable to delete page.",
        ),
        "error",
      );
    } finally {
      setDeletingId(null);
    }
  }

  const filteredPages = pages.filter((item) => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return (
      item.title
        .toLowerCase()
        .includes(query) ||
      item.slug
        .toLowerCase()
        .includes(query)
    );
  });

  return (
    <>
      <div className="glass rounded-3xl p-4 sm:p-5 lg:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Pages
            </h2>

            <p className="mt-1 text-sm text-zinc-600">
              Manage website content and page visibility.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreate}
            className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800"
          >
            + Create page
          </button>
        </div>

        <div className="mt-6 flex flex-col gap-3 md:flex-row">
          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search pages..."
            className="min-w-0 flex-1 rounded-xl border border-white/80 bg-white/55 px-4 py-2.5 text-sm outline-none backdrop-blur-xl transition focus:border-zinc-300 focus:bg-white/75"
          />

          <select
            value={visibilityFilter}
            onChange={(event) => {
              setVisibilityFilter(
                event.target.value as
                  | ""
                  | PageVisibility,
              );
              setPage(1);
            }}
            className="rounded-xl border border-white/80 bg-white/55 px-4 py-2.5 text-sm outline-none backdrop-blur-xl"
          >
            <option value="">
              All visibility
            </option>

            <option value="public">
              Public
            </option>

            <option value="registered">
              Registered
            </option>
          </select>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-white/70">
          {loading ? (
            <div className="px-5 py-12 text-center text-sm text-zinc-500">
              Loading pages...
            </div>
          ) : filteredPages.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-zinc-500">
              No pages found.
            </div>
          ) : (
            <div className="divide-y divide-white/70">
              {filteredPages.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-4 bg-white/25 px-5 py-4 transition hover:bg-white/45 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleViewPage(item)
                        }
                        className="truncate text-left text-sm font-semibold text-zinc-900 underline-offset-4 transition hover:text-zinc-600 hover:underline"
                      >
                        {item.title}
                      </button>

                      <span
                        className={
                          item.visibility ===
                          "public"
                            ? "rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700"
                            : "rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700"
                        }
                      >
                        {item.visibility ===
                        "public"
                          ? "Public"
                          : "Registered"}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleViewPage(item)
                      }
                      className="mt-1 block truncate text-left text-sm text-zinc-500 transition hover:text-zinc-800 hover:underline"
                    >
                      /{item.slug}
                    </button>

                    <p className="mt-1 text-xs text-zinc-400">
                      Updated{" "}
                      {new Date(
                        item.updatedAt,
                      ).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleViewPage(item)
                      }
                      className="rounded-xl border border-white/70 bg-white/55 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-white/80"
                    >
                      View
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        openEdit(item)
                      }
                      className="rounded-xl border border-white/70 bg-white/55 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-white/80"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(item)
                      }
                      disabled={
                        deletingId === item.id
                      }
                      className="rounded-xl border border-red-200/70 bg-red-50/60 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingId === item.id
                        ? "Deleting..."
                        : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-5 flex items-center justify-between">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() =>
                setPage(
                  (current) => current - 1,
                )
              }
              className="rounded-xl border border-white/80 bg-white/55 px-4 py-2 text-sm font-medium text-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <p className="text-sm text-zinc-500">
              Page {page} of {totalPages}
            </p>

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() =>
                setPage(
                  (current) => current + 1,
                )
              }
              className="rounded-xl border border-white/80 bg-white/55 px-4 py-2 text-sm font-medium text-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {showEditor && (
        <div className="fixed inset-0 z-[90] overflow-y-auto bg-zinc-950/30 px-4 py-8 backdrop-blur-sm">
          <div className="mx-auto max-w-5xl">
            <div className="glass-strong rounded-3xl p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">
                    {editingPage
                      ? "Edit page"
                      : "Create page"}
                  </h2>

                  <p className="mt-1 text-sm text-zinc-600">
                    {editingPage
                      ? "Update page content, slug and visibility."
                      : "Create and manage page content."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeEditor}
                  disabled={saving}
                  className="rounded-xl px-3 py-2 text-zinc-500 transition hover:bg-black/5 hover:text-zinc-800 disabled:opacity-40"
                >
                  ×
                </button>
              </div>

              <form
                onSubmit={handleSubmit}
                className="mt-6 space-y-5"
              >
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700">
                    Title
                  </label>

                  <input
                    type="text"
                    value={form.title}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        title:
                          event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-white/80 bg-white/55 px-4 py-3 text-sm outline-none backdrop-blur-xl transition focus:border-zinc-300 focus:bg-white/75"
                  />
                </div>

                {editingPage && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-700">
                      Slug
                    </label>

                    <input
                      type="text"
                      value={form.slug}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          slug:
                            event.target.value,
                        }))
                      }
                      placeholder="page-slug"
                      className="w-full rounded-xl border border-white/80 bg-white/55 px-4 py-3 text-sm outline-none backdrop-blur-xl transition focus:border-zinc-300 focus:bg-white/75"
                    />
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700">
                    Visibility
                  </label>

                  <select
                    value={form.visibility}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        visibility:
                          event.target.value as PageVisibility,
                      }))
                    }
                    className="w-full rounded-xl border border-white/80 bg-white/55 px-4 py-3 text-sm outline-none backdrop-blur-xl"
                  >
                    <option value="public">
                      Public
                    </option>

                    <option value="registered">
                      Registered
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700">
                    Content
                  </label>

                  <PageEditor
                    key={
                      editingPage?.id ??
                      "new-page"
                    }
                    initialContent={form.content}
                    onChange={(content) =>
                      setForm((current) => ({
                        ...current,
                        content,
                      }))
                    }
                  />
                </div>

                <div className="flex justify-end gap-3 border-t border-white/70 pt-5">
                  <button
                    type="button"
                    onClick={closeEditor}
                    disabled={saving}
                    className="rounded-xl border border-white/80 bg-white/55 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-white/80 disabled:opacity-40"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={
                      saving ||
                      !form.title.trim()
                    }
                    className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : editingPage
                        ? "Save changes"
                        : "Create page"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}