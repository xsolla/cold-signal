import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, readlinkSync, rmSync, symlinkSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { linkSkills } from '../scripts/pocket-studio.mjs';

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'cold-signal-skills-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, 'tools/pocket-studio/skills'), { recursive: true });
  writeFileSync(join(root, 'tools/pocket-studio/.git'), 'gitdir: fixture');
  return root;
}

function addSkill(root, name) {
  const folder = join(root, 'tools/pocket-studio/skills', name);
  mkdirSync(join(folder, 'references'), { recursive: true });
  writeFileSync(join(folder, 'SKILL.md'), `name: ${name}`);
  writeFileSync(join(folder, 'references/check.md'), 'baseline');
  return folder;
}

test('whole-folder links expose live edits and survive moving the project', t => {
  const root = fixture(t);
  addSkill(root, 'game-feel');
  assert.deepEqual(linkSkills(root, { write: true }), ['game-feel']);
  const installed = join(root, '.agents/skills/game-feel');
  assert.equal(readlinkSync(installed), '../../tools/pocket-studio/skills/game-feel');
  writeFileSync(join(installed, 'references/check.md'), 'candidate');
  assert.equal(readFileSync(join(root, 'tools/pocket-studio/skills/game-feel/references/check.md'), 'utf8'), 'candidate');
  assert.deepEqual(linkSkills(root, { write: true }), ['game-feel']);
  // The relative target remains valid under a different checkout root.
  const moved = fixture(t);
  addSkill(moved, 'game-feel');
  mkdirSync(join(moved, '.agents/skills'), { recursive: true });
  symlinkSync(readlinkSync(installed), join(moved, '.agents/skills/game-feel'), 'dir');
  assert.deepEqual(linkSkills(moved), ['game-feel']);
});

test('a conflicting installation prevents all link writes and preserves its content', t => {
  const root = fixture(t);
  addSkill(root, 'a-new-skill');
  addSkill(root, 'game-feel');
  const existing = join(root, '.agents/skills/game-feel');
  mkdirSync(existing, { recursive: true });
  writeFileSync(join(existing, 'SKILL.md'), 'local work');
  assert.throws(() => linkSkills(root, { write: true }), /already exists/);
  assert.equal(existsSync(join(root, '.agents/skills/a-new-skill')), false);
  assert.equal(readFileSync(join(existing, 'SKILL.md'), 'utf8'), 'local work');
});

test('verification detects missing, misdirected and stale links while preserving unrelated skills', t => {
  const root = fixture(t);
  const skill = addSkill(root, 'game-feel');
  assert.throws(() => linkSkills(root), /Missing skill link/);
  const links = join(root, '.agents/skills');
  mkdirSync(join(links, 'personal-skill'), { recursive: true });
  symlinkSync(skill, join(links, 'game-feel'), 'dir');
  assert.throws(() => linkSkills(root), /already exists/);
  rmSync(join(links, 'game-feel'));
  linkSkills(root, { write: true });
  rmSync(skill, { recursive: true });
  addSkill(root, 'playtest');
  assert.throws(() => linkSkills(root, { write: true }), /Stale Pocket Studio link/);
  assert.equal(existsSync(join(links, 'personal-skill')), true);
  assert.equal(existsSync(join(links, 'playtest')), false);
});

test('an uninitialized submodule gives setup instructions instead of using the parent repository', t => {
  const root = fixture(t);
  rmSync(join(root, 'tools/pocket-studio/.git'));
  assert.throws(() => linkSkills(root, { write: true }), /npm run skills:setup/);
});
