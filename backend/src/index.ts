import { createServer } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { sendJson, setCorsHeaders } from './pkg/server.ts';
import { handlePing } from './routes/index.ts';
import { routes } from './config/routes.ts';
import { logger } from './pkg/logger.ts';

const port = Number(process.env.PORT ?? 3001);

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

    sendJson(res, 404, { success: false, error: 'Not found' });
}

export const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    handleRequest(req, res).catch((err: Error) => {
        logger.error({ err: err.message }, 'Ошибка обработки запроса');
        sendJson(res, 500, { success: false, error: 'Internal server error' });
    });
});

if (process.env.NODE_ENV !== 'test') {
    server.listen(port, () => {
        logger.info(`Backend запущен на http://localhost:${port}`);
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
