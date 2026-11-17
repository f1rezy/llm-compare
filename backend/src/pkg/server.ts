import type { ServerResponse } from 'node:http';

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
