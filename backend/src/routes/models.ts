import type { IncomingMessage, ServerResponse } from 'node:http';
import type { ModelsApi } from '@llm-compare/common';
import { getModels } from '../services/ai-proxy.ts';
import { AiProxyError } from '../pkg/ai-proxy-error.ts';
import { logger } from '../pkg/logger.ts';
import { sendJson } from '../pkg/server.ts';

export async function handleModels(_req: IncomingMessage, res: ServerResponse): Promise<void> {
    let data: Awaited<ReturnType<typeof getModels>>;

    try {
        data = await getModels();
    } catch (error) {
        if (!(error instanceof AiProxyError)) {
            throw error;
        }

        logger.warn({ err: error }, 'Не удалось получить список моделей');

        const response: ModelsApi['response'] = {
            success: false,
            error: error.message,
        };

        sendJson(res, error.statusCode, response);
        return;
    }

    const response: ModelsApi['response'] = {
        success: true,
        data,
    };

    sendJson(res, 200, response);
}
