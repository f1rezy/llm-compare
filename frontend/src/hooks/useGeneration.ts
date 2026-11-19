import { useEffect, useRef, useState } from 'react';
import type { GenerateData } from '@llm-compare/common';
import { streamText } from '../api/generation';

export type GenerationState =
    | { status: 'idle' }
    | { status: 'loading'; text: string }
    | { status: 'success'; data: GenerateData; durationMs: number; firstChunkMs?: number }
    | { status: 'error'; error: string };

interface GenerationColumn {
    id: string;
    modelId: string;
}

type GenerationStates = Partial<Record<string, GenerationState>>;

export function useGeneration() {
    const [states, setStates] = useState<GenerationStates>({});
    const controllersRef = useRef(new Map<string, AbortController>());

    useEffect(() => {
        const controllers = controllersRef.current;

        return () => {
            controllers.forEach((controller) => controller.abort());
            controllers.clear();
        };
    }, []);

    async function generateColumn(
        column: GenerationColumn,
        prompt: string,
        controller: AbortController
    ) {
        const { signal } = controller;
        const startedAt = performance.now();

        let text = '';
        let firstChunkMs: number | undefined;

        function updateColumn(state: GenerationState) {
            setStates((previous) =>
                signal.aborted ? previous : { ...previous, [column.id]: state }
            );
        }

        try {
            const events = streamText({ prompt, model: column.modelId }, signal);

            for await (const event of events) {
                if (signal.aborted) {
                    return;
                }

                switch (event.type) {
                    case 'text-delta':
                        if (event.delta) {
                            firstChunkMs ??= performance.now() - startedAt;
                            text += event.delta;
                            updateColumn({ status: 'loading', text });
                        }
                        break;
                    case 'finish':
                        updateColumn({
                            status: 'success',
                            data: {
                                text,
                                usage: event.usage,
                                estimatedCostUsd: event.estimatedCostUsd,
                            },
                            durationMs: performance.now() - startedAt,
                            firstChunkMs,
                        });
                        return;
                    case 'error':
                        updateColumn({ status: 'error', error: event.message });
                        return;
                }
            }
        } catch {
            if (!signal.aborted) {
                updateColumn({
                    status: 'error',
                    error: 'Не удалось выполнить запрос. Попробуйте ещё раз.',
                });
            }
        } finally {
            if (controllersRef.current.get(column.id) === controller) {
                controllersRef.current.delete(column.id);
            }
        }
    }

    function generate(columns: GenerationColumn[], prompt: string) {
        const text = prompt.trim();

        if (!text) {
            return;
        }

        const controllers = controllersRef.current;

        controllers.forEach((controller) => controller.abort());
        controllers.clear();

        const nextStates: GenerationStates = {};

        for (const column of columns) {
            nextStates[column.id] = { status: 'loading', text: '' };
        }

        setStates(nextStates);

        for (const column of columns) {
            const controller = new AbortController();

            controllers.set(column.id, controller);

            void generateColumn(column, text, controller);
        }
    }

    function retryColumn(column: GenerationColumn, prompt: string) {
        const text = prompt.trim();
        const controllers = controllersRef.current;

        if (!text || controllers.has(column.id)) {
            return;
        }

        const controller = new AbortController();

        controllers.set(column.id, controller);

        setStates((previous) => ({
            ...previous,
            [column.id]: { status: 'loading', text: '' },
        }));

        void generateColumn(column, text, controller);
    }

    function resetColumn(columnId: string) {
        controllersRef.current.get(columnId)?.abort();
        controllersRef.current.delete(columnId);

        setStates((previous) => {
            const next = { ...previous };
            delete next[columnId];
            return next;
        });
    }

    const isGenerating = Object.values(states).some((state) => state?.status === 'loading');

    return {
        states,
        isGenerating,
        generate,
        retryColumn,
        resetColumn,
    };
}
