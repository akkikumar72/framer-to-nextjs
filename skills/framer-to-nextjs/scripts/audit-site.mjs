#!/usr/bin/env node
/** HTTP and declared-file checks. This is not a browser or a fidelity score. */
import { createHash } from 'node:crypto';
import { readFile, realpath, stat } from 'node:fs/promises';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

export const DEFAULT_TIMEOUT_MS = 10_000;
export const DEFAULT_MAX_BODY_BYTES = 32 * 1024 * 1024;

export class ContractInputError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ContractInputError';
  }
}

function requireInput(condition, message) {
  if (!condition) throw new ContractInputError(message);
}

function object(value, label) {
  requireInput(value !== null && typeof value === 'object' && !Array.isArray(value), `${label} must be an object`);
}

function keys(value, allowed, label) {
  for (const key of Object.keys(value)) requireInput(allowed.includes(key), `${label}: unknown field ${key}`);
}

function optionalString(value, key, label) {
  if (Object.hasOwn(value, key)) requireInput(typeof value[key] === 'string' && value[key].trim().length > 0, `${label}.${key} must be a nonempty string`);
}

/** Validate before URL parsing, which would otherwise silently remove dot segments. */
export function validatePath(value, label = 'path', publicFile = false) {
  requireInput(typeof value === 'string' && value.length > 0, `${label} must be a nonempty string`);
  requireInput(!/[\\\u0000-\u0020\u007f?#]/u.test(value), `${label} must not contain backslashes, controls, whitespace, query or hash`);
  requireInput(publicFile ? !value.startsWith('/') && !isAbsolute(value) && !/^[a-z]:/iu.test(value) : value.startsWith('/') && !value.startsWith('//'), `${label} must be ${publicFile ? 'public-relative' : 'same-origin root-relative'}`);
  // Validate the original encoding once; later passes must preserve a decoded literal percent.
  try { decodeURIComponent(value); } catch { throw new ContractInputError(`${label} contains invalid percent encoding`); }
  let decoded = value;
  for (let pass = 0; pass < 8; pass += 1) {
    requireInput(!decoded.includes('\\') && !/[\u0000-\u001f\u007f]/u.test(decoded), `${label} contains an unsafe encoded character`);
    requireInput(!decoded.split('/').some((part) => part === '.' || part === '..'), `${label} contains traversal`);
    requireInput(!decoded.startsWith('//'), `${label} must not start with //`);
    // Encoded separators make the filesystem/server interpretation ambiguous.
    requireInput(!/%(?:2f|5c)/iu.test(decoded), `${label} contains an encoded separator`);
    if (!/%[a-f0-9]{2}/iu.test(decoded)) return decoded;
    let next;
    try { next = decodeURIComponent(decoded.replace(/%(?![a-f0-9]{2})/giu, '%25')); } catch { throw new ContractInputError(`${label} contains invalid nested percent encoding`); }
    if (next === decoded) return decoded;
    decoded = next;
  }
  throw new ContractInputError(`${label} has excessive nested encoding`);
}

function httpUrl(value, label, originOnly = false) {
  requireInput(typeof value === 'string' && /^https?:\/\//iu.test(value) && !/[\\\u0000-\u0020\u007f]/u.test(value), `${label} must be an HTTP(S) URL`);
  let url;
  try { url = new URL(value); } catch { throw new ContractInputError(`${label} must be an HTTP(S) URL`); }
  requireInput(['http:', 'https:'].includes(url.protocol) && !url.username && !url.password, `${label} must be HTTP(S) without credentials`);
  if (originOnly) requireInput(url.pathname === '/' && !url.search && !url.hash, `${label} must contain only an origin`);
  return url;
}

function referenceUrl(value, label) {
  if (value.startsWith('/')) {
    requireInput(!value.startsWith('//') && !value.includes('\\') && !/[\u0000-\u0020\u007f]/u.test(value), `${label} must be root-relative without credentials or controls`);
    // Location and canonical may contain legitimate query state; validate the pathname separately.
    validatePath(value.split(/[?#]/u)[0], label);
  } else {
    httpUrl(value, label);
    const rawPath = value.match(/^[a-z][a-z0-9+.-]*:\/\/[^/?#]*(\/[^?#]*)?/iu)?.[1] ?? '/';
    validatePath(rawPath, label);
  }
}

export function validateManifest(manifest) {
  object(manifest, 'manifest');
  keys(manifest, ['version', 'productionOrigin', 'routes', 'assets'], 'manifest');
  requireInput(manifest.version === 1, 'manifest.version must be 1');
  if (Object.hasOwn(manifest, 'productionOrigin')) httpUrl(manifest.productionOrigin, 'productionOrigin', true);
  requireInput(Array.isArray(manifest.routes) && manifest.routes.length > 0, 'manifest.routes must be a nonempty array');
  requireInput(Array.isArray(manifest.assets), 'manifest.assets must be an array');
  const routePaths = new Set();
  for (const [index, route] of manifest.routes.entries()) {
    const label = `routes[${index}]`;
    object(route, label);
    keys(route, ['path', 'kind', 'status', 'title', 'marker', 'canonical', 'location'], label);
    const identity = validatePath(route.path, `${label}.path`);
    requireInput(!routePaths.has(identity), `${label}: duplicate route path ${route.path}`);
    routePaths.add(identity);
    requireInput(['page', 'redirect', 'not-found'].includes(route.kind), `${label}.kind is invalid`);
    requireInput(Number.isInteger(route.status), `${label}.status must be an integer`);
    requireInput(route.kind === 'page' ? route.status === 200 : route.kind === 'not-found' ? route.status === 404 : [301, 302, 303, 307, 308].includes(route.status), `${label}: status is invalid for ${route.kind}`);
    for (const field of ['title', 'marker', 'canonical', 'location']) optionalString(route, field, label);
    if (route.kind === 'redirect') requireInput(typeof route.location === 'string', `${label}: redirect requires location`);
    if (Object.hasOwn(route, 'location')) {
      requireInput(route.kind === 'redirect', `${label}: only redirects can declare location`);
      referenceUrl(route.location, `${label}.location`);
    }
    if (Object.hasOwn(route, 'canonical')) referenceUrl(route.canonical, `${label}.canonical`);
  }
  requireInput(manifest.routes.some((route) => route.kind === 'page'), 'manifest must contain at least one page contract');
  requireInput(manifest.routes.some((route) => route.kind === 'not-found'), 'manifest must contain at least one not-found contract');
  const assetUrls = new Set();
  const assetFiles = new Set();
  for (const [index, asset] of manifest.assets.entries()) {
    const label = `assets[${index}]`;
    object(asset, label);
    keys(asset, ['url', 'file', 'mime', 'sha256'], label);
    const identity = validatePath(asset.url, `${label}.url`);
    const file = validatePath(asset.file, `${label}.file`, true);
    requireInput(!assetUrls.has(identity), `${label}: duplicate asset URL ${asset.url}`);
    requireInput(!assetFiles.has(file), `${label}: duplicate asset file ${asset.file}`);
    assetUrls.add(identity);
    assetFiles.add(file);
    requireInput(typeof asset.mime === 'string' && /^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+$/iu.test(asset.mime), `${label}.mime must be a MIME type without parameters`);
    if (Object.hasOwn(asset, 'sha256')) requireInput(typeof asset.sha256 === 'string' && /^[a-f0-9]{64}$/iu.test(asset.sha256), `${label}.sha256 must be 64 hexadecimal characters`);
  }
  return manifest;
}

function hash(bytes) { return createHash('sha256').update(bytes).digest('hex'); }
function mime(value) { return String(value ?? '').split(';', 1)[0].trim().toLowerCase(); }

export async function request(url, { timeoutMs = DEFAULT_TIMEOUT_MS, maxBodyBytes = DEFAULT_MAX_BODY_BYTES } = {}) {
  const response = await fetch(url, { method: 'GET', redirect: 'manual', signal: AbortSignal.timeout(timeoutMs) });
  const length = response.headers.get('content-length');
  if (length !== null && Number(length) > maxBodyBytes) {
    await response.body?.cancel();
    throw new Error(`response exceeds ${maxBodyBytes} byte body limit`);
  }
  const chunks = [];
  let size = 0;
  if (response.body) {
    const reader = response.body.getReader();
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > maxBodyBytes) {
          await reader.cancel();
          throw new Error(`response exceeds ${maxBodyBytes} byte body limit`);
        }
        chunks.push(Buffer.from(value));
      }
    } finally { reader.releaseLock(); }
  }
  return { status: response.status, headers: response.headers, bytes: Buffer.concat(chunks) };
}

const ENTITIES = Object.freeze(JSON.parse(await readFile(new URL('./html-entities.json', import.meta.url), 'utf8')));
export function decodeHtml(value) {
  return String(value).replace(/&(#(?:[xX][0-9a-fA-F]+|\d+)|[a-zA-Z][a-zA-Z0-9]*);/gu, (whole, entity) => {
    if (entity.startsWith('#')) {
      const point = entity[1]?.toLowerCase() === 'x' ? Number.parseInt(entity.slice(2), 16) : Number.parseInt(entity.slice(1), 10);
      return point > 0 && point <= 0x10ffff && !(point >= 0xd800 && point <= 0xdfff) ? String.fromCodePoint(point) : '\ufffd';
    }
    return Object.hasOwn(ENTITIES, entity) ? ENTITIES[entity] : whole;
  });
}
function text(value) { return decodeHtml(value).replace(/\s+/gu, ' ').trim(); }
function withoutComments(html) { return html.replace(/<!--[\s\S]*?-->/gu, ''); }
function stripElements(html, names) {
  for (const name of names) {
    if (name === 'script' || name === 'style') {
      // HTML raw-text elements end at their first closing tag, even inside a JS/CSS string.
      html = html.replace(new RegExp(`<${name}\\b[^>]*>[\\s\\S]*?(?:<\\/${name}\\s*>|$)`, 'giu'), ' ');
      continue;
    }
    const tags = new RegExp(`<\\/?${name}\\b(?:[^"'<>]|"[^"]*"|'[^']*')*>`, 'giu');
    let depth = 0;
    let cursor = 0;
    let output = '';
    for (const match of html.matchAll(tags)) {
      const closing = match[0].startsWith('</');
      if (!closing) {
        if (depth === 0) output += html.slice(cursor, match.index) + ' ';
        depth += 1;
      } else if (depth > 0) {
        depth -= 1;
        if (depth === 0) cursor = match.index + match[0].length;
      }
    }
    html = output + (depth === 0 ? html.slice(cursor) : '');
  }
  return html;
}
function attributes(source) {
  const result = {};
  for (const match of source.matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/gu)) {
    const name = match[1].toLowerCase();
    if (!Object.hasOwn(result, name)) result[name] = decodeHtml(match[2] ?? match[3] ?? match[4] ?? '');
  }
  return result;
}

export function inspectHtml(html) {
  const metadata = stripElements(withoutComments(html), ['script', 'style', 'template']);
  const titles = [...metadata.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/giu)].map((match) => text(match[1]));
  const canonicals = [];
  for (const match of metadata.matchAll(/<link\b([^>]*?)>/giu)) {
    const attrs = attributes(match[1]);
    if (attrs.rel?.toLowerCase().split(/\s+/u).includes('canonical')) canonicals.push(attrs.href ?? '');
  }
  const body = stripElements(metadata, ['head']).replace(/<[^>]*>/gu, ' ');
  return { titles, canonicals, bodyText: text(body) };
}

/** Static asset-bearing references only. Normal <a href> attribution is intentionally ignored. */
export function findFramerDependencies(html, base) {
  const result = new Set();
  const record = (value) => {
    if (!value || /^(?:data|blob):/iu.test(value)) return;
    try {
      const url = new URL(value, base);
      if (['framerusercontent.com', 'framerstatic.com', 'framer.com'].some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`))) result.add(url.href);
    } catch { /* Unparseable observed markup is not evidence of a specific dependency. */ }
  };
  let safe = withoutComments(html).replace(/(<script\b[^>]*>)[\s\S]*?(?:<\/script\s*>|$)/giu, '$1</script>');
  safe = stripElements(safe, ['template']);
  const cssParts = [...safe.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style\s*>/giu)].map((match) => match[1]);
  safe = stripElements(safe, ['style']);
  for (const match of safe.matchAll(/<([a-z][\w:-]*)\b([^>]*?)>/giu)) {
    const tag = match[1].toLowerCase();
    const attrs = attributes(match[2]);
    if (['img', 'script', 'iframe', 'video', 'audio', 'source', 'track', 'input', 'embed'].includes(tag)) record(attrs.src);
    if (tag === 'video') record(attrs.poster);
    if (['img', 'source'].includes(tag) && attrs.srcset) {
      for (const candidate of attrs.srcset.split(',')) record(candidate.trim().split(/\s+/u)[0]);
    }
    if (tag === 'link' && attrs.rel?.toLowerCase().split(/\s+/u).includes('stylesheet')) record(attrs.href);
    if (attrs.style) cssParts.push(attrs.style);
  }
  for (const css of cssParts) {
    for (const match of css.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^\s)]+))\s*\)/giu)) record(match[1] ?? match[2] ?? match[3]);
  }
  return [...result];
}

/** Deliberately narrow signature checks, not a full media decoder. */
export function inspectAssetBytes(bytes, expectedMime) {
  if (bytes.length === 0) return 'asset is empty';
  const expected = mime(expectedMime);
  const prefix = bytes.subarray(0, 2048).toString('utf8').replace(/^\uFEFF/u, '').trimStart();
  if (/^(?:<!doctype\s+html\b|<html\b|<head\b|<body\b|<(?:h1|div|p)\b)/iu.test(prefix)) return 'asset contains an HTML document or error fragment';
  let detected;
  if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) detected = 'image/png';
  else if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) detected = 'image/jpeg';
  else if (/^GIF8[79]a/u.test(bytes.subarray(0, 6).toString('ascii'))) detected = 'image/gif';
  else if (bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP') detected = 'image/webp';
  else if (bytes.subarray(4, 8).toString('ascii') === 'ftyp') {
    const brands = bytes.subarray(8, Math.min(bytes.readUInt32BE(0), 256)).toString('ascii');
    detected = /avif|avis/u.test(brands) ? 'image/avif' : /heic|heix|hevc|hevx/u.test(brands) ? 'image/heic' : 'video/mp4';
  } else if (/^(?:<\?xml[\s\S]*?\?>\s*)?(?:<!--[\s\S]*?-->\s*)*<svg\b/iu.test(prefix)) detected = 'image/svg+xml';
  else if (bytes.subarray(0, 4).toString('ascii') === 'wOFF') detected = 'font/woff';
  else if (bytes.subarray(0, 4).toString('ascii') === 'wOF2') detected = 'font/woff2';
  else if (bytes.subarray(0, 4).equals(Buffer.from([0, 1, 0, 0]))) detected = 'font/ttf';
  else if (bytes.subarray(0, 4).toString('ascii') === 'OTTO') detected = 'font/otf';
  else if (bytes.subarray(0, 5).toString('ascii') === '%PDF-') detected = 'application/pdf';
  const known = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/avif', 'image/heic', 'image/svg+xml', 'font/woff', 'font/woff2', 'font/ttf', 'font/otf', 'application/pdf', 'video/mp4']);
  if (known.has(expected) && detected !== expected) return `asset signature ${detected ?? 'unrecognized'} does not match ${expected}`;
  if (detected?.startsWith('image/') && expected.startsWith('image/') && detected !== expected) return `asset signature ${detected} does not match ${expected}`;
  return null;
}

async function publicRoot(directory, needed) {
  if (!directory) {
    requireInput(!needed, '--public is required when assets are declared');
    return null;
  }
  let root;
  try {
    root = await realpath(directory);
    requireInput((await stat(root)).isDirectory(), '--public must be a directory');
  } catch (error) {
    if (error instanceof ContractInputError) throw error;
    throw new ContractInputError(`cannot open --public directory: ${error.message}`);
  }
  return root;
}

async function localAsset(root, file, maxBodyBytes) {
  const candidate = resolve(root, file);
  const actual = await realpath(candidate);
  const inside = relative(root, actual);
  if (inside === '..' || inside.startsWith(`..${sep}`) || isAbsolute(inside)) throw new Error('asset symlink escapes public directory');
  const info = await stat(actual);
  if (!info.isFile()) throw new Error('declared asset is not a file');
  if (info.size > maxBodyBytes) throw new Error(`local asset exceeds ${maxBodyBytes} byte limit`);
  return readFile(actual);
}

export async function auditSite({ base, manifest, publicDir, timeoutMs = DEFAULT_TIMEOUT_MS, maxBodyBytes = DEFAULT_MAX_BODY_BYTES }) {
  validateManifest(manifest);
  const baseUrl = httpUrl(base, '--base', true);
  requireInput(Number.isInteger(timeoutMs) && timeoutMs > 0 && Number.isInteger(maxBodyBytes) && maxBodyBytes > 0, 'request limits must be positive integers');
  const root = await publicRoot(publicDir, manifest.assets.length > 0);
  const canonicalOrigin = manifest.productionOrigin ?? baseUrl.origin;
  for (const route of manifest.routes) {
    if (route.canonical !== undefined) requireInput(new URL(route.canonical, canonicalOrigin).origin === new URL(canonicalOrigin).origin, `canonical for ${route.path} must use the destination origin`);
  }
  const checks = [];
  const add = (type, target, ok, message, details = {}) => checks.push({ type, target, ok, message, ...details });
  for (const route of manifest.routes) {
    const url = new URL(route.path, baseUrl).href;
    let response;
    try { response = await request(url, { timeoutMs, maxBodyBytes }); }
    catch (error) { add('route-request', route.path, false, error.message); continue; }
    add('route-status', route.path, response.status === route.status, `expected HTTP ${route.status}, received ${response.status}`, { expected: route.status, actual: response.status });
    if (route.kind !== 'redirect') {
      const actualMime = mime(response.headers.get('content-type'));
      add('route-content-type', route.path, ['text/html', 'application/xhtml+xml'].includes(actualMime), `expected an HTML page, received ${actualMime || '(missing Content-Type)'}`, { actual: actualMime });
    }
    if (route.kind === 'redirect') {
      const actual = response.headers.get('location');
      // Preserve the initially declared Location verbatim; do not follow or normalize it away.
      add('redirect-location', route.path, actual === route.location, `expected Location ${route.location}, received ${actual ?? '(missing)'}`, { expected: route.location, actual });
    }
    const html = response.bytes.toString('utf8');
    const observed = inspectHtml(html);
    if (route.title !== undefined) add('route-title', route.path, observed.titles.length === 1 && observed.titles[0] === text(route.title), `expected one exact title: ${route.title}`, { expected: text(route.title), actual: observed.titles });
    if (route.marker !== undefined) add('route-marker', route.path, observed.bodyText.includes(text(route.marker)), `body text must contain: ${route.marker}`, { expected: text(route.marker) });
    if (route.canonical !== undefined) {
      const expected = new URL(route.canonical, canonicalOrigin).href;
      let actual = null;
      try { if (observed.canonicals.length === 1 && observed.canonicals[0].trim()) actual = new URL(observed.canonicals[0], url).href; } catch { /* Invalid observed canonical remains a failed assertion. */ }
      add('route-canonical', route.path, observed.canonicals.length === 1 && actual === expected, `expected one canonical ${expected}, received ${actual ?? '(missing, invalid or multiple)'}`, { expected, actual });
    }
    const dependencies = findFramerDependencies(html, url);
    add('framer-asset-references', route.path, dependencies.length === 0, dependencies.length ? `Framer asset/runtime references: ${dependencies.join(', ')}` : 'no recognized Framer asset/runtime references in this HTTP HTML', { references: dependencies });
  }
  for (const asset of manifest.assets) {
    let local;
    try {
      local = await localAsset(root, asset.file, maxBodyBytes);
      const issue = inspectAssetBytes(local, asset.mime);
      add('asset-file', asset.url, issue === null, issue ?? `local file ${asset.file} is nonempty and passes supported signature checks`);
    } catch (error) { add('asset-file', asset.url, false, error.message); continue; }
    let response;
    try { response = await request(new URL(asset.url, baseUrl).href, { timeoutMs, maxBodyBytes }); }
    catch (error) { add('asset-request', asset.url, false, error.message); continue; }
    add('asset-status', asset.url, response.status === 200, `expected HTTP 200 without redirect, received ${response.status}`, { expected: 200, actual: response.status });
    const actualMime = mime(response.headers.get('content-type'));
    add('asset-mime', asset.url, actualMime === asset.mime.toLowerCase(), `expected ${asset.mime}, received ${actualMime || '(missing)'}`, { expected: asset.mime.toLowerCase(), actual: actualMime });
    const servedIssue = inspectAssetBytes(response.bytes, asset.mime);
    add('asset-content', asset.url, servedIssue === null, servedIssue ?? 'served asset is nonempty and passes supported signature checks');
    const localHash = hash(local);
    const servedHash = hash(response.bytes);
    add('asset-bytes', asset.url, localHash === servedHash, localHash === servedHash ? 'served bytes match the declared public file' : 'served bytes differ from the declared public file', { localSha256: localHash, servedSha256: servedHash });
    if (asset.sha256 !== undefined) add('asset-sha256', asset.url, localHash === asset.sha256.toLowerCase() && servedHash === asset.sha256.toLowerCase(), 'local and served asset must match declared SHA-256', { expected: asset.sha256.toLowerCase(), localSha256: localHash, servedSha256: servedHash });
  }
  const failed = checks.filter((check) => !check.ok).length;
  return {
    ok: failed === 0,
    base: baseUrl.origin,
    productionOrigin: manifest.productionOrigin ?? null,
    scope: 'HTTP responses, asserted HTML text/metadata, and declared public asset files only',
    routes: manifest.routes.length,
    declaredAssets: manifest.assets.length,
    summary: { passed: checks.length - failed, failed },
    checks,
    limitations: [
      'HTML text checks strip script/style/template/head but cannot compute CSS visibility or JavaScript-rendered content.',
      'Only declared routes/assets and recognized static Framer HTML references are checked; no complete route discovery or runtime independence proof.',
      'No browser hydration, visual fidelity, media decoding, interaction, accessibility, service delivery or licensing verification.',
      ...(manifest.assets.length === 0 ? ['No assets declared; this report makes no asset ownership claim.'] : []),
    ],
  };
}

const USAGE = 'Usage: node audit-site.mjs --base http://127.0.0.1:3000 --manifest manifest.json [--public ./public] [--json]';
export async function runCli(args, { stdout = console.log, stderr = console.error } = {}) {
  const json = args.includes('--json');
  try {
    if (args.length === 1 && args[0] === '--help') { stdout(USAGE); return 0; }
    const options = {};
    for (let index = 0; index < args.length; index += 1) {
      const arg = args[index];
      requireInput(['--base', '--manifest', '--public', '--json'].includes(arg), `unknown argument ${arg}`);
      requireInput(!Object.hasOwn(options, arg), `duplicate argument ${arg}`);
      if (arg === '--json') options[arg] = true;
      else {
        requireInput(index + 1 < args.length && !args[index + 1].startsWith('--'), `${arg} requires a value`);
        options[arg] = args[++index];
      }
    }
    requireInput(options['--base'] && options['--manifest'], `${USAGE}\n--base and --manifest are required; --public is required for declared assets`);
    let manifest;
    try { manifest = JSON.parse(await readFile(options['--manifest'], 'utf8')); }
    catch (error) { throw new ContractInputError(`cannot read manifest JSON: ${error.message}`); }
    const report = await auditSite({ base: options['--base'], manifest, publicDir: options['--public'] });
    if (json) stdout(JSON.stringify(report, null, 2));
    else {
      stdout(`${report.ok ? 'PASS' : 'FAIL'}: ${report.summary.passed} passed, ${report.summary.failed} failed; ${report.routes} routes, ${report.declaredAssets} declared assets.`);
      for (const check of report.checks.filter((item) => !item.ok)) stdout(`- ${check.type} ${check.target}: ${check.message}`);
      stdout('HTTP/declaration checks only. Browser fidelity and runtime independence are not verified.');
    }
    return report.ok ? 0 : 1;
  } catch (error) {
    const invalid = error instanceof ContractInputError;
    const code = invalid ? 2 : 1;
    if (json) stdout(JSON.stringify({ ok: false, error: error.message, exitCode: code }, null, 2));
    else stderr(`${invalid ? 'Invalid input' : 'Audit failed'}: ${error.message}`);
    return code;
  }
}

const entryPath = process.argv[1] ? await realpath(process.argv[1]).catch(() => null) : null;
if (entryPath && import.meta.url === pathToFileURL(entryPath).href) process.exitCode = await runCli(process.argv.slice(2));
