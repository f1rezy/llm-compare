import { useState, type FormEvent } from 'react';
import styles from './PromptInput.module.css';

interface PromptInputProps {
    onSubmit: (prompt: string) => void;
    disabled?: boolean;
}

export function PromptInput({
                                onSubmit,
                                disabled = false,
                            }: PromptInputProps) {
    const [value, setValue] = useState('');

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const prompt = value.trim();

        if (!prompt || disabled) {
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
                disabled={disabled}
            />

            <button
                className={styles.submit}
                type="submit"
                disabled={disabled || !value.trim()}
                aria-label="Отправить запрос"
                title="Отправить запрос"
            >
                <span aria-hidden="true">↑</span>
            </button>
        </form>
    );
}
