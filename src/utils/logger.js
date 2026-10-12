import fs from 'node:fs';
import path from 'node:path';
const directory = process.env.VERCEL ? '/tmp/comp3123-logs' : path.resolve('logs');
fs.mkdirSync(directory, { recursive: true });
// Only pass explicit, non-sensitive metadata. Never pass request bodies or headers.
export function log(event, metadata = {}) {
  const line = JSON.stringify({ timestamp: new Date().toISOString(), event, ...metadata });
  if (process.env.VERCEL) console.log(line);
  fs.appendFileSync(path.join(directory, 'application.log'), `${line}\n`);
}
