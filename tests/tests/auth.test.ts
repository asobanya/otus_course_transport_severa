import { expect, test } from '@playwright/test';

import { createRegistrationUser, INVALID_REGISTRATION_DATA, MESSAGES, USERS } from '@data/auth';

import { LoginPage, MenuPage } from '@pages';

const user1 = USERS.user1;
const user1Name = `${user1.name} ${user1.surname}`;

test.describe('Авторизация и регистрация', () => {
  let loginPage: LoginPage;
  let menuPage: MenuPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);

    // MenuPage уже создан внутри LoginPage
    menuPage = loginPage.mainMenu;

    await loginPage.goto();
  });

  test.describe('Регистрация', { tag: '@no-auth' }, () => {
    test.beforeEach(async () => {
      await loginPage.openRegistration();
      await expect(loginPage.registrationModal).toBeVisible();
    });

    test('1. Регистрация: Валидация обязательных полей и граничных значений [TESTY-1132]', async () => {
      await test.step('Проверить элементы формы', async () => {
        await expect(loginPage.nameInput).toBeVisible();
        await expect(loginPage.surnameInput).toBeVisible();
        await expect(loginPage.registrationEmailInput).toBeVisible();
        await expect(loginPage.registrationPasswordInput).toBeVisible();
        await expect(loginPage.passwordConfirmationInput).toBeVisible();
        await expect(loginPage.submitRegistrationButton).toBeVisible();
      });

      await test.step('Отправить пустую форму', async () => {
        await loginPage.submitRegistrationButton.click();

        await expect(loginPage.registrationModal).toBeVisible();

        await expect(loginPage.flashError).toBeVisible();
        await expect(loginPage.flashError).toContainText(MESSAGES.invalidRegistration);
      });

      await test.step('Проверить поле «Имя»', async () => {
        for (const value of INVALID_REGISTRATION_DATA.names) {
          await loginPage.nameInput.fill(value);

          await expect(loginPage.nameGroup).toHaveClass(/t-input-group_error/);
        }

        await loginPage.nameInput.fill('Ан');

        await expect(loginPage.nameGroup).not.toHaveClass(/t-input-group_error/);
      });

      await test.step('Проверить поле «Почта»', async () => {
        for (const value of INVALID_REGISTRATION_DATA.emails) {
          await loginPage.registrationEmailInput.fill(value);

          await expect(loginPage.registrationEmailGroup).toHaveClass(/t-input-group_error/);
        }

        await loginPage.registrationEmailInput.fill('validation_user@testtransflow.ru');

        await expect(loginPage.registrationEmailGroup).not.toHaveClass(/t-input-group_error/);
      });

      await test.step('Проверить поле «Пароль»', async () => {
        for (const value of INVALID_REGISTRATION_DATA.passwords) {
          await loginPage.registrationPasswordInput.fill(value);

          await expect(loginPage.registrationPasswordGroup).toHaveClass(/t-input-group_error/);
        }

        await loginPage.registrationPasswordInput.fill('12345');

        await expect(loginPage.registrationPasswordGroup).not.toHaveClass(/t-input-group_error/);
      });

      await test.step('Проверить несовпадение паролей', async () => {
        await loginPage.registrationPasswordInput.fill('Password123!');

        await loginPage.passwordConfirmationInput.fill('AnotherPassword123!');

        await expect(loginPage.passwordConfirmationGroup).toHaveClass(/t-input-group_error/);

        await loginPage.passwordConfirmationInput.fill('Password123!');

        await expect(loginPage.passwordConfirmationGroup).not.toHaveClass(/t-input-group_error/);
      });
    });

    test('2. Регистрация: Создание нового пользователя и автозаполнение формы входа [TESTY-1133]', async ({ page }) => {
      const user = createRegistrationUser();

      await loginPage.fillRegistration(user);
      await loginPage.submitRegistrationButton.click();

      await expect(loginPage.flashSuccess).toBeVisible();
      await expect(loginPage.flashSuccess).toContainText(MESSAGES.registrationSuccess);

      await expect(loginPage.loginModal).toBeVisible();
      await expect(page).toHaveURL(/\/#\/login\/?$/);

      await expect(loginPage.authEmailInput).toHaveValue(user.email);
      await expect(loginPage.authPasswordInput).toHaveValue(user.password);

      await loginPage.submitLoginButton.click();

      await expect(loginPage.flashSuccess).toContainText(MESSAGES.loginSuccess);
      await expect(loginPage.loginModal).toBeHidden();
    });

    test('3. Регистрация: Запрет регистрации с уже существующим Email [TESTY-1134]', async () => {
      test.skip(!user1.email, 'Укажите USER1_EMAIL в .env');

      const user = createRegistrationUser({
        name: 'Тест',
        surname: 'Пользователь',
        email: user1.email,
      });

      await loginPage.fillRegistration(user);
      await loginPage.submitRegistrationButton.click();

      await expect(loginPage.registrationModal).toBeVisible();

      // Flash показывает ошибку и сам исчезает
      await expect(loginPage.flashError).toBeVisible();
      await expect(loginPage.flashError).toContainText(MESSAGES.registrationError);
      await expect(loginPage.flashError).toBeHidden({
        timeout: 15_000,
      });
    });
  });

  test.describe('Вход', { tag: '@no-auth' }, () => {
    test.beforeEach(async () => {
      await loginPage.openLogin();
      await expect(loginPage.loginModal).toBeVisible();
    });

    test('4. Авторизация: Неверные учетные данные и повторные ошибки входа [TESTY-1135]', async () => {
      test.skip(!user1.email || !user1.password, 'Укажите данные User 1 в .env');

      await test.step('Проверить элементы формы входа', async () => {
        await expect(loginPage.loginWithYandexButton).toBeVisible();
        await expect(loginPage.loginWithVkButton).toBeVisible();

        await expect(loginPage.authEmailInput).toBeVisible();
        await expect(loginPage.authPasswordInput).toBeVisible();
        await expect(loginPage.rememberMeCheckbox).toBeVisible();
        await expect(loginPage.submitLoginButton).toBeVisible();
      });

      await test.step('Вход с неверным паролем', async () => {
        await loginPage.login(user1.email, 'WrongPassword123!');

        await expect(loginPage.loginModal).toBeVisible();

        // Flash показывает ошибку и сам исчезает
        await expect(loginPage.flashError).toBeVisible();
        await expect(loginPage.flashError).toContainText(MESSAGES.invalidCredentials);
        await expect(loginPage.flashError).toBeHidden({
          timeout: 15_000,
        });
      });

      await test.step('Вход с незарегистрированным Email', async () => {
        await loginPage.login(`unknown_${Date.now()}@testtransflow.ru`, 'pass12345');

        await expect(loginPage.loginModal).toBeVisible();
        await expect(loginPage.flashError).toBeVisible();
        await expect(loginPage.flashError).toContainText(MESSAGES.invalidCredentials);

        // Закрываем flash перед следующей проверкой
        await loginPage.flashError.getByRole('button').click();

        await expect(loginPage.flashError).toBeHidden();
      });

      await test.step('Повторные ошибочные попытки', async () => {
        for (let attempt = 1; attempt <= 5; attempt += 1) {
          await loginPage.login(user1.email, 'WrongPassword123!');

          await expect(loginPage.loginModal).toBeVisible();
          await expect(loginPage.flashError).toBeVisible();
          await expect(loginPage.flashError).toContainText(MESSAGES.invalidCredentials);

          // Не ждём автоскрытия пять раз
          await loginPage.flashError.getByRole('button').click();

          await expect(loginPage.flashError).toBeHidden();
        }

        await expect(loginPage.captcha).toHaveCount(0);
      });

      await test.step('Вход после ошибочных попыток', async () => {
        await loginPage.login(user1.email, user1.password);

        await expect(loginPage.loginModal).toBeHidden();

        await expect(loginPage.flashSuccess).toContainText(MESSAGES.loginSuccess);

        await expect(menuPage.logoutButton).toBeVisible();
      });
    });

    test('5. Авторизация: Успешный вход по Email и паролю [TESTY-1136]', async () => {
      test.skip(!user1.email || !user1.password, 'Укажите данные User 1 в .env');

      await loginPage.login(user1.email, user1.password);

      await expect(loginPage.loginModal).toBeHidden();

      await expect(loginPage.flashSuccess).toBeVisible();
      await expect(loginPage.flashSuccess).toContainText(MESSAGES.loginSuccess);

      await expect(menuPage.menu).toBeVisible();
      await expect(menuPage.profileButton(user1Name)).toBeVisible();
      await expect(menuPage.profileIcon(user1Name)).toBeVisible();
      await expect(menuPage.logoutButton).toBeVisible();
      await expect(menuPage.loginButton).toBeHidden();
    });
  });

  test.describe('Сессии', { tag: '@no-auth' }, () => {
    test.skip('6. Сессия: Сохранение авторизации с чекбоксом «Оставаться в системе» [TESTY-1137]', async () => {
      // TODO: пока работает некорректно, тест временно отключён
    });

    test.skip('7. Сессия: Завершение авторизации без чекбокса «Оставаться в системе» [TESTY-1138]', async () => {
      // TODO: пока работает некорректно, тест временно отключён
    });
  });

  test.describe('Авторизованный пользователь', { tag: '@auth' }, () => {
    test.beforeEach(async () => {
      if (!user1.email || !user1.password) {
        throw new Error('Укажите USER1_EMAIL и USER1_PASSWORD');
      }

      // Подготавливаем авторизованного пользователя
      await loginPage.openLogin();

      await loginPage.login(user1.email, user1.password);

      await expect(menuPage.logoutButton).toBeVisible();

      // Тест начинаем с закрытым меню
      if (await menuPage.menu.isVisible()) {
        await menuPage.closeButton.click();
        await expect(menuPage.menu).not.toBeInViewport();
      }
    });

    test('8. Авторизация: Выход из системы [TESTY-1139]', async ({ page }) => {
      await menuPage.menuButton.click();

      await expect(menuPage.profileButton(user1Name)).toBeVisible();
      await expect(menuPage.profileIcon(user1Name)).toBeVisible();
      await expect(menuPage.logoutButton).toBeVisible();
      await expect(menuPage.loginButton).toBeHidden();

      await menuPage.logoutButton.click();

      await expect(menuPage.profileButton(user1Name)).toBeHidden();
      await expect(menuPage.logoutButton).toBeHidden();
      await expect(menuPage.loginButton).toBeVisible();

      // Проверяем защищённый раздел после logout
      await menuPage.goto();
      await page.reload();

      await menuPage.menuButton.click();
      await menuPage.favoritesButton.click();

      await expect(page).toHaveURL(/\/#\/login\/?$/);
    });
  });

  test.describe('OAuth', { tag: ['@no-auth', '@oauth'] }, () => {
    test.skip('9. OAuth: Авторизация через VK ID [TESTY-1140]', async () => {
      // TODO: добавить автоматизацию OAuth через VK
    });

    test.skip('10. OAuth: Авторизация через Yandex ID [TESTY-1141]', async () => {
      // TODO: добавить автоматизацию OAuth через Яндекс
    });
  });

  test.describe('Выход из сохранённой сессии', { tag: '@no-auth' }, () => {
    test.skip('11. Сессия: Выход после авторизации с «Оставаться в системе» [TESTY-1281]', async () => {
      // TODO: сохранённая сессия пока работает некорректно
    });
  });
});
