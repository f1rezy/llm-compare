import type {
    GenerateData,
    GenerateRequest,
    GenerateStreamEvent,
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

async function fetchAiProxy(
    pathname: string,
    options: RequestInit,
    signal: AbortSignal
): Promise<Response> {
    const env = BackendEnv.getInstance();
    const headers = new Headers(options.headers);
    headers.set('x-api-key', env.aiApiAuthorization);

    if (!headers.has('Accept')) {
        headers.set('Accept', 'application/json');
    }

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

        if (response.status === 400 && (pathname === '/generate' || pathname === '/stream')) {
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

    return response;
}

async function requestAiProxy<T>(pathname: string, options: RequestInit): Promise<T> {
    const signal = AbortSignal.timeout(BackendEnv.getInstance().aiApiTimeoutMs);
    const response = await fetchAiProxy(pathname, options, signal);

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

function parseStreamEvent(
    line: string,
    pricing: ModelPricing | undefined
): GenerateStreamEvent | undefined {
    const event: unknown = JSON.parse(line);

    if (
        typeof event !== 'object' ||
        event === null ||
        !('type' in event) ||
        typeof event.type !== 'string'
    ) {
        throw new AiProxyError(502, 'Неверное событие в потоке AI Proxy');
    }

    switch (event.type) {
        case 'text-delta':
            if ('delta' in event && typeof event.delta === 'string') {
                return { type: 'text-delta', delta: event.delta };
            }
            break;
        case 'finish':
            if (
                'usage' in event &&
                typeof event.usage === 'object' &&
                event.usage !== null &&
                !Array.isArray(event.usage)
            ) {
                const rawUsage = event.usage;
                const getCount = (name: keyof TokenUsage) => {
                    const value: unknown = Reflect.get(rawUsage, name);
                    return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
                        ? value
                        : undefined;
                };
                const usage: TokenUsage = {
                    inputTokens: getCount('inputTokens'),
                    outputTokens: getCount('outputTokens'),
                    totalTokens: getCount('totalTokens'),
                    reasoningTokens: getCount('reasoningTokens'),
                    cachedInputTokens: getCount('cachedInputTokens'),
                };
                return { type: 'finish', usage, estimatedCostUsd: estimateCostUsd(usage, pricing) };
            }
            break;
        case 'error':
            return { type: 'error', message: 'AI Proxy прервал генерацию' };
        default:
            return undefined;
    }

    throw new AiProxyError(502, 'Неверное событие в потоке AI Proxy');
}

async function* readStreamEvents(
    body: ReadableStream<Uint8Array>,
    signal: AbortSignal,
    pricing: ModelPricing | undefined
): AsyncGenerator<GenerateStreamEvent> {
    const reader = body.getReader();
    const decoder = new TextDecoder('utf-8', { fatal: true });
    let remainder = '';

    try {
        while (true) {
            const { done, value } = await reader.read();
            const chunk = done ? decoder.decode() : decoder.decode(value, { stream: true });
            const lines = (remainder + chunk).split('\n');
            remainder = done ? '' : (lines.pop() ?? '');

            for (const line of lines) {
                if (!line.trim()) {
                    continue;
                }

                const event = parseStreamEvent(line, pricing);
                if (!event) {
                    continue;
                }

                yield event;
                if (event.type === 'finish' || event.type === 'error') {
                    return;
                }
            }

            if (done) {
                throw new AiProxyError(502, 'Поток AI Proxy завершился без итогового события');
            }
        }
    } catch (error) {
        if (signal.aborted) {
            throw new AiProxyError(504, 'Превышено время ожидания AI Proxy');
        }

        if (error instanceof AiProxyError) {
            throw error;
        }

        throw new AiProxyError(502, 'Не удалось прочитать поток AI Proxy');
    } finally {
        await reader.cancel().catch(() => {});
        reader.releaseLock();
    }
}

export async function streamText(
    payload: GenerateRequest,
    clientSignal: AbortSignal
): Promise<AsyncIterable<GenerateStreamEvent>> {
    const pricing = latestModels?.models.find(({ id }) => id === payload.model)?.pricing;
    const timeout = AbortSignal.timeout(BackendEnv.getInstance().aiApiTimeoutMs);
    const signal = AbortSignal.any([clientSignal, timeout]);
    const response = await fetchAiProxy(
        '/stream',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/x-ndjson',
            },
            body: JSON.stringify(payload),
        },
        signal
    );

    const contentType = response.headers
        .get('Content-Type')
        ?.split(';', 1)[0]
        ?.trim()
        .toLowerCase();
    if (!response.body || contentType !== 'application/x-ndjson') {
        await response.body?.cancel().catch(() => {});
        throw new AiProxyError(502, 'AI Proxy не вернул поток NDJSON');
    }

    return readStreamEvents(response.body, signal, pricing);
}
