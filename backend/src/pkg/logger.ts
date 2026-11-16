import pino from 'pino';

const isTestEnv = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;

const pinoOptions: pino.LoggerOptions = {
    level: isTestEnv ? 'silent' : 'info',
};

if (!isTestEnv) {
    pinoOptions.transport = {
        target: 'pino-pretty',
        options: { colorize: true },
    };
}

export const logger = pino(pinoOptions);
