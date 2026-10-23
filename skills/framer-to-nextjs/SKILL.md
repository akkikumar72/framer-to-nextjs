---
name: framer-to-nextjs
description: Rebuild an authorized, published Framer site or template as a standalone Next.js application with local assets, complete discovered routes, responsive behavior, and evidence-based verification. Use for Framer-to-Next.js migration, recreation, or export requests. Not a lossless source exporter or a redesign workflow.
license: MIT
---

# Framer to Next.js

Reconstruct the rendered site as maintainable application code. The published reference is the visual and behavioral specification. One prompt can start the entire workflow; it does not guarantee that any template, inaccessible project, or proprietary service can be reproduced exactly.

## Start here

Read [discovery](references/discovery.md) before coding. Read [assets and services](references/assets-and-services.md) when inventorying dependencies, [implementation](references/implementation.md) before scaffolding, and [verification](references/verification.md) before collecting final evidence. Use [the manifest contract](references/manifest.md) for the bundled checks.

This skill is self-contained. Use whatever documented browser, terminal, and file tools the host actually provides. A browser must be able to inspect rendering, computed styles, screenshots, responsive variants, and interactions. A fetch-only tool cannot prove visual fidelity. Do not require another skill, a particular browser brand, MCP server, paid API, or image generator. When browser access is absent, complete useful discovery and code work, state the missing verification, and do not claim visual acceptance.

## 1. Establish scope and discover the site

Identify the reference URL, destination, framework/version, scope, viewports, and required service replacements. Default to Next.js with TypeScript in a standalone application. Follow an existing repository's conventions and preserve unrelated work. A new standalone site normally serves its homepage at `/`; a namespace or monorepo gallery is only needed when requested.

A whole site, template, project, or root-URL request includes all evidence-backed project-owned routes: unlinked pages, collection details, legal pages, locales in scope, redirects, and the custom not-found experience. A named page or section can narrow that scope. Never invent conventional pages or follow external domains as new scope.

Use an accessible project tree, sitemap indexes and locale sitemaps, robots directives, rendered links, pagination, collection cards, and canonical evidence. Probe a guaranteed-missing path. Record inaccessible evidence; a public crawl cannot prove it found private or unlinked unsitemapped pages. Distinguish routes from anchors, overlays, query-driven state, downloads, and external actions.

Freeze a route manifest before implementation. Each route needs its exact source and local paths, evidence, family, kind, disposition, and expected HTTP behavior. Enumerate every discovered collection slug, even when only representative slugs receive full visual sampling. Keep content, redirect, and not-found counts separate.

## 2. Recognize and capture the template

Build a capability profile from observed sections and states. Record layout, typography, assets, responsive variants, fixed/sticky layers, stateful controls, motion drivers, embeds, services, risks, and unknowns. Do not force the site into a familiar landing-page structure.

Inspect desktop, tablet, and phone variants, locating actual breakpoint changes. Capture every distinct page family and materially different route. For each medium/high-risk section, record a contract: landmark, geometry, layers, assets, reachable states, driver, responsive changes, and selected probes.

Sample initial, in-flight, and settled motion from a fresh navigation. Enumerate finite carousel slides, tabs, overlays, menus, accordions, timers, and their reverse/close states. For combinatorial or unbounded search/data systems, record representative combinations, boundaries and residual coverage. Select probes based on detected capabilities. An unusual canvas or scroll effect stays unknown until evidence establishes its driver.

## 3. Own the assets and service boundaries

Localize permitted runtime images, fonts, SVG dependencies, backgrounds, masks, posters, video, audio, textures, and social images. Record provenance separately from runtime references. Verify response status, bytes, MIME type, crop, and font licensing. A `.jpg` filename can contain AVIF bytes.

Do not ship Framer's generated runtime, scraped HTML, iframe of the source, or CDN hotlinks as the new application. Keep a local asset map and an auditable inventory with content hashes and permission notes. Browser runtime checks must complement source scans because lazy media, CSS, SVG, and metadata can escape static checks.

Visible access does not grant redistribution rights. Migrate only material the user is authorized to use, preserve required notices, and never bypass authentication or paid access. The skill's MIT license does not license third-party template artwork or fonts.

Treat CMS snapshots separately from ongoing editing/synchronization. Forms, subscriptions, authentication, commerce, localization, search, analytics, and proprietary renderers need explicit replacement contracts. A preview form must say that nothing was sent. Never test submissions against the live reference or claim delivery from local validation.

## 4. Implement a maintainable application

Build tokens, fonts, shared shell, navigation, footer, metadata, and repeated primitives once. Use semantic React components, server-first rendering, small client interaction components, and data-driven collection families. Unknown slugs must reach real not-found handling, not a fallback article or a page with HTTP 200.

Reproduce measured structure and responsive variants before polishing surfaces. Separate sticky/flow wrappers from transformed visual layers. Match crop, overlays, blur, mask, and opacity independently. Implement observed state and motion with the simplest suitable CSS, React state, observers, timers with cleanup, or the existing motion library. Support reduced motion and keyboard/focus behavior.

Use current official documentation for the installed framework version. Decide between a normal Next.js server, Next.js standalone server output, and static export deliberately. These are different deployment modes. Do not promise server-only forms, default image optimization, or runtime dynamic routes in a static export.

If delegation is available and authorized, assign disjoint page families. One owner controls shared files, assets, dependencies, integration, and verification. A single agent can use the same workflow sequentially.

## 5. Verify, repair, and report

Run repository-native checks and the production build sequentially when they share generated types. Inspect the production preview. Check every canonical route and discovered slug, redirect status/location, metadata, internal link, missing asset, unknown slug, and guaranteed-missing path. Verify branded not-found UI after hydration and HTTP 404 independently. A screenshot or a successful HTTP response proves neither on its own.

At matching viewport, landmark, component state, and animation phase, compare reference and local captures at the same scale. Measure section boundaries, container edges, wrapping, and page height. Fix the earliest structural drift first, then typography, surfaces, and motion. A matching total height can hide cancelling section errors. Recheck shared consumers after shared changes.

Use [verification](references/verification.md) to create an acceptance matrix and delta ledger. Bundled helpers check discovery seeds and declared HTTP/asset contracts. They do not prove complete discovery, browser behavior, visual parity, or backend delivery. Never invent a fidelity percentage or mark unmeasured work passed.

Hand off the local path and preview, route counts by kind, tested viewports, checks and outcomes, matching-state evidence, assets/services status, remaining deltas, and deployment status. Keep the requested preview available; close only agent-created disposable browser resources. Deploy or publish the converted site only when authorized.
