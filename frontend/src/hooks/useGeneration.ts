import { useEffect, useRef, useState } from 'react';
import type { GenerateData } from '@llm-compare/common';
import { generateText } from '../api/generation';

export type GenerationState =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'success'; data: GenerateData; durationMs: number }
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

        try {
            const response = await generateText(
                {
                    prompt,
                    model: column.modelId,
                },
                signal
            );

            if (signal.aborted) {
                return;
            }

            const state: GenerationState =
                response.success && response.data
                    ? {
                          status: 'success',
                          data: response.data,
                          durationMs: performance.now() - startedAt,
                      }
                    : {
                          status: 'error',
                          error: response.error || 'Не удалось получить ответ модели',
                      };

            setStates((previous) => ({
                ...previous,
                [column.id]: state,
            }));
        } catch {
            if (signal.aborted) {
                return;
            }

            setStates((previous) => ({
                ...previous,
                [column.id]: {
                    status: 'error',
                    error: 'Не удалось выполнить запрос. Попробуйте ещё раз.',
                },
            }));
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
            nextStates[column.id] = { status: 'loading' };
        }

        setStates(nextStates);

        for (const column of columns) {
            const controller = new AbortController();

            controllers.set(column.id, controller);

            void generateColumn(column, text, controller);
        }
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
        resetColumn,
    };
}
