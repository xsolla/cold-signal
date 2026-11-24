import { copyFile, mkdir, mkdtemp, rename, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = join(root, 'dist'), output = join(dist, 'arcade');
const files = {
  'index.html': 'public/solo.html',
  'solo.js': 'public/solo.js',
  'solo-session.js': 'src/solo-session.js',
  'bots.js': 'src/bots.js',
  'rules.js': 'src/rules.js',
  'pilot-ui.js': 'public/pilot-ui.js',
  'renderer.js': 'public/renderer.js',
  'cold-signal.js': 'public/cold-signal.js',
  'audio.js': 'public/audio.js',
  'audio-cues.js': 'public/audio-cues.js',
  'audio-score.js': 'public/audio-score.js',
  'audio-chart.js': 'public/audio-chart.js',
  'audio-feedback.js': 'src/audio-feedback.js',
  'style.css': 'public/style.css',
  'icon.svg': 'public/icon.svg',
  'CREDITS.md': 'CREDITS.md',
  LICENSE: 'LICENSE',
  NOTICE: 'NOTICE',
  'docs/history/pocket-studio-NOTICE.txt': 'docs/history/pocket-studio-NOTICE.txt'
};

await mkdir(dist, { recursive: true });
const stage = await mkdtemp(join(dist, '.arcade-'));
try {
  await mkdir(join(stage, 'docs', 'history'), { recursive: true });
  await Promise.all(Object.entries(files).map(([target, source]) => copyFile(join(root, source), join(stage, target))));
  await rm(output, { recursive: true, force: true });
  await rename(stage, output);
} finally {
  await rm(stage, { recursive: true, force: true });
}
process.stdout.write('Built dist/arcade/ with index.html at the root.\n');
