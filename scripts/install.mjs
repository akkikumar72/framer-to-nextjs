#!/usr/bin/env node
import { cp, mkdir, access, readdir, realpath } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const source = fileURLToPath(new URL('../skills/framer-to-nextjs/', import.meta.url));
export async function install(target = join(homedir(), '.agents', 'skills', 'framer-to-nextjs')) {
  target = resolve(target);
  if (target === resolve(source)) throw new Error('The source skill is already at this path. Choose another target.');
  await access(join(source, 'SKILL.md'));
  await mkdir(dirname(target), { recursive: true });
  try {
    await mkdir(target);
  } catch (error) {
    if (error.code === 'EEXIST') throw new Error(`Refusing to overwrite existing skill: ${target}. Move or back it up before installing.`);
    throw error;
  }
  for (const entry of await readdir(source)) {
    await cp(join(source, entry), join(target, entry), { recursive: true, force: false, errorOnExist: true });
  }
  return target;
}
async function main(args) {
  if (args.includes('--help')) {
    console.log('Usage: node scripts/install.mjs [--to /absolute/skill-directory]\nDefault: ~/.agents/skills/framer-to-nextjs. Existing destinations are never overwritten.');
    return;
  }
  if (args.length && (args.length !== 2 || args[0] !== '--to' || !args[1])) throw new Error('Use --to <skill-directory> or no arguments.');
  const destination = await install(args[1]);
  console.log(`Installed framer-to-nextjs at ${destination}\nStart a fresh Codex task and invoke $framer-to-nextjs. Restart Codex if it is not listed.`);
}
const entryPath = process.argv[1] ? await realpath(process.argv[1]).catch(() => null) : null;
if (entryPath && import.meta.url === pathToFileURL(entryPath).href) {
  main(process.argv.slice(2)).catch(error => { console.error(error.message); process.exitCode = 1; });
}
