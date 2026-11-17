/** Базовый интерфейс для API ответа */
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
}

export type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface ApiPayload<TMethod extends Method = Method, TBody = unknown> extends RequestInit {
    method: TMethod;
    payload?: TBody;
}

export interface ApiConstructor<
    TPathname extends string,
    TPayload extends ApiPayload,
    TResponse extends ApiResponse,
> {
    payload: TPayload;
    pathname: TPathname;
    response: TResponse;
}
