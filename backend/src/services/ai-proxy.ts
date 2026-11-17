import type { ModelsData } from '@llm-compare/common';
import { BackendEnv } from '../pkg/env.ts';
import { AiProxyError } from '../pkg/ai-proxy-error.ts';

export async function getModels(): Promise<ModelsData> {
    const env = BackendEnv.getInstance();
    const signal = AbortSignal.timeout(env.aiApiTimeoutMs);

    let response: Response;

    try {
        response = await fetch(`${env.aiApiUrl}/models`, {
            method: 'GET',
            headers: {
                'x-api-key': env.aiApiAuthorization,
                Accept: 'application/json',
            },
            signal,
            redirect: 'error',
        });
    } catch {
        if (signal.aborted) {
            throw new AiProxyError(504, 'Превышено время ожидания AI Proxy');
        }

        throw new AiProxyError(502, 'Не удалось подключиться к AI Proxy');
    }

    if (!response.ok) {
        await response.body?.cancel().catch(() => {});

        if (response.status === 429) {
            throw new AiProxyError(429, 'Превышен лимит запросов к AI Proxy');
        }

        throw new AiProxyError(502, 'AI Proxy не смог выполнить запрос');
    }

    try {
        return await response.json();
    } catch {
        if (signal.aborted) {
            throw new AiProxyError(504, 'Превышено время ожидания AI Proxy');
        }

        throw new AiProxyError(502, 'Не удалось прочитать JSON-ответ AI Proxy');
    }
}
