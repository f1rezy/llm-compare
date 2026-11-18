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
}
