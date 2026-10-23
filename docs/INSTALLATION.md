# Installation and distribution

The payload is an [Agent Skills](https://agentskills.io/specification) folder: `SKILL.md`, references, scripts, notices and optional host metadata. It has no npm runtime dependencies or API credentials. The install client is separate from the generated Next.js application's dependencies.

## One command

From the destination project:

```sh
npx --yes skills add akkikumar72/framer-to-nextjs --skill framer-to-nextjs --agent codex --yes
```

The [Skills CLI](https://github.com/vercel-labs/skills) fetches the skill from GitHub. The first `--yes` accepts npx's package prompt; the last skips the skill installer's selection prompts. Node.js 22.20+ and npm are required. Existing installations may be replaced by a confirmed install, so review local modifications before reinstalling.

| Agent | `--agent` value |
| --- | --- |
| Codex | `codex` |
| Claude Code | `claude-code` |
| Cursor | `cursor` |
| OpenCode | `opencode` |

Installation is project-local by default. Add `--global` for user-level scope, or omit the agent/confirmation flags to choose interactively. Follow the [CLI command reference](https://github.com/vercel-labs/skills/blob/main/docs/commands.md) for current behavior. No separate clone, build, npm publication or skills.sh registration is necessary. Installation resolves the GitHub source directly.

## Install from Codex chat

Codex includes a skill installer. Paste:

```text
$skill-installer install https://github.com/akkikumar72/framer-to-nextjs/tree/main/skills/framer-to-nextjs
```

This installs from the repository's skill folder. It does not require the Skills CLI. The built-in installer refuses an existing destination; preserve local changes before replacing an installation. See [official Codex skill guidance](https://learn.chatgpt.com/docs/build-skills) and the [upstream installer](https://github.com/openai/skills/tree/main/skills/.system/skill-installer).

Use the skill on your next request. If the host has not discovered it, start a new chat or reload. A browser inspection tool and terminal/file access must already be available in the agent host. The skill adapts to those capabilities and reports missing visual verification when browser access is absent.

## Update

For Skills CLI-managed project installations:

```sh
npx skills update framer-to-nextjs
```

Use the install client's documented scope options for global installs. For a manual or native-installer copy, back up any edits before replacing the folder. Do not maintain multiple differently modified copies with the same skill name unless the host's precedence is intentional.

The Markdown entrypoint alone is not the complete package. Keep its references, helper scripts, HTML entity data, license and notices together. The existing [manual copy installer](../scripts/install.mjs) remains available and refuses overwrites.

## What inspired this setup

Research checked on **2026-10-23**. These are source/documentation comparisons, not endorsements or execution tests of third-party cloning workflows.

| Source | Useful pattern applied here |
| --- | --- |
| [Vercel Skills CLI](https://github.com/vercel-labs/skills) | One GitHub command, explicit agent selection, project scope and update support instead of a custom package manager |
| [Anthropic's skills](https://github.com/anthropics/skills) | Self-contained standard folders; detailed resources loaded only when needed |
| [OpenAI's skill installer](https://github.com/openai/skills/tree/main/skills/.system/skill-installer) | A native chat request can install a complete GitHub skill folder |
| [clone-any-website](https://github.com/braxtonROSE4/clone-any-website) | A short install/use path is valuable; its documented mandatory browser runtime is not a requirement of this skill |
| [site-cloner](https://github.com/CodeCompleteMedia/site-cloner) | Separating deterministic extraction/checks from agent implementation is useful; our optional helpers remain dependency-free |

Editor-specific plugin marketplaces are another distribution option. This repository currently supplies a portable skill, not a claim of listing or approval in any plugin directory.

## What was verified

The public GitHub folder was installed into four separate temporary projects using the already-cached **Skills CLI 1.5.26**. All four agent targets above received the same **12 files**, byte for byte, and both installed helpers started. Codex's native installer was also tested in its default download mode with an isolated destination and copied all 12 files successfully.

No new npm packages were downloaded for these checks, and no user/global installation was replaced. npm metadata reported **1.7.4** as the current Skills CLI release during research; it was not installed or runtime-tested here. The recommended command and flags were checked against current upstream documentation. These checks establish package installation and helper startup, not live migration execution in Claude Code, Cursor or OpenCode. Existing Codex fresh-session behavior checks are recorded in [VALIDATION.md](VALIDATION.md).
