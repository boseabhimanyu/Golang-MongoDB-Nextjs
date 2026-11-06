
"use client";

import { useMemo } from "react";

import { sanitizeHtml } from "@/lib/sanitize-html";
import { scopePageCss } from "@/lib/scope-page-css";

import styles from "../../app/(website)/[slug]/editor-typography.module.css";
import "../../styles/page-custom-styles.css";

type PageContentProps = {
  content: string;
  css?: string;
};

export default function PageContent({
  content,
  css = "",
}: PageContentProps) {
  const safeHtml = useMemo(
    () => sanitizeHtml(content),
    [content],
  );

  const scopedCss = useMemo(
    () => scopePageCss(css),
    [css],
  );

  return (
    <div
      className={`page-content-scope ${styles.typographyContainer}`}
    >
      <style>{scopedCss}</style>

      <div
        dangerouslySetInnerHTML={{
          __html: safeHtml,
        }}
      />
    </div>
  );
}
