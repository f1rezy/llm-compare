import { once } from 'node:events';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { GenerateStreamApi, GenerateStreamEvent } from '@llm-compare/common';
import { AiProxyError } from '../pkg/ai-proxy-error.ts';
import { readGenerateRequest } from '../pkg/generate-request.ts';
import { HttpError } from '../pkg/http-error.ts';
import { logger } from '../pkg/logger.ts';
import { sendJson } from '../pkg/server.ts';
import { streamText } from '../services/ai-proxy.ts';

export async function handleStream(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const controller = new AbortController();
    const { signal } = controller;
    const onClose = () => controller.abort();
    res.once('close', onClose);

    try {
        const payload = await readGenerateRequest(req);
        const events = await streamText(payload, signal);

        res.writeHead(200, {
            'Content-Type': 'application/x-ndjson; charset=utf-8',
            'Cache-Control': 'no-cache, no-transform',
            'X-Accel-Buffering': 'no',
        });
        res.flushHeaders();

        for await (const event of events) {
            if (!res.write(JSON.stringify(event) + '\n')) {
                await once(res, 'drain', { signal });
            }
        }

        res.end();
    } catch (error) {
        if (signal.aborted || res.destroyed) {
            return;
        }

        if (!(error instanceof HttpError) && !(error instanceof AiProxyError)) {
            throw error;
        }

        if (error instanceof AiProxyError) {
            logger.warn({ err: error }, 'Не удалось получить поток ответа');
        }

        if (res.headersSent) {
            const event: GenerateStreamEvent = { type: 'error', message: error.message };
            res.end(JSON.stringify(event) + '\n');
            return;
        }

        const response: GenerateStreamApi['response'] = {
            success: false,
            error: error.message,
        };
        sendJson(res, error.statusCode, response);
    } finally {
        res.off('close', onClose);
        controller.abort();
    }
}
