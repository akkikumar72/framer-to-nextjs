import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import test from 'node:test';
import { auditSite, decodeHtml, findFramerDependencies, inspectHtml, request, runCli, validateManifest } from '../skills/framer-to-nextjs/scripts/audit-site.mjs';

const exec = promisify(execFile);
const CLI = fileURLToPath(new URL('../skills/framer-to-nextjs/scripts/audit-site.mjs', import.meta.url));
const PNG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]);
const AVIF = Buffer.concat([Buffer.from([0, 0, 0, 24]), Buffer.from('ftypavif\0\0\0\0avifmif1', 'binary')]);
const MP4 = Buffer.concat([Buffer.from([0, 0, 0, 24]), Buffer.from('ftypisom\0\0\0\0isommp41', 'binary')]);
const DEFAULT_HTML = '<!doctype html><html><head><title>Fixture &amp; site</title><link rel="canonical" href="https://destination.example/" /></head><body><h1>Original fixture</h1><a href="https://framer.com">Made with Framer</a></body></html>';

function manifest(extra = {}) {
  return {
    version: 1,
    productionOrigin: 'https://destination.example',
    routes: [
      { path: '/', kind: 'page', status: 200, title: 'Fixture & site', marker: 'Original fixture', canonical: '/' },
      { path: '/not-a-real-page', kind: 'not-found', status: 404, marker: 'Fixture missing page' },
    ],
    assets: [],
    ...extra,
  };
}

