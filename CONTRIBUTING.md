# Contributing

Keep the skill portable and evidence-based. A change should prevent a demonstrated failure or improve a real migration decision, without prescribing one template's layout to everyone.

1. Describe the reference capability, expected behavior, observed failure and tool/framework versions. Include only URLs and assets you may share.
2. Update the smallest relevant instruction/reference. Keep `SKILL.md` concise and make tools/parallel work optional.
3. Add a fixture test when changing a helper's observable behavior. Do not add tests that merely assert prose wording.
4. Run `npm run check`. It needs Node.js 22+ and system Ruby, with no package installation. Do not install validation dependencies, strip quarantine or bypass platform protections.
5. For workflow changes, run a fresh-task evaluation using the installed skill and raw permitted artifacts. Distinguish missing verification from failures. Record what actually ran.

Do not commit credentials, private chat transcripts, local home paths, generated caches, copied Framer runtime, paid templates, third-party artwork or unsupported fidelity claims. Keep provenance separate from runtime dependencies. A new helper should report its coverage limits and fail clearly on invalid input.
