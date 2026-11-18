import { createServer } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { sendJson, setCorsHeaders } from './pkg/server.ts';
import { handlePing, handleModels, handleGenerate } from './routes/index.ts';
import { routes } from './config/routes.ts';
import { logger } from './pkg/logger.ts';
import { BackendEnv } from './pkg/env.ts';

const env = BackendEnv.getInstance();

async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const { method } = req;
    const pathname = new URL(req.url ?? '/', 'http://localhost').pathname;

    setCorsHeaders(res);

    if (method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (method === 'GET' && pathname === routes.PING) {
        return handlePing(req, res);
    }

    if (method === 'GET' && pathname === routes.MODELS) {
        return handleModels(req, res);
    }

    if (method === 'POST' && pathname === routes.GENERATE) {
        return handleGenerate(req, res);
    }

    sendJson(res, 404, { success: false, error: 'Not found' });
}

export const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    handleRequest(req, res).catch((error: unknown) => {
        const err = error instanceof Error ? error : new Error(String(error));

        logger.error(
            {
                err,
                method: req.method,
                url: req.url,
            },
            'Ошибка обработки запроса'
        );

        if (res.destroyed || res.writableEnded) {
            return;
        }

        if (res.headersSent) {
            res.destroy();
            return;
        }

        sendJson(res, 500, {
            success: false,
            error: 'Internal server error',
        });
    });
});

if (env.nodeEnv !== 'test') {
    server.on('error', (err: Error) => {
        logger.fatal({ err }, 'Ошибка HTTP-сервера');
        process.exit(1);
    });

    server.listen(env.port, () => {
        logger.info(`Backend запущен на http://localhost:${env.port}`);
    });

    function shutdown(signal: string): void {
        logger.info({ signal }, 'Получен сигнал, завершение работы...');
        server.close(() => {
            logger.info('Сервер остановлен');
            process.exit(0);
        });
    }

    process.once('SIGINT', () => shutdown('SIGINT'));
    process.once('SIGTERM', () => shutdown('SIGTERM'));
}
