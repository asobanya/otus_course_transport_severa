# UI-тесты портала «Транспорт Севера»

Учебный проект на TypeScript + Playwright с использованием Page Object Model.

## Сценарии

1. Открытие гида.
2. Листание слайдов.
3. Переход в FAQ.
4. Навигация по вопросам FAQ.
5. Закрытие панели гида.

## Page Object

Page Object реализован через классы:

```text
BasePage
   ↑
GuidePage
```

`GuidePage` содержит локаторы, действия пользователя и состояние страницы.

Для POM выбран подход через классы, так как он удобнее для инкапсуляции, переиспользования и поддержки кода.

## Запуск

```bash
npm install
npx playwright install chromium
npm test
```

Проверка TypeScript:

```bash
npm run type-check
```