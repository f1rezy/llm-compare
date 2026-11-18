import type { GenerateData, GenerateRequest, ModelsData } from '@llm-compare/common';
import { BackendEnv } from '../pkg/env.ts';
import { AiProxyError } from '../pkg/ai-proxy-error.ts';

async function requestAiProxy<T>(pathname: string, options: RequestInit): Promise<T> {
    const env = BackendEnv.getInstance();
    const signal = AbortSignal.timeout(env.aiApiTimeoutMs);

    const headers = new Headers(options.headers);
    headers.set('x-api-key', env.aiApiAuthorization);
    headers.set('Accept', 'application/json');

    let response: Response;

    try {
        response = await fetch(`${env.aiApiUrl}${pathname}`, {
            ...options,
            headers,
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

        if (response.status === 400 && pathname === '/generate') {
            throw new AiProxyError(
                400,
                'AI Proxy отклонил запрос. Проверьте выбранную модель и текст запроса'
            );
        }

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

export function getModels(): Promise<ModelsData> {
    return requestAiProxy<ModelsData>('/models', {
        method: 'GET',
    });
}

export function generateText(payload: GenerateRequest): Promise<GenerateData> {
    return requestAiProxy<GenerateData>('/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
}
