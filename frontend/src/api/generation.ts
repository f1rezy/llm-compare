import { fetchJSON, type GenerateApi, type GenerateRequest } from '@llm-compare/common';

export function generateText(
    payload: GenerateRequest,
    signal?: AbortSignal
): Promise<GenerateApi['response']> {
    return fetchJSON<GenerateApi>('/api/generate', {
        method: 'POST',
        payload,
        signal,
    });
}
