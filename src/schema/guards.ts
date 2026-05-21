// ─────────────────────────────────────────────────────────────────────────────
// schema/guards.ts
// Runtime type guards — use when receiving untrusted data from the AI,
// localStorage, or file uploads.
// ─────────────────────────────────────────────────────────────────────────────

import type { Node, NodeType } from "./nodes";
import type { PageDocument, PatchOp, OrchestratorResponse } from "./page";

// ─────────────────────────────────────────────────────────────────────────────
// Node type guard
// ─────────────────────────────────────────────────────────────────────────────

const NODE_TYPES = new Set<NodeType>([
  "container",
  "flex-container",
  "grid",
  "heading",
  "paragraph",
  "span",
  "button",
  "image",
  "divider",
]);

export function isNodeType(value: unknown): value is NodeType {
  return typeof value === "string" && NODE_TYPES.has(value as NodeType);
}

export function isNode(value: unknown): value is Node {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.id === "string" && isNodeType(v.type);
}

// ─────────────────────────────────────────────────────────────────────────────
// PatchOp guard
// ─────────────────────────────────────────────────────────────────────────────

const PATCH_OPS = new Set<PatchOp["op"]>([
  "insert_node",
  "remove_node",
  "move_node",
  "update_node",
  "replace_node",
  "update_theme",
  "update_meta",
  "replace_content",
]);

export function isPatchOp(value: unknown): value is PatchOp {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.op === "string" && PATCH_OPS.has(v.op as PatchOp["op"]);
}

// ─────────────────────────────────────────────────────────────────────────────
// PageDocument guard
// ─────────────────────────────────────────────────────────────────────────────

export function isPageDocument(value: unknown): value is PageDocument {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    v.version === "1" &&
    typeof v.id === "string" &&
    typeof v.meta === "object" && v.meta !== null &&
    typeof v.theme === "object" && v.theme !== null &&
    Array.isArray(v.content)
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OrchestratorResponse guard
// ─────────────────────────────────────────────────────────────────────────────

export function isOrchestratorResponse(value: unknown): value is OrchestratorResponse {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    Array.isArray(v.patches) &&
    v.patches.every(isPatchOp) &&
    typeof v.chatReply === "string"
  );
}
