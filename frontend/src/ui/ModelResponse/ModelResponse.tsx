import type { GenerationState } from '../../hooks/useGeneration';
import styles from './ModelResponse.module.css';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ModelResponseProps {
    state: GenerationState;
}

export function ModelResponse({ state }: ModelResponseProps) {
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
                <div className={styles.message} role="alert">
                    {state.error}
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
                </div>
            );
    }
}
