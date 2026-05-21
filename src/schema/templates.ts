// ─────────────────────────────────────────────────────────────────────────────
// schema/templates.ts
// Pre-composed primitive trees the AI can emit wholesale via replace_content,
// or splice in via insert_node. Every template is a pure function that accepts
// content overrides and returns a valid Node[].
//
// Design rules for templates:
//   - No hardcoded colours — use CSS var references so the page theme applies.
//   - All ids generated fresh each call so templates can be used multiple times.
//   - Tailwind classes only for layout/spacing. Theme colours via customClass
//     referencing CSS vars (e.g. "text-[var(--color-accent)]").
//   - Every template is self-contained: no assumptions about siblings.
// ─────────────────────────────────────────────────────────────────────────────

import type { Node, Container, FlexContainer } from "./nodes";
import type { PageDocument } from "./page";
import {
  makeContainer, makeFlex, makeGrid,
  makeHeading, makeParagraph, makeSpan,
  makeButton, makeImage, makeDivider,
  makePageDocument, genId,
} from "./factories";
import { defaultTheme } from "./primitives";

// ─────────────────────────────────────────────────────────────────────────────
// Template metadata
// ─────────────────────────────────────────────────────────────────────────────

export interface TemplateSection {
  id:          string;
  name:        string;
  description: string;
  tags:        string[];     // used by AI to pick templates e.g. ["hero","cta","above-fold"]
  build:       () => Node[]; // returns a fresh tree on every call
}

