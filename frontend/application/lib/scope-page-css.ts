import postcss from "postcss";

export function scopePageCss(css: string): string {
  if (!css.trim()) return "";

  const root = postcss.parse(css);

  root.walkRules((rule) => {
    // Ignore rules inside keyframes.
    if (
      rule.parent?.type === "atrule" &&
      /keyframes/i.test(rule.parent.name)
    ) {
      return;
    }

    const selectors = rule.selectors;

    rule.selectors = selectors.map((selector) => {
      const trimmed = selector.trim();

      // Prevent global selectors.
      if (
        trimmed === ":root" ||
        trimmed === "html" ||
        trimmed === "body"
      ) {
        return ".page-content-scope";
      }

      return `.page-content-scope ${trimmed}`;
    });
  });

  return root.toString();
}