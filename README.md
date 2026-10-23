# Framer to Next.js

[![Install via skills.sh](https://skills.sh/b/akkikumar72/framer-to-nextjs)](https://skills.sh/akkikumar72/framer-to-nextjs)

**Turn a Framer template into Next.js code you can own, edit and host.**

Install the skill, then give your coding agent a Framer project URL and published preview. It handles route discovery, responsive and interaction inspection, permitted local assets, maintainable implementation and production verification. A single published URL is also supported.

Built from lessons across **21 converted sites** in the [Framer template workspace](https://github.com/akkikumar72/framer-slate-nextjs). The workflow is reusable; the original templates and their assets are not included or relicensed here.

> One prompt launches the workflow. This is an agent skill, not a lossless Framer source exporter or a guarantee that every template can be converted exactly in one attempt. Inaccessible pages and proprietary services can require additional input or replacements.

## Install

Run this from your destination project for Codex:

```sh
npx --yes skills add akkikumar72/framer-to-nextjs --skill framer-to-nextjs --agent codex --yes
```

This installs the complete skill for that project, without cloning this repository yourself or running `npm install`. It requires Node.js **22.20+** and npm. For Claude Code, Cursor or OpenCode, replace `codex` with `claude-code`, `cursor` or `opencode`. Omit `--agent codex --yes` to choose your agent interactively. Add `--global` if you want a user-level installation across projects.

**Prefer a chat-only install in Codex?** Paste this into Codex:

```text
$skill-installer install https://github.com/akkikumar72/framer-to-nextjs/tree/main/skills/framer-to-nextjs
```

No Framer API key, paid migration service, companion skill or specific MCP server is required. Your coding agent still needs browser inspection and terminal/file tools; building the generated Next.js app needs its normal Node.js toolchain. Ask the agent to use `framer-to-nextjs` after installation. If it does not discover the skill, start a new chat or reload the host.

Installation works directly from GitHub; a skills.sh listing or separate registry signup is not required. Both installation paths copy the full standard `SKILL.md` folder, including its references and helpers. Copying the Markdown entrypoint alone loses those files. See [installation details, updates and the research behind this setup](docs/INSTALLATION.md).

<details>
<summary>Manual installation without the Skills CLI</summary>

```sh
git clone https://github.com/akkikumar72/framer-to-nextjs.git
cd framer-to-nextjs
node scripts/install.mjs
```

This dependency-free helper copies the skill to `~/.agents/skills/framer-to-nextjs` and refuses to overwrite an existing destination. For a project-local installation:

```sh
node scripts/install.mjs --to /absolute/path/to/your-project/.agents/skills/framer-to-nextjs
```

The manual helper and bundled checks need Node.js 22+. Ruby is only needed for contributor validation, not ordinary skill use.

</details>

## Choose and remix a template

1. Browse [free Framer Marketplace templates](https://www.framer.com/marketplace/templates/?pricing=free).
2. Choose a template and click **Remix for free**. Open the copied project in your Framer dashboard or workspace.
3. Copy your **remixed project/editor URL** and the template's **published preview URL**. The Marketplace listing is optional provenance.
4. Open your destination project in Codex and use one of the prompts below.

The project URL helps inspect the page tree, CMS, components and variants when authorized access is available. The published preview supplies the rendered visual and behavior reference. A `?node=...` selection in the editor URL does not narrow a whole-site request. If the editor is inaccessible or requires an unavailable login, the agent continues from public evidence and reports discovery limits.

The prompts below assume you have already remixed the template. Supplying these URLs does not authorize the agent to remix, edit or publish your Framer project. Free access does not automatically permit redistribution of template assets or code.

## Use it

A short prompt is enough; the installed skill contains the detailed workflow:

```text
Use $framer-to-nextjs.
Framer project: <paste your remixed project URL>
Published preview: <paste the template's public preview URL>
Build a standalone Next.js app in ./my-site. Do not deploy.
```

For an existing app, replace the final line with: `Add all template pages under /roco in our existing Next.js app. Preserve unrelated work. Do not deploy.` A project URL is optional when only the published reference is available. In another agent, mention the skill by name using that host's invocation syntax.

<details>
<summary>Full prompt examples for standalone and existing apps</summary>

**Standalone Next.js app, homepage at `/`:**

```text
Use $framer-to-nextjs to rebuild this Framer template as a standalone
Next.js application in ./my-site, with its homepage at /.

Remixed project/editor URL: <paste your copied Framer project URL>
Published template preview URL: https://your-template.framer.website/

I am authorized to use this template. Discover all project-owned routes,
including collection details and the custom 404. Localize permitted assets,
preserve responsive layouts, interactions and motion, and verify the production
build at desktop, tablet and phone sizes. Report remaining differences and
service replacements. Do not deploy.
```

**Existing-app mode, all template pages under `/roco`:**

```text
Use $framer-to-nextjs to add this template to our existing Next.js app.
Put its homepage at /roco and all its other pages under /roco.

Remixed project/editor URL: <paste your copied Framer project URL>
Published template preview URL: https://roco.framer.website/

I am authorized to use this template. Discover all project-owned routes,
including collection details and the custom 404. Preserve unrelated routes
and existing work. Localize permitted assets, preserve responsive layouts,
interactions and motion, and verify the production build at desktop, tablet
and phone sizes. Report route mappings, remaining differences and service
replacements. Do not deploy.
```

</details>

The Roco URL is an example, not a claim of current verification. Parallel work is optional: add `Use $spin-goal to split independent page families across agents` only when that companion skill and delegation are available. Single-agent execution works too.

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
