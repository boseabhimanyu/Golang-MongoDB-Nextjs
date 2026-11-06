import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import styles from "./editor-typography.module.css"; 
import "../../../styles/page-custom-styles.css"
import type { Metadata } from "next";

type Page = {
  id: string;
  title: string;
  content: string;
  authorId: string;
  slug: string;
  visibility: "public" | "registered";
  createdAt: string;
  updatedAt: string;
  css?: string; // Added custom CSS field
};

type PageResponse = {
  page: Page;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);

  return {
    title: page ? page.title : "Page Not Found",
  };
}

async function getPage(slug: string): Promise<Page | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  }

  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const response = await fetch(
    `${apiUrl}/pages/${encodeURIComponent(slug)}`,
    {
      cache: "no-store",
      headers: {
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
    },
  );

  if (response.status === 404) {
    return null;
  }

  if (response.status === 401 || response.status === 403) {
    redirect(`/login?callbackUrl=/${encodeURIComponent(slug)}`);
  }

  if (!response.ok) {
    throw new Error("Unable to load page.");
  }

  const data = (await response.json()) as PageResponse;
  return data.page ?? null;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const page = await getPage(slug);

  if (!page) {
    notFound();
  }

  return (
    <>
      {/* Inject the page-specific custom CSS */}
      {page.css && (
        <style dangerouslySetInnerHTML={{ __html: page.css }} />
      )}

      <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
        <article className="glass mx-auto max-w-5xl rounded-3xl p-6 sm:p-8 lg:p-10">
          <header>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
                {page.title}
              </h1>

              {page.visibility === "registered" && (
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                  Registered Only
                </span>
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-500">
              <span>Created {formatDate(page.createdAt)}</span>
              <span>Updated {formatDate(page.updatedAt)}</span>
            </div>
          </header>

          <div
            className={`${styles.typographyContainer} mt-8`}
            dangerouslySetInnerHTML={{
              __html: page.content,
            }}
          />
        </article>
      </main>
    </>
  );
}