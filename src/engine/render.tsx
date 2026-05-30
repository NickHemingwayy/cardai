// engine/render.tsx
// Public entry point for the render engine.
//
//   renderPage(doc)    → complete standalone HTML string (export / /p/[slug])
//   renderPreview(doc) → same + postMessage bridge for the builder iframe

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { PageDocument } from "../schema/page";
import { defaultTheme } from "../schema/primitives";
import { RenderNode } from "./NodeRenderer";
import {
  buildFontLink,
  buildThemeCSS,
  BASE_CSS,
  ANIMATION_SCRIPT,
  PREVIEW_BRIDGE_SCRIPT,
} from "./theme";

// ─────────────────────────────────────────────────────────────────────────────
// Options
// ─────────────────────────────────────────────────────────────────────────────

export interface RenderOptions {
  /** Strip entrance animations. Useful for SSR screenshots / OG image generation. */
  disableAnimations?: boolean;
  /** Return only the <body> content, no <html>/<head> wrapper. For unit tests. */
  fragmentOnly?: boolean;
  /** Inject the preview bridge (postMessage + hover/select outlines). */
  preview?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Page component
// ─────────────────────────────────────────────────────────────────────────────

function Page({
  doc,
  preview = false,
}: {
  doc: PageDocument;
  preview?: boolean;
}) {
  return (
    <div>
      {doc.content.map((node) => (
        <RenderNode key={node.id} node={node} preview={preview} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function buildFavicon(favicon: string): string {
  // Single emoji → SVG data URI
  if ([...favicon].length <= 2) {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>${favicon}</text></svg>`;
    return `  <link rel="icon" href="data:image/svg+xml,${encodeURIComponent(svg)}">`;
  }
  return `  <link rel="icon" href="${escapeAttr(favicon)}">`;
}

function buildSeoTags(doc: PageDocument): string {
  const lines: string[] = [];
  const { meta } = doc;

  if (meta.description) {
    lines.push(
      `  <meta name="description" content="${escapeAttr(meta.description)}">`,
    );
    lines.push(
      `  <meta property="og:description" content="${escapeAttr(meta.description)}">`,
    );
  }
  lines.push(
    `  <meta property="og:title" content="${escapeAttr(meta.title)}">`,
  );
  lines.push(`  <meta property="og:type" content="website">`);

  if (meta.ogImage) {
    lines.push(
      `  <meta property="og:image" content="${escapeAttr(meta.ogImage)}">`,
    );
    lines.push(`  <meta name="twitter:card" content="summary_large_image">`);
  }
  if (meta.noIndex) {
    lines.push(`  <meta name="robots" content="noindex,nofollow">`);
  }

  return lines.join("\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// Core render function
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Render a PageDocument to a complete, standalone HTML string.
 * Pure function — no I/O, no side effects.
 */
export function renderPage(
  doc: PageDocument,
  options: RenderOptions = {},
): string {
  const {
    disableAnimations = false,
    fragmentOnly = false,
    preview = false,
  } = options;

  // Merge user theme over defaults so no CSS var is ever undefined
  const mergedDoc: PageDocument = {
    ...doc,
    theme: { ...defaultTheme, ...doc.theme },
  };

  // Render the node tree to an HTML string via React SSR
  const bodyHtml = renderToStaticMarkup(
    <Page doc={mergedDoc} preview={preview} />,
  );

  if (fragmentOnly) return bodyHtml;

  // ── <head> assembly ─────────────────────────────────────────────────────────
  const themeCSS = buildThemeCSS(mergedDoc.theme);
  const fontLink = buildFontLink(mergedDoc.theme);
  const seoTags = buildSeoTags(mergedDoc);
  const favicon = mergedDoc.meta.favicon
    ? buildFavicon(mergedDoc.meta.favicon)
    : "";
  const animBlock = disableAnimations ? "" : `\n${ANIMATION_SCRIPT}`;
  const bridge = preview ? `\n${PREVIEW_BRIDGE_SCRIPT}` : "";

  // ── Full document ───────────────────────────────────────────────────────────
  return `<!DOCTYPE html>
<html lang="${escapeAttr(mergedDoc.meta.lang ?? "en")}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeAttr(mergedDoc.meta.title)}</title>
${seoTags}
${favicon}
  ${fontLink}
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            heading: ["var(--font-heading)"],
            body:    ["var(--font-body)"],
          },
        },
      },
    };
  </script>
  <style>
${themeCSS}

${BASE_CSS}
  </style>
</head>
<body class="font-body">

${bodyHtml}
${animBlock}
${bridge}
</body>
</html>`.trim();
}

/**
 * Render for the builder <iframe srcdoc> preview.
 * Adds the postMessage bridge and hover/select outlines.
 */
export function renderPreview(doc: PageDocument): string {
  return renderPage(doc, { preview: true });
}
