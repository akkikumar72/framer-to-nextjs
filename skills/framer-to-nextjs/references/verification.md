# Verification and acceptance

## Record proof by category

Maintain an acceptance ledger with `pass`, `fail`, `blocked`, `not-run` or evidence-backed `n/a`. A completed build is compile evidence; an HTTP contract is route evidence; a screenshot is visual evidence. Do not promote one category to another.

| Category | Proof |
| --- | --- |
| Discovery/scope | Every discovered route has an implemented, user-excluded or evidence-blocked disposition. Report private/unlinked coverage limits. |
| Routes | Every content/detail instance, exact canonical path, redirect status and Location, unknown slug and missing path. |
| Assets | Local file/HTTP/decode/MIME checks, source review and browser runtime inventory across routes/states. |
| Structure | Per-section geometry, typography/wrapping, crop and layout variants at matched viewports. |
| Behavior | Finite control states, recorded combinations/boundaries for unbounded systems, keyboard/focus, motion phases and timer/scroll driver samples. |
| Services | Configured replacement or honest preview/unavailable boundary, verified without production side effects. |
| Production | Project checks, production build, final preview, no implementation-caused console/hydration/server errors. |

## HTTP checks and their limits

Use the bundled [manifest contract and audit](manifest.md) for declared route/asset checks. Inspect successful pages for the expected visible marker, title and canonical. A marker in script data or a hidden element does not prove users see it. The helper strips script/style/template/head content but is not a browser and cannot compute CSS visibility.

Use manual redirect handling to prove the initial status and `Location`; automatically following redirects can hide defects. Test error UI after hydration as well as actual 404 status. A clean production build can still serve a wrong title, missing image or soft 404. Verify every instance in a collection, not just its layout representative.

Review internal links in the browser or a DOM-aware crawl, including links revealed by overlays and menus. Distinguish mail, telephone, download, external, hash and query-state targets. Verify hash targets exist and back/next relationships are correct. The bundled audit does not perform complete link discovery or browser visibility checks.

## Match geometry before polish

At each target viewport wait for fonts and decoded images, align the same landmark and content state, and record actual dimensions. Keep captures at identical viewport size and 1:1 scale. Do not resize each screenshot independently.

Measure section starts and heights, container edges, repeated gaps, text frame widths/wrapping and page ending. Fix the earliest structural mismatch first; then typography, images, surfaces and motion. Recheck from the top after changing upstream height. Matching page height can conceal opposing section errors.

For a deterministic reference, these are suggested comparison budgets, not proof of fidelity:

| Measurement | Starting budget |
| --- | --- |
| Section start or major container edge | 2 CSS px |
| Section height | max(2 CSS px, 0.25% of reference height) |
| Full page height | max(3 CSS px, 0.1% of reference height) |
| Repeated card gap | 1 CSS px |

Agree different budgets when the reference is dynamic or the user requests approximation. Record actual deltas; never copy budgets into the results as if measured. Font rasterization and browser differences may prevent literal pixel equality.

## Match motion and state

Capture fresh-navigation initial, in-flight and settled phases, using repeatable timestamps or landmarks. Equal `scrollY` does not mean equal section progress if upstream heights differ. Sample scroll-driven systems at start/middle/end and confirm what remains pinned after a small scroll delta. Measure flow wrappers separately from transformed children.

For a carousel, enumerate all slides, align the same active slide, test previous/next/wraparound, observe autoplay and manual reset behavior. Do not disable a reference feature just to get a stable screenshot. Menus/overlays need close, Escape, focus return and mobile states. Forms need truthful pending/error/unavailable/success states. Test reduced motion independently.

For canvas, embeds, or proprietary effects, capture inputs and output samples and document any maintained approximation. An unexplained difference cannot be relabeled as pass.

## Production sequence

Run the project's real type/lint/check tasks, then its production build, then start a production preview and run route/asset/browser checks. Keep checks that consume generated files sequential with the build. Use the installed package manager and supported browser APIs; do not assume `networkidle` works on a page with continuous media or analytics. Wait for specific fonts, media or visible landmarks instead.

Inspect console/server warnings and classify their cause before changing code. An unavailable DNS path or browser viewport control is a verification boundary; it is not evidence the site is broken. Use an available documented alternative and record unperformed checks.

## Final handoff

Tag evidence with the code revision/content version, capture time, actual viewport, state and motion phase. Invalidate or relabel evidence after relevant code, copy, asset or configuration changes. Historical captures prove only the captured revision. For medium/high-risk sections save labeled reference/local pairs at identical scale and state, with measurements and remaining deltas.

Report local path and preview; route counts by kind; implemented/excluded/blocked counts; viewports; production checks; per-family and per-instance coverage; same-state comparison evidence and actual deltas; assets/services limits; remaining unknowns; deployment status. Save durable evidence intentionally and keep temporary browser artifacts out of commits.

Never claim "100%" from intuition, a build, or one settled homepage screenshot. One-prompt orchestration is a workflow convenience, not a universal exact-conversion guarantee.
