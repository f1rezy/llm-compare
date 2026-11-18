import { useState } from 'react';
import type { ModelsData } from '@llm-compare/common';
import { useGeneration } from '../../hooks/useGeneration';
import { ModelSelector } from '../ModelSelector/ModelSelector';
import { ModelResponse } from '../ModelResponse/ModelResponse';
import { PromptInput } from '../PromptInput/PromptInput';
import styles from './Comparison.module.css';

const MAX_COLUMNS = 4;

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

    const [columns, setColumns] = useState<Column[]>(() => {
        const secondModelId =
            data.models.find((model) => model.id !== defaultModelId)?.id ?? defaultModelId;

        return [
            { id: 'initial', modelId: defaultModelId },
            { id: 'second', modelId: secondModelId },
        ];
    });

    const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);

    const activeColumnId =
        columns.find((column) => column.id === selectedColumnId)?.id ?? columns[0]?.id;

    const [isAddingModel, setIsAddingModel] = useState(false);

    const [prompt, setPrompt] = useState('');

    const { states, isGenerating, generate, retryColumn, resetColumn } = useGeneration();

    function addColumn(modelId: string) {
        if (!modelId) {
            return;
        }

        const newColumn: Column = {
            id: crypto.randomUUID(),
            modelId,
        };

        setColumns((previous) =>
            previous.length < MAX_COLUMNS ? [...previous, newColumn] : previous
        );
        setIsAddingModel(false);
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

            <div className={styles.tabs} role="group" aria-label="Колонки сравнения">
                {columns.map((column, index) => {
                    const modelName =
                        data.models.find((model) => model.id === column.modelId)?.name ??
                        column.modelId;

                    return (
                        <button
                            key={column.id}
                            className={styles.tab}
                            type="button"
                            aria-label={`${modelName}, колонка ${index + 1}`}
                            aria-pressed={column.id === activeColumnId}
                            onClick={() => setSelectedColumnId(column.id)}
                        >
                            {modelName}
                        </button>
                    );
                })}
            </div>

            <div className={styles.columns}>
                {columns.map((column, index) => (
                    <section
                        className={styles.column}
                        key={column.id}
                        data-active={column.id === activeColumnId}
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

                {columns.length < MAX_COLUMNS &&
                    (isAddingModel ? (
                        <div>
                            <label>
                                Новая модель
                                <select
                                    value=""
                                    onChange={(event) => addColumn(event.currentTarget.value)}
                                >
                                    <option value="" disabled>
                                        Выберите модель
                                    </option>
                                    {data.models.map((model) => (
                                        <option key={model.id} value={model.id}>
                                            {model.name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <button type="button" onClick={() => setIsAddingModel(false)}>
                                Отмена
                            </button>
                        </div>
                    ) : (
                        <button
                            className={styles.addButton}
                            type="button"
                            onClick={() => setIsAddingModel(true)}
                        >
                            <span className={styles.addIcon} aria-hidden="true">
                                +
                            </span>
                            Добавить модель
                        </button>
                    ))}
            </div>

            <div className={styles.composer}>
                <PromptInput onSubmit={handleSubmit} disabled={isGenerating} />
            </div>
        </section>
    );
}
