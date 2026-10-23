import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import { discover, htmlLinks, xmlLocations, decode } from '../skills/framer-to-nextjs/scripts/discover-routes.mjs';

async function fixture(t, handler) {
  const server = http.createServer(handler);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); }));
  return `http://127.0.0.1:${server.address().port}`;
}
test('extracts links and sitemap locations without treating scripts or downloads as pages', () => {
  assert.deepEqual(htmlLinks('<script>"<a href="/fake">"</script><a href="/about?a=1&amp;b=2">About</a><a href="/file" download>File</a>'), ['/about?a=1&b=2']);
  assert.deepEqual(xmlLocations('<urlset><loc><![CDATA[https://example.test/a?x=1&y=2]]></loc><loc>https://example.test/b?a=1&amp;b=2</loc></urlset>'), ['https://example.test/a?x=1&y=2', 'https://example.test/b?a=1&b=2']);
  assert.equal(decode('&#x1F600; &#65; &AMP; &#99999999;'), '😀 A & &#99999999;');
});
test('reconciles sitemap index, robots locale map and nested HTML while staying on origin', async t => {
  const seen=[];
  const base=await fixture(t, (req,res) => {
    seen.push(req.url);
    if (req.url==='/robots.txt') { res.setHeader('content-type','text/plain'); res.end('Sitemap: /locale.xml'); }
    else if (req.url==='/sitemap.xml') { res.setHeader('content-type','application/xml'); res.end('<sitemapindex><sitemap><loc>/pages.xml</loc></sitemap></sitemapindex>'); }
    else if (req.url==='/pages.xml') { res.setHeader('content-type','application/xml'); res.end('<urlset><url><loc>/unlinked</loc></url><url><loc>https://outside.invalid/secret</loc></url></urlset>'); }
    else if (req.url==='/locale.xml') { res.setHeader('content-type','application/xml'); res.end('<urlset><loc>/sv</loc></urlset>'); }
    else if (req.url==='/') { res.setHeader('content-type','text/html'); res.end('<title>Home</title><a href="/about#team">About</a><a href="/?theme=blue">Theme</a><a href="/old">Old</a><a href="/photo.avif">Photo</a><a href="https://outside.invalid">Away</a>'); }
    else if (req.url==='/old') { res.writeHead(308, { location:'/about' }); res.end(); }
    else { res.setHeader('content-type','text/html'); res.end('<title>Detail</title>Content'); }
  });
  const result=await discover(base);
  assert.deepEqual(new Set(result.candidates.map(x=>x.path)), new Set(['/','/about','/old','/unlinked','/sv']));
  assert.deepEqual(result.candidates.find(x=>x.path==='/').queryStates, ['?theme=blue']);
  assert.equal(result.candidates.find(x=>x.path==='/old').observed.kind, 'redirect');
  assert.equal(result.truncated,false);
  assert.equal(result.errors.length,0);
  assert.ok(!seen.some(x=>x.includes('photo')));
});
test('reports bounded discovery and HTTP failures instead of claiming complete coverage', async t => {
  const base=await fixture(t, (req,res) => {
    if (req.url==='/') { res.setHeader('content-type','text/html'); res.end('<a href="/a">A</a><a href="/b">B</a>'); }
    else { res.writeHead(404); res.end('missing'); }
  });
  const result=await discover(base,{limit:3});
  assert.equal(result.truncated,true);
  assert.equal(result.fetches.length,3);
  assert.equal(result.errors.length,2);
  assert.equal(result.candidates.find(x=>x.path==='/a').observed,undefined);
});
test('marks non-HTML targets and does not recurse through redirect cycles', async t => {
  const base=await fixture(t,(req,res)=>{
    if(req.url==='/robots.txt'||req.url==='/sitemap.xml'){ res.writeHead(404);res.end(); }
    else if(req.url==='/'){res.setHeader('content-type','text/html');res.end('<a href="/asset">file</a><a href="/cycle">cycle</a>');}
    else if(req.url==='/cycle'){res.writeHead(302,{location:'/cycle'});res.end();}
    else {res.setHeader('content-type','application/pdf');res.end('pdf');}
  });
  const result=await discover(base);
  assert.equal(result.candidates.find(x=>x.path==='/asset').observed.kind,'non-html');
  assert.equal(result.fetches.filter(x=>x.url.endsWith('/cycle')).length,1);
});
test('rejects unsafe origins and unreasonable request budgets', async()=>{
  await assert.rejects(discover('file:///tmp/site'),/HTTP/);
  await assert.rejects(discover('https://name:secret@example.test'),/credentials/);
  await assert.rejects(discover('https://example.test',{limit:0}),/limit/);
});

test('respects document base and real download attributes without title false positives', async t => {
  const base=await fixture(t,(req,res)=>{
    if(req.url==='/robots.txt'||req.url==='/sitemap.xml'){res.writeHead(404);res.end();}
    else if(req.url==='/'){res.setHeader('content-type','text/html');res.end('<base href="/nested/"><a title="download details > here" href="article">Article</a><a download href="secret">Download</a>');}
    else{res.setHeader('content-type','text/html');res.end('<title>Article</title>');}
  });
  const result=await discover(base);
  assert.deepEqual(result.candidates.map(x=>x.path),['/','/nested/article']);
  assert.deepEqual(htmlLinks('<a title="download" href="/real">Real</a><a href="/blob" download="">File</a>'),['/real']);
});
test('external document base cannot invent same-origin paths from relative anchors', async t=>{
  const base=await fixture(t,(req,res)=>{
    if(req.url!=='/'){res.writeHead(404);res.end();return;}
    res.setHeader('content-type','text/html');res.end('<base href="https://outside.invalid/docs/"><a href="guide">Guide</a><a href="/also-external">Other</a>');
  });
  const result=await discover(base);
  assert.deepEqual(result.candidates.map(x=>x.path),['/']);
});
test('robots sitemap declarations permit trailing comments', async t=>{
  const base=await fixture(t,(req,res)=>{
    if(req.url==='/robots.txt'){res.setHeader('content-type','text/plain');res.end('Sitemap: /extra.xml # locale pages\n');}
    else if(req.url==='/extra.xml'){res.setHeader('content-type','application/xml');res.end('<urlset><loc>/extra-page</loc></urlset>');}
    else if(req.url==='/sitemap.xml'){res.writeHead(404);res.end();}
    else{res.setHeader('content-type','text/html');res.end('<title>Page</title>');}
  });
  const result=await discover(base);
  assert.ok(result.candidates.some(x=>x.path==='/extra-page'));
});
