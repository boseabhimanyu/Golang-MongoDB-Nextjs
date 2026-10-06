import { notFound } from "next/navigation";

type Page = {
  id: string;
  title: string;
  content: string;
  authorId: string;
  slug: string;
  visibility: "public" | "registered";
  createdAt: string;
  updatedAt: string;
};

type PageResponse = {
  page: Page;
};

async function getPage(
  slug: string,
): Promise<Page | null> {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not configured.",
    );
  }

  const response = await fetch(
    `${apiUrl}/pages/${encodeURIComponent(slug)}`,
    {
      cache: "no-store",
    },
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      "Unable to load page.",
    );
  }

  const data =
    (await response.json()) as PageResponse;

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
    <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <article className="glass mx-auto max-w-5xl rounded-3xl p-6 sm:p-8 lg:p-10">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
            {page.title}
          </h1>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-500">
            <span>
              Created{" "}
              {formatDate(page.createdAt)}
            </span>

            <span>
              Updated{" "}
              {formatDate(page.updatedAt)}
            </span>
          </div>
        </header>

        <div
          className="page-editor-content mt-8"
          dangerouslySetInnerHTML={{
            __html: page.content,
          }}
        />
      </article>
    </main>
  );
}