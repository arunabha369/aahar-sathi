'use client';

import type { BarcodeDetector as BarcodeDetectorPonyfill } from 'barcode-detector/ponyfill';

/** The product barcodes on Indian packaging: EAN-13 (890…) mostly, plus EAN-8 and UPC. */
const FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e'] as const;

type Detector = Pick<BarcodeDetectorPonyfill, 'detect'>;

/**
 * A barcode detector: the browser's own where it has one (Chrome on Android, ChromeOS, macOS),
 * otherwise a WebAssembly build of ZXing, loaded only now and served from this site
 * (public/wasm) rather than a CDN — Safari on iPhone needs this one.
 */
export async function createBarcodeDetector(): Promise<Detector> {
  const native = (globalThis as { BarcodeDetector?: typeof BarcodeDetectorPonyfill }).BarcodeDetector;
  if (native) {
    try {
      const supported = await native.getSupportedFormats();
      const formats = FORMATS.filter((format) => supported.includes(format));
      if (formats.length > 0) return new native({ formats });
    } catch {
      // Fall through to the WebAssembly reader.
    }
  }

  const { BarcodeDetector, prepareZXingModule } = await import('barcode-detector/ponyfill');
  prepareZXingModule({
    overrides: {
      locateFile: (path: string, prefix: string) => (path.endsWith('.wasm') ? '/wasm/zxing_reader.wasm' : prefix + path),
    },
  });
  return new BarcodeDetector({ formats: [...FORMATS] });
}
