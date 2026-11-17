import type { ApiConstructor, ApiPayload, ApiResponse } from '../types/api.ts';

type ApiDefinition = ApiConstructor<string, ApiPayload, ApiResponse>;

type TypedResponse<T> = Omit<Response, 'json'> & {
    json(): Promise<T>;
};

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
        body: requestBody,
        headers,
    };
}

export async function fetchResponse<TApi extends ApiDefinition>(
    pathname: TApi['pathname'],
    options: TApi['payload']
): Promise<TypedResponse<TApi['response']>> {
    return fetch(pathname, preparePayload(options));
}

export async function fetchJSON<TApi extends ApiDefinition>(
    pathname: TApi['pathname'],
    options: TApi['payload']
): Promise<TApi['response']> {
    const response = await fetchResponse<TApi>(pathname, options);

    return response.json();
}
