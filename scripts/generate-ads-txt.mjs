// Generates ads.txt / app-ads.txt at build time from env — no IDs in git.
//
// Reads (in priority order): VITE_ADMOB_APP_ID, ADMOB_APP_ID, or
// local.properties (admob.appId) for Android-wrapper parity.
// Writes: client/public/ads.txt and client/public/app-ads.txt (both gitignored).
// Skips silently when no ID is configured (dev builds without secrets).

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const clientPublic = join(root, 'client', 'public');

function fromLocalProperties() {
  for (const p of [join(root, 'local.properties'), join(root, 'client', 'local.properties')]) {
    try {
      if (!existsSync(p)) continue;
      const text = readFileSync(p, 'utf8');
      const m = text.match(/admob\.appId\s*=\s*(ca-app-pub-[^\s#]+)/);
      if (m) return m[1].trim();
    } catch {
      /* ignore */
    }
  }
  return '';
}

const appId =
  (process.env.VITE_ADMOB_APP_ID || '').trim() ||
  (process.env.ADMOB_APP_ID || '').trim() ||
  fromLocalProperties();

if (!appId) {
  console.log('[ads-txt] No AdMob app ID configured — skipping ads.txt generation.');
  process.exit(0);
}

const pubMatch = appId.match(/ca-app-pub-(\d+)/);
if (!pubMatch) {
  console.warn(`[ads-txt] Unrecognized app ID format — skipping (got "${appId.slice(0, 12)}…").`);
  process.exit(0);
}

const pubId = pubMatch[1];
const line = `google.com, pub-${pubId}, DIRECT, f08c47fec0942fa0`;

mkdirSync(clientPublic, { recursive: true });
writeFileSync(join(clientPublic, 'ads.txt'), `${line}\n`, 'utf8');
writeFileSync(join(clientPublic, 'app-ads.txt'), `${line}\n`, 'utf8');
console.log(`[ads-txt] Wrote ads.txt + app-ads.txt for pub-${pubId}.`);
