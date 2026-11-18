import type { GenerationState } from '../../hooks/useGeneration';
import styles from './ModelResponse.module.css';

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
                    <p className={styles.text}>
                        {state.data.text || 'Модель вернула пустой ответ'}
                    </p>
                </div>
            );
    }
}
