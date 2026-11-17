import type { ApiConstructor, ApiPayload, ApiResponse } from './api.ts';

export type PingApi = ApiConstructor<
    '/api/ping',
    ApiPayload<'GET', never>,
    ApiResponse<{ message: 'pong' }>
>;
