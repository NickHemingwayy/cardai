// engine/theme.ts
// Converts PageTheme → CSS injected into the rendered document <head>.
// Three outputs: font <link> tag, :root CSS vars block, base stylesheet.

import type { PageTheme } from "../schema/primitives";

// ── Google Fonts ──────────────────────────────────────────────────────────────

const SYSTEM_FONTS = new Set([
  "system-ui",
  "sans-serif",
  "serif",
  "monospace",
  "inherit",
]);

export function buildFontLink(theme: PageTheme): string {
  const families = new Set([theme.fontHeading, theme.fontBody]);
  const googleFamilies = [...families].filter((f) => !SYSTEM_FONTS.has(f));
  if (!googleFamilies.length) return "";

  const query = googleFamilies
    .map((f) => `family=${encodeURIComponent(f)}:wght@400;500;600;700`)
    .join("&");

  return [
    `<link rel="preconnect" href="https://fonts.googleapis.com">`,
    `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`,
    `<link href="https://fonts.googleapis.com/css2?${query}&display=swap" rel="stylesheet">`,
  ].join("\n  ");
}

// ── CSS custom properties ─────────────────────────────────────────────────────

export function buildThemeCSS(theme: PageTheme): string {
  const vars: [string, string][] = [
    ["--color-primary", theme.colorPrimary],
    ["--color-accent", theme.colorAccent],
    ["--color-bg", theme.colorBg],
    ["--color-surface", theme.colorSurface],
    ["--color-text", theme.colorText],
    ["--color-muted", theme.colorMuted],
    ["--color-border", theme.colorBorder],
    ["--font-heading", `"${theme.fontHeading}", sans-serif`],
    ["--font-body", `"${theme.fontBody}", sans-serif`],
  ];

  const declarations = vars.map(([k, v]) => `  ${k}: ${v};`).join("\n");
  return `:root {\n${declarations}\n}`;
}

// ── Base stylesheet ───────────────────────────────────────────────────────────
// Minimal reset + design-system primitives used by the rendered page.
// All Tailwind utility classes come from the CDN; this handles only
// theme-driven values that Tailwind can't express statically.

export const BASE_CSS = `
/* Reset */
*, *::before, *::after { box-sizing: border-box; }

html {
  -webkit-text-size-adjust: 100%;
  scroll-behavior: smooth;
}

body {
  font-family: var(--font-body);
  color: var(--color-text);
  background-color: var(--color-bg);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  min-height: 100svh;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
  color: var(--color-text);
}

/* Button primitives — variant classes used by the Button node renderer */
.pf-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.625rem 1.375rem;
  border-radius: 0.5rem;
  font-family: var(--font-body);
  font-size: 0.9375rem;
  font-weight: 600;
  line-height: 1;
  text-decoration: none;
  cursor: pointer;
  border: 2px solid transparent;
  transition: opacity 0.15s ease, transform 0.1s ease, background 0.15s ease;
  white-space: nowrap;
}
.pf-btn:hover  { opacity: 0.85; text-decoration: none; }
.pf-btn:active { transform: scale(0.98); }

.pf-btn-solid {
  background-color: var(--color-primary);
  color: var(--color-bg);
  border-color: var(--color-primary);
}
.pf-btn-outline {
  background-color: transparent;
  color: var(--color-primary);
  border-color: var(--color-primary);
}
.pf-btn-ghost {
  background-color: transparent;
  color: var(--color-text);
  border-color: transparent;
  padding-inline: 0.5rem;
}
.pf-btn-ghost:hover { background-color: color-mix(in srgb, var(--color-border) 40%, transparent); opacity: 1; }

/* Scroll-triggered entrance animations */
@media (prefers-reduced-motion: no-preference) {
  .pf-fade {
    opacity: 0;
    transform: translateY(12px);
    transition: opacity 0.5s ease, transform 0.5s ease;
  }
  .pf-fade.pf-visible {
    opacity: 1;
    transform: none;
  }
}

/* Preview iframe: section hover/select outlines (injected by renderPreview) */
.pf-section-hover   { outline: 2px dashed rgba(99,102,241,0.4); outline-offset: -2px; }
.pf-section-select  { outline: 2px solid #6366f1; outline-offset: -2px; }
.pf-section-flash   { animation: pf-flash 1.2s ease forwards; }
@keyframes pf-flash {
  0%   { outline: 2px solid #6366f1; }
  50%  { outline: 3px solid #6366f1; }
  100% { outline: 2px solid transparent; }
}
`.trim();

// ── Entrance animation script ─────────────────────────────────────────────────

export const ANIMATION_SCRIPT = `
<script>
(function() {
  var els = document.querySelectorAll('.pf-fade');
  if (!els.length || !window.IntersectionObserver) return;
  var io = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (e.isIntersecting) {
        e.target.classList.add('pf-visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.08 });
  els.forEach(function(el) { io.observe(el); });
})();
</script>`.trim();

// ── Preview bridge script ─────────────────────────────────────────────────────
// Injected only in renderPreview() — not in exported pages.

export const PREVIEW_BRIDGE_SCRIPT = `
<script>
(function() {
  var selected = null;

  function getSection(el) {
    while (el && el !== document.body) {
      if (el.dataset && el.dataset.pfSection) return el;
      el = el.parentElement;
    }
    return null;
  }

  document.addEventListener('mouseover', function(e) {
    var sec = getSection(e.target);
    document.querySelectorAll('[data-pf-section]').forEach(function(s) {
      s.classList.remove('pf-section-hover');
    });
    if (sec && sec.id !== selected) sec.classList.add('pf-section-hover');
  });

  document.addEventListener('click', function(e) {
    var sec = getSection(e.target);
    var id  = sec ? sec.id : null;

    document.querySelectorAll('[data-pf-section]').forEach(function(s) {
      s.classList.remove('pf-section-select');
    });

    selected = (id && id !== selected) ? id : null;
    if (selected) document.getElementById(selected).classList.add('pf-section-select');

    window.parent.postMessage({ type: 'pf:section-click', sectionId: selected }, '*');
    e.stopPropagation();
  });

  window.addEventListener('message', function(e) {
    if (!e.data) return;
    if (e.data.type === 'pf:highlight') {
      var el = document.getElementById(e.data.sectionId);
      if (!el) return;
      el.classList.add('pf-section-flash');
      setTimeout(function() { el.classList.remove('pf-section-flash'); }, 1200);
    }
    if (e.data.type === 'pf:scroll-to') {
      var target = document.getElementById(e.data.sectionId);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
})();
</script>`.trim();
