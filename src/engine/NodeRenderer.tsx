// engine/NodeRenderer.tsx
// One React component per node type.
// All components are pure (no hooks, no side effects) — safe for renderToStaticMarkup.
// Tailwind classes come from maps.ts; theme values come from CSS vars set by theme.ts.

import React from "react";
import type {
  Node,
  Container,
  FlexContainer,
  Grid,
  Heading,
  Paragraph,
  Span,
  Button,
  Image,
  Divider,
} from "../schema/nodes";
import {
  cx,
  PADDING,
  GAP,
  TEXT_ALIGN,
  MAX_WIDTH,
  GRID_COLS,
  FLEX_JUSTIFY,
  FLEX_ALIGN,
  OBJECT_FIT,
  BUTTON_VARIANT,
  HEADING_SIZE,
  DIVIDER_SIZE,
} from "./maps";

// ─────────────────────────────────────────────────────────────────────────────
// Mini markdown → HTML
// Handles **bold**, _italic_, [text](url) in Paragraph content.
// Safe: escapes raw HTML before applying patterns.
// ─────────────────────────────────────────────────────────────────────────────

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function parseInline(raw: string): string {
  let s = escape(raw);
  s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(?<![a-zA-Z0-9])_(.+?)_(?![a-zA-Z0-9])/g, "<em>$1</em>");
  s = s.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="underline hover:opacity-75" rel="noopener noreferrer">$1</a>',
  );
  s = s.replace(/\n/g, "<br>");
  return s;
}

// ─────────────────────────────────────────────────────────────────────────────
// Layout node renderers
// ─────────────────────────────────────────────────────────────────────────────

function ContainerNode({
  node,
  preview,
}: {
  node: Container;
  preview: boolean;
}) {
  const style: React.CSSProperties = node.background
    ? { background: node.background }
    : {};

  const classes = cx(
    "w-full",
    node.maxWidth ? `${MAX_WIDTH[node.maxWidth]} mx-auto` : undefined,
    node.padding ? PADDING[node.padding] : undefined,
    node.customClass,
  );

  return (
    <div
      id={node.id}
      className={classes}
      style={style}
      {...(preview ? { "data-pf-section": "true" } : {})}
    >
      {node.content.map((child) => (
        <RenderNode key={child.id} node={child} preview={preview} />
      ))}
    </div>
  );
}

function FlexNode({
  node,
  preview,
}: {
  node: FlexContainer;
  preview: boolean;
}) {
  const style: React.CSSProperties = node.background
    ? { background: node.background }
    : {};

  const classes = cx(
    "flex",
    node.direction === "column" ? "flex-col" : "flex-row",
    node.justify ? FLEX_JUSTIFY[node.justify] : "justify-start",
    node.align ? FLEX_ALIGN[node.align] : "items-center",
    node.wrap ? "flex-wrap" : undefined,
    node.gap ? GAP[node.gap] : undefined,
    node.padding ? PADDING[node.padding] : undefined,
    node.customClass,
  );

  return (
    <div
      id={node.id}
      className={classes}
      style={style}
      {...(preview ? { "data-pf-section": "true" } : {})}
    >
      {node.content.map((child) => (
        <RenderNode key={child.id} node={child} preview={preview} />
      ))}
    </div>
  );
}

function GridNode({ node, preview }: { node: Grid; preview: boolean }) {
  const style: React.CSSProperties = node.background
    ? { background: node.background }
    : {};

  const classes = cx(
    "grid",
    GRID_COLS[node.cols],
    node.gap ? GAP[node.gap] : undefined,
    node.padding ? PADDING[node.padding] : undefined,
    node.customClass,
  );

  return (
    <div
      id={node.id}
      className={classes}
      style={style}
      {...(preview ? { "data-pf-section": "true" } : {})}
    >
      {node.content.map((child) => (
        <RenderNode key={child.id} node={child} preview={preview} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Text node renderers
// ─────────────────────────────────────────────────────────────────────────────

function HeadingNode({ node }: { node: Heading }) {
  const classes = cx(
    HEADING_SIZE[node.level],
    "font-heading",
    node.align ? TEXT_ALIGN[node.align] : undefined,
    node.customClass,
  );

  const Tag = `h${node.level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  return (
    <Tag id={node.id} className={classes}>
      {node.content}
    </Tag>
  );
}

function ParagraphNode({ node }: { node: Paragraph }) {
  const classes = cx(
    "leading-relaxed",
    node.align ? TEXT_ALIGN[node.align] : undefined,
    node.customClass,
  );
  // dangerouslySetInnerHTML is safe here — parseInline escapes raw HTML first
  return (
    <p
      id={node.id}
      className={classes}
      dangerouslySetInnerHTML={{ __html: parseInline(node.content) }}
    />
  );
}

function SpanNode({ node }: { node: Span }) {
  return (
    <span id={node.id} className={node.customClass}>
      {node.content}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Media + interaction node renderers
// ─────────────────────────────────────────────────────────────────────────────

function ButtonNode({ node }: { node: Button }) {
  const variant = node.variant ?? "solid";
  const classes = cx("pf-btn", BUTTON_VARIANT[variant], node.customClass);

  return (
    <a
      id={node.id}
      href={node.href}
      className={classes}
      target={node.openInNewTab ? "_blank" : undefined}
      rel={node.openInNewTab ? "noopener noreferrer" : undefined}
    >
      {node.content}
    </a>
  );
}

function ImageNode({ node }: { node: Image }) {
  const classes = cx(
    "max-w-full",
    node.objectFit ? OBJECT_FIT[node.objectFit] : undefined,
    node.customClass,
  );

  return (
    <img
      id={node.id}
      src={node.src}
      alt={node.alt}
      width={node.width}
      height={node.height}
      className={classes}
      loading="lazy"
      decoding="async"
    />
  );
}

function DividerNode({ node }: { node: Divider }) {
  const size = node.size ?? "md";

  if (node.style === "line") {
    const classes = cx(
      "w-full border-0 border-t border-[var(--color-border)]",
      node.size ? `my-${size}` : "my-8",
      node.customClass,
    );
    return <hr id={node.id} className={classes} />;
  }

  // Default: spacer
  const classes = cx(DIVIDER_SIZE[size], node.customClass);
  return <div id={node.id} className={classes} aria-hidden="true" />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Root dispatcher
// ─────────────────────────────────────────────────────────────────────────────

export function RenderNode({
  node,
  preview = false,
}: {
  node: Node;
  preview?: boolean;
  key?: string; // React key — handled by JSX transform, not used in component body
}) {
  switch (node.type) {
    case "container":
      return <ContainerNode node={node} preview={preview} />;
    case "flex-container":
      return <FlexNode node={node} preview={preview} />;
    case "grid":
      return <GridNode node={node} preview={preview} />;
    case "heading":
      return <HeadingNode node={node} />;
    case "paragraph":
      return <ParagraphNode node={node} />;
    case "span":
      return <SpanNode node={node} />;
    case "button":
      return <ButtonNode node={node} />;
    case "image":
      return <ImageNode node={node} />;
    case "divider":
      return <DividerNode node={node} />;
    default: {
      // Exhaustiveness check — TypeScript will error if a new node type
      // is added to the union without a case here.
      const _never: never = node;
      console.warn("[renderer] Unknown node type:", (_never as Node).type);
      return null;
    }
  }
}
