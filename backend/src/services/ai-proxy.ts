import type { ModelsData } from '@llm-compare/common';
import { BackendEnv } from '../pkg/env.ts';

export async function getModels(): Promise<ModelsData> {
    const env = BackendEnv.getInstance();

    const response = await fetch(`${env.aiApiUrl}/models`, {
        method: 'GET',
        headers: {
            'x-api-key': env.aiApiAuthorization,
            Accept: 'application/json',
        },
        signal: AbortSignal.timeout(env.aiApiTimeoutMs),
        redirect: 'error',
    });

    if (!response.ok) {
        await response.body?.cancel();

        throw new Error(`AI Proxy вернул HTTP ${response.status}`);
    }

    return response.json();
}
