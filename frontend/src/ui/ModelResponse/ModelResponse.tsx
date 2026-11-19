import type { GenerationState } from '../../hooks/useGeneration';
import styles from './ModelResponse.module.css';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ResponseStats } from '../ResponseStats/ResponseStats';

interface ModelResponseProps {
    state: GenerationState;
    isFastest: boolean;
    isCheapest: boolean;
    onRetry: () => void;
}

export function ModelResponse({ state, isFastest, isCheapest, onRetry }: ModelResponseProps) {
    if (state.status === 'idle') {
        return <div className={styles.message}>Здесь появится ответ модели</div>;
    }

    if (state.status === 'error') {
        return (
            <div className={styles.message}>
                <div className={styles.errorContent}>
                    <p className={styles.errorText} role="alert">
                        {state.error}
                    </p>

                    <button className={styles.retryButton} type="button" onClick={onRetry}>
                        Попробовать снова
                    </button>
                </div>
            </div>
        );
    }

    const text = state.status === 'success' ? state.data.text : state.text;
    const progressLabel = state.status === 'stopped' ? 'Остановлено' : 'Генерируем ответ…';

    if (state.status !== 'success' && !text) {
        return (
            <div className={styles.message} role="status">
                {progressLabel}
            </div>
        );
    }

    return (
        <div className={styles.response}>
            <div className={styles.markdown}>
                <Markdown
                    remarkPlugins={[remarkGfm]}
                    skipHtml
                    components={{
                        a: ({ href, children }) => (
                            <a href={href} target="_blank" rel="noopener noreferrer">
                                {children}
                            </a>
                        ),
                        table: ({ children }) => (
                            <div className={styles.tableWrapper}>
                                <table>{children}</table>
                            </div>
                        ),
                    }}
                >
                    {text || 'Модель вернула пустой ответ'}
                </Markdown>
            </div>
            {state.status === 'success' ? (
                <ResponseStats
                    usage={state.data.usage}
                    durationMs={state.durationMs}
                    firstChunkMs={state.firstChunkMs}
                    isFastest={isFastest}
                    isCheapest={isCheapest}
                    estimatedCostUsd={state.data.estimatedCostUsd}
                />
            ) : (
                <p className={styles.progress} role="status">
                    {progressLabel}
                </p>
            )}
        </div>
    );
}
