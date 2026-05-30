@AGENTS.md

# PageForge — AI-Driven Page Builder

## What this is

A chat-driven single-page website builder. The user describes what they want
in a chat interface; an AI orchestrator interprets the message and returns
structured patch operations that mutate a JSON page document. A render engine
converts that document into a standalone HTML page displayed in an iframe preview.

Think Carrd but entirely chat-driven, with a structured JSON schema instead of
freeform HTML generation. The key differentiator over competitors (Chariot etc.)
is that any section in the preview is clickable — selecting it pins that node's
JSON to the chat context so the AI knows exactly what to edit without guessing.

---

## Current status

- ✅ Schema layer complete (`src/schema/`)
- ✅ Render engine complete (`src/engine/`)
- 🔜 Builder UI scaffolded, needs wiring (`src/builder/`)
- 🔜 AI orchestrator not yet built (`src/ai/`)
- 🔜 Database/persistence not yet built
- 🔜 Auth not yet built
- 🔜 Published page route not yet built

---

## Tech stack

- **Framework**: Next.js 16 (App Router, React 19)
- **Styling**: Tailwind CSS — builder UI only. The render engine uses CSS custom
  properties for dynamic theme values; Tailwind CDN is injected into rendered pages.
- **State**: Zustand — `usePageStore` (document + patches) and `useChatStore` (chat history)
- **AI**: Anthropic Claude API (`claude-sonnet-4-5`) via `@anthropic-ai/sdk`
- **Rendering**: `ReactDOMServer.renderToStaticMarkup()` — outputs standalone HTML strings
- **Language**: TypeScript throughout, strict mode

---

## How the system works

### The data model

Every page is a `PageDocument` (see `src/schema/page.ts`). It contains:

```ts
{
  version:   "1";
  id:        string;
  meta:      PageMeta;      // title, slug, favicon, SEO
  theme:     PageTheme;     // flat design token object
  content:   Node[];        // recursive tree of primitives
  createdAt: string;
  updatedAt: string;
}
```

### Node primitives

Nodes are typed primitives that compose into any layout. The full union is in
`src/schema/nodes.ts`. The 9 types are:

| Type             | Kind   | Purpose                            |
| ---------------- | ------ | ---------------------------------- |
| `container`      | layout | Block box with padding + max-width |
| `flex-container` | layout | CSS flexbox wrapper                |
| `grid`           | layout | CSS grid wrapper                   |
| `heading`        | leaf   | h1–h6 semantic heading             |
| `paragraph`      | leaf   | Body text, supports mini-markdown  |
| `span`           | leaf   | Inline text fragment / label       |
| `button`         | leaf   | CTA link (renders as `<a>`)        |
| `image`          | leaf   | Responsive `<img>`                 |
| `divider`        | leaf   | Horizontal rule or spacer          |

Layout nodes (`container`, `flex-container`, `grid`) have a `content: Node[]`
field and recurse. Leaf nodes are terminal.

### Design tokens

`PageTheme` is a flat object stored at the page level. The render engine
injects it as CSS custom properties on `:root`. Always use `var(--color-*)` and
`var(--font-*)` references in templates — never hardcode hex values.

```ts
interface PageTheme {
  fontHeading: string; // Google Font name or system stack
  fontBody: string;
  colorPrimary: string;
  colorAccent: string;
  colorBg: string;
  colorSurface: string;
  colorText: string;
  colorMuted: string;
  colorBorder: string;
}
```

### How edits work (patch system)

The AI returns an `OrchestratorResponse`:

```ts
{
  patches:      PatchOp[];   // ordered list of mutations
  chatReply:    string;      // shown as the assistant bubble in chat
  suggestions?: string[];    // quick-reply chips below the message
}
```

Patches are applied immutably by `applyPatches(doc, patches)` in
`src/schema/applyPatch.ts`. The full set of patch operations:

| Op                | Purpose                                                |
| ----------------- | ------------------------------------------------------ |
| `insert_node`     | Add a node to a content[] array at a given path        |
| `remove_node`     | Delete a node by id from anywhere in the tree          |
| `move_node`       | Relocate a node to a new parent/position               |
| `update_node`     | Shallow-merge changes into an existing node            |
| `replace_node`    | Swap a node entirely (e.g. heading → paragraph)        |
| `update_theme`    | Merge partial PageTheme changes                        |
| `update_meta`     | Merge partial PageMeta changes                         |
| `replace_content` | Replace the entire content[] (used for template loads) |

`NodePath` is an ordered array of node ids from root to target:
`["hero", "hero-flex", "hero-h1"]`. An empty path `[]` means the root
`content[]`.

