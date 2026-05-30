// engine/maps.ts
// Schema token → Tailwind class segment lookup tables.
// Every renderer file imports from here — no raw Tailwind strings scattered around.

import type {
  Spacing,
  Align,
  MaxWidth,
  GridCols,
  FlexJustify,
  FlexAlign,
  ObjectFit,
} from "../schema/primitives";

// ── Spacing ───────────────────────────────────────────────────────────────────

export const PADDING: Record<Spacing, string> = {
  none: "p-0",
  xs: "p-2",
  sm: "p-4",
  md: "p-6",
  lg: "p-10",
  xl: "p-16",
};

export const GAP: Record<Spacing, string> = {
  none: "gap-0",
  xs: "gap-1",
  sm: "gap-3",
  md: "gap-6",
  lg: "gap-10",
  xl: "gap-16",
};

export const PADDING_X: Record<Spacing, string> = {
  none: "px-0",
  xs: "px-2",
  sm: "px-4",
  md: "px-6",
  lg: "px-10",
  xl: "px-16",
};

export const PADDING_Y: Record<Spacing, string> = {
  none: "py-0",
  xs: "py-2",
  sm: "py-4",
  md: "py-6",
  lg: "py-10",
  xl: "py-16",
};

// ── Alignment ─────────────────────────────────────────────────────────────────

export const TEXT_ALIGN: Record<Align, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

// ── Max width ─────────────────────────────────────────────────────────────────

export const MAX_WIDTH: Record<MaxWidth, string> = {
  xs: "max-w-xs",
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  prose: "max-w-prose",
  full: "max-w-full",
};

// ── Grid columns ──────────────────────────────────────────────────────────────

export const GRID_COLS: Record<GridCols, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  6: "grid-cols-6",
  12: "grid-cols-12",
};

// ── Flex justify ──────────────────────────────────────────────────────────────

export const FLEX_JUSTIFY: Record<FlexJustify, string> = {
  start: "justify-start",
  end: "justify-end",
  center: "justify-center",
  between: "justify-between",
  around: "justify-around",
  evenly: "justify-evenly",
};

// ── Flex align ────────────────────────────────────────────────────────────────

export const FLEX_ALIGN: Record<FlexAlign, string> = {
  start: "items-start",
  end: "items-end",
  center: "items-center",
  stretch: "items-stretch",
  baseline: "items-baseline",
};

// ── Object fit ────────────────────────────────────────────────────────────────

export const OBJECT_FIT: Record<ObjectFit, string> = {
  cover: "object-cover",
  contain: "object-contain",
  fill: "object-fill",
  none: "object-none",
};

// ── Button variants ───────────────────────────────────────────────────────────
// These reference CSS vars set by the theme injector — not raw Tailwind colours.

export const BUTTON_VARIANT: Record<string, string> = {
  solid: "pf-btn-solid",
  outline: "pf-btn-outline",
  ghost: "pf-btn-ghost",
};

// ── Heading sizes ─────────────────────────────────────────────────────────────

export const HEADING_SIZE: Record<1 | 2 | 3 | 4 | 5 | 6, string> = {
  1: "text-5xl md:text-6xl font-bold leading-tight tracking-tight",
  2: "text-3xl md:text-4xl font-bold leading-snug",
  3: "text-2xl font-semibold leading-snug",
  4: "text-xl font-semibold",
  5: "text-lg font-medium",
  6: "text-base font-medium",
};

// ── Divider spacer sizes ──────────────────────────────────────────────────────

export const DIVIDER_SIZE: Record<Spacing, string> = {
  none: "h-0",
  xs: "h-2",
  sm: "h-6",
  md: "h-12",
  lg: "h-20",
  xl: "h-32",
};

// ── Utility ───────────────────────────────────────────────────────────────────

/** Join class segments, filtering out empty strings */
export function cx(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ").trim();
}
