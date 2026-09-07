# 🚌 UI-тесты для портала «Транспорт Севера»

Набор автоматизированных E2E-тестов для веб-портала «Транспорт Севера».
Проект реализован на **TypeScript** и **Playwright** с использованием паттерна **Page Object Model (POM)** и интеграцией с **Testy TMS**.

---

## 🎯 Цель проекта

Автоматизировать ключевые пользовательские UI-сценарии портала «Транспорт Севера» и показать связь автотестов с ручными тест-кейсами в Testy TMS.

### Выбор технологий

- **Playwright Test** — запуск E2E-сценариев и управление браузером;
- **TypeScript** — статическая типизация тестового кода;
- **Page Object Model** — централизованное хранение элементов страниц и повторное использование общей логики;
- **Playwright HTML reporter** — просмотр результатов локального и CI-прогона;
- **Testy TMS** — связь автотестов с ручными кейсами и сохранение результатов выполнения.

---

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
npm ci
npx playwright install chromium
```

### 2. Настройка окружения (`.env`)

Создайте файл `.env` в корне проекта на основе шаблона:

```bash
cp .env.example .env
```

Заполните настройки приложения и Testy TMS:

```dotenv
# URL приложения
BASE_URL=

# Учетные данные Пользователя 1 (Иван Иванов)
USER1_EMAIL=
USER1_PASSWORD=

# Учетные данные Пользователя 2 (Петр Петров)
USER2_EMAIL=
USER2_PASSWORD=

# Testy
TESTY_API_URL=
TESTY_USERNAME=
TESTY_PASSWORD=
TESTY_PROJECT_ID=2
TESTY_PLAN_ID=
```

Файл `.env` находится в `.gitignore` и не должен попадать в Git.

---

## ⌨️ Команды и NPM-скрипты

| Команда               | Описание                                                       |
| :-------------------- | :------------------------------------------------------------- |
| `npm test`            | Запуск всех тестов без отправки результатов в TMS.             |
| `npm run test:headed` | Запуск тестов в браузере.                                      |
| `npm run test:tms`    | Запуск тестов с отправкой результатов в Testy TMS.             |
| `npm run tms-sync`    | Выгрузка тест-кейсов из TMS в Markdown-файлы каталога `docs/`. |
| `npm run type-check`  | Проверка TypeScript.                                           |
| `npm run lint`        | Проверка ESLint с автоматическим исправлением.                 |
| `npm run lint:ci`     | Проверка ESLint без изменения файлов.                          |
| `npm run format`      | Форматирование файлов с помощью Prettier.                      |
| `npm run format:ci`   | Проверка форматирования без изменения файлов.                  |
| `npm run check`       | Последовательный запуск TypeScript, ESLint и Prettier.         |

---

## 📂 Структура проекта

```text
├── scripts/              # Интеграция с TMS
│   ├── tms-reporter.ts   # Отправка результатов тестов
│   └── tms-sync.ts       # Выгрузка тест-кейсов
├── tests/
│   ├── pages/            # Page Object классы и barrel file
│   └── tests/            # Playwright-тесты (*.test.ts)
├── .editorconfig         # Базовые настройки редактора
├── .env.example          # Шаблон переменных окружения
├── .prettierrc           # Настройки форматирования
├── eslint.config.mjs     # Настройки статического анализа
├── playwright.config.ts  # Конфигурация Playwright и TMS-репортера
└── package.json          # Зависимости и команды запуска
```

Каталог `docs/` изначально отсутствует. Скрипт синхронизации создаст его при первой выгрузке из TMS.

---

## 🏗 Архитектура

```text
Playwright Test
│
├── Tests
│   └── пользовательские сценарии и assertions
│
├── Page Objects
│   ├── Page Elements — локаторы
│   └── Page Actions — составные и переиспользуемые действия
│
├── BasePage
│   └── общая логика открытия страниц
│
├── Configuration
│   └── переменные окружения и playwright.config.ts
│
└── Reporting
    ├── Playwright HTML reporter
    └── Testy TMS reporter
```

Проект намеренно не создаёт методы Page Object, которые только повторяют стандартные однострочные действия Playwright. Простые `click`, `fill`, `check` и assertions выполняются непосредственно над локаторами Page Object в spec-файле. В Page Actions выносятся составные, повторяемые и бизнес-значимые действия.

`BasePage` содержит только общую для страниц навигацию. `GuidePage` наследует её и предоставляет публичные `readonly` Page Elements.

---

## 🔄 Интеграция с Testy TMS

### 📥 Выгрузка тест-кейсов из TMS в `.md`

Для загрузки тест-кейсов из TMS в проект:

```bash
# Обновить весь проект (project ID берётся из .env)
npm run tms-sync

# Обновить конкретный проект
npm run tms-sync -- -p 2

# Обновить конкретный suite
npm run tms-sync -- -s 173

# Выгрузить конкретный тест-кейс
npm run tms-sync -- -c 562
```

Скрипт `scripts/tms-sync.ts` авторизуется в Testy, получает тест-кейсы и создает каталог `docs/`. Для каждого suite формируются:

- `README.md` с требованиями и преднастройками suite;
- `TEST-CASES.md` с тест-кейсами, шагами и ожидаемыми результатами.

### 📤 Автоматическая отправка статусов

Для запуска тестов с отправкой результатов укажите ID тест-плана:

```bash
TESTY_PLAN_ID=430 npm run test:tms
```

При запуске `npm run test:tms` переменная `TMS_SYNC=true` подключает репортер `scripts/tms-reporter.ts`. Репортер ищет ID вида `[TESTY-123]` в названии теста, находит соответствующий кейс в тест-плане и отправляет статус `Passed`, `Failed` или `Skipped` в Testy TMS.

Обычный запуск `npm test` не отправляет результаты в TMS.

Все параметры TMS обязательны для соответствующих команд. `TESTY_PLAN_ID` используется только при `npm run test:tms`, поэтому обычному `npm test` настройки Testy не мешают.

Команды `tms-sync` и `test:tms` запускают Node с параметром `--use-system-ca`. Благодаря этому Node использует доверенные сертификаты операционной системы, включая корпоративный CA из системного хранилища, и не требует отключать проверку TLS.

Если корпоративный CA не установлен в системе, укажите файл сертификата явно:

```bash
NODE_EXTRA_CA_CERTS=/полный/путь/company-ca.pem npm run tms-sync
```

Не используйте `NODE_TLS_REJECT_UNAUTHORIZED=0`: он отключает проверку TLS для всего процесса.

---

## 🤖 GitHub Actions

Workflow `.github/workflows/playwright.yml` запускается при push, pull request и вручную через `workflow_dispatch`. Он устанавливает зависимости, выполняет `npm run check`, устанавливает Chromium, запускает Playwright и сохраняет `playwright-report` и `test-results` на 30 дней.

Файл `.env` не загружается в GitHub. В репозитории откройте **Settings → Secrets and variables → Actions** и создайте Repository secrets:

- `BASE_URL`;
- `USER1_EMAIL`;
- `USER1_PASSWORD`;
- `USER2_EMAIL`;
- `USER2_PASSWORD`.

Значения берутся из локального `.env`. Не вставляйте их в workflow или README.

Параметры `TESTY_API_URL`, `TESTY_USERNAME`, `TESTY_PASSWORD`, `TESTY_PROJECT_ID` и `TESTY_PLAN_ID` понадобятся GitHub Actions только для запуска `npm run test:tms`. Текущий внутренний адрес Testy должен быть доступен runner через корпоративную сеть, поэтому для TMS-прогона нужен self-hosted runner или сетевой доступ к Testy.