### How rendering works

`renderPage(doc)` and `renderPreview(doc)` in `src/engine/render.tsx`:

1. Merge user theme over `defaultTheme` so no CSS var is undefined
2. Call `renderToStaticMarkup(<Page doc={doc} />)` to get the body HTML
3. Wrap in a full `<!DOCTYPE html>` document with:
   - CSS custom properties from `PageTheme` injected into `:root`
   - `BASE_CSS` reset + button variant classes
   - Tailwind CDN `<script>` with `font-heading`/`font-body` extensions
   - Google Fonts `<link>` tag
   - Entrance animation `IntersectionObserver` script

`renderPreview()` additionally injects a postMessage bridge that:

- Adds `data-pf-section` to every layout node
- Sends `pf:section-click` to the parent window on click
- Handles `pf:highlight` and `pf:scroll-to` messages from the builder

### Template library

`src/schema/templates.ts` contains pre-composed primitive trees.
**Always use these as starting points** — never compose layouts from scratch.

Section templates (9): `navSimple`, `heroCenter`, `heroSplit`, `featuresGrid`,
`testimonialsGrid`, `pricingThreeTier`, `statsBar`, `contactSimple`, `footerSimple`

Page templates (4): `minimalTemplate`, `portfolioTemplate`, `saasTemplate`, `eventTemplate`

`buildTemplateSummary()` returns a compact string describing all templates —
inject this into the AI system prompt.

---

## What to build next

### Priority 1 — `src/ai/prompt.ts`

Builds the system prompt string passed to Claude. Must include:

- What the AI is (a page builder assistant)
- The full `OrchestratorResponse` JSON contract it must return
- All 8 patch op types with examples
- The current page's theme tokens (compact)
- A summary of the current `content[]` tree (node ids + types, 2 levels deep)
- If `selectedNodeId` is set: the full JSON of that node + instruction to scope
  all edits to it
- If no selection: instruction that it can add/edit/remove any node
- The template summary from `buildTemplateSummary()`
- Hard rules (JSON only, no markdown fences, chatReply under 2 sentences, etc.)

### Priority 2 — `src/ai/orchestrate.ts`

Calls the Anthropic API and returns a validated `OrchestratorResponse`:

```ts
export async function orchestrate(input: {
  message: string;
  doc: PageDocument;
  selectedNodeId: string | null;
  history: Array<{ role: "user" | "assistant"; content: string }>;
}): Promise<OrchestratorResponse>;
```

Steps:

