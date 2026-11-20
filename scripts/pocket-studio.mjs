import { existsSync, lstatSync, mkdirSync, readdirSync, readlinkSync, symlinkSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
const checkoutPath = 'tools/pocket-studio';

function requireCheckout(repoRoot) {
  const checkout = join(repoRoot, checkoutPath);
  if (!existsSync(join(checkout, '.git'))) {
    throw new Error('Pocket Studio is not initialized. Run npm run skills:setup.');
  }
  return checkout;
}

// Validate every destination before creating anything; preserve other installed skills.
export function linkSkills(repoRoot, { write = false } = {}) {
  const source = join(requireCheckout(repoRoot), 'skills');
  const destination = join(repoRoot, '.agents/skills');
  const names = readdirSync(source, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && existsSync(join(source, entry.name, 'SKILL.md')))
    .map(entry => entry.name).sort();
  if (!names.length) throw new Error('No Pocket Studio skills found. Inspect the submodule checkout.');
  const missing = [];
  for (const name of names) {
    const target = join(destination, name);
    const expected = relative(destination, join(source, name));
    let info;
    try { info = lstatSync(target); } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    if (!info) {
      if (!write) throw new Error(`Missing skill link: ${name}. Run npm run skills:link.`);
      missing.push([target, expected]);
    } else if (!info.isSymbolicLink() || readlinkSync(target) !== expected) {
      throw new Error(`Skill destination already exists: ${target}. Review it before replacing it.`);
    }
  }
  if (existsSync(destination)) {
    for (const name of readdirSync(destination)) {
      const target = join(destination, name);
      if (!lstatSync(target).isSymbolicLink()) continue;
      const resolved = resolve(destination, readlinkSync(target));
      if (resolved.startsWith(source + sep) && !names.includes(name)) {
        throw new Error(`Stale Pocket Studio link: ${target}. Review and remove it before continuing.`);
      }
    }
  }
  for (const [target, expected] of missing) {
    mkdirSync(dirname(target), { recursive: true });
    symlinkSync(expected, target, 'dir');
  }
  return names;
}

function run(command, args, cwd = root) {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed (${result.status ?? result.signal}).`);
}

function venvPython(checkout) {
  return join(checkout, '.venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
}

function main(command) {
  if (command === 'setup') {
    // Re-running setup must preserve a contributor's current branch and edits.
    if (!existsSync(join(root, checkoutPath, '.git'))) {
      run('git', ['submodule', 'update', '--init', '--', checkoutPath]);
    }
    const checkout = requireCheckout(root);
    console.log(`Linked ${linkSkills(root, { write: true }).length} Pocket Studio skills.`);
    const python = venvPython(checkout);
    if (!existsSync(python)) run(process.platform === 'win32' ? 'python' : 'python3', ['-m', 'venv', '.venv'], checkout);
    run(python, ['-m', 'pip', 'install', '-r', 'requirements-dev.txt'], checkout);
    return;
  }
  if (command === 'link' || command === 'links') {
    console.log(`Verified ${linkSkills(root, { write: command === 'link' }).length} Pocket Studio skill links.`);
    return;
  }
  if (command === 'status') {
    const checkout = requireCheckout(root);
    run('git', ['submodule', 'status', '--', checkoutPath]);
    run('git', ['status', '--short', '--branch'], checkout);
    return;
  }
  if (command === 'check') {
    const checkout = requireCheckout(root);
    linkSkills(root);
    const python = venvPython(checkout);
    if (!existsSync(python)) throw new Error('Missing skill-check environment. Run npm run skills:setup.');
    run(python, ['scripts/check_skills.py'], checkout);
    run(python, ['-m', 'unittest', 'discover', '-s', 'tests', '-v'], checkout);
    run(python, ['scripts/package_skill.py', '--all'], checkout);
    return;
  }
  throw new Error('Usage: node scripts/pocket-studio.mjs setup|link|links|status|check');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(process.argv[2]); } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
