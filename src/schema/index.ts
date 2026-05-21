// schema/index.ts — single import point for the entire schema package

// Primitives
export type {
  Spacing, Align, MaxWidth, GridCols,
  FlexDirection, FlexJustify, FlexAlign,
  ButtonVariant, ObjectFit, PageTheme,
} from "./primitives";
export { defaultTheme } from "./primitives";

// Nodes
export type {
  Container, FlexContainer, Grid,
  Heading, Paragraph, Span,
  Button, Image, Divider,
  Node, NodeType, NodeOfType,
  LayoutNode, LeafNode,
} from "./nodes";
export { isLayoutNode } from "./nodes";

// Page document + ops
export type {
  PageMeta, PageDocument, NodePath,
  InsertNodeOp, RemoveNodeOp, MoveNodeOp,
  UpdateNodeOp, ReplaceNodeOp, UpdateThemeOp,
  UpdateMetaOp, ReplaceContentOp, PatchOp,
  OrchestratorResponse,
} from "./page";

// Patch engine
export { applyPatchOp, applyPatches, PatchError } from "./applyPatch";

// Guards
export {
  isNodeType, isNode,
  isPatchOp,
  isPageDocument,
  isOrchestratorResponse,
} from "./guards";

// Factories
export {
  genId,
  makeContainer, makeFlex, makeGrid,
  makeHeading, makeParagraph, makeSpan,
  makeButton, makeImage, makeDivider,
  makeDefaultNode, makePageDocument,
} from "./factories";

// Templates
export type { TemplateSection, PageTemplate } from "./templates";
export {
  sectionTemplates, getSectionTemplate,
  pageTemplates,    getPageTemplate,
  buildTemplateSummary,
  heroCenter, heroSplit,
  featuresGrid, testimonialsGrid,
  pricingThreeTier, statsBar,
  contactSimple, footerSimple, navSimple,
  portfolioTemplate, saasTemplate,
  eventTemplate, minimalTemplate,
} from "./templates";
