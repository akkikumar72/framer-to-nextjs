# Lessons from 21 Framer conversions and adaptations

These lessons come from the [Framer template workspace](https://github.com/akkikumar72/framer-slate-nextjs), inspected as a **local working snapshot on 2026-10-23**. Some snapshot files were uncommitted. Source-relative paths below describe that snapshot and may not yet exist in the public default branch.

The inventory demonstrates a range of layouts, content families and interaction systems. It does not establish that every template can be converted in one attempt with exact visual parity.

## What was inspected and checked

The snapshot contains **21 converted or adapted sites plus Showcase infrastructure**. Their configurations declare **343 normal endpoints**, **68 invalid-route probes** and **11 redirects**. Two normal endpoints are Vessla's authored English and Swedish `/404` demonstration pages, served with HTTP 200. Excluding those demonstrations leaves **341 content endpoints**. Other apps generally list the authored `/404` under invalid probes. Dynamic detail instances count individually; redirects and missing-path probes are separate from content.

Checks performed during this audit:

- **22/22 asset audits passed**, including Showcase. These check recognized source references and nonempty local files.
- The validator unit suite had **9 passes and 1 failure**. Its directory-discovery test attempted to read `apps/maya/template.config.json`, which did not exist, and raised `ENOENT`.
- Production builds, production HTTP checks, browser suites and live visual comparisons were **not rerun**. Earlier acceptance documents retain historical results, which must be read with their revision and date.

This is an audit of the working snapshot, not a claim that the whole repository currently passes verification.

## How the workflow evolved

A read-only history review covered 29 relevant prior chats across 33 saved rollout segments, including resumed conversations and related standalone work. Missing or cloud-only/deleted sessions were outside the audit. Raw transcripts and personal data are not distributed here.

- **July 2026:** Fuel follow-up corrections established separate sticky/visual layers, motion-phase sampling, capability-based probes and whole-project route discovery. Earlier homepage completion had missed important behaviors and pages.
- **July-August 2026:** Architecture and quality audits exposed soft 404s, misleading preview forms, extensionless media dependencies, metadata leakage, oversized client manifests and offscreen animation work.
- **September 2026:** Standalone portfolio extraction added editable content entry points, production-origin validation, editing/architecture guidance and independent operation.
- **October 2026:** Shader, intermediate-width and inert-control corrections reinforced that successful builds and matching page heights do not establish interaction or motion parity.

Earlier scenario/planning forward tests were not live end-to-end migrations. Keep that distinction when citing validation.

## Complete site inventory

Every row has a route contract at `apps/<slug>/template.config.json`. The endpoint column includes only configured normal responses, with the Vessla demonstration exception described above. Evidence paths are local snapshot artifacts, not links to unpublished files.

| Site | Endpoints | Capabilities that shaped the conversion | Representative evidence in the snapshot |
| --- | ---: | --- | --- |
| Agenio | 9 | Unlinked blog, three project details, slider, marquees, counters, file-input form | `apps/agenio/components/agenio/` |
| Agentik | 9 | Four article details, workflow selector, local video, counters | `apps/agentik/components/agentik/`, `public/agentik/assets/source-manifest.json` within that app |
| Alytics | 7 | Four articles, scroll tilt, draggable tickers, timed integration spiral, price springs, independent FAQs and envelope motion | `apps/alytics/docs/acceptance.md`, `tests/alytics-motion.spec.ts` |
| B2bizz | 28 | Alternate homepage, five services, seven case studies, seven articles, video, menus, sliders, pagination | `apps/b2bizz/docs/capability-profile.md`, `apps/b2bizz/scripts/` |
| Dashfluence | 35 | Five services, eight projects, twelve articles, timed hero stories, service explorer, pricing | `apps/dashfluence/components/dashfluence/`, `tests/dashfluence-service-assets.spec.ts` |
| Fuel | 12 | Four projects, four articles, redirected index routes, canvas/pointer effects, reel and testimonials | `apps/fuel/components/fuel/`, `tests/preview-forms.spec.ts` |
| GridFolio | 1 | Eighteen tiles, five dialogs, sticky intro, progressive blur, mobile menu | `apps/gridfolio/docs/intro-motion.md`, `tests/gridfolio-motion.spec.ts` |
| Grovia | 1 | Feature tabs, intersection reveals, contact and newsletter previews | `apps/grovia/components/GroviaPage.tsx`, `tests/preview-forms.spec.ts` |
| Hulio | 23 | Six projects, nine articles, Load More, pointer-follow affordances, shared shell, word and navigation springs | `apps/hulio/docs/README.md`, `apps/hulio/docs/motion-verification.md` |
| Jayden | 8 | Three projects, fixed navigation rail, canvas background, counters, service/pricing/FAQ states | `apps/jayden/components/jayden/` |
| Nue | 5 | Four projects, fixed dock, SSR reveal springs, snap carousel, media dialogs, email draft | `apps/nue/docs/acceptance.md`, `tests/nue.spec.ts` |
| Orbital | 15 | Nine articles, four use-case states, viewport-wide logos, responsive carousels, pricing switch | `apps/orbital/docs/validation.md`, `apps/orbital/docs/responsive-audit.json` |
| Palmer | 13 | Five projects, four articles, gallery parallax, custom cursor, video reel | `apps/palmer/components/palmer/`, app-local asset manifests |
| Payble | 21 | Twelve articles, four legal pages, billing state, budget tabs, testimonials and marquees | `apps/payble/components/payble/`, `tests/preview-forms.spec.ts` |
| Pilar | 4 | Three query-selected themes, integration/testimonial tickers, FAQ and forms | `apps/pilar/components/pilar/`, `tests/template-smoke.spec.ts` |
| Rivero | 45 | Twelve articles, seven case studies, nine integrations, four changelogs, two pricing variants | `apps/rivero/components/rivero/`, `tests/template-smoke.spec.ts` |
| Roco | 55 | Forty-seven projects, data-driven legal pages, responsive sidebar, ticker, contact API | `apps/roco/docs/acceptance.md`, `tests/roco.spec.ts` |
| Saazai | 19 | Nine articles, jobs list, integration directory, changelog timeline, pricing and testimonials | `apps/saazai/components/saazai/`, `tests/preview-forms.spec.ts` |
| Slate | 1 | One-page product site, stateful feature tabs and reveals | `apps/slate/components/SlateHomepage.tsx`, `tests/template-smoke.spec.ts` |
| Trillo | 1 | Three dashboard states, autoplay, platform tabs, phone-specific pricing and FAQs | `apps/trillo/components/trillo/`, `tests/template-smoke.spec.ts` |
| Vessla | 31 | Published company-site adaptation, English/Swedish pages, twelve job details, workflow, carousel, canvas, legal-source notices | `apps/vessla/docs/route-manifest.md`, `tests/vessla.spec.ts` |

**Showcase is infrastructure, not another conversion.** It adds one normal endpoint and two invalid probes. It holds the catalog, preview images, filters, destination configuration and redirects into the separate apps. Its representative files are `apps/showcase/lib/templates.ts`, `apps/showcase/next.config.ts` and `apps/showcase/docs/ui-audit.md`.

## Discover the site before choosing an implementation

**The homepage does not define the scope.** Agenio has an unlinked blog. Roco has 47 project details. Rivero has article, case-study, integration and changelog families. Freeze a route manifest using the accessible project tree, sitemap, navigation, cards, canonical links and a guaranteed-missing-path probe before building components.

Record the evidence and disposition for each route: implemented, excluded by scope, or blocked. Keep supplemental pages and intentional corrections separate from source pages. Vessla documents three supplemental local pages; B2bizz corrects a malformed source placeholder link instead of inventing a new destination.

**Count states separately from routes.** Pilar's themes use a query parameter. GridFolio's five overlays are dialogs on one page. Pricing intervals, carousel positions and FAQ disclosures need a state inventory even when the route count is small.

Preserve observed path case, punctuation and semantics. Dashfluence uses a capitalized route prefix; Rivero has changelog slugs containing parentheses. Probe both an authored `/404` and an unknown path, since the authored page can be a normal demonstration route.

## Build shared systems without coupling independent pages

Choose components from repeated rendered evidence. Hulio shares labels, typography, cards, navigation and motion across page families. Roco and Nue use one detail template with typed data rather than copying every project page.

If work runs in parallel, one agent owns tokens, fonts, assets, global CSS, shared components and integration. Route workers own disjoint families and report missing shared primitives. Recheck all affected families after a shared typography or spacing change: a small line-height difference can shift every later landmark.

**An independent workspace is not automatically a portable copied app.** Some apps use shared workspace packages; newer app scripts explicitly call `../../packages/template-validation`. Copying only an app directory therefore loses part of its tooling. A standalone handoff needs local package scripts, declared dependencies, environment examples and install/build/start instructions without sibling-repository assumptions.

Use an explicit production origin for metadata and make any route prefix a deliberate choice. Gallery ports and catalog redirects are integration details, not defaults every standalone conversion should inherit.

## Validate behavior, geometry and motion separately

1. **Verify every route and sample every family.** Check every detail slug, internal link, title, canonical and invalid route. Run full visual and interaction checks for each distinct family. A working homepage cannot establish complete site coverage.
2. **Measure the actual responsive changes.** Orbital's audit includes 809/810px boundaries and a wide desktop. GridFolio changes sticky behavior at 810px. Measure container rules, image crops and column changes, not just three convenient device sizes.
3. **Fix upstream geometry first.** Match fonts, intrinsic media dimensions, section boundaries and layering before surface polish. Compare equal CSS viewports and equivalent landmarks/states. Equal total page heights alone cannot prove matching sections.
4. **Capture real motion phases.** Nue tests initial, intermediate and settled frames, entrance order and live reduced-motion changes. GridFolio tests activation at scrollY 7 versus 6 and reversal during a fade. Hulio records spring settings and acknowledges hydration scheduling offsets. A settled screenshot or reduced-motion-only suite misses these behaviors.
5. **Exercise keyboard and lifecycle transitions.** Test dialog focus/scroll restoration, menu Escape, hidden carousel slides, route changes, observer/timer cleanup, no-JavaScript readability and focus inside reveals. Include keyboard-then-pointer sequences, since gesture state can survive an earlier interaction.

Concrete regression checks worth retaining:

- Unknown dynamic slugs must fail during metadata resolution as well as page rendering. Alytics uses `notFound()` in both paths.
- Object-backed collections need own-property lookup. Roco tests `toString` and `constructor` as invalid legal slugs.
- A valid but incorrect image still passes existence checks. Rivero's smoke test checks the ordered avatar sources; Dashfluence separately checks bounded, lazy service images.
- SSR-hidden reveal content needs first-paint reduced-motion and no-JavaScript fallbacks. Nue also completes a reveal when keyboard focus reaches it.

## Keep assets, services and evidence honest

**Local media removes runtime hosting dependencies, not licensing obligations.** Inventory image renditions, fonts, SVGs, backgrounds, masks, video and posters with provenance and dimensions. Public accessibility does not grant redistribution rights. This skill repository contains behavioral lessons, not template artwork or source screenshots.

Forms need a stated delivery contract. Most inspected apps provide local validation only. Nue prepares an encoded email draft. Roco returns HTTP 503 when no delivery endpoint is configured. A local confirmation must not claim a message was sent or a subscription created. CMS editing, authentication, commerce and localization also need explicit replacement decisions.

**Historical captures do not verify a changed revision.** Nue, Roco and GridFolio intentionally changed branding or content after earlier comparisons. Preserve the distinction between a source-fidelity baseline and a later adaptation. Mark evidence with the revision, viewport, state and capture time; invalidate or relabel it after relevant edits.

A report should distinguish routes implemented, interactions exercised, measured geometry, saved visual comparisons, builds passed, service limitations and remaining deltas. Do not convert these into an intuitive fidelity percentage.

## Understand the checks before claiming completion

The source workspace's `packages/template-validation` is useful structural tooling with explicit limits:

| Check | What it supports | What still needs separate evidence |
| --- | --- | --- |
| Asset audit | Recognized references resolve to nonempty local files; selected remote references are rejected | Dynamic asset helpers, extensionless/embedded media, correct image identity, rendered crop and licensing |
| Normal HTTP route contract | Status, parsed response marker, title and canonical pathname | Browser visibility, complete content, canonical origin/query behavior and appearance |
| Invalid HTTP route contract | Expected response status | Branded visible missing-page content; the HTTP function does not inspect its marker |
| Common browser smoke | Homepage hydration, one selected interaction per app and configured invalid pages | Every normal route, every state and reference visual parity |
| Specialized browser suites | Deeper route, responsive, accessibility or motion assertions for selected apps | Uncovered families and live source comparisons |

The browser configuration defaults to reduced motion; dedicated motion suites opt into normal motion. Several suites save screenshots, but the inspected tests contain no `toHaveScreenshot` source-reference assertions. Screenshot output is evidence to inspect, not an automatic proof of fidelity.

The unit failure above also supplies a portability lesson: **discover apps by their contract files, not by assuming every directory is an app**. The browser helper already filters for both `package.json` and `template.config.json`; the failing unit discovery did not.

A complete conversion needs runnable standalone code and explicit outcomes for route coverage, responsive layouts, interaction states, motion, accessibility, assets, metadata, services and production validation. The workflow makes those outcomes reviewable; it cannot guarantee exact results for every accessible template.
