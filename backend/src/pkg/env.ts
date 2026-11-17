type NodeEnv = 'development' | 'production' | 'test';

interface BackendEnvValues {
    port: number;
    nodeEnv: NodeEnv;
    aiApiUrl: string;
    aiApiAuthorization: string;
    aiApiTimeoutMs: number;
}

export class BackendEnv {
    private static instance: BackendEnv | null = null;

    private readonly values: BackendEnvValues;

    private constructor(env: NodeJS.ProcessEnv) {
        this.values = this.parseAndValidate(env);
    }

    public static getInstance(): BackendEnv {
        if (BackendEnv.instance === null) {
            BackendEnv.instance = new BackendEnv(process.env);
        }

        return BackendEnv.instance;
    }

    public get port(): number {
        return this.values.port;
    }

    public get nodeEnv(): NodeEnv {
        return this.values.nodeEnv;
    }

    public get aiApiUrl(): string {
        return this.values.aiApiUrl;
    }

    public get aiApiAuthorization(): string {
        return this.values.aiApiAuthorization;
    }

    public get aiApiTimeoutMs(): number {
        return this.values.aiApiTimeoutMs;
    }

    private parseAndValidate(env: NodeJS.ProcessEnv): BackendEnvValues {
        const port = this.parsePositiveInteger(env.PORT ?? '3001', 'PORT');

        if (port > 65535) {
            throw new Error('PORT должен быть в диапазоне от 1 до 65535');
        }

        const nodeEnv = env.NODE_ENV?.trim() ?? 'development';

        if (nodeEnv !== 'development' && nodeEnv !== 'production' && nodeEnv !== 'test') {
            throw new Error('NODE_ENV должен быть "development", "production" или "test"');
        }

        const aiApiUrl = this.parseHttpUrl(
            this.requireString(env.AI_API_URL, 'AI_API_URL'),
            'AI_API_URL'
        );

        const aiApiAuthorization = this.requireString(
            env.AI_API_AUTHORIZATION,
            'AI_API_AUTHORIZATION'
        );

        const aiApiTimeoutMs = this.parsePositiveInteger(
            env.AI_API_TIMEOUT_MS ?? '10000',
            'AI_API_TIMEOUT_MS'
        );

        // Максимальная задержка таймеров Node.js.
        if (aiApiTimeoutMs > 2_147_483_647) {
            throw new Error('AI_API_TIMEOUT_MS не должен превышать 2147483647');
        }

        return {
            port,
            nodeEnv,
            aiApiUrl,
            aiApiAuthorization,
            aiApiTimeoutMs,
        };
    }

    private requireString(value: string | undefined, key: string): string {
        const trimmed = value?.trim();

        if (!trimmed) {
            throw new Error(`Не задана обязательная переменная окружения: ${key}`);
        }

        return trimmed;
    }

    private parsePositiveInteger(value: string, key: string): number {
        const trimmed = value.trim();
        const parsed = Number(trimmed);

        if (!/^\d+$/.test(trimmed) || !Number.isSafeInteger(parsed) || parsed <= 0) {
            throw new Error(`${key} должен быть положительным целым числом`);
        }

        return parsed;
    }

    private parseHttpUrl(value: string, key: string): string {
        let url: URL;

        try {
            url = new URL(value);
        } catch {
            throw new Error(`${key} должен быть корректным URL`);
        }

        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
            throw new Error(`${key} должен использовать HTTP или HTTPS`);
        }

        if (url.username || url.password || url.search || url.hash) {
            throw new Error(
                `${key} не должен содержать логин, пароль, параметры запроса или фрагмент`
            );
        }

        return url.href.replace(/\/+$/, '');
    }
}