export interface PageTemplate {
  id:          string;
  name:        string;
  description: string;
  tags:        string[];
  useCase:     string;       // one-liner for the AI prompt e.g. "portfolio landing page"
  build:       () => PageDocument;
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared sub-trees (internal helpers, not exported as templates)
// ─────────────────────────────────────────────────────────────────────────────

/** Eyebrow label above a heading */
function eyebrow(text: string): Node {
  return makeSpan(text, {
    customClass: "text-sm font-semibold uppercase tracking-widest text-[var(--color-accent)]",
  });
}

/** Standard section heading block: optional eyebrow + h2 + subline */
function sectionHeader(opts: {
  eyebrow?:  string;
  heading:   string;
  subline?:  string;
  align?:    "left" | "center" | "right";
}): Node {
  const { align = "center" } = opts;
  const children: Node[] = [];
  if (opts.eyebrow) children.push(eyebrow(opts.eyebrow));
  children.push(makeHeading(opts.heading, { level: 2, align }));
  if (opts.subline) {
    children.push(makeParagraph(opts.subline, {
      align,
      customClass: "text-lg text-[var(--color-muted)] max-w-2xl mx-auto mt-2",
    }));
  }
  return makeFlex({
    id:        genId("hdr"),
    direction: "column",
    align:     "center",
    gap:       "sm",
    content:   children,
    customClass: align === "center" ? "text-center" : "",
  });
}

/** A single feature card used in the features grid */
function featureCard(icon: string, title: string, body: string): Node {
  return makeContainer({
    padding:    "md",
    customClass: "rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]",
    content: [
      makeFlex({
        direction: "column",
        gap:       "sm",
        content: [
          makeSpan(icon, { customClass: "text-3xl" }),
          makeHeading(title, { level: 3, customClass: "text-lg font-semibold" }),
          makeParagraph(body, { customClass: "text-sm text-[var(--color-muted)] leading-relaxed" }),
        ],
      }),
    ],
  });
}

/** A testimonial card */
function testimonialCard(quote: string, name: string, role: string): Node {
  return makeContainer({
    padding:    "md",
    customClass: "rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]",
    content: [
      makeFlex({
        direction: "column",
        gap:       "md",
        content: [
          makeParagraph(`"${quote}"`, {
            customClass: "text-sm italic text-[var(--color-text)] leading-relaxed",
          }),
          makeFlex({
            direction: "row",
            align:     "center",
            gap:       "sm",
            content: [
              makeContainer({
                customClass: "w-10 h-10 rounded-full bg-[var(--color-border)] flex items-center justify-center text-sm font-bold text-[var(--color-muted)]",
                content: [makeSpan(name[0])],
              }),
              makeFlex({
                direction: "column",
                gap:       "none",
                content: [
                  makeSpan(name,  { customClass: "text-sm font-semibold" }),
                  makeSpan(role,  { customClass: "text-xs text-[var(--color-muted)]" }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

/** Pricing tier card */
function pricingCard(opts: {
  name:        string;
  price:       string;
  period:      string;
  features:    string[];
  ctaLabel:    string;
  ctaHref:     string;
  highlighted?: boolean;
}): Node {
  const border = opts.highlighted
    ? "border-2 border-[var(--color-accent)]"
    : "border border-[var(--color-border)]";

  return makeContainer({
    padding:    "lg",
    customClass: `rounded-xl ${border} bg-[var(--color-surface)] flex flex-col`,
    content: [
      makeFlex({
        direction: "column",
        gap:       "sm",
        content: [
          makeHeading(opts.name, { level: 3, customClass: "text-lg font-semibold" }),
          makeFlex({
            direction: "row",
            align:     "baseline",
            gap:       "xs",
            content: [
              makeSpan(opts.price, { customClass: "text-4xl font-bold font-heading text-[var(--color-primary)]" }),
              makeSpan(opts.period, { customClass: "text-sm text-[var(--color-muted)]" }),
            ],
          }),
          makeDivider({ style: "line", size: "sm" }),
          ...opts.features.map((f) =>
            makeFlex({
              direction: "row",
              align:     "center",
              gap:       "sm",
              content: [
                makeSpan("✓", { customClass: "text-[var(--color-accent)] font-bold text-sm flex-shrink-0" }),
                makeSpan(f,   { customClass: "text-sm" }),
              ],
            })
          ),
          makeButton(opts.ctaLabel, opts.ctaHref, {
            variant:     opts.highlighted ? "solid" : "outline",
            customClass: "w-full justify-center mt-auto",
          }),
        ],
      }),
    ],
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Section templates
// Each returns Node[] — one or more top-level nodes.
// ─────────────────────────────────────────────────────────────────────────────

// ── Hero variants ─────────────────────────────────────────────────────────────

export const heroCenter: TemplateSection = {
  id:          "hero-center",
  name:        "Hero — centered",
  description: "Full-width hero with centered headline, subline, and CTA buttons.",
  tags:        ["hero", "above-fold", "cta", "centered"],
  build: () => [
    makeContainer({
      id:         "hero",
      padding:    "xl",
      maxWidth:   "full",
      background: "var(--color-bg)",
      content: [
        makeContainer({
          maxWidth: "2xl",
          customClass: "mx-auto",
          content: [
            makeFlex({
              id:        "hero-inner",
              direction: "column",
              align:     "center",
              gap:       "lg",
              customClass: "text-center py-16 md:py-24",
              content: [
                eyebrow("Welcome"),
                makeHeading("Your headline goes here", {
                  level:       1,
                  align:       "center",
                  customClass: "text-5xl md:text-6xl font-bold leading-tight",
                }),
                makeParagraph("A compelling subline that tells visitors what you do and why it matters.", {
                  align:       "center",
                  customClass: "text-xl text-[var(--color-muted)] max-w-xl",
                }),
                makeFlex({
                  direction: "row",
                  justify:   "center",
                  gap:       "sm",
                  wrap:      true,
                  content: [
                    makeButton("Get started", "#", { variant: "solid" }),
                    makeButton("Learn more",  "#", { variant: "outline" }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  ],
};

export const heroSplit: TemplateSection = {
  id:          "hero-split",
  name:        "Hero — split",
  description: "Two-column hero: text on the left, image on the right.",
  tags:        ["hero", "above-fold", "split", "image"],
  build: () => [
    makeContainer({
      id:         "hero",
      padding:    "xl",
      maxWidth:   "full",
      background: "var(--color-bg)",
      content: [
        makeContainer({
          maxWidth: "2xl",
          customClass: "mx-auto",
          content: [
            makeFlex({
              id:        "hero-inner",
              direction: "row",
              align:     "center",
              gap:       "xl",
              customClass: "py-16 md:py-24 flex-col md:flex-row",
              content: [
                makeFlex({
                  direction:   "column",
                  gap:         "md",
                  customClass: "flex-1",
                  content: [
                    eyebrow("Introducing"),
                    makeHeading("Build something people love.", {
                      level:       1,
                      customClass: "text-5xl font-bold leading-tight",
                    }),
                    makeParagraph("Your subline goes here. Keep it short, punchy, and focused on the value you deliver.", {
                      customClass: "text-lg text-[var(--color-muted)]",
                    }),
                    makeFlex({
                      direction: "row",
                      gap:       "sm",
                      wrap:      true,
                      content: [
                        makeButton("Get started", "#", { variant: "solid" }),
                        makeButton("Learn more",  "#", { variant: "ghost" }),
                      ],
                    }),
                  ],
                }),
                makeContainer({
                  customClass: "flex-1 rounded-2xl overflow-hidden bg-[var(--color-surface)] aspect-video",
                  content: [
                    makeImage("https://placehold.co/800x500", "Hero image", {
                      objectFit:   "cover",
                      customClass: "w-full h-full object-cover",
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  ],
};

// ── Features ──────────────────────────────────────────────────────────────────

export const featuresGrid: TemplateSection = {
  id:          "features-grid",
  name:        "Features — 3-column grid",
  description: "Section heading followed by a 3-column grid of feature cards with icon, title, and description.",
  tags:        ["features", "grid", "cards", "services"],
  build: () => [
    makeContainer({
      id:         "features",
      padding:    "xl",
      maxWidth:   "full",
      background: "var(--color-bg)",
      content: [
        makeContainer({
          maxWidth: "2xl",
          customClass: "mx-auto",
          content: [
            sectionHeader({
              eyebrow:  "Features",
              heading:  "Everything you need",
              subline:  "A short description of your product's key benefits.",
            }),
            makeDivider({ style: "spacer", size: "lg" }),
            makeGrid({
              cols: 3,
              gap:  "md",
              customClass: "md:grid-cols-3 sm:grid-cols-2 grid-cols-1",
              content: [
                featureCard("⚡", "Fast",       "Built for speed from the ground up. No compromises."),
                featureCard("🔒", "Secure",     "Enterprise-grade security baked in at every layer."),
                featureCard("📱", "Responsive", "Looks great on every screen, every device."),
                featureCard("🎨", "Customisable","Adapt every detail to match your brand perfectly."),
                featureCard("🔗", "Integrates", "Connects with the tools you already use and love."),
                featureCard("📊", "Analytics",  "Understand your users with built-in insights."),
              ],
            }),
          ],
        }),
      ],
    }),
  ],
};

// ── Testimonials ──────────────────────────────────────────────────────────────

export const testimonialsGrid: TemplateSection = {
  id:          "testimonials-grid",
  name:        "Testimonials — 3-column grid",
  description: "Section heading with a grid of customer testimonial cards.",
  tags:        ["testimonials", "social-proof", "reviews"],
  build: () => [
    makeContainer({
      id:         "testimonials",
      padding:    "xl",
      maxWidth:   "full",
      background: "var(--color-surface)",
      content: [
        makeContainer({
          maxWidth: "2xl",
          customClass: "mx-auto",
          content: [
            sectionHeader({
              eyebrow:  "Testimonials",
              heading:  "Loved by our customers",
              subline:  "Don't just take our word for it.",
            }),
            makeDivider({ style: "spacer", size: "lg" }),
            makeGrid({
              cols: 3,
              gap:  "md",
              customClass: "md:grid-cols-3 sm:grid-cols-2 grid-cols-1",
              content: [
                testimonialCard(
                  "This product completely changed how our team works. We ship twice as fast.",
                  "Sarah Chen", "Engineering Lead at Acme"
                ),
                testimonialCard(
                  "The simplest tool I've ever used. Got up and running in under 10 minutes.",
                  "James Okafor", "Founder, Stacklabs"
                ),
                testimonialCard(
                  "Customer support is world-class. Every question answered within the hour.",
                  "Maria Silva", "Head of Product at Globex"
                ),
              ],
            }),
          ],
        }),
      ],
    }),
  ],
};

// ── Pricing ───────────────────────────────────────────────────────────────────

export const pricingThreeTier: TemplateSection = {
  id:          "pricing-three-tier",
  name:        "Pricing — three tiers",
  description: "Section heading with three pricing tier cards. Middle tier is highlighted.",
  tags:        ["pricing", "plans", "tiers", "saas"],
  build: () => [
    makeContainer({
      id:         "pricing",
      padding:    "xl",
      maxWidth:   "full",
      background: "var(--color-bg)",
      content: [
        makeContainer({
          maxWidth: "2xl",
          customClass: "mx-auto",
          content: [
            sectionHeader({
              eyebrow:  "Pricing",
              heading:  "Simple, transparent pricing",
              subline:  "No hidden fees. Cancel any time.",
            }),
            makeDivider({ style: "spacer", size: "lg" }),
            makeGrid({
              cols:       3,
              gap:        "md",
              customClass: "md:grid-cols-3 sm:grid-cols-1 items-stretch",
              content: [
                pricingCard({
                  name:     "Starter",
                  price:    "$0",
                  period:   "/ month",
                  features: ["5 projects", "1 GB storage", "Community support"],
                  ctaLabel: "Get started free",
                  ctaHref:  "#",
                }),
                pricingCard({
                  name:        "Pro",
                  price:       "$29",
                  period:      "/ month",
                  features:    ["Unlimited projects", "50 GB storage", "Priority support", "Custom domain"],
                  ctaLabel:    "Start free trial",
                  ctaHref:     "#",
                  highlighted: true,
                }),
                pricingCard({
                  name:     "Enterprise",
                  price:    "Custom",
                  period:   "",
                  features: ["Unlimited everything", "Dedicated support", "SLA guarantee", "SSO / SAML"],
                  ctaLabel: "Contact sales",
                  ctaHref:  "#",
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  ],
};

// ── Contact ───────────────────────────────────────────────────────────────────

export const contactSimple: TemplateSection = {
  id:          "contact-simple",
  name:        "Contact — simple centered",
  description: "Centered heading with email link and social links.",
  tags:        ["contact", "footer", "cta", "links"],
  build: () => [
    makeContainer({
      id:         "contact",
      padding:    "xl",
      maxWidth:   "full",
      background: "var(--color-bg)",
      content: [
        makeContainer({
          maxWidth: "lg",
          customClass: "mx-auto",
          content: [
            makeFlex({
              direction:   "column",
              align:       "center",
              gap:         "md",
              customClass: "text-center",
              content: [
                eyebrow("Get in touch"),
                makeHeading("Let's work together", {
                  level:       2,
                  align:       "center",
                  customClass: "text-4xl font-bold",
                }),
                makeParagraph(
                  "Have a project in mind? I'd love to hear about it. Send me a message and I'll get back to you within 48 hours.",
                  {
                    align:       "center",
                    customClass: "text-lg text-[var(--color-muted)] max-w-md",
                  }
                ),
                makeButton("Send me an email", "mailto:hello@example.com", {
                  variant: "solid",
                }),
                makeFlex({
                  direction: "row",
                  justify:   "center",
                  gap:       "md",
                  content: [
                    makeButton("LinkedIn",  "https://linkedin.com",  { variant: "ghost" }),
                    makeButton("GitHub",    "https://github.com",    { variant: "ghost" }),
                    makeButton("Dribbble",  "https://dribbble.com",  { variant: "ghost" }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  ],
};

// ── Footer ────────────────────────────────────────────────────────────────────

export const footerSimple: TemplateSection = {
  id:          "footer-simple",
  name:        "Footer — simple",
  description: "Brand name on the left, copyright and nav links on the right.",
  tags:        ["footer", "nav", "links"],
  build: () => [
    makeContainer({
      id:         "footer",
      padding:    "lg",
      maxWidth:   "full",
      background: "var(--color-primary)",
      content: [
        makeContainer({
          maxWidth: "2xl",
          customClass: "mx-auto",
          content: [
            makeFlex({
              direction:   "row",
              justify:     "between",
              align:       "center",
              gap:         "md",
              wrap:        true,
              customClass: "flex-col sm:flex-row",
              content: [
                makeSpan("Brand", {
                  customClass: "font-heading font-bold text-lg text-white",
                }),
                makeFlex({
                  direction: "row",
                  gap:       "md",
                  align:     "center",
                  wrap:      true,
                  content: [
                    makeButton("Privacy",  "#", { variant: "ghost", customClass: "text-white/60 hover:text-white text-sm" }),
                    makeButton("Terms",    "#", { variant: "ghost", customClass: "text-white/60 hover:text-white text-sm" }),
                    makeButton("Twitter",  "#", { variant: "ghost", customClass: "text-white/60 hover:text-white text-sm" }),
                    makeSpan(`© ${new Date().getFullYear()} Brand. All rights reserved.`, {
                      customClass: "text-white/40 text-xs",
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  ],
};

// ── Nav ───────────────────────────────────────────────────────────────────────

export const navSimple: TemplateSection = {
  id:          "nav-simple",
  name:        "Nav — simple sticky",
  description: "Sticky navigation with logo on the left and links + CTA on the right.",
  tags:        ["nav", "navigation", "header", "sticky"],
  build: () => [
    makeContainer({
      id:         "nav",
      padding:    "none",
      maxWidth:   "full",
      background: "var(--color-bg)",
      customClass: "sticky top-0 z-50 border-b border-[var(--color-border)] backdrop-blur-sm",
      content: [
        makeContainer({
          maxWidth: "2xl",
          customClass: "mx-auto",
          content: [
            makeFlex({
              direction: "row",
              justify:   "between",
              align:     "center",
              padding:   "sm",
              content: [
                makeSpan("Brand", {
                  customClass: "font-heading font-bold text-lg",
                }),
                makeFlex({
                  direction: "row",
                  align:     "center",
                  gap:       "md",
                  content: [
                    makeButton("About",   "#about",   { variant: "ghost", customClass: "text-sm hidden md:inline-flex" }),
                    makeButton("Work",    "#work",    { variant: "ghost", customClass: "text-sm hidden md:inline-flex" }),
                    makeButton("Contact", "#contact", { variant: "solid", customClass: "text-sm" }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  ],
};

// ── Stats bar ─────────────────────────────────────────────────────────────────

export const statsBar: TemplateSection = {
  id:          "stats-bar",
  name:        "Stats bar",
  description: "A horizontal row of key metrics / numbers.",
  tags:        ["stats", "metrics", "numbers", "social-proof"],
  build: () => [
    makeContainer({
      id:         "stats",
      padding:    "xl",
      maxWidth:   "full",
      background: "var(--color-surface)",
      content: [
        makeContainer({
          maxWidth: "2xl",
          customClass: "mx-auto",
          content: [
            makeFlex({
              direction: "row",
              justify:   "around",
              align:     "center",
              gap:       "lg",
              wrap:      true,
              content: [
                makeFlex({ direction: "column", align: "center", gap: "xs", content: [
                  makeSpan("10k+",     { customClass: "text-4xl font-bold font-heading text-[var(--color-primary)]" }),
                  makeSpan("Customers",{ customClass: "text-sm text-[var(--color-muted)]" }),
                ]}),
                makeFlex({ direction: "column", align: "center", gap: "xs", content: [
                  makeSpan("99.9%",   { customClass: "text-4xl font-bold font-heading text-[var(--color-primary)]" }),
                  makeSpan("Uptime",  { customClass: "text-sm text-[var(--color-muted)]" }),
                ]}),
                makeFlex({ direction: "column", align: "center", gap: "xs", content: [
                  makeSpan("4.9★",    { customClass: "text-4xl font-bold font-heading text-[var(--color-primary)]" }),
                  makeSpan("Rating",  { customClass: "text-sm text-[var(--color-muted)]" }),
                ]}),
                makeFlex({ direction: "column", align: "center", gap: "xs", content: [
                  makeSpan("24/7",    { customClass: "text-4xl font-bold font-heading text-[var(--color-primary)]" }),
                  makeSpan("Support", { customClass: "text-sm text-[var(--color-muted)]" }),
                ]}),
              ],
            }),
          ],
        }),
      ],
    }),
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Section template registry
// The AI system prompt references this to know what it can compose.
// ─────────────────────────────────────────────────────────────────────────────

export const sectionTemplates: TemplateSection[] = [
  navSimple,
  heroCenter,
  heroSplit,
  featuresGrid,
  testimonialsGrid,
  pricingThreeTier,
  statsBar,
  contactSimple,
  footerSimple,
];

export function getSectionTemplate(id: string): TemplateSection | undefined {
  return sectionTemplates.find((t) => t.id === id);
}

// ─────────────────────────────────────────────────────────────────────────────
// Full page templates
// ─────────────────────────────────────────────────────────────────────────────

export const portfolioTemplate: PageTemplate = {
  id:          "portfolio",
  name:        "Portfolio",
  description: "Personal portfolio with nav, hero, features (skills), testimonials, contact, and footer.",
  tags:        ["portfolio", "personal", "freelancer", "designer", "developer"],
  useCase:     "personal portfolio or freelancer landing page",
  build: () => makePageDocument(
    { title: "My Portfolio", slug: "portfolio", description: "Personal portfolio" },
    [
      ...navSimple.build(),
      ...heroSplit.build(),
      ...featuresGrid.build(),
      ...testimonialsGrid.build(),
      ...contactSimple.build(),
      ...footerSimple.build(),
    ]
  ),
};

export const saasTemplate: PageTemplate = {
  id:          "saas",
  name:        "SaaS Landing Page",
  description: "Product landing page with nav, hero, stats, features, pricing, and footer.",
  tags:        ["saas", "product", "startup", "landing-page"],
  useCase:     "SaaS or software product landing page",
  build: () => makePageDocument(
    { title: "Product Name", slug: "product", description: "Your product tagline here" },
    [
      ...navSimple.build(),
      ...heroCenter.build(),
      ...statsBar.build(),
      ...featuresGrid.build(),
      ...pricingThreeTier.build(),
      ...footerSimple.build(),
    ]
  ),
};

export const eventTemplate: PageTemplate = {
  id:          "event",
  name:        "Event Page",
  description: "Single-event page with hero, details, speakers (features), and contact/RSVP.",
  tags:        ["event", "conference", "meetup", "launch"],
  useCase:     "event, conference, or product launch page",
  build: () => makePageDocument(
    { title: "Event Name", slug: "event", description: "Join us for..." },
    [
      ...navSimple.build(),
      ...heroCenter.build(),
      ...statsBar.build(),
      ...featuresGrid.build(),
      ...contactSimple.build(),
      ...footerSimple.build(),
    ]
  ),
};

export const minimalTemplate: PageTemplate = {
  id:          "minimal",
  name:        "Minimal",
  description: "Just a centered hero with a heading, subline, and CTA. Start from scratch.",
  tags:        ["minimal", "blank", "simple", "starter"],
  useCase:     "minimal starter page",
  build: () => makePageDocument(
    { title: "My Page", slug: "my-page" },
    [...heroCenter.build()]
  ),
};

// ─────────────────────────────────────────────────────────────────────────────
// Page template registry
// ─────────────────────────────────────────────────────────────────────────────

export const pageTemplates: PageTemplate[] = [
  minimalTemplate,
  portfolioTemplate,
  saasTemplate,
  eventTemplate,
];

export function getPageTemplate(id: string): PageTemplate | undefined {
  return pageTemplates.find((t) => t.id === id);
}

// ─────────────────────────────────────────────────────────────────────────────
// Template summary for AI system prompt injection
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns a compact string describing all available section templates.
 * Injected into the AI system prompt so the model knows what it can compose.
 */
export function buildTemplateSummary(): string {
  const sections = sectionTemplates
    .map((t) => `- ${t.id}: ${t.description} [tags: ${t.tags.join(", ")}]`)
    .join("\n");

  const pages = pageTemplates
    .map((t) => `- ${t.id}: ${t.description} [use case: ${t.useCase}]`)
    .join("\n");

  return `## Available section templates
${sections}

## Available page templates (use replace_content op to load one)
${pages}`;
}
