// ─────────────────────────────────────────────────────────────────────────────
// schema/primitives.ts
// Atomic type building blocks shared across every node type.
// ─────────────────────────────────────────────────────────────────────────────

// ── Spacing scale ─────────────────────────────────────────────────────────────
// Maps to Tailwind padding/gap utilities in the renderer.
// none=0, xs=1, sm=2, md=4, lg=8, xl=16 (Tailwind scale units)

export type Spacing = "none" | "xs" | "sm" | "md" | "lg" | "xl";

// ── Text alignment ────────────────────────────────────────────────────────────

export type Align = "left" | "center" | "right";

// ── Max width presets ─────────────────────────────────────────────────────────
// Maps to Tailwind max-w-* utilities

export type MaxWidth = "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "prose" | "full";

// ── Grid column counts ────────────────────────────────────────────────────────
// Constrained to values Tailwind has static classes for

export type GridCols = 1 | 2 | 3 | 4 | 6 | 12;

// ── Flex variants ─────────────────────────────────────────────────────────────

export type FlexDirection = "row" | "column";
export type FlexJustify   = "start" | "end" | "center" | "between" | "around" | "evenly";
export type FlexAlign     = "start" | "end" | "center" | "stretch" | "baseline";

// ── Button variants ───────────────────────────────────────────────────────────

export type ButtonVariant = "solid" | "outline" | "ghost";

// ── Image fit ────────────────────────────────────────────────────────────────

export type ObjectFit = "cover" | "contain" | "fill" | "none";

// ── Design tokens ─────────────────────────────────────────────────────────────
// Flat theme object stored at the page level.
// The renderer injects these as CSS custom properties on :root.

export interface PageTheme {
  // Typography
  fontHeading: string;   // Google Font name or system stack e.g. "Inter"
  fontBody:    string;
  // Colours (raw hex / hsl / oklch — any valid CSS colour)
  colorPrimary:  string; // main brand / CTA colour
  colorAccent:   string; // secondary highlight
  colorBg:       string; // page background
  colorSurface:  string; // card / raised surface background
  colorText:     string; // default body text
  colorMuted:    string; // secondary / muted text
  colorBorder:   string; // dividers, input borders
}

export const defaultTheme: PageTheme = {
  fontHeading:   "Inter",
  fontBody:      "Inter",
  colorPrimary:  "#111827",
  colorAccent:   "#6366f1",
  colorBg:       "#ffffff",
  colorSurface:  "#f9fafb",
  colorText:     "#111827",
  colorMuted:    "#6b7280",
  colorBorder:   "#e5e7eb",
};
