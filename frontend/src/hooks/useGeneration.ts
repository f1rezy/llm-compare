import { useEffect, useRef, useState } from 'react';
import type { GenerateData } from '@llm-compare/common';
import { streamText } from '../api/generation';

export type GenerationState =
    | { status: 'idle' }
    | { status: 'loading'; text: string }
    | { status: 'stopped'; text: string }
    | { status: 'success'; data: GenerateData; durationMs: number; firstChunkMs?: number }
    | { status: 'error'; error: string };

interface GenerationColumn {
    id: string;
    modelId: string;
}

interface ActiveGeneration {
    controller: AbortController;
    receivedText: string;
}

type GenerationStates = Partial<Record<string, GenerationState>>;

const REVEAL_INTERVAL_MS = 40;

function revealNextWords(visibleText: string, receivedText: string): string {
    const remaining = receivedText.slice(visibleText.length);
    const nextWords = remaining.match(/^(?:\s*\S+\s+){1,3}/u)?.[0];

    return visibleText + (nextWords ?? '');
}

export function useGeneration() {
    const [states, setStates] = useState<GenerationStates>({});
    const requestsRef = useRef(new Map<string, ActiveGeneration>());

    useEffect(() => {
        const requests = requestsRef.current;

        return () => {
            requests.forEach(({ controller }) => controller.abort());
            requests.clear();
        };
    }, []);

    async function generateColumn(
        column: GenerationColumn,
        prompt: string,
        request: ActiveGeneration
    ) {
        const { signal } = request.controller;
        const startedAt = performance.now();

        let visibleText = '';
        let revealTimer: number | undefined;
        let firstChunkMs: number | undefined;

        function updateColumn(state: GenerationState) {
            setStates((previous) =>
                signal.aborted ? previous : { ...previous, [column.id]: state }
            );
        }

        function clearRevealTimer() {
            window.clearTimeout(revealTimer);
            revealTimer = undefined;
        }

        function scheduleReveal() {
            if (revealTimer !== undefined || signal.aborted) {
                return;
            }

            const nextText = revealNextWords(visibleText, request.receivedText);

            if (nextText === visibleText) {
                return;
            }

            revealTimer = window.setTimeout(() => {
                revealTimer = undefined;
                visibleText = nextText;
                updateColumn({ status: 'loading', text: visibleText });
                scheduleReveal();
            }, REVEAL_INTERVAL_MS);
        }

        signal.addEventListener('abort', clearRevealTimer, { once: true });

        try {
            const events = streamText({ prompt, model: column.modelId }, signal);
            let finalState: GenerationState | undefined;

            for await (const event of events) {
                if (signal.aborted) {
                    return;
                }

                switch (event.type) {
                    case 'text-delta':
                        if (event.delta) {
                            firstChunkMs ??= performance.now() - startedAt;
                            request.receivedText += event.delta;
                            scheduleReveal();
                        }
                        break;
                    case 'finish':
                        clearRevealTimer();
                        finalState = {
                            status: 'success',
                            data: {
                                text: request.receivedText,
                                usage: event.usage,
                                estimatedCostUsd: event.estimatedCostUsd,
                            },
                            durationMs: performance.now() - startedAt,
                            firstChunkMs,
                        };
                        break;
                    case 'error':
                        clearRevealTimer();
                        finalState = { status: 'error', error: event.message };
                        break;
                }
            }

            if (finalState) {
                updateColumn(finalState);
            }
        } catch {
            if (!signal.aborted) {
                updateColumn({
                    status: 'error',
                    error: 'Не удалось выполнить запрос. Попробуйте ещё раз.',
                });
            }
        } finally {
            clearRevealTimer();
            signal.removeEventListener('abort', clearRevealTimer);

            if (requestsRef.current.get(column.id) === request) {
                requestsRef.current.delete(column.id);
            }
        }
    }

    function generate(columns: GenerationColumn[], prompt: string) {
        const text = prompt.trim();

        if (!text) {
            return;
        }

        const requests = requestsRef.current;

        requests.forEach(({ controller }) => controller.abort());
        requests.clear();

        const nextStates: GenerationStates = {};

        for (const column of columns) {
            nextStates[column.id] = { status: 'loading', text: '' };
        }

        setStates(nextStates);

        for (const column of columns) {
            const request = { controller: new AbortController(), receivedText: '' };

            requests.set(column.id, request);

            void generateColumn(column, text, request);
        }
    }

    function retryColumn(column: GenerationColumn, prompt: string) {
        const text = prompt.trim();
        const requests = requestsRef.current;

        if (!text || requests.has(column.id)) {
            return;
        }

        const request = { controller: new AbortController(), receivedText: '' };

        requests.set(column.id, request);

        setStates((previous) => ({
            ...previous,
            [column.id]: { status: 'loading', text: '' },
        }));

        void generateColumn(column, text, request);
    }

    function stopGeneration() {
        const requests = requestsRef.current;
        const receivedByColumn = Array.from(requests, ([columnId, { receivedText }]) => ({
            columnId,
            receivedText,
        }));

        requests.forEach(({ controller }) => controller.abort());
        requests.clear();

        setStates((previous) => {
            const next = { ...previous };

            for (const { columnId, receivedText } of receivedByColumn) {
                const state = previous[columnId];

                if (state?.status === 'loading') {
                    next[columnId] = { status: 'stopped', text: receivedText };
                }
            }

            return next;
        });
    }

    function resetColumn(columnId: string) {
        requestsRef.current.get(columnId)?.controller.abort();
        requestsRef.current.delete(columnId);

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
        stopGeneration,
        retryColumn,
        resetColumn,
    };
}
