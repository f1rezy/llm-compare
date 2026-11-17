import { useId } from 'react';
import type { Model } from '@llm-compare/common';
import styles from './ModelSelector.module.css';

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
    const selectId = useId();

    return (
        <div className={styles.selector}>
            <div className={styles.field}>
                <label className={styles.label} htmlFor={selectId}>
                    Модель
                </label>

                <select
                    className={styles.input}
                    id={selectId}
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
