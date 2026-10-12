import fs from 'node:fs';
import path from 'node:path';
const directory = path.resolve('logs');
fs.mkdirSync(directory, { recursive: true });
// Only pass explicit, non-sensitive metadata. Never pass request bodies or headers.
export function log(event, metadata = {}) {
  const line = JSON.stringify({ timestamp: new Date().toISOString(), event, ...metadata });
  fs.appendFileSync(path.join(directory, 'application.log'), `${line}\n`);
}
