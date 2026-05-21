// ── Spacing scale ─────────────────────────────────────────────────────────────
type Spacing = "none" | "xs" | "sm" | "md" | "lg" | "xl";

// ── Text alignment ────────────────────────────────────────────────────────────
type Align = "left" | "center" | "right";

// ── Forward-declare the recursive node union ──────────────────────────────────
// Defined fully at the bottom — referenced here for Container/Flex/Grid content.
type Node =
  | Container
  | FlexContainer
  | Grid
  | Heading
  | Paragraph
  | Span
  | Button
  | Image;

// ── Layout primitives ─────────────────────────────────────────────────────────

interface Container {
  id: string;
  type: "container";
  padding?: Spacing;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "full"; // maps to Tailwind max-w-*
  customClass?: string;
  content: Node[];
}

interface FlexContainer {
  id: string;
  type: "flex-container";
  direction?: "row" | "column";
  justify?: "start" | "end" | "center" | "between" | "around" | "evenly";
  align?: "start" | "end" | "center" | "stretch";
  wrap?: boolean;
  gap?: Spacing;
  padding?: Spacing;
  customClass?: string;
  content: Node[];
}

interface Grid {
  id: string;
  type: "grid";
  cols: 1 | 2 | 3 | 4 | 6 | 12; // maps to Tailwind grid-cols-*
  gap?: Spacing;
  customClass?: string;
  content: Node[]; // <-- added
}

// ── Text primitives ───────────────────────────────────────────────────────────

interface Heading {
  id: string;
  type: "heading";
  level: 1 | 2 | 3 | 4 | 5 | 6;
  align?: Align;
  customClass?: string;
  content: string;
}

interface Paragraph {
  id: string;
  type: "paragraph";
  align?: Align;
  customClass?: string;
  content: string;
}

interface Span {
  id: string;
  type: "span";
  // No align — inline element, alignment is the parent's job
  customClass?: string;
  content: string;
}

// ── Media + interaction primitives ───────────────────────────────────────────

interface Button {
  id: string;
  type: "button";
  variant?: "solid" | "outline" | "ghost"; // gives the renderer/AI a hint
  customClass?: string;
  content: string;
  href: string;
  openInNewTab?: boolean;
}

interface Image {
  id: string;
  type: "image";
  customClass?: string;
  src: string;
  alt: string;
  width?: number;
  height?: number;
  objectFit?: "cover" | "contain" | "fill"; // useful once inside a sized container
}

// ── Root page document ────────────────────────────────────────────────────────

interface PageDocument {
  version: "1";
  id: string;
  meta: {
    title: string;
    slug: string;
    favicon?: string;
    lang?: string;
    description?: string;
  };
  theme: {
    fontHeading: string; // Google Font name or system stack
    fontBody: string;
    colorPrimary: string;
    colorAccent: string;
    colorBg: string;
    colorText: string;
  };
  content: Node[]; // top-level nodes, rendered in order
}
