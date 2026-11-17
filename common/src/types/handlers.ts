import type { ApiConstructor, ApiPayload, ApiResponse } from './api.ts';
import type { ModelsData } from './models.ts';

export type PingApi = ApiConstructor<
    '/api/ping',
    ApiPayload<'GET', never>,
    ApiResponse<{ message: 'pong' }>
>;

export type ModelsApi = ApiConstructor<
    '/api/models',
    ApiPayload<'GET', never>,
    ApiResponse<ModelsData>
>;
