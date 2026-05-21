// ─────────────────────────────────────────────────────────────────────────────
// schema/page.ts
// Root PageDocument type and all patch operations the AI can emit.
// ─────────────────────────────────────────────────────────────────────────────

import type { Node } from "./nodes";
import type { PageTheme } from "./primitives";

// ─────────────────────────────────────────────────────────────────────────────
// Page metadata
// ─────────────────────────────────────────────────────────────────────────────

export interface PageMeta {
  title:        string;
  slug:         string;         // URL-safe identifier
  favicon?:     string;         // emoji or URL
  lang?:        string;         // default "en"
  description?: string;         // SEO meta description
  ogImage?:     string;         // absolute URL for Open Graph image
  noIndex?:     boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Root document
// ─────────────────────────────────────────────────────────────────────────────

export interface PageDocument {
  version:   "1";
  id:        string;
  meta:      PageMeta;
  theme:     PageTheme;
  /** Top-level nodes rendered in document order */
  content:   Node[];
  createdAt: string;  // ISO 8601
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Node path
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A NodePath locates any node in the tree by walking content[] arrays.
 * The renderer and patch engine use this to find and update nodes without
 * requiring a flat node map.
 *
 * Example: ["hero", "hero-flex", "hero-h1"]
 *   → doc.content[hero].content[hero-flex].content[hero-h1]
 *
 * The first element is always a top-level node id.
 * An empty array [] means the root content[] itself.
 */
export type NodePath = string[]; // ordered list of node ids from root → target

// ─────────────────────────────────────────────────────────────────────────────
// Patch operations
// The AI returns an array of these. Applied in order by applyPatches().
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Insert a node into a content[] array.
 * parentPath: path to the parent layout node (empty = root content[])
 * atIndex: insertion index; omit to append
 */
export interface InsertNodeOp {
  op:          "insert_node";
  parentPath:  NodePath;
  node:        Node;
  atIndex?:    number;
}

/**
 * Remove a node by id anywhere in the tree.
 */
export interface RemoveNodeOp {
  op:     "remove_node";
  nodeId: string;
}

/**
 * Move a node to a new parent / position.
 * Removes from current location, inserts at target.
 */
export interface MoveNodeOp {
  op:           "move_node";
  nodeId:       string;
  toParentPath: NodePath;
  toIndex?:     number;
}

/**
 * Replace a node's properties with a partial update.
 * Deep-merges into the existing node — only provided keys are changed.
 * Use this for text edits, style tweaks, property changes.
 */
export interface UpdateNodeOp {
  op:      "update_node";
  nodeId:  string;
  // Partial<Node> but typed as Record to avoid union complexity.
  // The patch engine validates the keys against the existing node type.
  updates: Record<string, unknown>;
}

/**
 * Replace a node entirely (e.g. swapping a Heading for a Paragraph,
 * or replacing a whole subtree with a template).
 */
export interface ReplaceNodeOp {
  op:      "replace_node";
  nodeId:  string;
  node:    Node;
}

/**
 * Update the page theme (design tokens).
 * Deep-merges into the existing theme.
 */
export interface UpdateThemeOp {
  op:    "update_theme";
  theme: Partial<PageTheme>;
}

/**
 * Update page metadata.
 */
export interface UpdateMetaOp {
  op:   "update_meta";
  meta: Partial<PageMeta>;
}

/**
 * Replace the entire page content[] with a new tree.
 * Used when loading a template.
 */
export interface ReplaceContentOp {
  op:      "replace_content";
  content: Node[];
}

export type PatchOp =
  | InsertNodeOp
  | RemoveNodeOp
  | MoveNodeOp
  | UpdateNodeOp
  | ReplaceNodeOp
  | UpdateThemeOp
  | UpdateMetaOp
  | ReplaceContentOp;

// ─────────────────────────────────────────────────────────────────────────────
// AI orchestrator response envelope
// ─────────────────────────────────────────────────────────────────────────────

export interface OrchestratorResponse {
  /** Ordered list of patches to apply */
  patches:      PatchOp[];
  /** Shown as the assistant's chat message */
  chatReply:    string;
  /** Optional quick-reply chips shown below the message */
  suggestions?: string[];
}
