// ─────────────────────────────────────────────────────────────────────────────
// schema/factories.ts
// Helpers that produce valid, minimal default nodes.
// Used by templates and the AI orchestrator.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  Container, FlexContainer, Grid,
  Heading, Paragraph, Span,
  Button, Image, Divider,
  Node,
} from "./nodes";
import type { PageDocument, PageMeta } from "./page";
import { defaultTheme } from "./primitives";

// ── ID generation ─────────────────────────────────────────────────────────────
// Replace with nanoid in production for guaranteed uniqueness.

export function genId(prefix = "node"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

// ── Layout factories ──────────────────────────────────────────────────────────

export function makeContainer(overrides?: Partial<Container>): Container {
  return {
    id:      genId("ctr"),
    type:    "container",
    padding: "lg",
    content: [],
    ...overrides,
  };
}

export function makeFlex(overrides?: Partial<FlexContainer>): FlexContainer {
  return {
    id:        genId("flex"),
    type:      "flex-container",
    direction: "row",
    justify:   "start",
    align:     "center",
    gap:       "md",
    content:   [],
    ...overrides,
  };
}

export function makeGrid(overrides?: Partial<Grid>): Grid {
  return {
    id:      genId("grid"),
    type:    "grid",
    cols:    3,
    gap:     "md",
    content: [],
    ...overrides,
  };
}

// ── Text factories ────────────────────────────────────────────────────────────

export function makeHeading(content: string, overrides?: Partial<Heading>): Heading {
  return {
    id:      genId("h"),
    type:    "heading",
    level:   2,
    content,
    ...overrides,
  };
}

export function makeParagraph(content: string, overrides?: Partial<Paragraph>): Paragraph {
  return {
    id:      genId("p"),
    type:    "paragraph",
    content,
    ...overrides,
  };
}

export function makeSpan(content: string, overrides?: Partial<Span>): Span {
  return {
    id:      genId("span"),
    type:    "span",
    content,
    ...overrides,
  };
}

// ── Media + interaction factories ─────────────────────────────────────────────

export function makeButton(content: string, href: string, overrides?: Partial<Button>): Button {
  return {
    id:      genId("btn"),
    type:    "button",
    variant: "solid",
    content,
    href,
    ...overrides,
  };
}

export function makeImage(src: string, alt: string, overrides?: Partial<Image>): Image {
  return {
    id:         genId("img"),
    type:       "image",
    src,
    alt,
    objectFit:  "cover",
    ...overrides,
  };
}

export function makeDivider(overrides?: Partial<Divider>): Divider {
  return {
    id:    genId("div"),
    type:  "divider",
    style: "spacer",
    size:  "lg",
    ...overrides,
  };
}

// ── Node factory dispatcher ───────────────────────────────────────────────────
// Used by the AI orchestrator when it needs to insert a default node by type.

export function makeDefaultNode(type: Node["type"]): Node {
  switch (type) {
    case "container":     return makeContainer();
    case "flex-container": return makeFlex();
    case "grid":          return makeGrid();
    case "heading":       return makeHeading("New heading");
    case "paragraph":     return makeParagraph("New paragraph");
    case "span":          return makeSpan("New text");
    case "button":        return makeButton("Click me", "#");
    case "image":         return makeImage("", "Image description");
    case "divider":       return makeDivider();
  }
}

// ── Page factory ──────────────────────────────────────────────────────────────

export function makePageDocument(
  metaOverrides?: Partial<PageMeta>,
  initialContent: Node[] = []
): PageDocument {
  const now = new Date().toISOString();
  return {
    version:   "1",
    id:        genId("page"),
    meta: {
      title: "My Page",
      slug:  "my-page",
      lang:  "en",
      ...metaOverrides,
    },
    theme:     { ...defaultTheme },
    content:   initialContent,
    createdAt: now,
    updatedAt: now,
  };
}
