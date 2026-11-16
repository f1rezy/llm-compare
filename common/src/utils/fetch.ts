import type { ApiConstructor, ApiPayload, ApiResponse } from '../types/api.ts';

type ApiDefinition = ApiConstructor<string, ApiPayload, ApiResponse>;

export class HttpError extends Error {
    readonly response: Response;

    constructor(response: Response) {
        super(`HTTP ${response.status}: ${response.statusText}`);
        this.name = 'HttpError';
        this.response = response;
    }
}

function preparePayload(options: ApiPayload): RequestInit {
    const { payload, body, headers: initialHeaders, ...rest } = options;
    const headers = new Headers(initialHeaders);

    if (body != null && payload !== undefined) {
        throw new TypeError('Нельзя одновременно передавать body и payload');
    }

    let requestBody = body;

    if (payload !== undefined) {
        requestBody = JSON.stringify(payload);

        if (requestBody === undefined) {
            throw new TypeError('Payload нельзя сериализовать в JSON');
        }

        if (!headers.has('Content-Type')) {
            headers.set('Content-Type', 'application/json');
        }
    }

    return {
        ...rest,
        headers,
        body: requestBody,
    };
}

export async function fetchResponse<TApi extends ApiDefinition>(
    pathname: TApi['pathname'],
    options: TApi['payload']
): Promise<Response> {
    const response = await fetch(pathname, preparePayload(options));

    if (!response.ok) {
        throw new HttpError(response);
    }

    return response;
}

/**
 * Запросить JSON данные
 * @typeParam TApi полное описание запроса
 * @param pathname Запрос
 * @param options Опции запроса
 * @returns Ответ запроса
 */
export async function fetchJSON<TApi extends ApiDefinition>(
    pathname: TApi['pathname'],
    options: TApi['payload']
): Promise<TApi['response']> {
    const response = await fetchResponse<TApi>(pathname, options);

    return response.json();
}
