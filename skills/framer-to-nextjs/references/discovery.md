# Discovery and capability recognition

## Route evidence

Reconcile these sources rather than trusting any one of them:

1. An authorized project page tree, when available. Editor login or unavailable authorization is a boundary, not proof the public site is unavailable.
2. `robots.txt`, `sitemap.xml`, sitemap indexes, and locale sitemaps. A sitemap may omit pages, include redirects, or be stale.
3. Rendered navigation, footer, menus, pagination, card links, legal links, canonical and alternate language URLs on every newly found page.
4. Collection detail instances, linked downloads and utility pages, classified by behavior.
5. A randomized guaranteed-missing path to identify the actual 404 UI and status.

Only add routes with evidence of project ownership. Query strings may control themes, search, or overlays; keep those in the state ledger rather than inventing duplicate pages. Preserve path case, encoded slugs, observed trailing-slash behavior and locale distinctions. A same-origin link may be a file or API endpoint, not a page. A redirect is not an extra content page.

Stop when newly inspected pages add no undisposed route or family. Record coverage boundaries, source conflicts, inaccessible routes and unsampled states. Public-only discovery cannot guarantee coverage of unlinked, unsitemapped pages. Do not call that complete project-tree discovery.

The bundled `scripts/discover-routes.mjs` collects bounded, same-origin **seeds** from robots, sitemap files and server-rendered anchors. Run it from the installed skill directory:

```sh
node scripts/discover-routes.mjs https://your-published-site.example --limit 100 > discovery.json
```

It uses GET only, does not execute JavaScript or submit controls, and does not treat the robots file as authorization. It can miss client-rendered links and must be followed by browser inspection. Examine its errors, truncation flag and non-HTML results. A 200 response may be a soft 404.

## Capability profile

Keep one compact record for each visible section and global layer:

| Field | Record |
| --- | --- |
| Landmark | Stable text, role, id, or visual order |
| Geometry | Flow height, container edges, overlap, clipping and z-order |
| Typography | Actual font file/family, weights, size, line height, tracking, wrapping |
| Assets | Source/local identity, intrinsic size, crop, masks, repeated layers |
| Variants | Structural, ordering, visibility and behavior changes by viewport |
| State | Controls, all reachable values, focus, close/reverse and timer behavior |
| Motion | Load, intersection, scroll progress, pointer, drag, time or state driver |
| Risk | Low for static flow; medium for local transitions/reordering; high for uncertain or layered/stateful behavior |
| Evidence | Captures, measured rectangles, timestamps/scroll landmarks, confidence and unknowns |

Use computed styles and observed input/output together. Generated classes and `data-framer-name` are hints; they can be unstable or attached to hidden responsive variants. Filter zero-size/hidden elements before measuring.

Inspect at least one desktop, tablet and phone size, then bracket any observed breakpoint. Suggested starting sizes are 1280x900, 810x1080 and 390x844 CSS pixels, adjusted to the reference and requested devices. Record actual `innerWidth`, `innerHeight`, device pixel ratio, reduced-motion setting and browser zoom after navigation.

## Select probes by capability

| Observed system | Capture and test |
| --- | --- |
| Static flow or grid | Section starts/heights, columns, gaps, typography, asset crop |
| Layered/sticky/pinned | Wrapper vs inner rectangles, sticky offsets, z-order, scroll-range and at least three progress samples |
| Carousel/tabs/filter | Every distinct state, next/previous, wraparound, hidden-state accessibility, manual vs autoplay timing |
| Menu/modal/overlay | Open, close, Escape, focus entry/return, scrolling lock, backdrop and stacking |
| Marquee/counter/timer | Initial, intermediate, full cycle, interval, pause/reset and reduced motion |
| Video/audio | Poster, autoplay/mute/loop, controls, playback, mobile policy and fallback |
| Pointer/drag/canvas/3D | Input path, frame/progress samples, touch/keyboard fallback, renderer/texture ownership |
| Forms or platform services | Validation, pending, unavailable/error/success, real backend boundary |

For an unfamiliar capability define a small evidence table with input, initial state, samples, output and acceptance criteria. Do not replace an unknown effect with a familiar carousel just because they look similar.
