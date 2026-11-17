import { useModels } from './hooks/useModels';
import styles from './App.module.css';
import { Comparison } from './ui/Comparison/Comparison.tsx';

function App() {
    const { state, reload } = useModels();

    return (
        <div className={styles.app}>
            <header className={styles.header}>
                <h1 className={styles.title}>LLM Compare</h1>
            </header>

            <main className={styles.comparison}>
                {state.status === 'loading' && (
                    <p className={styles.message} role="status">
                        Загружаем модели…
                    </p>
                )}

                {state.status === 'error' && (
                    <div className={styles.message}>
                        <p role="alert">{state.error}</p>

                        <button className={styles.retryButton} type="button" onClick={reload}>
                            Попробовать снова
                        </button>
                    </div>
                )}

                {state.status === 'success' &&
                    (state.data.models.length > 0 ? (
                        <Comparison data={state.data} />
                    ) : (
                        <p className={styles.message}>Сейчас нет доступных моделей</p>
                    ))}
            </main>
        </div>
    );
}

export default App;
