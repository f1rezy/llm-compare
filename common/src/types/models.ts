export interface ModelPricing {
    input: number;
    output: number;
    cacheRead: number;
    cacheWrite?: number;
}

export interface Model {
    id: string;
    name: string;
    pricing: ModelPricing;
}

export interface ModelsData {
    default: string;
    models: Model[];
}
