// Neon Harbor entry program (make.fun "Make GTA 6").
// Takes this repository's game/ and screenshots/ and lays them out in the
// grader's output directory, then writes dossier.json with the kit's
// buildDossier. Node 22, standard library only.
//
// The output directory is only ever created, never removed: the grader
// mounts it, so removing it fails the run. Everything here is deterministic
// (sorted copies, no clock, no randomness), so two runs agree byte for byte.
import { copyFileSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildDossier } from './vendor/makefun-game.ts';

const home = dirname(fileURLToPath(import.meta.url));
const target = process.env.MAKEFUN_OUTPUT_DIR || '/output';

function copyTree(fromDir: string, toDir: string): void {
  mkdirSync(toDir, { recursive: true });
  const names = readdirSync(fromDir).sort();
  for (const name of names) {
    const srcPath = join(fromDir, name);
    const dstPath = join(toDir, name);
    if (statSync(srcPath).isDirectory()) copyTree(srcPath, dstPath);
    else copyFileSync(srcPath, dstPath);
  }
}

function run(): void {
  copyTree(join(home, 'game'), join(target, 'game'));
  copyTree(join(home, 'screenshots'), join(target, 'screenshots'));
  const limits = {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  };
  const record = buildDossier(target, limits);
  writeFileSync(join(target, 'dossier.json'), record);
}

run();
