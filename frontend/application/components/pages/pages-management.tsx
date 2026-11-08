"use client";

import axios from "axios";
import DOMPurify from "isomorphic-dompurify";
import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import dynamic from "next/dynamic";

import api from "@/lib/api";
import { useNotification } from "@/components/notifications/notification-provider";
import type {
  Page,
  PageVisibility,
  PagesResponse,
} from "@/lib/types";

import styles from "../../app/(website)/[slug]/editor-typography.module.css"
import "../../styles/page-custom-styles.css"
import { Home, Search, X } from "lucide-react";
import { scopePageCss } from "@/lib/scope-page-css";
// Dynamic import with SSR disabled to prevent hydration errors with TinyMCE
const PageEditor = dynamic(
  () => import("@/components/pages/page-editor"),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-white/70 bg-white/40 text-sm text-zinc-500 backdrop-blur-xl">
        Loading editor...
      </div>
    ),
  }
);

const CssEditor = dynamic(
  () => import("@/components/pages/CssEditor"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[240px] items-center justify-center rounded-xl border border-white/80 bg-zinc-900/10 text-sm text-zinc-500">
        Loading CSS editor...
      </div>
    ),
  }
);

type PageForm = {
  title: string;
  content: string;
  visibility: PageVisibility;
  slug: string;
  css: string;
};

