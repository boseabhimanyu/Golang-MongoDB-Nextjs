"use client";

import { useMemo } from "react";

import { sanitizeHtml } from "@/lib/sanitize-html";

type PageContentProps = {
  content: string;
};

export default function PageContent({
  content,
}: PageContentProps) {
  const safeHtml = useMemo(
    () => sanitizeHtml(content),
    [content],
  );

  return (
    <div
      className="page-content"
      dangerouslySetInnerHTML={{
        __html: safeHtml,
      }}
    />
  );
}