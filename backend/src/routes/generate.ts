import type { IncomingMessage, ServerResponse } from 'node:http';
import type { GenerateApi } from '@llm-compare/common';
import { generateText } from '../services/ai-proxy.ts';
import { AiProxyError } from '../pkg/ai-proxy-error.ts';
import { HttpError } from '../pkg/http-error.ts';
import { readGenerateRequest } from '../pkg/generate-request.ts';
import { sendJson } from '../pkg/server.ts';
import { logger } from '../pkg/logger.ts';

export async function handleGenerate(req: IncomingMessage, res: ServerResponse): Promise<void> {
    let data: Awaited<ReturnType<typeof generateText>>;

    try {
        const payload = await readGenerateRequest(req);

        data = await generateText(payload);
    } catch (error) {
        if (!(error instanceof HttpError) && !(error instanceof AiProxyError)) {
            throw error;
        }

        if (error instanceof AiProxyError) {
            logger.warn({ err: error }, 'Не удалось сгенерировать ответ');
        }

        const response: GenerateApi['response'] = {
            success: false,
            error: error.message,
        };

        sendJson(res, error.statusCode, response);
        return;
    }

    const response: GenerateApi['response'] = {
        success: true,
        data,
    };

    sendJson(res, 200, response);
}
