// ─────────────────────────────────────────────────────────────────────────────
// schema/nodes.ts
// Every node type the AI can compose and the renderer can draw.
// The Node union is the single source of truth for what's valid in content[].
// ─────────────────────────────────────────────────────────────────────────────

import type {
  Align,
  ButtonVariant,
  FlexAlign,
  FlexDirection,
  FlexJustify,
  GridCols,
  MaxWidth,
  ObjectFit,
  Spacing,
} from "./primitives";

// ─────────────────────────────────────────────────────────────────────────────
// Layout nodes
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Container — block-level box with optional padding and max-width.
 * The workhorse for sections: wrap everything in a Container first,
 * then put layout children (FlexContainer, Grid) inside it.
 *
 * Renderer output:
 *   <div class="w-full mx-auto px-{padding} max-w-{maxWidth} {customClass}">
 *     {content}
 *   </div>
 */
export interface Container {
  id: string;
  type: "container";
  padding?:     Spacing;
  maxWidth?:    MaxWidth;
  /** Background colour — CSS var reference or raw value e.g. "var(--color-surface)" */
  background?:  string;
  customClass?: string;
  content:      Node[];
}

/**
 * FlexContainer — CSS flexbox wrapper.
 * Use for horizontal or vertical arrangements of children.
 *
 * Renderer output:
 *   <div class="flex flex-{direction} justify-{justify} items-{align}
 *               gap-{gap} p-{padding} flex-{wrap?wrap:nowrap} {customClass}">
 *     {content}
 *   </div>
 */
export interface FlexContainer {
  id: string;
  type:       "flex-container";
  direction?: FlexDirection;   // default: "row"
  justify?:   FlexJustify;     // default: "start"
  align?:     FlexAlign;       // default: "center"
  wrap?:      boolean;         // default: false
  gap?:       Spacing;
  padding?:   Spacing;
  background?: string;
  customClass?: string;
  content:    Node[];
}

/**
 * Grid — CSS grid wrapper.
 * cols maps to Tailwind grid-cols-{n}. Use for card grids, image galleries,
 * multi-column layouts. For responsive behaviour use customClass with sm:/md: prefixes.
 *
 * Renderer output:
 *   <div class="grid grid-cols-{cols} gap-{gap} {customClass}">
 *     {content}
 *   </div>
 */
export interface Grid {
  id: string;
  type:         "grid";
  cols:         GridCols;   // required — no sensible default
  gap?:         Spacing;
  padding?:     Spacing;
  background?:  string;
  customClass?: string;
  content:      Node[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Text nodes
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Heading — semantic h1–h6.
 * content is plain text (no markdown). Use customClass for size overrides.
 *
 * Renderer output:
 *   <h{level} class="text-{align} font-heading {customClass}">{content}</h{level}>
 */
export interface Heading {
  id: string;
  type:         "heading";
  level:        1 | 2 | 3 | 4 | 5 | 6;
  align?:       Align;
  customClass?: string;
  content:      string;
}

/**
 * Paragraph — block of body text.
 * content supports a minimal markdown subset: **bold**, _italic_, [link](url).
 * The renderer converts these to safe HTML.
 *
 * Renderer output:
 *   <p class="text-{align} {customClass}">{renderedContent}</p>
 */
export interface Paragraph {
  id: string;
  type:         "paragraph";
  align?:       Align;
  customClass?: string;
  content:      string; // mini-markdown supported
}

/**
 * Span — inline text fragment.
 * Useful for coloured labels, badges, eyebrow text.
 * No alignment (inline element — alignment is the parent's responsibility).
 *
 * Renderer output:
 *   <span class="{customClass}">{content}</span>
 */
export interface Span {
  id: string;
  type:         "span";
  customClass?: string;
  content:      string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Media + interaction nodes
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Button — renders as an <a> tag (all CTAs are links in a static page).
 * variant drives the visual style; customClass can override fully.
 *
 * Renderer output:
 *   <a href="{href}" class="pf-btn pf-btn-{variant} {customClass}"
 *      target?="_blank" rel?="noopener noreferrer">
 *     {content}
 *   </a>
 */
export interface Button {
  id: string;
  type:         "button";
  variant?:     ButtonVariant; // default: "solid"
  content:      string;
  href:         string;
  openInNewTab?: boolean;
  customClass?: string;
}

/**
 * Image — responsive <img> with optional sizing and fit control.
 *
 * Renderer output:
 *   <img src="{src}" alt="{alt}" width? height?
 *        class="object-{objectFit} {customClass}" loading="lazy" decoding="async">
 */
export interface Image {
  id: string;
  type:         "image";
  src:          string;
  alt:          string;
  width?:       number;
  height?:      number;
  objectFit?:   ObjectFit;
  customClass?: string;
}

/**
 * Divider — horizontal rule or visual spacer.
 *
 * Renderer output (line):   <hr class="{customClass}">
 * Renderer output (spacer): <div class="h-{size} {customClass}"></div>
 */
export interface Divider {
  id: string;
  type:         "divider";
  style?:       "line" | "spacer"; // default: "spacer"
  size?:        Spacing;           // height of spacer / margin of line
  customClass?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Node union — the complete set of things that can appear in content[]
// ─────────────────────────────────────────────────────────────────────────────

export type Node =
  | Container
  | FlexContainer
  | Grid
  | Heading
  | Paragraph
  | Span
  | Button
  | Image
  | Divider;

/** All valid node type strings — useful for the AI system prompt */
export type NodeType = Node["type"];

/** Narrow to a specific node shape by its type discriminant */
export type NodeOfType<T extends NodeType> = Extract<Node, { type: T }>;

/** True if a node can contain children */
export type LayoutNode = Container | FlexContainer | Grid;
export type LeafNode   = Heading | Paragraph | Span | Button | Image | Divider;

export function isLayoutNode(node: Node): node is LayoutNode {
  return node.type === "container"
    || node.type === "flex-container"
    || node.type === "grid";
}
