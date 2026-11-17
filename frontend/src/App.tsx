import { useModels } from './hooks/useModels';
import './App.css';

function App() {
    const { state, reload } = useModels();

    return (
        <div className="app">
            <header className="app-header">
                <h1 className="app-title">LLM Compare</h1>
            </header>

            <main className="comparison">
                {state.status === 'loading' && (
                    <p className="app-message" role="status">
                        Загружаем модели…
                    </p>
                )}

                {state.status === 'error' && (
                    <div className="app-message">
                        <p role="alert">{state.error}</p>

                        <button className="retry-button" type="button" onClick={reload}>
                            Попробовать снова
                        </button>
                    </div>
                )}

                {state.status === 'success' && (
                    <p className="app-message">
                        {state.data.models.length > 0
                            ? 'Выберите модели для сравнения'
                            : 'Сейчас нет доступных моделей'}
                    </p>
                )}
            </main>
        </div>
    );
}

export default App;
