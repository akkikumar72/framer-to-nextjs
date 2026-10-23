#!/usr/bin/env node
/** Bounded public GET discovery. Seeds only, not a DOM or project-tree exporter. */
import { pathToFileURL } from 'node:url';
import { realpath } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';

const MAX_BYTES = 2 * 1024 * 1024;
const nonPages = /\.(?:avif|bmp|css|csv|docx?|eot|gif|gz|ico|jpe?g|js|json|m4a|mov|mp3|mp4|ogg|otf|pdf|png|pptx?|svg|tar|tiff?|ttf|txt|wav|webm|webp|woff2?|xlsx?|xml|zip)$/i;
const entities = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>' };
export function decode(text) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|amp|quot|apos|lt|gt);/gi, (all, key) => {
    if (!key.startsWith('#')) return entities[key.toLowerCase()] ?? all;
    const value = key[1].toLowerCase() === 'x' ? parseInt(key.slice(2), 16) : Number(key.slice(1));
    return value > 0 && value <= 0x10ffff ? String.fromCodePoint(value) : all;
  });
}
export function attributes(tag) {
  const attrs = Object.create(null);
  const body = tag.replace(/^<\/?[^\s>]+/, '').replace(/\/?>$/, '');
  for (const match of body.matchAll(/([^\s=<>"'`/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
    const key = match[1].toLowerCase();
    if (!Object.hasOwn(attrs, key)) attrs[key] = decode(match[2] ?? match[3] ?? match[4] ?? '');
  }
  return attrs;
}
function observedHtml(html) {
  return html.replace(/<!--[\s\S]*?-->/g, '').replace(/<(script|style|template)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '');
}
export function htmlLinks(html) {
  return [...observedHtml(html).matchAll(/<a\b(?:"[^"]*"|'[^']*'|[^'">])*>/gi)].flatMap(m => {
    const a = attributes(m[0]);
    return a.href && !Object.hasOwn(a, 'download') ? [a.href] : [];
  });
}
export function htmlBase(html, pageUrl) {
  const tags = observedHtml(html).matchAll(/<base\b(?:"[^"]*"|'[^']*'|[^'">])*>/gi);
  for (const match of tags) {
    const attrs = attributes(match[0]);
    if (!Object.hasOwn(attrs, 'href')) continue;
    try {
      const base = new URL(attrs.href, pageUrl);
      return ['http:', 'https:'].includes(base.protocol) ? base.href : pageUrl;
    } catch { return pageUrl; }
  }
  return pageUrl;
}
export function xmlLocations(xml) {
  return [...xml.matchAll(/<(?:[\w.-]+:)?loc\b[^>]*>([\s\S]*?)<\/(?:[\w.-]+:)?loc\s*>/gi)]
    .map(m => decode(m[1].trim().replace(/^<!\[CDATA\[([\s\S]*?)\]\]>$/, '$1')));
}
function urlOnOrigin(value, base, origin) {
  try {
    const url = new URL(value, base);
    if (!['http:', 'https:'].includes(url.protocol) || url.origin !== origin || url.username || url.password) return null;
    url.hash = '';
    return url;
  } catch { return null; }
}
async function boundedBody(response) {
  if (!response.body) return Buffer.alloc(0);
  const parts = [];
  let size = 0;
  const reader = response.body.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) throw new Error('Response exceeds 2 MiB discovery limit');
      parts.push(Buffer.from(value));
    }
  } finally { await reader.cancel(); }
  return Buffer.concat(parts);
}
export async function discover(input, { limit = 100, timeout = 8000 } = {}) {
  const entry = new URL(input);
  if (!['http:', 'https:'].includes(entry.protocol) || entry.username || entry.password) throw new Error('Use an HTTP(S) URL without credentials');
  if (!Number.isInteger(limit) || limit < 3 || limit > 1000) throw new Error('limit must be an integer from 3 to 1000');
  const origin = entry.origin;
  const records = new Map();
  const fetched = new Set();
  const queued = new Set();
  const queue = [];
  const fetches = [];
  const errors = [];
  let truncated = false;
  function enqueue(url, type) {
    const key = `${type}:${url.href}`;
    if (!queued.has(key)) { queued.add(key); queue.push({ url, type }); }
  }
  function candidate(value, base, evidence) {
    const url = urlOnOrigin(value, base, origin);
    if (!url || nonPages.test(url.pathname)) return;
    const state = url.search;
    url.search = '';
    const key = url.pathname;
    if (!records.has(key)) records.set(key, { path: key, referenceUrl: url.href, evidence: [], queryStates: [], disposition: 'pending' });
    const record = records.get(key);
    if (!record.evidence.includes(evidence)) record.evidence.push(evidence);
    if (state && !record.queryStates.includes(state)) record.queryStates.push(state);
    enqueue(url, 'page');
  }
  enqueue(new URL('/robots.txt', origin), 'robots');
  enqueue(new URL('/sitemap.xml', origin), 'sitemap');
  candidate(entry.href, entry.href, 'provided-url');
  while (queue.length) {
    if (fetches.length >= limit) { truncated = true; break; }
    const { url, type } = queue.shift();
    if (fetched.has(url.href)) continue;
    fetched.add(url.href);
    const record = { url: url.href, type };
    fetches.push(record);
    try {
      const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(timeout), headers: { 'user-agent': 'framer-to-nextjs-discovery/1.0', accept: 'text/html, application/xml, text/plain' } });
      record.status = response.status;
      record.contentType = response.headers.get('content-type') ?? '';
      const route = type === 'page' ? records.get(url.pathname) : undefined;
      if (route) route.observed = { status: response.status, contentType: record.contentType };
      if (response.status >= 300 && response.status < 400) {
        record.location = response.headers.get('location');
        if (route) { route.observed.kind = 'redirect'; route.observed.location = record.location; }
        const target = record.location && urlOnOrigin(record.location, url, origin);
        if (target) {
          if (type === 'page') candidate(target.href, url, `redirect:${url.pathname}`);
          else enqueue(target, type);
        }
        await response.body?.cancel();
        continue;
      }
      if (!response.ok) {
        await response.body?.cancel();
        errors.push({ url: url.href, message: `HTTP ${response.status}` });
        continue;
      }
      let bytes = await boundedBody(response);
      if (type === 'sitemap' && bytes[0] === 0x1f && bytes[1] === 0x8b) bytes = gunzipSync(bytes, { maxOutputLength: MAX_BYTES });
      const text = bytes.toString('utf8');
      if (type === 'robots') {
        for (const m of text.matchAll(/^sitemap:\s*(\S+?)(?:[ \t]+#.*)?[ \t]*$/gim)) {
          const target = urlOnOrigin(m[1], url, origin);
          if (target) enqueue(target, 'sitemap');
        }
      } else if (type === 'sitemap') {
        if (!/<(?:[\w.-]+:)?(?:urlset|sitemapindex)\b/i.test(text)) {
          errors.push({ url: url.href, message: 'Not a recognized sitemap document' });
          continue;
        }
        const index = /<(?:[\w.-]+:)?sitemapindex\b/i.test(text);
        for (const value of xmlLocations(text)) {
          const target = urlOnOrigin(value, url, origin);
          if (!target) continue;
          if (index) enqueue(target, 'sitemap');
          else candidate(target.href, url, `sitemap:${url.pathname}`);
        }
      } else {
        if (!/\b(?:text\/html|application\/xhtml\+xml)\b/i.test(record.contentType)) {
          route.observed.kind = 'non-html';
          continue;
        }
        route.observed.kind = 'html-candidate';
        const title = observedHtml(text).match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
        if (title) route.observed.title = decode(title[1].trim());
        const base = htmlBase(text, url.href);
        for (const link of htmlLinks(text)) candidate(link, base, `anchor:${url.pathname}`);
      }
    } catch (error) {
      errors.push({ url: url.href, message: error.message });
    }
  }
  return {
    version: 1, origin, entryUrl: entry.href, candidates: [...records.values()], fetches, errors, truncated,
    limitations: ['Discovery seeds only; browser inspection and project evidence still required.', 'No JavaScript execution, private tree access, complete robots policy evaluation, or soft-404 detection.', 'Only same-origin GET requests, without form submissions; robots is inspected for sitemap declarations.', 'Query strings are recorded as state evidence; canonical identity and path case require manual reconciliation.'],
  };
}
async function main(args) {
  if (args.includes('--help')) {
    console.log('Usage: node discover-routes.mjs <published-url> [--limit 100]\nPrints JSON seeds, not a verified route manifest. Bounded same-origin GET requests only.');
    return;
  }
  const [input, ...rest] = args;
  let limit = 100;
  if (!input) throw new Error('A published URL is required. Use --help.');
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] !== '--limit' || !rest[i + 1]) throw new Error(`Unknown or incomplete argument: ${rest[i]}`);
    limit = Number(rest[++i]);
  }
  console.log(JSON.stringify(await discover(input, { limit }), null, 2));
}
const entryPath = process.argv[1] ? await realpath(process.argv[1]).catch(() => null) : null;
if (entryPath && import.meta.url === pathToFileURL(entryPath).href) {
  main(process.argv.slice(2)).catch(error => { console.error(error.message); process.exitCode = 2; });
}
