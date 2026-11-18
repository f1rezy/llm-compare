import type { IncomingMessage, ServerResponse } from 'node:http';
import type { GenerateApi, GenerateRequest } from '@llm-compare/common';
import { generateText } from '../services/ai-proxy.ts';
import { AiProxyError } from '../pkg/ai-proxy-error.ts';
import { HttpError } from '../pkg/http-error.ts';
import { readBody } from '../pkg/server.ts';
import { sendJson } from '../pkg/server.ts';
import { logger } from '../pkg/logger.ts';

function parseGenerateRequest(value: unknown): GenerateRequest {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        throw new HttpError(400, 'Тело запроса должно быть объектом');
    }

    if (!('prompt' in value) || typeof value.prompt !== 'string' || !value.prompt.trim()) {
        throw new HttpError(400, 'Поле prompt должно быть непустой строкой');
    }

    if (!('model' in value) || typeof value.model !== 'string' || !value.model.trim()) {
        throw new HttpError(400, 'Поле model должно быть непустой строкой');
    }

    return {
        prompt: value.prompt.trim(),
        model: value.model.trim(),
    };
}

export async function handleGenerate(req: IncomingMessage, res: ServerResponse): Promise<void> {
    let data: Awaited<ReturnType<typeof generateText>>;

    try {
        const body = await readBody(req);
        const payload = parseGenerateRequest(body);

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