const emptyForm: PageForm = {
  title: "",
  content: "",
  visibility: "public",
  slug: "",
  css: "",
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

const [homepageModalOpen, setHomepageModalOpen] = useState(false);
const [publicPages, setPublicPages] = useState<Page[]>([]);
const [homepageSearch, setHomepageSearch] = useState("");
const [selectedHomepageId, setSelectedHomepageId] = useState("");
const [homepagePage, setHomepagePage] = useState(1);
const [hasMorePages, setHasMorePages] = useState(true);
const [loadingHomepagePages, setLoadingHomepagePages] = useState(false);
const [updatingHomepage, setUpdatingHomepage] = useState(false);
const PAGE_LIMIT = 20;
  // State to track which page is pending confirmation
  const [pageToDelete, setPageToDelete] = useState<Page | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  function confirmDelete(selectedPage: Page) {
    setPageToDelete(selectedPage);
  }

  function cancelDelete() {
    if (isDeleting) return;
    setPageToDelete(null);
  }

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

const loadHomepagePages = useCallback(
  async (searchTerm: string, pageNumber: number, signal?: AbortSignal) => {
    setLoadingHomepagePages(true);

    try {
      const response = await api.get<PagesResponse>(
        "/admin/pages",
        {
          params: {
            visibility: "public",
            page: pageNumber,
            limit: PAGE_LIMIT,
            ...(searchTerm.trim()
              ? { search: searchTerm.trim() }
              : {}),
          },
          signal,
        },
      );

      const fetchedPages = response.data.pages ?? [];
      
      // Determine if there are more pages to load
      setHasMorePages(fetchedPages.length === PAGE_LIMIT);

      // If page is 1, replace list (new search or modal open). If page > 1, append for "Load More".
      setPublicPages((prev) =>
        pageNumber === 1 ? fetchedPages : [...prev, ...fetchedPages]
      );
    } catch (error) {
      if (signal?.aborted || axios.isCancel(error)) {
        return;
      }

      showNotification(
        getErrorMessage(error, "Unable to load public pages."),
        "error",
      );
    } finally {
      if (!signal?.aborted) {
        setLoadingHomepagePages(false);
      }
    }
  },
  [showNotification],
);

useEffect(() => {
  if (!homepageModalOpen) return;

  const controller = new AbortController();
  setHomepagePage(1); // Reset to page 1 on search term change

  const timeout = setTimeout(() => {
    loadHomepagePages(
      homepageSearch,
      1,
      controller.signal,
    );
  }, 400);

  return () => {
    clearTimeout(timeout);
    controller.abort();
  };
}, [
  homepageModalOpen,
  homepageSearch,
  loadHomepagePages,
]);

const handleLoadMore = () => {
  const nextPage = homepagePage + 1;
  setHomepagePage(nextPage);
  loadHomepagePages(homepageSearch, nextPage);
};

function openHomepageModal() {
  setHomepageModalOpen(true);
  setHomepageSearch("");
  setSelectedHomepageId("");
  setHomepagePage(1);
}

async function setHomepage(selectedPageId: string) {
  if (!selectedPageId || updatingHomepage) return;

  try {
    setUpdatingHomepage(true);

    const response = await api.patch(
      `/admin/pages/${selectedPageId}/homepage`,
      {
        isHomepage: true,
      },
    );

    showNotification(
      response.data?.message ?? "Homepage assigned successfully.",
      "success",
    );

    await loadPages();
    // Refreshes the list so the "Current" badge updates inside the modal immediately
    await loadHomepagePages(homepageSearch, homepagePage); 
  } catch (error) {
    showNotification(
      getErrorMessage(error, "Unable to assign homepage."),
      "error",
    );
  } finally {
    setUpdatingHomepage(false);
  }
}

async function removeHomepage(selectedPageId: string) {
  if (!selectedPageId || updatingHomepage) return;

  try {
    setUpdatingHomepage(true);

    const response = await api.patch(
      `/admin/pages/${selectedPageId}/homepage`,
      {
        isHomepage: false,
      },
    );

    showNotification(
      response.data?.message ?? "Homepage designation removed.",
      "success",
    );

    await loadPages();
    // Refreshes the list so the "Current" badge clears inside the modal immediately
    await loadHomepagePages(homepageSearch, homepagePage);
  } catch (error) {
    showNotification(
      getErrorMessage(error, "Unable to remove homepage."),
      "error",
    );
  } finally {
    setUpdatingHomepage(false);
  }
}

  useEffect(() => {
    loadPages();
  }, [page, visibilityFilter]);

async function handleViewPage(selectedPage: Page) {
  try {
    const response = await api.get<{ page: Page }>(
      `/admin/pages/${selectedPage.id}`,
    );

    setViewingPage(response.data.page);
  } catch (error) {
    showNotification(
      getErrorMessage(error, "Unable to load page preview."),
      "error",
    );
  }
}

  // Opens the live URL in a new browser tab/window
  function handleViewNewPage(selectedPage: Page) {
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

  function closeView() {
    setViewingPage(null);
  }

function openCreate() {
  setEditingPage(null);

  setForm({
    title: "",
    content: "",
    visibility: "public",
    slug: "",
    css: "",
  });

  setShowEditor(true);
}

  async function openEdit(selectedPage: Page) {
  try {
    const response = await api.get<{ page: Page }>(
      `/admin/pages/${selectedPage.id}`,
    );

    const fullPage = response.data.page;

    setEditingPage(fullPage);

    setForm({
      title: fullPage.title,
      content: fullPage.content,
      visibility: fullPage.visibility,
      slug: fullPage.slug,
      css: fullPage.css ?? "",
    });

    setShowEditor(true);
  } catch (error) {
    showNotification(
      getErrorMessage(error, "Unable to load page details."),
      "error",
    );
  }
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
            css: string;
          } = {
            title,
            content: form.content,
            visibility: form.visibility,
            css: form.css,
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
            css: form.css,
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

  async function executeDelete() {
    if (!pageToDelete) return;

    setIsDeleting(true);

    try {
      const response = await api.delete(`/admin/pages/${pageToDelete.id}`);

      showNotification(
        response.data?.message ?? "Page deleted successfully.",
        "success",
      );

      setPageToDelete(null);

      if (pages.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        await loadPages();
      }
    } catch (error) {
      showNotification(
        getErrorMessage(error, "Unable to delete page."),
        "error",
      );
    } finally {
      setIsDeleting(false);
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

const currentHomepage = publicPages.find(
  (item) => item.isHomepage,
);

  return (
    <>
      <div className="glass rounded-3xl p-4 sm:p-5 lg:p-6">
        {/* Smoked Liquid Glass Header Bar */}
        <div className="relative overflow-hidden rounded-2xl border border-white/70 bg-zinc-900/[0.07] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] backdrop-blur-xl transition-all">
          {/* Specular light highlight */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <select
            value={visibilityFilter}
            onChange={(event) => {
              setVisibilityFilter(event.target.value as "" | PageVisibility);
              setPage(1);
            }}
            className="rounded-xl border border-white/80 bg-white/95 px-4 py-2.5 text-sm outline-none backdrop-blur-xl"
          >
            <option value="">All visibility</option>
            <option value="public">Public</option>
            <option value="registered">Registered</option>
          </select>
            </div>
<input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search pages..."
            className="min-w-0 flex-1 rounded-xl border border-white/80 bg-white/95 px-4 py-2.5 text-sm outline-none backdrop-blur-xl transition focus:border-zinc-300 focus:bg-white/75"
          />
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 active:scale-[0.98]"
            >
              + Create page
            </button>
            <button
  type="button"
  onClick={openHomepageModal}
  className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 active:scale-[0.98]"
>
  <Home className="h-4 w-4" />
  Manage Homepage
</button>
          </div>
        </div>

        {/* Search & Visibility Filters */}
        <div className="mt-6 flex flex-col gap-3 md:flex-row">
          

          
        </div>

        {/* Table List Section */}
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
                  className="flex flex-col gap-4 bg-zinc-900/[0.07] px-5 py-4 backdrop-blur-xl transition hover:bg-zinc-900/[0.11] lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        className="truncate text-left text-sm font-semibold text-zinc-900 underline-offset-4 transition hover:text-zinc-600 hover:underline"
                      >
                        {item.title}
                      </button>

                      <span
                        className={
                          item.visibility === "public"
                            ? "rounded-full border border-emerald-600/20 bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 backdrop-blur-sm"
                            : "rounded-full border border-blue-600/20 bg-blue-500/15 px-2.5 py-0.5 text-xs font-semibold text-blue-800 backdrop-blur-sm"
                        }
                      >
                        {item.visibility === "public"
                          ? "Public"
                          : "Registered"}
                      </span>
                      {item.isHomepage && (
  <span className="rounded-full border border-blue-600/20 bg-blue-500/15 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
    Homepage
  </span>
)}
                    </div>
                          
                    <p className="mt-1 text-xs text-zinc-500">
                      Updated {new Date(item.updatedAt).toLocaleString()}
                      <button
                      type="button"
                      onClick={() =>
                        handleViewPage(item)
                      }
                      className="mt-1 block truncate text-left text-sm text-zinc-500 transition hover:text-zinc-800 hover:underline"
                    >
                      /{item.slug}
                    </button>
                    </p>
                  </div>
                      
                  <div className="flex flex-wrap items-center gap-2">
                     {item.visibility === "public" && (
  item.isHomepage ? (
    <button
      type="button"
      onClick={() => removeHomepage(item.id)}
      disabled={updatingHomepage}
      className="rounded-xl border border-red-200/90 bg-red-100/70 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
    >
      Remove homepage
    </button>
  ) : (
    <button
      type="button"
      onClick={() => setHomepage(item.id)}
      disabled={updatingHomepage}
      className="rounded-xl border border-white/90 bg-white/85 px-3 py-2 text-sm font-medium text-zinc-800 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
    >
      Set as homepage
    </button>
  )
)}
                    <button
                      type="button"
                      onClick={() => handleViewPage(item)}
                      className="rounded-xl border border-white/90 bg-white/85 px-3 py-2 text-sm font-medium text-zinc-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] backdrop-blur-md transition hover:border-white hover:bg-white hover:text-zinc-950 active:scale-[0.98]"
                    >
                      View
                    </button>
                     
                    <button
                      type="button"
                      onClick={() => handleViewNewPage(item)}
                      title="Open live page in new tab"
                      className="rounded-xl border border-white/90 bg-white/85 px-3 py-2 text-sm font-medium text-zinc-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] backdrop-blur-md transition hover:border-white hover:bg-white hover:text-zinc-950 active:scale-[0.98]"
                    >
                      Live ↗
                    </button>

                    <button
                      type="button"
                      onClick={() => openEdit(item)}
                      className="rounded-xl border border-white/90 bg-white/85 px-3 py-2 text-sm font-medium text-zinc-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] backdrop-blur-md transition hover:border-white hover:bg-white hover:text-zinc-950 active:scale-[0.98]"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => confirmDelete(item)}
                      disabled={isDeleting && pageToDelete?.id === item.id}
                      className="rounded-xl border border-red-200/90 bg-red-100/70 px-3 py-2 text-sm font-medium text-red-700 shadow-[0_2px_8px_rgba(239,68,68,0.06)] backdrop-blur-md transition hover:border-red-300 hover:bg-red-100 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]"
                    >
                      {isDeleting && pageToDelete?.id === item.id
                        ? "Deleting..."
                        : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-5 flex items-center justify-between">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((current) => current - 1)}
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
              onClick={() => setPage((current) => current + 1)}
              className="rounded-xl border border-white/80 bg-white/55 px-4 py-2 text-sm font-medium text-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Editor Modal */}
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
                        title: event.target.value,
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
                          slug: event.target.value,
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
                        visibility: event.target.value as PageVisibility,
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
                    key={editingPage?.id ?? "new-page"}
                    initialContent={form.content}
                    onChange={(content) =>
                      setForm((current) => ({
                        ...current,
                        content,
                      }))
                    }
                  />
<div className="mt-5">
  <label className="mb-2 block text-sm font-medium text-zinc-700">
    Custom CSS
  </label>

  <CssEditor
    value={form.css}
    onChange={(cssValue) =>
      setForm((current) => ({
        ...current,
        css: cssValue,
      }))
    }
    height="260px"
    placeholder="/* Enter custom CSS rules (e.g. p, em, strong) */"
  />

  <p className="mt-1 text-xs text-zinc-500">
    Scoped automatically with class .page-content-scope.
  </p>
</div>
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
                    disabled={saving || !form.title.trim()}
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

      {/* Preview Modal */}
      {viewingPage && (
        <div className="fixed inset-0 z-[90] overflow-y-auto bg-zinc-950/30 px-4 py-8 backdrop-blur-sm">
          <div className="mx-auto max-w-4xl">
            <div className="glass-strong rounded-3xl p-6 sm:p-8">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 border-b border-white/70 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold tracking-tight text-zinc-900">
                      {viewingPage.title}
                    </h2>
                    <span
                      className={
                        viewingPage.visibility === "public"
                          ? "rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700"
                          : "rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700"
                      }
                    >
                      {viewingPage.visibility === "public"
                        ? "Public"
                        : "Registered"}
                    </span>
                  </div>
                  {viewingPage.slug && (
                    <p className="mt-1 text-xs text-zinc-500">
                      Slug: /{viewingPage.slug}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={closeView}
                  className="rounded-xl px-3 py-1.5 text-xl font-semibold text-zinc-500 transition hover:bg-black/5 hover:text-zinc-800"
                >
                  ×
                </button>
              </div>

              {/* Content Body */}
              <div
  className={`page-content-scope pt-6 text-zinc-800 ${styles.typographyContainer}`}
>
  <style>
    {scopePageCss(viewingPage.css ?? "")}
  </style>

  {viewingPage.content ? (
    <div
      dangerouslySetInnerHTML={{
        __html: DOMPurify.sanitize(viewingPage.content),
      }}
    />
  ) : (
    <p className="italic text-zinc-400">No content available.</p>
  )}
</div>

              {/* Footer */}
              <div className="mt-8 flex flex-wrap items-center justify-end gap-2 border-t border-white/70 pt-4">
                <button
                  type="button"
                  onClick={closeView}
                  className="rounded-xl border border-white/70 bg-white/55 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-white/80"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={() => handleViewNewPage(viewingPage)}
                  className="rounded-xl border border-white/70 bg-white/55 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-white/80"
                >
                  Live ↗
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const targetPage = viewingPage;
                    closeView();
                    openEdit(targetPage);
                  }}
                  className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {pageToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/40 px-4 backdrop-blur-sm">
          <div className="glass-strong w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-[0_24px_70px_rgba(0,0,0,0.2)]">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.75"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                  />
                </svg>
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold text-zinc-900">
                  Delete page
                </h3>
                <p className="mt-1 text-sm text-zinc-600">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-zinc-900">
                    &quot;{pageToDelete.title}&quot;
                  </span>
                  ? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-white/70 pt-4">
              <button
                type="button"
                onClick={cancelDelete}
                disabled={isDeleting}
                className="rounded-xl border border-white/70 bg-white/55 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-white/80 disabled:opacity-40"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={executeDelete}
                disabled={isDeleting}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Homepage Management Modal */}
{homepageModalOpen && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/40 px-4 backdrop-blur-sm">
    <div className="glass-strong w-full max-w-lg rounded-3xl p-6 shadow-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">
            Manage Homepage
          </h2>

          <p className="mt-1 text-sm text-zinc-600">
            Search or select a public page to display at the homepage URL (/).
          </p>
        </div>

        <button
          type="button"
          onClick={() => setHomepageModalOpen(false)}
          disabled={updatingHomepage}
          className="rounded-xl p-2 text-zinc-500 transition hover:bg-black/5"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-6 space-y-4">
        {/* Unified Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />

          <input
            type="search"
            value={homepageSearch}
            onChange={(event) => {
              setHomepageSearch(event.target.value);
            }}
            placeholder="Search pages by title or slug..."
            className="w-full rounded-xl border border-zinc-300 bg-white/80 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
          />
        </div>

        {/* Custom Scrollable List with Load More */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-800">
            Select page
          </label>

          <div className="max-h-60 overflow-y-auto rounded-xl border border-zinc-300 bg-white p-1 shadow-inner space-y-1">
            {loadingHomepagePages && publicPages.length === 0 ? (
              <div className="py-6 text-center text-sm text-zinc-500">
                Loading pages...
              </div>
            ) : publicPages.length === 0 ? (
              <div className="py-6 text-center text-sm text-zinc-500">
                No matching public pages found.
              </div>
            ) : (
              <>
                {publicPages.map((item) => {
                  const isSelected = selectedHomepageId === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedHomepageId(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-left text-sm rounded-lg transition ${
                        isSelected
                          ? "bg-zinc-900 text-white font-medium"
                          : "hover:bg-zinc-100 text-zinc-800"
                      }`}
                    >
                      <div className="truncate pr-2">
                        <span>{item.title}</span>
                        {item.slug && (
                          <span className={`block text-xs ${isSelected ? "text-zinc-300" : "text-zinc-400"}`}>
                            /{item.slug}
                          </span>
                        )}
                      </div>

                      {item.isHomepage && (
                        <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                          isSelected ? "bg-zinc-800 text-zinc-200" : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}>
                          Current
                        </span>
                      )}
                    </button>
                  );
                })}

                {/* Load More Button inside list */}
                {hasMorePages && (
                  <div className="pt-2 pb-1 text-center border-t border-zinc-100 mt-1">
                    <button
                      type="button"
                      onClick={handleLoadMore}
                      disabled={loadingHomepagePages}
                      className="text-xs font-medium text-zinc-600 hover:text-zinc-900 py-1.5 px-3 rounded-lg hover:bg-zinc-100 transition disabled:opacity-50"
                    >
                      {loadingHomepagePages ? "Loading..." : "Load More Pages"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {currentHomepage && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
            Current active homepage:{" "}
            <span className="font-semibold">
              {currentHomepage.title}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-end gap-2 border-t border-white/70 pt-4">
          <button
            type="button"
            onClick={() => setHomepageModalOpen(false)}
            disabled={updatingHomepage}
            className="rounded-xl border border-white/80 bg-white/55 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-white/80 disabled:opacity-50"
          >
            Cancel
          </button>

          {currentHomepage && (
            <button
              type="button"
              onClick={() => removeHomepage(currentHomepage.id)}
              disabled={updatingHomepage}
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              {updatingHomepage ? "Updating..." : "Remove Homepage"}
            </button>
          )}

          <button
            type="button"
            onClick={() => setHomepage(selectedHomepageId)}
            disabled={
              !selectedHomepageId ||
              selectedHomepageId === currentHomepage?.id ||
              updatingHomepage ||
              loadingHomepagePages
            }
            className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {updatingHomepage ? "Updating..." : "Set Homepage"}
          </button>
        </div>
      </div>
    </div>
  </div>
)}
    </>
  );
}
