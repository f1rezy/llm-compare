import { useState } from 'react';
import type { ModelsData } from '@llm-compare/common';
import { ModelSelector } from '../ModelSelector/ModelSelector';
import styles from './Comparison.module.css';
import {PromptInput} from "../PromptInput/PromptInput.tsx";

interface ComparisonProps {
    data: ModelsData;
}

interface Column {
    id: string;
    modelId: string;
}

export function Comparison({ data }: ComparisonProps) {
    const defaultModelId = data.models.some(
        (model) => model.id === data.default
    )
        ? data.default
        : (data.models[0]?.id ?? '');

    const [columns, setColumns] = useState<Column[]>(() => [
        {
            id: 'initial',
            modelId: defaultModelId,
        },
    ]);

    function addColumn() {
        const newColumn: Column = {
            id: crypto.randomUUID(),
            modelId: defaultModelId,
        };

        setColumns((previous) => [...previous, newColumn]);
    }

    function changeModel(columnId: string, modelId: string) {
        setColumns((previous) =>
            previous.map((column) =>
                column.id === columnId
                    ? { ...column, modelId }
                    : column
            )
        );
    }

    function removeColumn(columnId: string) {
        setColumns((previous) =>
            previous.length > 1
                ? previous.filter((column) => column.id !== columnId)
                : previous
        );
    }

    const [prompt, setPrompt] = useState('');

    return (
        <section className={styles.root} aria-label="Сравнение моделей">
            {prompt && (
                <div className={styles.promptRow}>
                    <p className={styles.prompt}>{prompt}</p>
                </div>
            )}

            <div className={styles.columns}>
                {columns.map((column, index) => (
                    <section
                        className={styles.column}
                        key={column.id}
                        aria-label={`Колонка ${index + 1}`}
                    >
                        <ModelSelector
                            models={data.models}
                            value={column.modelId}
                            onChange={(modelId) =>
                                changeModel(column.id, modelId)
                            }
                            onRemove={() => removeColumn(column.id)}
                            canRemove={columns.length > 1}
                        />

                        <div className={styles.placeholder}>
                            {prompt
                                ? 'Генерация ответов пока не подключена'
                                : 'Здесь появится ответ модели'}
                        </div>
                    </section>
                ))}

                <button
                    className={styles.addButton}
                    type="button"
                    onClick={addColumn}
                >
                <span className={styles.addIcon} aria-hidden="true">
                    +
                </span>
                    Добавить модель
                </button>
            </div>

            <div className={styles.composer}>
                <PromptInput onSubmit={setPrompt} />
            </div>
        </section>
    );
}
