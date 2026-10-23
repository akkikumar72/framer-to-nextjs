# Route and asset contract

The contract is a small executable subset of the larger discovery/capability/acceptance ledgers. It does not replace those ledgers. Author it from evidence; do not mechanically turn every discovery candidate into a passing route.

## Schema

```json
{
  "version": 1,
  "productionOrigin": "https://owned.example",
  "routes": [
    {
      "path": "/",
      "kind": "page",
      "status": 200,
      "title": "Example Studio",
      "marker": "Independent creative work",
      "canonical": "/"
    },
    {
      "path": "/old",
      "kind": "redirect",
      "status": 308,
      "location": "/journal/first-post"
    },
    {
      "path": "/definitely-missing",
      "kind": "not-found",
      "status": 404,
      "marker": "Page not found"
    }
  ],
  "assets": [
    {
      "url": "/assets/mark.svg",
      "file": "assets/mark.svg",
      "mime": "image/svg+xml"
    }
  ]
}
```

- `version` must be `1`. Include at least one `page` and one `not-found` contract. Enumerate **every** required collection slug and static route. Add invalid slugs and a guaranteed-missing path as explicit `not-found` entries.
- `path` is a unique, same-origin root-relative path, without query or hash. Preserve meaningful case/trailing slash. No protocol-relative paths, credentials or traversal. Query-driven UI variants belong in the browser state ledger.
- `kind` is `page`, `redirect` or `not-found`. Pages use status 200; not-found uses 404; redirects use 301, 302, 303, 307 or 308 and require `location`.
- `title`, `marker` and `canonical` are optional assertions for returned HTML. Use them on content routes to prevent status-only false positives. `title` is exact after numeric and semicolon-terminated HTML named-character decoding and whitespace normalization. `marker` is body text after excluding head/script/style/template content. A hidden CSS element can still match; verify visibility in a browser. The bundled named-character lookup is generated from the standard HTML5 entity definitions available in Python's standard library at authoring time; users need only Node. This is not a full parser for malformed HTML or semicolonless references.
- `productionOrigin` is an optional HTTP(S) origin with no path, credentials, query or fragment. Relative `canonical` values resolve against it, or against `--base` when omitted. This lets localhost checks assert the intended production owner. An absolute canonical is checked as written. An observed relative canonical resolves against the actual requested page URL; with a production origin configured, publish absolute canonicals for that origin.
- `location` is the expected redirect target, root-relative or HTTP(S). The helper checks the initial status and exact `Location` header as declared, without following it.
- `assets` declares runtime files. `url` is a local same-origin root-relative URL. `file` is relative to `--public`, such as `assets/mark.svg`, without traversal. Symlinks escaping public are rejected. `mime` is the expected served type, ignoring header parameters. Optional `sha256` is a 64-character hexadecimal digest of the local and served file.

Keep source URLs, licenses/permission, original names, source MIME, intrinsic dimensions, crops and acquisition history in a separate provenance inventory. Do not erase provenance to obtain a zero-hotlink result. Do not place secrets in either file.

## Run the checker

Use the absolute installed script path if your current directory is the target app:

```sh
node /path/to/framer-to-nextjs/scripts/audit-site.mjs \
  --base http://127.0.0.1:3000 \
  --manifest ./docs/site-manifest.json \
  --public ./public \
  --json
```

`--public` is required when declaring assets. The helper performs read-only GET requests to the base origin, checks declared status/HTML/redirect assertions and local-versus-served asset content, and reports failures. Exit 0 means these declarations passed, 1 means an observed contract failed, and 2 means invalid input/schema or arguments. It does not start a server or submit forms.

The helper also checks common media signatures and detects known Framer runtime/asset hosts in supported asset-bearing HTML contexts. It cannot discover all composed URLs, CSS imports, nested SVG dependencies, lazy content or scripts that load assets later. Audit code and browser runtime requests separately. Hash matching proves file equality, not permission or visual identity.

A passing manifest cannot prove routes missing from the manifest, correct CSS visibility, post-hydration behavior, accessibility, link completeness, service delivery or visual/motion parity. Record those as separate acceptance rows.
