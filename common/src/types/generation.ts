export interface GenerateRequest {
    prompt: string;
    model: string;
}

export interface TokenUsage {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    reasoningTokens?: number;
    cachedInputTokens?: number;
}

export interface GenerateData {
    text: string;
    usage: TokenUsage;
    estimatedCostUsd?: number;
}

export type GenerateStreamEvent =
    | { type: 'text-delta'; delta: string }
    | { type: 'finish'; usage: TokenUsage; estimatedCostUsd?: number }
    | { type: 'error'; message: string };
