import type {
    GenerateData,
    GenerateRequest,
    ModelPricing,
    ModelsData,
    TokenUsage,
} from '@llm-compare/common';
import { BackendEnv } from '../pkg/env.ts';
import { AiProxyError } from '../pkg/ai-proxy-error.ts';

let latestModels: ModelsData | undefined;

function estimateCostUsd(usage: TokenUsage, pricing: ModelPricing | undefined): number | undefined {
    if (!pricing || pricing.cacheWrite !== undefined || usage.cachedInputTokens !== 0) {
        return undefined;
    }

    const { inputTokens, outputTokens } = usage;

    if (
        inputTokens === undefined ||
        outputTokens === undefined ||
        !Number.isSafeInteger(inputTokens) ||
        !Number.isSafeInteger(outputTokens) ||
        inputTokens < 0 ||
        outputTokens < 0 ||
        !Number.isFinite(pricing.input) ||
        !Number.isFinite(pricing.output) ||
        pricing.input < 0 ||
        pricing.output < 0
    ) {
        return undefined;
    }

    const cost = (inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000;
    return Number.isFinite(cost) ? cost : undefined;
}

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

export async function getModels(): Promise<ModelsData> {
    const data = await requestAiProxy<ModelsData>('/models', {
        method: 'GET',
    });

    latestModels = data;
    return data;
}

export async function generateText(payload: GenerateRequest): Promise<GenerateData> {
    const pricing = latestModels?.models.find(({ id }) => id === payload.model)?.pricing;
    const data = await requestAiProxy<Omit<GenerateData, 'estimatedCostUsd'>>('/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    return { ...data, estimatedCostUsd: estimateCostUsd(data.usage, pricing) };
}
