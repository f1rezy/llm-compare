import type { ApiConstructor, ApiPayload, ApiResponse } from './api.ts';
import type { ModelsData } from './models.ts';
import type { GenerateData, GenerateRequest } from './generation.ts';

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

export type GenerateApi = ApiConstructor<
    '/api/generate',
    ApiPayload<'POST', GenerateRequest>,
    ApiResponse<GenerateData>
>;

export type GenerateStreamApi = ApiConstructor<
    '/api/stream',
    ApiPayload<'POST', GenerateRequest>,
    ApiResponse<never>
>;
