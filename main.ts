// Leonida Trophy Guide — hand-in program (Node 22, standard library only).
//
// What it does: takes this repository's app/ (the offline guide) and
// screenshots/ (four renders of it in a browser) and lays them out under
// the output directory, then writes dossier.json there — the summary the
// judge reads — using make.fun's vendored dossier library, untouched.
//
// Where the output goes: the MAKEFUN_OUTPUT_DIR environment variable when
// it is set, otherwise /output, which is the grader's mount point.
// Deliberately, this program never deletes the output directory or
// anything inside it: the grader mounts /output as a mount point, and
// removing it fails the run. It only creates the directories it needs
// and copies files into them, so running it twice gives the same dossier.
//
// Try it outside the grader with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Create the destination first; copying into a directory that does not
// exist yet would fail, and mkdirSync with recursive is safe to repeat.
mkdirSync(outputDir, { recursive: true });

// The whole guide goes over as-is: pages, script, styles and data.
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });

// The screenshots go over next, into their own folder under the output.
const shotFolder = join(outputDir, 'screenshots');
mkdirSync(shotFolder, { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), shotFolder, { recursive: true });
}

// The dossier caps match the competition's gate: at most 4 screenshots
// of 256 KiB each, app/ at most 993 entries and 48 MiB, and the judge's
// text budget of 163840 bytes. Only the text budget changes the bytes;
// the rest refuse an entry the scorer would refuse too.
const dossierText = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(outputDir, 'dossier.json'), dossierText);
