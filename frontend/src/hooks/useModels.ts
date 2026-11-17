import { useEffect, useState } from 'react';
import type { ModelsData } from '@llm-compare/common';
import { getModels } from '../api/models';

type ModelsState =
    | { status: 'loading' }
    | { status: 'success'; data: ModelsData }
    | { status: 'error'; error: string };

export function useModels() {
    const [state, setState] = useState<ModelsState>({
        status: 'loading',
    });

    const [requestId, setRequestId] = useState(0);

    useEffect(() => {
        const controller = new AbortController();

        async function loadModels() {
            try {
                const response = await getModels(controller.signal);

                if (controller.signal.aborted) {
                    return;
                }

                if (!response.success || !response.data) {
                    setState({
                        status: 'error',
                        error: response.error || 'Не удалось получить список моделей',
                    });
                    return;
                }

                setState({
                    status: 'success',
                    data: response.data,
                });
            } catch {
                if (controller.signal.aborted) {
                    return;
                }

                setState({
                    status: 'error',
                    error: 'Не удалось загрузить модели. Попробуйте ещё раз.',
                });
            }
        }

        void loadModels();

        return () => {
            controller.abort();
        };
    }, [requestId]);

    function reload() {
        setState({ status: 'loading' });
        setRequestId((previous) => previous + 1);
    }

    return { state, reload };
}
