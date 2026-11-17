import type { IncomingMessage, ServerResponse } from 'node:http';
import type { ModelsApi } from '@llm-compare/common';
import { getModels } from '../services/ai-proxy.ts';
import { sendJson } from '../pkg/server.ts';

export async function handleModels(_req: IncomingMessage, res: ServerResponse): Promise<void> {
    const data = await getModels();

    const response: ModelsApi['response'] = {
        success: true,
        data,
    };

    sendJson(res, 200, response);
}
