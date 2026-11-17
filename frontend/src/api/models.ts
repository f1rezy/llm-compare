import { fetchJSON, type ModelsApi } from '@llm-compare/common';

export function getModels(signal?: AbortSignal): Promise<ModelsApi['response']> {
    return fetchJSON<ModelsApi>('/api/models', {
        method: 'GET',
        signal,
    });
}
