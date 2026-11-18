import type { Model } from '@llm-compare/common';
import styles from './ModelSelector.module.css';

const providerNames = new Map([
    ['openai', 'OpenAI'],
    ['anthropic', 'Anthropic'],
    ['google', 'Google'],
    ['deepseek', 'DeepSeek'],
    ['moonshotai', 'Moonshot AI'],
    ['spacexai', 'SpaceXAI'],
]);

interface ModelSelectorProps {
    models: Model[];
    value: string;
    onChange: (modelId: string) => void;
    onRemove: () => void;
    canRemove: boolean;
}

export function ModelSelector({
    models,
    value,
    onChange,
    onRemove,
    canRemove,
}: ModelSelectorProps) {
    const separatorIndex = value.indexOf('/');
    const providerId = separatorIndex > 0 ? value.slice(0, separatorIndex) : '';
    const providerName = providerNames.get(providerId) ?? providerId;

    return (
        <div className={styles.selector}>
            <div className={styles.field}>
                {providerName && <span className={styles.provider}>{providerName}</span>}

                <select
                    className={styles.input}
                    aria-label="Модель"
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                >
                    <option value="" disabled>
                        Выберите модель
                    </option>

                    {models.map((model) => (
                        <option key={model.id} value={model.id}>
                            {model.name}
                        </option>
                    ))}
                </select>
            </div>

            <button
                className={styles.remove}
                type="button"
                onClick={onRemove}
                disabled={!canRemove}
                aria-label="Удалить колонку"
                title="Удалить колонку"
            >
                <span aria-hidden="true">×</span>
            </button>
        </div>
    );
}
