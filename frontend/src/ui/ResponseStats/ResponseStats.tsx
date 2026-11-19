import type { TokenUsage } from '@llm-compare/common';
import styles from './ResponseStats.module.css';

interface ResponseStatsProps {
    usage: TokenUsage;
    durationMs: number;
    isFastest: boolean;
    isCheapest: boolean;
    estimatedCostUsd?: number;
}

const tokenFormatter = new Intl.NumberFormat('ru-RU');

const durationFormatter = new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
});

const costFormatter = new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
});

export function ResponseStats({
    usage,
    durationMs,
    isFastest,
    isCheapest,
    estimatedCostUsd,
}: ResponseStatsProps) {
    const metrics = [
        { label: 'Входные токены', value: usage.inputTokens },
        { label: 'Выходные токены', value: usage.outputTokens },
        { label: 'Всего токенов', value: usage.totalTokens },
        { label: 'Токены рассуждений', value: usage.reasoningTokens },
        { label: 'Входные из кэша', value: usage.cachedInputTokens },
    ];

    return (
        <dl className={styles.stats} aria-label="Статистика ответа">
            <div className={styles.item}>
                <dt>Время ответа</dt>
                <dd>
                    {durationFormatter.format(durationMs / 1000)} с
                    {isFastest && <span className={styles.highlight}>Самый быстрый</span>}
                </dd>
            </div>

            <div className={styles.item}>
                <dt>Оценка стоимости</dt>
                <dd>
                    {estimatedCostUsd === undefined
                        ? 'Недоступна'
                        : costFormatter.format(estimatedCostUsd)}
                    {isCheapest && <span className={styles.highlight}>Самый дешёвый</span>}
                </dd>
            </div>

            {metrics.map(({ label, value }) =>
                value !== undefined ? (
                    <div className={styles.item} key={label}>
                        <dt>{label}</dt>
                        <dd>{tokenFormatter.format(value)}</dd>
                    </div>
                ) : null
            )}
        </dl>
    );
}
