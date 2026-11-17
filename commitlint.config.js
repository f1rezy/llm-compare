export default {
    extends: ['@commitlint/config-conventional'],
    rules: {
        // Тип коммита
        'type-enum': [
            2,
            'always',
            [
                'feat',
                'fix',
                'docs',
                'style',
                'refactor',
                'perf',
                'test',
                'build',
                'ci',
                'chore',
                'revert',
            ],
        ],

        // Тип обязателен и в нижнем регистре
        'type-case': [2, 'always', 'lower-case'],
        'type-empty': [2, 'never'],

        // Scope
        'scope-case': [2, 'always', 'lower-case'],
        'scope-empty': [0], // не обязателен

        // Описание (subject)
        'subject-empty': [2, 'never'],
        'subject-case': [2, 'never', ['sentence-case', 'start-case', 'pascal-case', 'upper-case']],

        // Длина заголовка
        'header-max-length': [2, 'always', 100],

        // Точка в конце запрещена
        'subject-full-stop': [2, 'never', '.'],

        // Пустые строки
        'body-leading-blank': [2, 'always'],
        'footer-leading-blank': [2, 'always'],

        // Разрешаем BREAKING CHANGE
        'footer-max-line-length': [0],
    },
};
