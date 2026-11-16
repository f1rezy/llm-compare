import type { IncomingMessage, ServerResponse } from 'node:http';
import { sendJson } from '../pkg/server.ts';

export function handlePing(_req: IncomingMessage, res: ServerResponse): void {
    sendJson(res, 200, { success: true, data: { message: 'pong' } });
}
