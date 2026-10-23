# Implementation and integration

## Choose the actual destination

A standalone migration means an application that can be installed, built and served independently with owned source and permitted assets. Default its homepage to `/`. A template-specific prefix, showcase, Turbo workspace and dedicated local port were useful for a template library; they are not requirements for another user's site.

Inspect existing repository instructions, status, package manager, framework version, app structure and available scripts before editing. Do not change framework versions or styling systems just to match a previous conversion. Check the official documentation for APIs used by the installed version.

Use a local content schema and shared route template for collection families. Enumerate the discovered slugs, preserve source slugs/case, and ensure unknown slugs produce the intended not-found result. Content snapshots must not be advertised as live CMS integrations.

## Build in dependency order

1. Local assets, font faces, tokens, container widths and breakpoints.
2. Root layout and metadata helpers, shell variants, navigation/footer and shared interaction primitives.
3. Distinct page families, data-driven detail templates and not-found handling.
4. Route-local states, services, motion and responsive changes.
5. Integration and the production verification loop.

Extract a shared component when rendered structure, behavior and responsive contracts repeat. Similar-looking components with different state or content requirements need not share an abstraction. Prefer server rendering for content and small client components for state. Avoid making the entire application a client component for one carousel.

For layered compositions, keep flow/sticky wrappers structural and transform a measured inner layer. Recreate background blur, inset sharp image, mask, crop and overscale as separate visual layers. Do not solve text layout with brittle absolute coordinates or hide content to force height agreement.

Keep editable copy, navigation, collections and theme tokens easy to locate. Supply a short editing guide, supported runtime/package-manager versions, lockfile, commands and environment example with names only when handing off a new standalone app.

Use accessible native controls where possible. Preserve keyboard operation, visible focus, labels, alt text and reduced motion. Timers, listeners and observers need cleanup. Pause expensive canvas, media and continuous work when offscreen or the document is hidden when that preserves the observed experience. Keep acquisition/provenance manifests out of client bundles; expose only the compact runtime data they need. Reduced motion should leave the content and controls usable; it must not leave reveal content permanently hidden. Keep server-rendered/no-JavaScript content readable and complete a reveal when keyboard focus enters it.

## Not-found and metadata

Implement the custom not-found design, test an invalid collection slug and a guaranteed-missing path, and distinguish a source `/404` demonstration page from unknown-route behavior. It is possible for a branded error design to return HTTP 200. Do not accept that as proof of a correct local 404.

Next.js streaming can commit HTTP 200 before a later `notFound()` renders. Check the actual response in the chosen runtime and arrange known slug validation before streaming when a 404 status is required. Confirm the UI after hydration too. See the installed version's [not-found convention](https://nextjs.org/docs/app/api-reference/file-conventions/not-found).

Preserve observed titles, descriptions and social images while adapting canonical ownership to the destination. Keep a configurable production origin and local canonical paths. Do not accidentally point the new site's canonicals back to the Framer original or a different template. Test exact titles when content is stable, rather than a generic substring appearing on every page.

## Deployment modes

| Mode | Meaning and required checks |
| --- | --- |
| Normal Next.js server | Build then run the production server. Supports configured server features; verify actual endpoints and environment. |
| Next.js `output: 'standalone'` | A packaged Node server deployment. It is not an HTML export. Include the runtime's required static/public files and verify the packaged server. |
| Next.js `output: 'export'` | Static files. Enumerate dynamic routes at build time; choose compatible image handling and externalize required services. Server actions, request-dependent handlers and Next server redirects do not work as a static-only backend. Verify host routing and real 404 responses. |

Do not enable static export solely because the user said "standalone website." Use [official static export guidance](https://nextjs.org/docs/app/guides/static-exports) for the installed version and deployment needs.

## Prove standalone ownership

Copy or export only the intended application into a clean temporary directory, install from its own manifest/lockfile, then run its checks, build and production server without the original monorepo. Resolve workspace-only packages, sibling imports and validator scripts. Do not advertise a copied-folder export until it works without parent directories or an inherited node_modules. Record remaining permitted external services and verify no runtime request needs Framer. Keep this check proportional to the requested destination; an intentionally integrated workspace can remain integrated when the user asked for that.

## Optional parallel work

Delegate only if the host supports it and the current instructions authorize it. One owner controls reconnaissance, shared styles/components, asset names, dependencies, metadata, integration and final verification. Assign disjoint page families or route-local files. Provide exact reference/local routes, asset maps, shell APIs, viewports, contracts and acceptance evidence. Workers report missing shared primitives rather than duplicating them.

Keep generated-type checks and builds sequential if one replaces the other's artifacts. Detect apps through real package/contract files instead of assuming every directory is an app or hard-coding application counts. For an existing monorepo, update the app contract, gallery/redirects, environment examples, task graph, lockfile, checks and documentation together when they are part of the user's scope.
