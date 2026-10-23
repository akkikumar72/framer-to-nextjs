# Validation record

Release preparation: **2026-10-23**. This document separates package checks, agent behavior and historical conversion evidence.

## Package checks

Local environment: macOS arm64, Node.js **22.22.3**, system Ruby **2.6.10**, Codex CLI **0.163.0**.

| Check | Observed result | Boundary |
| --- | --- | --- |
| System Ruby safe YAML validation | Passed for original and packaged skill | Static frontmatter and UI metadata only |
| `ruby scripts/validate-skill.rb` | Passed | Metadata, naming, linked local references and selected private-path/scaffold checks |
| `npm test` | 33 tests passed | Synthetic local fixtures; no packages installed |
| Fresh-path installation | Passed | Complete skill copied into repo-local `.agents/skills/framer-to-nextjs`; repeat install refused and preserved a user file |
| CLI help and example contract | Inspected | No assertion of a real converted application |

The 24 HTTP/asset tests exercise actual local GET responses and exit codes: soft 404s, initial redirect status/Location, title and marker isolation, destination versus source canonicals, document-relative canonicals, HTML content types, missing/empty/redirected/mismatched files, AVIF-versus-JPEG and PNG-versus-MP4 signatures, numeric/named HTML entities, hashes, traversal, symlink confinement, body limits and timeout handling.

The eight discovery tests exercise sitemap indexes, robots-declared/locale maps, nested links, document base URLs, external-base scope, real download attributes, redirects/cycles, query-state evidence, non-HTML targets, HTTP errors and request-budget truncation. The installer test verifies complete copying, helper startup through symlinks, packaged license notices and refusal to overwrite existing work.

These are lightweight HTML/XML and media-signature checks, not complete browser parsers or media decoders. They cannot certify discovery completeness, CSS visibility, hydration, visual fidelity, service delivery, licensing or all runtime dependencies.

## Fresh Codex behavior evaluation

The package was copied into a clean temporary Git workspace's `.agents/skills/framer-to-nextjs`. A fresh, ephemeral Codex CLI session discovered it through local skill metadata, identified its loaded path and used the skill. This was not merely an existing agent manually reading an explicit skill path.

The session received independently authored captured HTML, a sitemap and local probe records for an incomplete claimed migration. It correctly withheld completion and identified:

- Two discovered routes without local verification and a listing that may return homepage content.
- A missing path returning HTTP 200 and a canonical still pointing to the source host.
- A subscription success claim with no configured endpoint.
- Unaccounted media and a filename/MIME mismatch requiring byte/decode inspection.
- Missing responsive, interaction, motion and independent-runtime evidence.

The session made local reads only. It did not fetch a reference, submit forms, install dependencies, write application code or execute a live migration. This evaluation supports skill discovery and evidence-based handoff behavior, **not end-to-end conversion fidelity**.

## Marketplace handoff update

On **2026-10-23**, a new ephemeral Codex session discovered the revised skill installed in a temporary project's `.agents/skills/framer-to-nextjs` directory. It reviewed two synthetic captured migration requests using local reads only.

For paired Marketplace, remixed editor and published preview links, it distinguished each source's role, treated editor sign-in as a recorded access limit and kept whole-site scope despite an editor `?node=` selection. It mapped five discovered content paths under the requested `/roco` namespace, preserved the existing `/` and `/settings` routes and tracked HTTP 404 behavior separately. For the second request, it accepted a single authorized published URL and selected a standalone application with its homepage at `/`, without requiring a remix or editor login.

This checks handoff decisions and fresh-task skill discovery. No account remix, live Roco migration, browser comparison, implementation or deployment was performed. Private editor links and raw evaluation transcripts are not distributed.

## Standard installer checks

On **2026-10-23**, the public GitHub skill folder was installed into four isolated project directories using the pre-existing cached **Skills CLI 1.5.26** with explicit `codex`, `claude-code`, `cursor` and `opencode` agent targets. Each installation contained the same 12 files byte for byte, and both installed helpers printed their usage successfully. No npm packages were installed for validation.

The native Codex GitHub installer also succeeded with its default download method and an isolated destination, copied all 12 files and passed safe static validation. No user/global skill was overwritten. These are installer checks, not execution tests of the migration workflow in every host. The research sources, documented commands and version boundaries are in [INSTALLATION.md](INSTALLATION.md).

## Existing-project research

The repository audit inspected 21 converted/adapted sites and Showcase infrastructure. All 22 existing asset audits passed; the validator unit suite had nine passes and one directory-discovery failure. Production builds, full browser suites and live reference comparisons were not rerun across those apps.

The history review covered 29 relevant prior chats across 33 saved rollout segments, including resumed history and related standalone work. Some original sessions were unavailable. Current code evidence and historical claims remain separate in [LESSONS.md](LESSONS.md). Raw chats, private local paths and third-party template assets are not included in this repository.

## Remaining validation limits

No new complete live-template conversion was performed during this package release. Existing migrations supplied the lessons; fixture tests and a fresh-task scenario verified the new package's helpers and behavior. Other agent hosts, browsers and operating systems are not claimed as tested merely because the folder format is portable.

A new conversion must still run the skill's project-specific production, standalone, route, browser, responsive, motion and service checks. No universal one-shot or exact-parity guarantee follows from this release record.
