// Copies the barcode reader's WebAssembly into public/ so it is served from this site rather
// than a public CDN. Runs before `dev` and `build`, so it always matches the installed version.
import { copyFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const source = require.resolve('zxing-wasm/reader/zxing_reader.wasm');
const target = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'wasm', 'zxing_reader.wasm');

mkdirSync(dirname(target), { recursive: true });
copyFileSync(source, target);
console.log('Copied the barcode reader to public/wasm/zxing_reader.wasm');
