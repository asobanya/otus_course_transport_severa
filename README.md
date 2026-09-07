# 🚌 UI-тесты портала «Транспорт Севера»

Учебный проект автоматизации UI-сценариев портала «Транспорт Севера».

Стек: **TypeScript**, **Playwright Test**, **Page Object Model**, **Testy TMS**, **Playwright HTML Reporter**.

## Установка

```bash
npm ci
npx playwright install chromium
cp .env.example .env
```

В `.env` необходимо заполнить URL приложения, данные тестового пользователя и параметры Testy.

Файл `.env` добавлен в `.gitignore`.

## Команды

| Команда | Назначение |
| --- | --- |
| `npm test` | Запустить все тесты без отправки результатов в TMS |
| `npm run test:headed` | Запустить тесты в открытом браузере |
| `npm run test:tms` | Запустить тесты и отправить результаты в Testy |
| `npm run tms-sync` | Выгрузить все тест-кейсы проекта Testy в `docs/` |
| `npm run tms-sync -- -s 389` | Выгрузить конкретный suite |
| `npm run tms-sync -- -c 1156` | Выгрузить конкретный тест-кейс |
| `npm run type-check` | Проверить TypeScript |
| `npm run lint` | Запустить ESLint с исправлением |
| `npm run lint:ci` | Проверить ESLint без изменения файлов |
| `npm run format` | Отформатировать проект с Prettier |
| `npm run format:ci` | Проверить форматирование |
| `npm run check` | Выполнить TypeScript, ESLint и Prettier проверки |

## Структура

```text
├── docs/                 # Требования и тест-кейсы из Testy
├── scripts/              # Синхронизация и reporter Testy
├── tests/
│   ├── data/             # Тестовые данные
│   ├── pages/            # Page Objects
│   └── tests/            # Playwright-тесты (*.test.ts)
├── playwright.config.ts
└── package.json
```

`BasePage` содержит общую навигацию.

Page Objects хранят локаторы и составные пользовательские действия. Простые `click`, `fill` и проверки выполняются непосредственно в тестах.

## Testy TMS

Интеграция работает с проектом Testy **2**.

- `tms-sync.ts` выгружает требования и тест-кейсы в `docs/`;
- `tms-reporter.ts` находит ID вида `[TESTY-1156]` в названии теста и отправляет результат в тест-план;
- для `npm run test:tms` в `.env` должен быть указан `TESTY_PLAN_ID`;
- обычный `npm test` не обращается к Testy.

Для корпоративного сертификата TMS используется системное хранилище CA. При необходимости можно указать сертификат через `NODE_EXTRA_CA_CERTS`.

## GitHub Actions

Workflow `.github/workflows/playwright.yml`:

- проверяет TypeScript, ESLint и Prettier;
- устанавливает Chromium;
- запускает Playwright-тесты;
- сохраняет Playwright-отчёт и результаты тестов.

В **Settings → Secrets and variables → Actions** нужно добавить:

- `BASE_URL`;
- `USER1_EMAIL`;
- `USER1_PASSWORD`.
