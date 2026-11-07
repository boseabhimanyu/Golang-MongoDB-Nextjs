import postcss, { AnyNode, AtRule } from "postcss";

/**
 * Traverses parent nodes to determine if a rule is located inside an @keyframes block.
 * Typed with `AnyNode` to avoid TypeScript Document vs Container parent union mismatches.
 */
function isInsideKeyframes(node: AnyNode): boolean {
  let curr: AnyNode["parent"] = node.parent;
  while (curr) {
    if (curr.type === "atrule" && /keyframes/i.test((curr as AtRule).name)) {
      return true;
    }
    curr = curr.parent;
  }
  return false;
}

export function scopePageCss(css: string, scopeClass = ".page-content-scope"): string {
  if (!css || !css.trim()) return "";

  // 1. Strip CSS comments first so "{ /* comment */ }" collapses cleanly to "{}"
  let sanitized = css.replace(/\/\*[\s\S]*?\*\//g, "");

  // 2. Remove orphaned selector lines ending with ';' that lack a property ':'
  // E.g., removes stripped artifacts like "p em;" while preserving valid rules like "color: red;"
  sanitized = sanitized
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      if (trimmed.endsWith(";") && !trimmed.includes(":")) {
        return false;
      }
      return true;
    })
    .join("\n")
    .trim();

  if (!sanitized) return "";

  let root;
  try {
    root = postcss.parse(sanitized);
  } catch (error) {
    // Prevents unhandled CSS syntax errors from crashing the page or modal
    console.warn("Failed to parse CSS for scoping:", error);
    return "";
  }

  root.walkRules((rule) => {
    // Remove empty rule declarations (e.g. "p em {}")
    if (!rule.nodes || rule.nodes.length === 0) {
      rule.remove();
      return;
    }

    // Skip keyframe animation steps (from, to, 0%, 100%)
    if (isInsideKeyframes(rule)) {
      return;
    }

    rule.selectors = rule.selectors
      .map((selector) => {
        const trimmed = selector.trim();
        if (!trimmed) return "";

        // Normalize root elements to the scope class
        if (
          trimmed === ":root" ||
          trimmed === "html" ||
          trimmed === "body"
        ) {
          return scopeClass;
        }

        // Handle root chained selectors (e.g. "html.dark" -> ".page-content-scope.dark")
        if (/^(html|body|:root)/i.test(trimmed)) {
          return trimmed.replace(/^(html|body|:root)/i, scopeClass);
        }

        return `${scopeClass} ${trimmed}`;
      })
      .filter(Boolean);
  });

  return root.toString();
}