# Assets and service boundaries

## Build an asset inventory

Inspect rendered `currentSrc`, `srcset`, CSS `url()` backgrounds/masks, inline and external SVG references, preload/font declarations, media sources/posters, iframes, canvas textures, and social metadata. Lazy sections need scrolling; hover or carousel states can reveal additional assets.

For each asset record source URL, local runtime URL, media role, byte count, content type, intrinsic size, responsive variant/crop and license/permission notes. Keep original source URLs in a **provenance record**, not in application runtime data. Original site links used for attribution are not remote visual dependencies.

Download only permitted public assets. Check HTTP status and bytes before writing them. A success response can contain an HTML error page. File suffix, MIME header and byte signature can disagree. Rename the local file to match its real encoding, preserve a map, and verify the served content type. Preserve third-party notices. Font access does not automatically allow redistribution.

Use descriptive local paths under `public/`. Account for spaces, case and URL encoding. Inspect dependencies within SVG/CSS as well as their parent files. Dedupe repeated originals without losing distinct crops. Preserve local social images and icon/font dependencies too.

Avoid storing a second archive of every unused source asset without a reason. Do not copy generated Framer scripts, tracking tags or runtime architecture. Use the live reference for evidence, and recreate application behavior in owned source code.

## Verify ownership in three layers

1. **Declared files:** audit the [asset manifest](manifest.md), local existence, non-empty bytes, served status and declared MIME.
2. **Runtime source:** inspect code/data/CSS/SVG for remaining hotlinks, copied Framer scripts and external dependencies. Exclude explicit provenance and the audit's own forbidden-host patterns from runtime claims. Static patterns can miss composed URLs and produce false positives.
3. **Browser:** visit every route and reachable state, including lazy media. Inspect rendered asset URLs and network requests. Check console/hydration errors, media playback, image decode, fonts and route-specific social assets.

The bundled `audit-site.mjs` checks **declared** assets and returned route HTML only. It is not a recursive code scanner, browser, or complete ownership proof. A browser network check remains required before claiming no Framer runtime dependency.

## Preserve service semantics honestly

| Capability | Standalone replacement and limit |
| --- | --- |
| CMS | Local typed content/data plus collection routes is a snapshot. Ongoing authoring, preview, sync and updates need a chosen CMS or editing workflow. |
| Contact/newsletter | Local validation alone must say no message/subscription was sent. Configure a real endpoint when requested; represent pending, error and success based on its response. |
| Authentication | A login-looking page does not supply identity/session/security behavior. Integrate an authorized provider if required. |
| Commerce | Product pages do not supply payments, tax, stock or fulfillment. Use a chosen integration and test only an authorized sandbox. |
| Localization | Inventory locale routes and alternate links. Distinguish translated content from actual locale switching/fallback behavior. |
| Search/filter | Specify the data source and supported dataset. A visual control must operate on real included content or disclose its limit. |
| Proprietary canvas/code component | Inspect public assets and inputs. Reimplement when feasible; otherwise document the specific deviation and fallback. |
| Analytics/embed | Retain only requested integrations and correct permissions. A third-party embed may remain a documented external dependency. |

Do not submit to the production reference. Use local fixtures or explicitly authorized sandbox endpoints when verifying delivery. Keep credentials server-side and out of screenshots/manifests. Do not deploy or publish the converted site as an incidental validation step.