1. Call `buildSystemPrompt(doc, selectedNodeId)` from `prompt.ts`
2. Call `anthropic.messages.create()` with model `claude-sonnet-4-5`
3. Extract the text content from the response
4. Strip any markdown fences (model sometimes wraps in ```json)
5. `JSON.parse()` the result
6. Validate with `isOrchestratorResponse()` from `src/schema/guards.ts`
7. Return the validated response

### Priority 3 — Wire `app/api/ai/route.ts`

The stub and the commented-out Phase 2 block are already in place.
Once `orchestrate.ts` is built, replace the stub call:

```ts
// Delete:
const response = await stubResponse(message, doc, selectedNodeId);
// Add:
const response = await orchestrate({ message, doc, selectedNodeId, history });
```

Add `ANTHROPIC_API_KEY` to `.env.local`.

---

## File map

```
src/
  schema/
    index.ts          — barrel export (always import from here, not sub-files)
    primitives.ts     — Spacing, Align, MaxWidth, GridCols, PageTheme, defaultTheme
    nodes.ts          — Node union + all 9 node interfaces + isLayoutNode()
    page.ts           — PageDocument, NodePath, PatchOp, OrchestratorResponse
    applyPatch.ts     — applyPatchOp(), applyPatches(), PatchError
    guards.ts         — isNode(), isPatchOp(), isPageDocument(), isOrchestratorResponse()
    factories.ts      — genId(), makeContainer(), makeHeading(), makePageDocument() etc.
    templates.ts      — sectionTemplates[], pageTemplates[], buildTemplateSummary()

  engine/
    index.ts          — barrel export
    render.tsx        — renderPage(doc, opts?) / renderPreview(doc) entry points
    NodeRenderer.tsx  — RenderNode dispatcher + one component per node type
    theme.ts          — buildThemeCSS(), buildFontLink(), BASE_CSS, ANIMATION_SCRIPT,
                        PREVIEW_BRIDGE_SCRIPT
    maps.ts           — schema tokens → Tailwind class strings + cx() utility

  ai/                 — NOT YET BUILT
    prompt.ts         — buildSystemPrompt(doc, selectedNodeId) → string
    orchestrate.ts    — orchestrate(input) → Promise<OrchestratorResponse>

  builder/
    store/
      usePageStore.ts — Zustand: doc, history[], future[], selectedNodeId
                        actions: applyPatches(), undo(), redo(), setDoc(),
                        setSelectedNode(), updateTheme(), canUndo(), canRedo()
      useChatStore.ts — Zustand: messages[], isStreaming, error
                        actions: addMessage(), setStreaming(), setError(), clearMessages()
    hooks/
      useSendMessage.ts — send(content) → POST /api/ai → applyPatches() + addMessage()
    components/
      BuilderLayout.tsx         — draggable two-pane shell (chat | preview)
      ChatPane/
        ChatPane.tsx            — header + MessageList + InputBar
        MessageList.tsx         — message bubbles + empty state + thinking indicator
        InputBar.tsx            — textarea + context pill + send button
        SuggestionChips.tsx     — quick-reply chips that call send()
      PreviewPane/
        PreviewPane.tsx         — viewport frame + <iframe srcdoc={renderPreview(doc)} />
                                  listens for pf:section-click postMessages
        PreviewToolbar.tsx      — viewport switcher + undo/redo + selected node indicator

app/
  (builder)/
    layout.tsx                  — fixed full-viewport shell, strips root nav/footer
    builder/
      page.tsx                  — redirect to /builder/demo
      [id]/
        page.tsx                — async params (Next 16), renders <BuilderLayout />
  (published)/
    p/
      [slug]/
        route.ts                — NOT YET BUILT: GET → renderPage(doc) → raw HTML response
  api/
    ai/
      route.ts                  — POST handler; stub active, Phase 2 commented out
    pages/
      route.ts                  — NOT YET BUILT: GET list + POST create
      [id]/
        route.ts                — NOT YET BUILT: GET + PATCH + DELETE
```

---

## Key conventions — read before touching any file

### Never do these

- Do not import `react-dom/server` anywhere except `src/engine/render.tsx`
- Do not use `useState`, `useEffect`, or any React hooks in `src/engine/` —
  all engine components must be pure functions safe for `renderToStaticMarkup`
- Do not use raw Tailwind colour classes in `src/engine/` — use `var(--color-*)` CSS
  var references so the user's theme applies
- Do not hardcode hex values in `src/schema/templates.ts` — use `var(--color-*)` refs
- Do not add a new node type without updating ALL of these files:
  `nodes.ts`, `NodeRenderer.tsx`, `guards.ts`, `factories.ts`
  (`applyPatch.ts` handles new types automatically via `mapTree`)
- Do not use relative `../../` imports that cross module boundaries —
  always use the `@/` alias

### Always do these

- Use `genId(prefix?)` from `src/schema/factories.ts` for all id generation
- Import from barrel `index.ts` files, not individual sub-files
- Validate AI responses with `isOrchestratorResponse()` before calling `applyPatches()`
- Mark all `src/builder/` files with `"use client"` at the top
- Keep `src/engine/` and `src/schema/` free of any browser-only APIs

### Client vs server boundary

```
"use client"                    server-safe
─────────────────────────────   ──────────────────────────────
src/builder/**                  src/schema/**
app/(builder)/**  (mostly)      src/engine/**
                                src/ai/**
                                app/api/**
```

### Patch authoring rules (for the AI system prompt and any manual patches)

- Always use `update_node` for text/property changes — don't `replace_node` unless
  you're actually swapping the node type
- `insert_node` with `parentPath: []` and `atIndex: 0` adds to the top of the page
- `replace_content` is destructive — only use for loading a full template
- Multiple patches in one response are applied in order — order matters

---

## Environment variables

```bash
# .env.local
ANTHROPIC_API_KEY=sk-ant-...   # Required for Phase 2 AI calls
USE_AI_STUB=true               # Set to "true" to use stub responses in dev
```

Toggle the stub in `app/api/ai/route.ts`:

```ts
const USE_STUB = process.env.USE_AI_STUB === "true";
const response = USE_STUB
  ? await stubResponse(message, doc, selectedNodeId)
  : await orchestrate({ message, doc, selectedNodeId, history });
```

---

## Running the project

```bash
npm install          # includes: next, react, react-dom, zustand, @anthropic-ai/sdk
npm run dev          # → http://localhost:3000
# Visit /builder to test the render engine with stub responses
# Visit /builder/demo for the default portfolio template
```
