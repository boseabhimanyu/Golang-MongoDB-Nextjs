import Link from "next/link";
import type { MenuItem } from "./menu-types";

export default function MenuLink({
  item,
}: {
  item: MenuItem;
}) {
  const url = item.url?.trim();

  if (!url) {
    return <span>{item.label}</span>;
  }

  // External links stay unchanged.
  if (/^https?:\/\//i.test(url)) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer">
        {item.label}
      </a>
    );
  }

  // Convert /pages/quality-certifications
  // into /quality-certifications for frontend page links.
  const internalUrl =
    item.type === "page"
      ? url.replace(/^\/pages\//, "/")
      : url;

  return <Link href={internalUrl}>{item.label}</Link>;
}