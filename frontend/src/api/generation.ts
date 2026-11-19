import {
    fetchResponse,
    type GenerateRequest,
    type GenerateStreamApi,
    type GenerateStreamEvent,
} from '@llm-compare/common';

function isStreamEvent(event: unknown): event is GenerateStreamEvent {
    if (typeof event !== 'object' || event === null || !('type' in event)) {
        return false;
    }

    switch (event.type) {
        case 'text-delta':
            return 'delta' in event && typeof event.delta === 'string';
        case 'finish':
            return (
                'usage' in event &&
                typeof event.usage === 'object' &&
                event.usage !== null &&
                !Array.isArray(event.usage) &&
                (!('estimatedCostUsd' in event) ||
                    (typeof event.estimatedCostUsd === 'number' &&
                        Number.isFinite(event.estimatedCostUsd)))
            );
        case 'error':
            return 'message' in event && typeof event.message === 'string';
        default:
            return false;
    }
}

function parseStreamEvent(line: string): GenerateStreamEvent {
    const invalidEvent = {
        type: 'error',
        message: 'Сервер вернул неверное событие потока',
    } as const;
    let event: unknown;

    try {
        event = JSON.parse(line);
    } catch {
        return invalidEvent;
    }

    return isStreamEvent(event) ? event : invalidEvent;
}

export async function* streamText(
    payload: GenerateRequest,
    signal?: AbortSignal
): AsyncGenerator<GenerateStreamEvent> {
    const response = await fetchResponse<GenerateStreamApi>('/api/stream', {
        method: 'POST',
        headers: { Accept: 'application/x-ndjson' },
        payload,
        signal,
    });

    if (!response.ok) {
        const data = await response.json().catch(() => undefined);
        yield { type: 'error', message: data?.error || 'Не удалось получить ответ модели' };
        return;
    }

    const contentType = response.headers
        .get('Content-Type')
        ?.split(';', 1)[0]
        ?.trim()
        .toLowerCase();
    if (!response.body || contentType !== 'application/x-ndjson') {
        await response.body?.cancel().catch(() => {});
        yield { type: 'error', message: 'Сервер не вернул поток ответа' };
        return;
    }

    const reader = response.body.getReader();
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

                const event = parseStreamEvent(line);
                yield event;

                if (event.type !== 'text-delta') {
                    return;
                }
            }

            if (done) {
                yield { type: 'error', message: 'Поток ответа завершился без итогового события' };
                return;
            }
        }
    } finally {
        await reader.cancel().catch(() => {});
        reader.releaseLock();
    }
}
