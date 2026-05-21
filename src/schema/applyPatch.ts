// ─────────────────────────────────────────────────────────────────────────────
// schema/applyPatch.ts
// Immutable patch engine for the primitive node tree.
// Every function returns a new object — the input is never mutated.
// ─────────────────────────────────────────────────────────────────────────────

import type { Node } from "./nodes";
import type { PageDocument, PatchOp, NodePath } from "./page";
import { isLayoutNode } from "./nodes";

// ─────────────────────────────────────────────────────────────────────────────
// Errors
// ─────────────────────────────────────────────────────────────────────────────

export class PatchError extends Error {
  constructor(public readonly op: string, message: string) {
    super(`[${op}] ${message}`);
    this.name = "PatchError";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Tree traversal utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Walk a node tree and return the content[] array of the node identified
 * by parentPath. An empty path returns the root content[].
 *
 * Returns null if any step in the path is not a layout node or doesn't exist.
 */
function getContentArray(nodes: Node[], path: NodePath): Node[] | null {
  if (path.length === 0) return nodes;

  const [head, ...rest] = path;
  const node = nodes.find((n) => n.id === head);

  if (!node) return null;
  if (!isLayoutNode(node)) return null;

  return getContentArray(node.content, rest);
}

/**
 * Find a node and its parent content[] anywhere in the tree.
 * Returns { parent: Node[], index: number } or null if not found.
 */
function findNode(
  nodes: Node[],
  id: string
): { parent: Node[]; index: number } | null {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].id === id) return { parent: nodes, index: i };
    const node = nodes[i];
    if (isLayoutNode(node)) {
      const found = findNode(node.content, id);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Immutably map over a node tree.
 * Calls transform(node) for every node; if it returns a new node, that node
 * replaces the original. Return the same node reference to leave it unchanged.
 */
function mapTree(nodes: Node[], transform: (n: Node) => Node): Node[] {
  return nodes.map((node) => {
    const next = transform(node);
    if (isLayoutNode(next)) {
      return { ...next, content: mapTree(next.content, transform) };
    }
    return next;
  });
}

/**
 * Immutably remove a node by id from the tree.
 * Returns [updatedNodes, removed] where removed is true if the node was found.
 */
function removeFromTree(nodes: Node[], id: string): [Node[], boolean] {
  let removed = false;
  const next = nodes
    .filter((n) => {
      if (n.id === id) { removed = true; return false; }
      return true;
    })
    .map((n) => {
      if (isLayoutNode(n)) {
        const [updatedContent, childRemoved] = removeFromTree(n.content, id);
        if (childRemoved) { removed = true; return { ...n, content: updatedContent }; }
      }
      return n;
    });
  return [next, removed];
}

// ─────────────────────────────────────────────────────────────────────────────
// Individual op handlers
// ─────────────────────────────────────────────────────────────────────────────

function applyInsertNode(doc: PageDocument, op: Extract<PatchOp, { op: "insert_node" }>): PageDocument {
  const content: Node[] = structuredClone(doc.content);
  const target = getContentArray(content, op.parentPath);

  if (!target) {
    throw new PatchError("insert_node", `Parent path [${op.parentPath.join(" → ")}] not found`);
  }

  const idx = op.atIndex ?? target.length;
  target.splice(idx, 0, op.node);
  return { ...doc, content };
}

function applyRemoveNode(doc: PageDocument, op: Extract<PatchOp, { op: "remove_node" }>): PageDocument {
  const [content, removed] = removeFromTree(structuredClone(doc.content), op.nodeId);
  if (!removed) {
    throw new PatchError("remove_node", `Node "${op.nodeId}" not found`);
  }
  return { ...doc, content };
}

function applyMoveNode(doc: PageDocument, op: Extract<PatchOp, { op: "move_node" }>): PageDocument {
  // 1. Find and extract the node
  let extracted: Node | null = null;
  const [afterRemove, removed] = removeFromTree(structuredClone(doc.content), op.nodeId);
  if (!removed) throw new PatchError("move_node", `Node "${op.nodeId}" not found`);

  // We need to capture the node before removal — re-find in original
  const original = findNode(doc.content, op.nodeId);
  if (!original) throw new PatchError("move_node", `Node "${op.nodeId}" not found`);
  extracted = structuredClone(original.parent[original.index]);

  // 2. Insert at target
  const target = getContentArray(afterRemove, op.toParentPath);
  if (!target) {
    throw new PatchError("move_node", `Target path [${op.toParentPath.join(" → ")}] not found`);
  }
  const idx = op.toIndex ?? target.length;
  target.splice(idx, 0, extracted);

  return { ...doc, content: afterRemove };
}

function applyUpdateNode(doc: PageDocument, op: Extract<PatchOp, { op: "update_node" }>): PageDocument {
  let found = false;
  const content = mapTree(structuredClone(doc.content), (node) => {
    if (node.id !== op.nodeId) return node;
    found = true;
    // Shallow merge updates into the node — nested objects (like content[])
    // are replaced wholesale if provided, not deep-merged.
    return { ...node, ...op.updates } as Node;
  });
  if (!found) throw new PatchError("update_node", `Node "${op.nodeId}" not found`);
  return { ...doc, content };
}

function applyReplaceNode(doc: PageDocument, op: Extract<PatchOp, { op: "replace_node" }>): PageDocument {
  let found = false;
  const content = mapTree(structuredClone(doc.content), (node) => {
    if (node.id !== op.nodeId) return node;
    found = true;
    return op.node;
  });
  if (!found) throw new PatchError("replace_node", `Node "${op.nodeId}" not found`);
  return { ...doc, content };
}

function applyUpdateTheme(doc: PageDocument, op: Extract<PatchOp, { op: "update_theme" }>): PageDocument {
  return { ...doc, theme: { ...doc.theme, ...op.theme } };
}

function applyUpdateMeta(doc: PageDocument, op: Extract<PatchOp, { op: "update_meta" }>): PageDocument {
  return { ...doc, meta: { ...doc.meta, ...op.meta } };
}

function applyReplaceContent(doc: PageDocument, op: Extract<PatchOp, { op: "replace_content" }>): PageDocument {
  return { ...doc, content: op.content };
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Apply a single patch operation to a PageDocument.
 * Returns a new PageDocument — the input is never mutated.
 * Throws PatchError if the operation is invalid.
 */
export function applyPatchOp(doc: PageDocument, patch: PatchOp): PageDocument {
  const next = (() => {
    switch (patch.op) {
      case "insert_node":     return applyInsertNode(doc, patch);
      case "remove_node":     return applyRemoveNode(doc, patch);
      case "move_node":       return applyMoveNode(doc, patch);
      case "update_node":     return applyUpdateNode(doc, patch);
      case "replace_node":    return applyReplaceNode(doc, patch);
      case "update_theme":    return applyUpdateTheme(doc, patch);
      case "update_meta":     return applyUpdateMeta(doc, patch);
      case "replace_content": return applyReplaceContent(doc, patch);
      default: {
        const _never: never = patch;
        throw new PatchError((_never as PatchOp).op, "Unknown op");
      }
    }
  })();

  return { ...next, updatedAt: new Date().toISOString() };
}

/**
 * Apply an ordered array of patch operations in sequence.
 * If any operation throws, the error propagates and no partial state is returned.
 */
export function applyPatches(doc: PageDocument, patches: PatchOp[]): PageDocument {
  return patches.reduce<PageDocument>(
    (current, patch) => applyPatchOp(current, patch),
    doc
  );
}
