import { useState, type FormEvent } from 'react';
import styles from './PromptInput.module.css';

interface PromptInputProps {
    onSubmit: (prompt: string) => void;
    onStop: () => void;
    isGenerating: boolean;
}

export function PromptInput({ onSubmit, onStop, isGenerating }: PromptInputProps) {
    const [value, setValue] = useState('');
    const actionLabel = isGenerating ? 'Остановить генерацию' : 'Отправить запрос';

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const prompt = value.trim();

        if (!prompt || isGenerating) {
            return;
        }

        onSubmit(prompt);
        setValue('');
    }

    return (
        <form className={styles.form} onSubmit={handleSubmit}>
            <textarea
                className={styles.input}
                aria-label="Запрос ко всем моделям"
                placeholder="Задайте вопрос всем моделям"
                rows={2}
                value={value}
                onChange={(event) => setValue(event.target.value)}
                disabled={isGenerating}
            />

            <button
                className={styles.submit}
                type={isGenerating ? 'button' : 'submit'}
                onClick={isGenerating ? onStop : undefined}
                disabled={!isGenerating && !value.trim()}
                aria-label={actionLabel}
                title={actionLabel}
            >
                <span aria-hidden="true">{isGenerating ? '■' : '↑'}</span>
            </button>
        </form>
    );
}
