import type { ServerResponse } from 'node:http';
import type { IncomingMessage } from 'node:http';
import { HttpError } from './http-error.ts';

const MAX_BODY_BYTES = 64 * 1024;

export function setCorsHeaders(res: ServerResponse): void {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export function sendJson(res: ServerResponse, statusCode: number, data: unknown): void {
    const body = JSON.stringify(data);

    if (body === undefined) {
        throw new TypeError('Response cannot be serialized as JSON');
    }

    res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(body),
    });

    res.end(body);
}

export function readBody(req: IncomingMessage): Promise<unknown> {
    return new Promise((resolve, reject) => {
        let raw = '';
        let size = 0;
        let exceeded = false;

        req.setEncoding('utf8');

        req.on('data', (chunk: string) => {
            if (exceeded) {
                return;
            }

            size += Buffer.byteLength(chunk, 'utf8');

            if (size > MAX_BODY_BYTES) {
                exceeded = true;
                raw = '';
                reject(new HttpError(413, 'Тело запроса слишком большое'));
                return;
            }

            raw += chunk;
        });

        req.on('end', () => {
            if (exceeded) {
                return;
            }

            try {
                const body: unknown = raw ? JSON.parse(raw) : {};
                resolve(body);
            } catch {
                reject(new HttpError(400, 'Неверный формат JSON'));
            }
        });

        req.on('error', reject);
    });
}
