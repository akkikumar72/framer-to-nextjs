# Framer to Next.js

**An open-source agent skill for rebuilding Framer sites as standalone Next.js applications you can own, edit and host.**

Give your coding agent a published Framer URL. The skill guides it through route discovery, responsive and interaction inspection, permitted asset localization, maintainable implementation, and production verification.

Built from lessons across **21 converted sites** in the [Framer template workspace](https://github.com/akkikumar72/framer-slate-nextjs). The workflow is reusable; the original templates and their assets are not included or relicensed here.

> One prompt launches the workflow. This is an agent skill, not a lossless Framer source exporter or a guarantee that every template can be converted exactly in one attempt. Inaccessible pages and proprietary services can require additional input or replacements.

## Install in Codex

Requirements: Codex with local skill support; Node.js 22+ for the optional helpers; a supported browser inspection tool for visual verification. No npm dependencies or API keys are required by this package. Your coding agent and the generated application have their own requirements.

```sh
git clone https://github.com/akkikumar72/framer-to-nextjs.git
cd framer-to-nextjs
node scripts/install.mjs
```

The installer copies the complete skill to `~/.agents/skills/framer-to-nextjs`. It refuses to overwrite an existing destination. Start a fresh Codex task; restart Codex if the skill is not listed.

To install for one project instead:

```sh
node scripts/install.mjs --to /absolute/path/to/your-project/.agents/skills/framer-to-nextjs
```

You can also ask Codex's built-in installer:

```text
$skill-installer install the skill at skills/framer-to-nextjs from https://github.com/akkikumar72/framer-to-nextjs
```

The package uses the standard `SKILL.md` folder layout. For another agent host, copy `skills/framer-to-nextjs` into that host's documented skills directory. Other hosts are not claimed as tested. Browser tooling and delegation adapt to capabilities actually available; no companion skills or MCP servers are mandatory.

## Use it

Open your destination project in Codex and send:

```text
Use $framer-to-nextjs to rebuild https://your-template.framer.website
as a standalone Next.js application in ./my-site.

I am authorized to use this template. Discover all project-owned routes,
including collection details and the custom 404. Localize permitted assets,
preserve responsive layouts, interactions and motion, and verify the production
build at desktop, tablet and phone sizes. Report remaining differences and
service replacements. Do not deploy.
```

You can narrow the request to one named page or supply a different destination, framework version, viewport, CMS or form integration. A standalone site's homepage defaults to `/`; a template library namespace is optional.

## What it does

1. **Discovers scope.** Reconciles project access, sitemaps, rendered links, collection slugs, redirects and the not-found experience.
2. **Records the design.** Captures section geometry, assets, responsive variants, interaction states and motion drivers.
3. **Builds owned code.** Uses shared components and data-driven routes with local permitted assets, without shipping Framer's runtime.
4. **Checks the result.** Runs production checks and matches reference/local viewports, states, motion phases and measured deltas.
5. **Hands off honestly.** Reports route coverage, evidence, remaining differences and service boundaries.

Forms, CMS authoring/sync, authentication, commerce and proprietary effects need explicit replacement contracts. Local validation must not pretend a message was delivered. A successful build or HTTP check does not prove visual fidelity. Public-only discovery cannot guarantee finding unlinked, unsitemapped or private pages.

## Included helpers

The helpers use Node built-ins, perform GET requests only, and do not deploy or submit forms.

```sh
# Discovery seeds. Reconcile them in a browser before freezing scope.
node skills/framer-to-nextjs/scripts/discover-routes.mjs \
  https://your-template.framer.website --limit 100 > discovery.json

# Declared route, redirect, 404, metadata and local asset checks.
node skills/framer-to-nextjs/scripts/audit-site.mjs \
  --base http://127.0.0.1:3000 \
  --manifest ./docs/site-manifest.json --public ./public --json
```

Start from [the example manifest](examples/site-manifest.json) and read [its contract and limits](skills/framer-to-nextjs/references/manifest.md). The example uses synthetic paths; adapt them to your own site. A passing declaration cannot prove an omitted route or an unobserved browser state.

## Workflow and lessons

- [Skill entrypoint](skills/framer-to-nextjs/SKILL.md)
- [Discovery and capability recognition](skills/framer-to-nextjs/references/discovery.md)
- [Assets and service boundaries](skills/framer-to-nextjs/references/assets-and-services.md)
- [Implementation and standalone ownership](skills/framer-to-nextjs/references/implementation.md)
- [Verification and acceptance](skills/framer-to-nextjs/references/verification.md)
- [Lessons from all 21 sites](docs/LESSONS.md)
- [Validation performed and remaining limits](docs/VALIDATION.md)

## Contribute

```sh
# No dependency installation is needed.
npm run check
```

Static validation uses the system Ruby YAML parser without downloads or optional native extensions. Tests use Node's built-in runner and local HTTP fixtures. The checks distinguish passing contracts from browser/visual evidence. See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution scope and regression reports.

## License and attribution

[MIT](LICENSE) covers the original skill, documentation and helper code. The bundled HTML entity data retains its [Python license and attribution](skills/framer-to-nextjs/THIRD_PARTY_NOTICES.md). Third-party templates, fonts, images, copy and trademarks retain their own rights. Use material you are authorized to migrate and preserve required attribution. This project is independent of Framer, Next.js, Vercel and OpenAI.

Installation guidance was checked against [official Codex skill documentation](https://learn.chatgpt.com/docs/build-skills). Framework-specific guidance links to official Next.js documentation and should be checked against the destination's installed version.
