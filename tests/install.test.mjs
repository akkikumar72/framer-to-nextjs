import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { install } from '../scripts/install.mjs';

const run = promisify(execFile);

test('installs complete skill into a clean path and refuses to replace user work', async t=>{
  const dir=await mkdtemp(join(tmpdir(),'framer-skill-install-'));
  t.after(()=>rm(dir,{recursive:true,force:true}));
  const dest=join(dir,'.agents','skills','framer-to-nextjs');
  assert.equal(await install(dest),dest);
  assert.match(await readFile(join(dest,'SKILL.md'),'utf8'),/name: framer-to-nextjs/);
  assert.match(await readFile(join(dest,'references','verification.md'),'utf8'),/HTTP/);
  assert.match(await readFile(join(dest,'scripts','discover-routes.mjs'),'utf8'),/export async function discover/);
  const alias = join(dir, 'linked-skill');
  await symlink(dest, alias, 'dir');
  for (const helper of ['audit-site', 'discover-routes']) {
    const { stdout } = await run(process.execPath, [join(alias, 'scripts', `${helper}.mjs`), '--help']);
    assert.match(stdout, new RegExp(`Usage: node ${helper}`));
  }
  const linkedInstaller = join(dir, 'linked-installer.mjs');
  await symlink(fileURLToPath(new URL('../scripts/install.mjs', import.meta.url)), linkedInstaller);
  const { stdout: installerHelp } = await run(process.execPath, [linkedInstaller, '--help']);
  assert.match(installerHelp, /Usage: node scripts\/install/);
  assert.match(await readFile(join(dest, 'LICENSE'), 'utf8'), /MIT License/);
  assert.match(await readFile(join(dest, 'THIRD_PARTY_NOTICES.md'), 'utf8'), /PYTHON SOFTWARE FOUNDATION LICENSE/);
  await writeFile(join(dest,'USER-NOTE.txt'),'keep me');
  await assert.rejects(install(dest),/Refusing to overwrite/);
  assert.equal(await readFile(join(dest,'USER-NOTE.txt'),'utf8'),'keep me');
});