async function fixture(t, responses = {}) {
  const directory = await mkdtemp(join(tmpdir(), 'framer-audit-'));
  const publicDir = join(directory, 'public');
  await mkdir(join(publicDir, 'assets'), { recursive: true });
  const server = createServer((req, res) => {
    const response = responses[req.url] ?? (req.url === '/' ? { status: 200, body: DEFAULT_HTML } : { status: 404, body: '<html><head><title>Missing</title></head><body>Fixture missing page</body></html>' });
    res.writeHead(response.status ?? 200, { 'content-type': response.mime ?? 'text/html; charset=utf-8', ...response.headers });
    if (response.delayMs) setTimeout(() => res.end(response.body ?? ''), response.delayMs);
    else res.end(response.body ?? '');
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => { await new Promise((resolve) => server.close(resolve)); await rm(directory, { recursive: true, force: true }); });
  return { base: `http://127.0.0.1:${server.address().port}`, publicDir, directory };
}

function failures(report, type) { return report.checks.filter((check) => !check.ok && (!type || check.type === type)); }
function asset(file = 'assets/a.png', mime = 'image/png') { return { url: `/${file}`, file, mime }; }
async function save(publicDir, file, bytes) { await mkdir(dirname(join(publicDir, file)), { recursive: true }); await writeFile(join(publicDir, file), bytes); }

test('valid declared routes, destination canonical and hashed local asset pass', async (t) => {
  const context = await fixture(t, { '/assets/a.png': { mime: 'image/png; charset=binary', body: PNG } });
  await save(context.publicDir, 'assets/a.png', PNG);
  const declared = { ...asset(), sha256: createHash('sha256').update(PNG).digest('hex') };
  const report = await auditSite({ ...context, manifest: manifest({ assets: [declared] }) });
  assert.equal(report.ok, true, JSON.stringify(failures(report)));
  assert.equal(report.declaredAssets, 1);
});

test('no assets needs no public directory and cannot claim asset ownership', async (t) => {
  const { base } = await fixture(t);
  const report = await auditSite({ base, manifest: manifest() });
  assert.equal(report.ok, true);
  assert.equal(report.declaredAssets, 0);
  assert.ok(report.limitations.some((item) => item.includes('no asset ownership claim')));
  await assert.rejects(auditSite({ base, manifest: manifest({ assets: [asset()] }) }), /--public is required/);
});

test('soft 404 is a status failure even when branded missing-page content matches', async (t) => {
  const context = await fixture(t, { '/not-a-real-page': { status: 200, body: 'Fixture missing page' } });
  const report = await auditSite({ ...context, manifest: manifest() });
  assert.equal(report.ok, false);
  assert.equal(failures(report, 'route-status')[0].actual, 200);
});

test('redirect checks the initial Location and never follows it', async (t) => {
  const context = await fixture(t, { '/old': { status: 307, headers: { location: '/wrong' }, body: '' }, '/wrong': { status: 500 } });
  const contract = manifest();
  contract.routes.push({ path: '/old', kind: 'redirect', status: 307, location: '/new' });
  const report = await auditSite({ ...context, manifest: contract });
  assert.equal(failures(report, 'redirect-location').length, 1);
  assert.equal(report.checks.find((check) => check.target === '/old' && check.type === 'route-status').actual, 307);
});

test('a title found only in script is not an HTML title and script/head/template markers do not count', async (t) => {
  const context = await fixture(t, { '/': { body: '<html><head><script>const fake = "<title>Fixture &amp; site</title>Original fixture";</script><meta name="x" content="Original fixture"></head><body><template>Original fixture</template><style>.x{content:"Original fixture"}</style>Other body</body></html>' } });
  const report = await auditSite({ ...context, manifest: manifest() });
  assert.equal(failures(report, 'route-title').length, 1);
  assert.equal(failures(report, 'route-marker').length, 1);
});

test('wrong canonical host fails, including an old Framer host', async (t) => {
  const context = await fixture(t, { '/': { body: DEFAULT_HTML.replace('href="https://destination.example/"', 'href="https://old.framer.website/"') } });
  const report = await auditSite({ ...context, manifest: manifest() });
  assert.equal(failures(report, 'route-canonical')[0].actual, 'https://old.framer.website/');
});


test('relative canonical resolves against the preview host and cannot masquerade as production', async (t) => {
  const context = await fixture(t, { '/': { body: DEFAULT_HTML.replace('href="https://destination.example/"', 'href="/"') } });
  const report = await auditSite({ ...context, manifest: manifest() });
  assert.equal(failures(report, 'route-canonical')[0].actual, `${context.base}/`);
});

test('nested relative canonical resolves against its actual document path', async (t) => {
  const context = await fixture(t, { '/nested/page': { body: '<html><head><link rel="canonical" href="next"></head><body>Nested</body></html>' } });
  const contract = manifest();
  delete contract.productionOrigin;
  delete contract.routes[0].canonical;
  contract.routes.push({ path: '/nested/page', kind: 'page', status: 200, canonical: '/nested/next' });
  const report = await auditSite({ ...context, manifest: contract });
  assert.equal(report.ok, true, JSON.stringify(failures(report)));
  assert.equal(report.checks.find((check) => check.target === '/nested/page' && check.type === 'route-canonical').actual, `${context.base}/nested/next`);
});

test('empty canonical href cannot satisfy a root canonical contract', async (t) => {
  const context = await fixture(t, { '/': { body: DEFAULT_HTML.replace('href="https://destination.example/"', 'href=""') } });
  const report = await auditSite({ ...context, manifest: manifest() });
  assert.equal(failures(report, 'route-canonical').length, 1);
});

test('JSON or binary with HTTP200 cannot satisfy a page contract', async (t) => {
  const context = await fixture(t, { '/': { mime: 'application/json', body: '{"ok":true}' } });
  const contract = manifest();
  contract.routes[0] = { path: '/', kind: 'page', status: 200 };
  const report = await auditSite({ ...context, manifest: contract });
  assert.equal(failures(report, 'route-content-type').length, 1);
});

test('missing and empty declared public files fail', async (t) => {
  const context = await fixture(t, { '/assets/empty.png': { mime: 'image/png', body: '' } });
  await save(context.publicDir, 'assets/empty.png', Buffer.alloc(0));
  const report = await auditSite({ ...context, manifest: manifest({ assets: [asset('assets/missing.png'), asset('assets/empty.png')] }) });
  assert.equal(failures(report, 'asset-file').length, 2);
  assert.equal(failures(report, 'asset-content').length, 1);
});

test('HTTP missing, redirected and wrongly served assets fail', async (t) => {
  const context = await fixture(t, {
    '/assets/missing.png': { status: 404, body: 'Missing' },
    '/assets/moved.png': { status: 302, headers: { location: '/assets/a.png' }, body: '' },
    '/assets/different.png': { mime: 'image/png', body: Buffer.concat([PNG, Buffer.from([1])]) },
  });
  const assets = ['missing', 'moved', 'different'].map((name) => asset(`assets/${name}.png`));
  for (const entry of assets) await save(context.publicDir, entry.file, PNG);
  const report = await auditSite({ ...context, manifest: manifest({ assets }) });
  assert.equal(failures(report, 'asset-status').length, 2);
  assert.equal(failures(report, 'asset-bytes').length, 3);
});

test('AVIF bytes mislabeled JPEG and HTML returned as media are rejected', async (t) => {
  const context = await fixture(t, {
    '/assets/wrong.jpg': { mime: 'image/jpeg', body: AVIF },
    '/assets/error.png': { mime: 'image/png', body: '<!doctype html><html>Oops</html>' },
    '/assets/type.png': { mime: 'image/jpeg', body: PNG },
  });
  await save(context.publicDir, 'assets/wrong.jpg', AVIF);
  await save(context.publicDir, 'assets/error.png', PNG);
  await save(context.publicDir, 'assets/type.png', PNG);
  const report = await auditSite({ ...context, manifest: manifest({ assets: [asset('assets/wrong.jpg', 'image/jpeg'), asset('assets/error.png'), asset('assets/type.png')] }) });
  assert.match(failures(report, 'asset-file')[0].message, /image\/avif.*image\/jpeg/);
  assert.ok(failures(report, 'asset-content').some((check) => check.message.includes('HTML')));
  assert.equal(failures(report, 'asset-mime').length, 1);
});

test('valid AVIF bytes and MIME pass, while a wrong declared digest fails', async (t) => {
  const context = await fixture(t, { '/assets/a.avif': { mime: 'image/avif', body: AVIF } });
  await save(context.publicDir, 'assets/a.avif', AVIF);
  const declared = asset('assets/a.avif', 'image/avif');
  assert.equal((await auditSite({ ...context, manifest: manifest({ assets: [declared] }) })).ok, true);
  declared.sha256 = '0'.repeat(64);
  assert.equal(failures(await auditSite({ ...context, manifest: manifest({ assets: [declared] }) }), 'asset-sha256').length, 1);
});


test('video/mp4 requires the declared signature; PNG bytes fail and BMFF MP4 bytes pass', async (t) => {
  const context = await fixture(t, {
    '/assets/fake.mp4': { mime: 'video/mp4', body: PNG },
    '/assets/a.mp4': { mime: 'video/mp4', body: MP4 },
  });
  await save(context.publicDir, 'assets/fake.mp4', PNG);
  await save(context.publicDir, 'assets/a.mp4', MP4);
  const bad = await auditSite({ ...context, manifest: manifest({ assets: [asset('assets/fake.mp4', 'video/mp4')] }) });
  assert.equal(bad.ok, false);
  assert.match(failures(bad, 'asset-file')[0].message, /image\/png.*video\/mp4/);
  assert.match(failures(bad, 'asset-content')[0].message, /image\/png.*video\/mp4/);
  const good = await auditSite({ ...context, manifest: manifest({ assets: [asset('assets/a.mp4', 'video/mp4')] }) });
  assert.equal(good.ok, true, JSON.stringify(failures(good)));
});

test('asset paths cannot escape public through a symlink', async (t) => {
  const context = await fixture(t);
  const outside = join(context.directory, 'outside.png');
  await writeFile(outside, PNG);
  await symlink(outside, join(context.publicDir, 'assets', 'escape.png'));
  const report = await auditSite({ ...context, manifest: manifest({ assets: [asset('assets/escape.png')] }) });
  assert.match(failures(report, 'asset-file')[0].message, /symlink escapes public/);
});

test('manifest rejects traversal, external identities, credentials, duplicate and invalid contracts', () => {
  for (const path of ['/../private', '/%2e%2e/private', '/%252e%252e/private', '/safe/%2e%2e/private', '//evil.test/path', 'https://name:secret@example.test/x', '/a?x=1', '/a#x', '/a\\b', '/%2f%2fevil.test']) {
    const contract = manifest();
    contract.routes[0].path = path;
    assert.throws(() => validateManifest(contract), undefined, path);
  }
  for (const file of ['../private', 'assets/%2e%2e/private', '/absolute', 'C:\\private']) {
    assert.throws(() => validateManifest(manifest({ assets: [{ ...asset(), file }] })), undefined, file);
  }
  const duplicate = manifest();
  duplicate.routes.push({ ...duplicate.routes[0] });
  assert.throws(() => validateManifest(duplicate), /duplicate route/);
  const duplicateEncoded = manifest();
  duplicateEncoded.routes[0].path = '/example';
  duplicateEncoded.routes.push({ path: '/%65xample', kind: 'page', status: 200 });
  assert.throws(() => validateManifest(duplicateEncoded), /duplicate route/);
  assert.throws(() => validateManifest(manifest({ routes: [{ path: '/old', kind: 'redirect', status: 301, location: '/' }] })), /page contract/);
  assert.throws(() => validateManifest(manifest({ routes: [{ path: '/', kind: 'page', status: 200 }] })), /not-found contract/);
  assert.throws(() => validateManifest(manifest({ productionOrigin: 'https://destination.example/path' })), /only an origin/);
  assert.throws(() => validateManifest(manifest({ productionOrigin: 'https://user:pass@destination.example' })), /credentials/);
  assert.throws(() => validateManifest(manifest({ assets: [asset(), asset()] })), /duplicate asset/);
  assert.throws(() => validateManifest(manifest({ assets: [{ ...asset(), sha256: 'oops' }] })), /sha256/);
  const redirect = manifest();
  redirect.routes.push({ path: '/old', kind: 'redirect', status: 302 });
  assert.throws(() => validateManifest(redirect), /requires location/);
  const invalidStatus = manifest();
  invalidStatus.routes[0].status = 404;
  assert.throws(() => validateManifest(invalidStatus), /status is invalid/);
  const notRedirect = manifest();
  notRedirect.routes.push({ path: '/cached', kind: 'redirect', status: 304, location: '/' });
  assert.throws(() => validateManifest(notRedirect), /status is invalid/);
  const percent = manifest();
  percent.routes[0].path = '/100%25';
  assert.doesNotThrow(() => validateManifest(percent));
});

test('Framer dependency detection checks asset attributes/CSS, without attribution or script-string false positives', () => {
  const observed = findFramerDependencies(`
    <a href="https://framer.com">Attribution</a>
    <script>const provenance = '<img src="https://framerusercontent.com/documentation.png">';</script>
    <img src="https://framerusercontent.com/image.png">
    <source srcset="https://framerusercontent.com/a.png 1x, https://framerusercontent.com/b.png 2x">
    <script src="https://framer.com/runtime.js"></script>
    <link rel="stylesheet" href="https://framerstatic.com/style.css">
    <video poster="https://framerusercontent.com/poster.jpg"></video>
    <div style="background: url('https://framerusercontent.com/bg.png')"></div>
    <style>.foo { background: url(https://framerusercontent.com/css.png); }</style>
  `, 'https://local.example/');
  assert.equal(observed.length, 8);
  assert.ok(!observed.some((url) => url.includes('documentation') || url === 'https://framer.com/'));
  assert.deepEqual(findFramerDependencies('<a href="https://framer.com">Attribution</a>', 'https://local.example/'), []);
});

test('request caps response bodies, including bodies with no declared content length', async (t) => {
  const context = await fixture(t, { '/large': { body: 'x'.repeat(100) } });
  await assert.rejects(request(`${context.base}/large`, { maxBodyBytes: 8 }), /body limit/);
});


test('request timeout bounds a stalled response', async (t) => {
  const context = await fixture(t, { '/slow': { body: 'Late', delayMs: 80 } });
  await assert.rejects(request(`${context.base}/slow`, { timeoutMs: 10 }), /timeout|aborted/iu);
});

test('HTML inspection decodes common/numeric entities and excludes inert marker text', () => {
  const result = inspectHtml('<head><title>A &#38; B</title></head><body>A &amp; B <script>hidden</script><template>hidden<template>nested</template>still hidden</template><style>hidden</style></body>');
  assert.deepEqual(result.titles, ['A & B']);
  assert.equal(result.bodyText, 'A & B');
});


test('HTTP title and body markers decode accented, Greek, mathematical and numeric character references', async (t) => {
  const encoded = 'Caf&eacute; &amp; Cr&egrave;me &Alpha; &alpha; &frac12; &sup2; &NotEqualTilde; &#x03A9; &#937;';
  const expected = 'Café & Crème Α α ½ ² \u2242\u0338 Ω Ω';
  const context = await fixture(t, { '/': { body: `<html><head><title>${encoded}</title></head><body><h1>${encoded}</h1></body></html>` } });
  const contract = manifest();
  contract.routes[0] = { path: '/', kind: 'page', status: 200, title: expected, marker: expected };
  const report = await auditSite({ ...context, manifest: contract });
  assert.equal(report.ok, true, JSON.stringify(failures(report)));
});

test('named entities are case-sensitive, require semicolons and preserve unsupported names', () => {
  assert.equal(decodeHtml('&Alpha; &alpha; &ALPHA; &alpha &unregisteredName; &constructor; &frac12;'), 'Α α &ALPHA; &alpha &unregisteredName; &constructor; ½');
  assert.equal(decodeHtml('&#x03B1; &#X03B1; &#945;'), 'α α α');
});

test('CLI exits 0 for passing HTTP contracts, 1 for failures, 2 for invalid input; JSON stays machine-readable', async (t) => {
  const context = await fixture(t);
  const contractPath = join(context.directory, 'manifest.json');
  await writeFile(contractPath, JSON.stringify(manifest()));
  const args = [CLI, '--base', context.base, '--manifest', contractPath, '--json'];
  const passing = await exec(process.execPath, args);
  assert.equal(JSON.parse(passing.stdout).ok, true);
  const broken = manifest();
  broken.routes[0].title = 'Wrong';
  await writeFile(contractPath, JSON.stringify(broken));
  await assert.rejects(exec(process.execPath, args), (error) => error.code === 1 && JSON.parse(error.stdout).ok === false);
  await writeFile(contractPath, JSON.stringify({ version: 2 }));
  await assert.rejects(exec(process.execPath, args), (error) => error.code === 2 && JSON.parse(error.stdout).exitCode === 2);
  const output = [];
  assert.equal(await runCli(['--nope', '--json'], { stdout: (line) => output.push(line), stderr: () => {} }), 2);
  assert.equal(JSON.parse(output[0]).exitCode, 2);
});
