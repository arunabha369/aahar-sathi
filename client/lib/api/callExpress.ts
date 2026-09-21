import { IncomingMessage, ServerResponse } from 'node:http';
import { Socket } from 'node:net';
import { getExpressApp } from '@/lib/api/expressApp';

export interface InProcessResponse {
  status: number;
  body: string;
}

/**
 * Runs one GET through the Express API inside this process — no network hop. Express is
 * given genuine Node request/response objects (the kind it rewires per request); only
 * `write`/`end` are captured so the body lands here instead of on a socket.
 */
export function callExpress(url: string, headers: Record<string, string>): Promise<InProcessResponse> {
  return new Promise((resolve, reject) => {
    // There is no real connection, so give the socket the visitor's address: Express reads it
    // for req.ip when it is not trusting proxy headers (development), and rate limiting keys on it.
    const forwardedFor = Object.entries(headers).find(([key]) => key.toLowerCase() === 'x-forwarded-for')?.[1];
    const socket = new Socket();
    Object.defineProperty(socket, 'remoteAddress', {
      value: forwardedFor?.split(',')[0]?.trim() || '127.0.0.1',
    });

    const req = new IncomingMessage(socket);
    req.method = 'GET';
    req.url = url;
    req.headers = Object.fromEntries(Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]));
    req.push(null); // a GET has no body

    const res = new ServerResponse(req);
    const chunks: Buffer[] = [];
    const collect = (chunk: unknown, encoding?: unknown) => {
      if (chunk === undefined || chunk === null || typeof chunk === 'function') return;
      chunks.push(
        Buffer.isBuffer(chunk)
          ? chunk
          : Buffer.from(String(chunk), typeof encoding === 'string' ? (encoding as BufferEncoding) : 'utf8'),
      );
    };

    res.write = ((chunk: unknown, encoding?: unknown) => {
      collect(chunk, encoding);
      return true;
    }) as ServerResponse['write'];

    res.end = ((chunk?: unknown, encoding?: unknown) => {
      collect(chunk, encoding);
      resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString('utf8') });
      res.emit('finish');
      return res;
    }) as ServerResponse['end'];

    try {
      getExpressApp()(req, res);
    } catch (error) {
      reject(error);
    }
  });
}
