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
    switch (state.status) {
        case 'idle':
            return <div className={styles.message}>Здесь появится ответ модели</div>;

        case 'loading':
            return (
                <div className={styles.message} role="status">
                    Генерируем ответ…
                </div>
            );

        case 'error':
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

        case 'success':
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
                            {state.data.text || 'Модель вернула пустой ответ'}
                        </Markdown>
                    </div>
                    <ResponseStats
                        usage={state.data.usage}
                        durationMs={state.durationMs}
                        isFastest={isFastest}
                        isCheapest={isCheapest}
                        estimatedCostUsd={state.data.estimatedCostUsd}
                    />
                </div>
            );
    }
}
