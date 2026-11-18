import { useState } from 'react';
import type { ModelsData } from '@llm-compare/common';
import { useGeneration } from '../../hooks/useGeneration';
import { ModelSelector } from '../ModelSelector/ModelSelector';
import { ModelResponse } from '../ModelResponse/ModelResponse';
import { PromptInput } from '../PromptInput/PromptInput';
import styles from './Comparison.module.css';

interface ComparisonProps {
    data: ModelsData;
}

interface Column {
    id: string;
    modelId: string;
}

export function Comparison({ data }: ComparisonProps) {
    const defaultModelId = data.models.some((model) => model.id === data.default)
        ? data.default
        : (data.models[0]?.id ?? '');

    const [columns, setColumns] = useState<Column[]>(() => [
        {
            id: 'initial',
            modelId: defaultModelId,
        },
    ]);

    const [prompt, setPrompt] = useState('');

    const { states, isGenerating, generate, retryColumn, resetColumn } = useGeneration();

    function addColumn() {
        const newColumn: Column = {
            id: crypto.randomUUID(),
            modelId: defaultModelId,
        };

        setColumns((previous) => [...previous, newColumn]);
    }

    function changeModel(columnId: string, modelId: string) {
        const column = columns.find((item) => item.id === columnId);

        if (!column || column.modelId === modelId) {
            return;
        }

        resetColumn(columnId);

        setColumns((previous) =>
            previous.map((item) => (item.id === columnId ? { ...item, modelId } : item))
        );
    }

    function removeColumn(columnId: string) {
        if (columns.length <= 1) {
            return;
        }

        resetColumn(columnId);

        setColumns((previous) => previous.filter((column) => column.id !== columnId));
    }

    function handleSubmit(value: string) {
        const nextPrompt = value.trim();

        if (!nextPrompt || isGenerating) {
            return;
        }

        setPrompt(nextPrompt);
        generate(columns, nextPrompt);
    }

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
                            onChange={(modelId) => changeModel(column.id, modelId)}
                            onRemove={() => removeColumn(column.id)}
                            canRemove={columns.length > 1}
                        />

                        <ModelResponse
                            state={states[column.id] ?? { status: 'idle' }}
                            onRetry={() => retryColumn(column, prompt)}
                        />
                    </section>
                ))}

                <button className={styles.addButton} type="button" onClick={addColumn}>
                    <span className={styles.addIcon} aria-hidden="true">
                        +
                    </span>
                    Добавить модель
                </button>
            </div>

            <div className={styles.composer}>
                <PromptInput onSubmit={handleSubmit} disabled={isGenerating} />
            </div>
        </section>
    );
}
