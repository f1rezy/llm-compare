import type { IncomingMessage } from 'node:http';
import type { GenerateRequest } from '@llm-compare/common';
import { HttpError } from './http-error.ts';
import { readBody } from './server.ts';

function parseGenerateRequest(value: unknown): GenerateRequest {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        throw new HttpError(400, 'Тело запроса должно быть объектом');
    }

    if (!('prompt' in value) || typeof value.prompt !== 'string' || !value.prompt.trim()) {
        throw new HttpError(400, 'Поле prompt должно быть непустой строкой');
    }

    if (!('model' in value) || typeof value.model !== 'string' || !value.model.trim()) {
        throw new HttpError(400, 'Поле model должно быть непустой строкой');
    }

    return {
        prompt: value.prompt.trim(),
        model: value.model.trim(),
    };
}

export async function readGenerateRequest(req: IncomingMessage): Promise<GenerateRequest> {
    return parseGenerateRequest(await readBody(req));
}
