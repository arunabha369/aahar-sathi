'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, ScanBarcode } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { ApiError, api } from '@/lib/api/client';
import { createBarcodeDetector } from '@/lib/barcodeScanner';
import type { BarcodeProduct } from '@/lib/types';
import type { PickedFood } from './foodTypes';

type Status =
  | { kind: 'idle' }
  | { kind: 'starting' }
  | { kind: 'scanning' }
  | { kind: 'looking-up'; code: string }
  | { kind: 'not-found'; code: string }
  | { kind: 'no-nutrition'; product: BarcodeProduct }
  | { kind: 'error'; message: string };

const SCAN_EVERY_MS = 250;

function cameraMessage(error: unknown): string {
  const name = error instanceof DOMException ? error.name : '';
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return 'Camera access was blocked. Allow it in your browser settings, or type the number under the barcode.';
  }
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'No camera was found. Type the number under the barcode instead.';
  return 'The camera could not start. Type the number under the barcode instead.';
}

/** Find a packaged food by scanning its barcode or typing the number under it. */
export function BarcodeTab({ onPick, onAddOwn }: { onPick: (food: PickedFood) => void; onAddOwn: (name: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [code, setCode] = useState('');

  const stopCamera = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  // Never leave the camera on when the tab or sheet closes.
  useEffect(() => stopCamera, [stopCamera]);

  const lookUp = useCallback(
    async (barcode: string) => {
      stopCamera();
      setStatus({ kind: 'looking-up', code: barcode });
      try {
        const { product } = await api.get<{ product: BarcodeProduct }>(`/foods/barcode/${barcode}`);
        if (!product.per100 && !product.perServing) {
          setStatus({ kind: 'no-nutrition', product });
          return;
        }
        setStatus({ kind: 'idle' });
        onPick({ kind: 'barcode', product });
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) setStatus({ kind: 'not-found', code: barcode });
        else setStatus({ kind: 'error', message: error instanceof ApiError ? error.message : 'The lookup failed. Try again.' });
      }
    },
    [onPick, stopCamera],
  );

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus({ kind: 'error', message: 'The camera needs a secure (https) connection. Type the number under the barcode instead.' });
      return;
    }
    setStatus({ kind: 'starting' });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      streamRef.current = stream;
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();
      const detector = await createBarcodeDetector();
      setStatus({ kind: 'scanning' });

      const tick = async () => {
        if (!streamRef.current) return;
        try {
          const found = (await detector.detect(video)).find((result) => /^\d{8,14}$/.test(result.rawValue));
          if (found) {
            void lookUp(found.rawValue);
            return;
          }
        } catch {
          // A frame that can't be read yet — keep trying.
        }
        timerRef.current = setTimeout(tick, SCAN_EVERY_MS);
      };
      void tick();
    } catch (error) {
      stopCamera();
      setStatus({ kind: 'error', message: cameraMessage(error) });
    }
  };

  const submitCode = () => {
    const digits = code.replace(/\D/g, '');
    if (digits.length < 8 || digits.length > 14) {
      setStatus({ kind: 'error', message: 'A barcode number is 8 to 14 digits.' });
      return;
    }
    void lookUp(digits);
  };

  const cameraOn = status.kind === 'starting' || status.kind === 'scanning';

  return (
    <div>
      <div className={cameraOn ? 'relative overflow-hidden rounded-2xl bg-black ring-1 ring-line' : 'hidden'}>
        <video ref={videoRef} className="aspect-[4/3] w-full object-cover" playsInline muted aria-label="Camera preview" />
        {/* A frame to aim with. */}
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-[12%] top-1/2 h-24 -translate-y-1/2 rounded-xl ring-2 ring-accent/80" />
        <p className="absolute inset-x-0 bottom-0 bg-black/60 px-3 py-2 text-center text-xs font-semibold text-white" aria-live="polite">
          {status.kind === 'starting' ? 'Starting the camera…' : 'Hold the barcode inside the frame'}
        </p>
      </div>

      {cameraOn ? (
        <Button variant="secondary" fullWidth className="mt-3" onClick={() => { stopCamera(); setStatus({ kind: 'idle' }); }}>
          <CameraOff className="size-4" aria-hidden="true" />
          Stop camera
        </Button>
      ) : (
        <Button fullWidth onClick={startCamera}>
          <Camera className="size-4" aria-hidden="true" />
          Scan with camera
        </Button>
      )}

      <form
        className="mt-4 flex items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          submitCode();
        }}
      >
        <div className="flex-1">
          <Field
            label="Or type the barcode number"
            name="barcode"
            inputMode="numeric"
            autoComplete="off"
            placeholder="8901058851298"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            leading={<ScanBarcode className="size-4" aria-hidden="true" />}
          />
        </div>
        <Button type="submit" variant="secondary" size="lg" pending={status.kind === 'looking-up'} className="mb-0.5">
          Look up
        </Button>
      </form>

      <div className="mt-3 min-h-6" aria-live="polite">
        {status.kind === 'looking-up' ? <p className="text-sm text-muted">Looking up {status.code}…</p> : null}
        {status.kind === 'error' ? <p className="text-sm font-semibold text-chilli-700">{status.message}</p> : null}
        {status.kind === 'not-found' ? (
          <div className="rounded-xl bg-surface-2 px-3 py-3 ring-1 ring-line">
            <p className="text-sm text-ink-soft">{status.code} isn’t in the product database yet.</p>
            <Button variant="secondary" size="sm" className="mt-2" onClick={() => onAddOwn('')}>
              Add it as my own food
            </Button>
          </div>
        ) : null}
        {status.kind === 'no-nutrition' ? (
          <div className="rounded-xl bg-surface-2 px-3 py-3 ring-1 ring-line">
            <p className="text-sm text-ink-soft">
              Found <strong className="font-bold text-ink">{status.product.name}</strong>, but it has no nutrition facts yet.
            </p>
            <Button variant="secondary" size="sm" className="mt-2" onClick={() => onAddOwn(status.product.name)}>
              Add it with the label’s numbers
            </Button>
          </div>
        ) : null}
      </div>

      <p className="mt-4 text-xs text-muted">
        Product data from{' '}
        <a href="https://world.openfoodfacts.org" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
          Open Food Facts
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
        , shared under the Open Database License.
      </p>
    </div>
  );
}
