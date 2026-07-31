// sx — converts the design's inline CSS strings into React style objects.
// Styles are transcribed verbatim from the Claude Design source, so visual
// parity is kept; parsed objects are memoized by the full CSS string.
import type { CSSProperties } from "react";

const cache = new Map<string, CSSProperties>();

function toCamel(prop: string): string {
  return prop.replace(/-(\w)/g, (_, c: string) => c.toUpperCase());
}

// Declarations are read from CSS text at runtime, so the property names are
// only known as strings; the index signature keeps that honest without
// widening the value the caller receives.
function parse(css: string): CSSProperties {
  const out: CSSProperties & Record<string, string> = {};
  for (const decl of css.split(";")) {
    const i = decl.indexOf(":");
    if (i === -1) continue;
    const prop = decl.slice(0, i).trim();
    const value = decl.slice(i + 1).trim();
    if (prop) out[toCamel(prop)] = value;
  }
  return out;
}

export default function sx(strings: TemplateStringsArray | string, ...values: unknown[]): CSSProperties {
  const css =
    typeof strings === "string"
      ? strings
      : strings.reduce((acc, s, i) => acc + s + (i < values.length ? String(values[i]) : ""), "");
  let style = cache.get(css);
  if (!style) {
    if (cache.size > 800) cache.clear();
    style = parse(css);
    cache.set(css, style);
  }
  return style;
}
