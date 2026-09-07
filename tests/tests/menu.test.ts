import { expect, test } from '@playwright/test';
import { USERS } from '@data/auth';
import { LoginPage, MenuPage } from '@pages';

const userName = `${USERS.user1.name} ${USERS.user1.surname}`;

test.describe('Боковое меню', () => {
  let loginPage: LoginPage;
  let menuPage: MenuPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);

    // Переиспользуем MenuPage из LoginPage
    menuPage = loginPage.mainMenu;

    await menuPage.goto();
  });

  test.describe('Гостевой режим', { tag: '@no-auth' }, () => {
    test('1. Меню: Открытие, состав и закрытие меню гостя [TESTY-1156]', async ({ page }) => {
      const initialUrl = page.url();

      await menuPage.menuButton.click();

      await expect(menuPage.menu).toBeVisible();
      await expect(menuPage.logo).toBeVisible();
      await expect(menuPage.closeButton).toBeVisible();

      const menuItems = [
        menuPage.routesButton,
        menuPage.stopsButton,
        menuPage.favoritesButton,
        menuPage.newsButton,
        menuPage.pollsButton,
        menuPage.infoButton,
        menuPage.guideButton,
      ];

      for (const menuItem of menuItems) {
        await expect(menuItem).toBeVisible();
      }

      await expect(menuPage.loginButton).toBeVisible();
      await expect(menuPage.logoutButton).toBeHidden();
      await expect(menuPage.profileButton(userName)).toBeHidden();

      await menuPage.closeButton.click();

      await expect(menuPage.menu).toBeHidden();
      await expect(page).toHaveURL(initialUrl);
    });

    test('2. Навигация: Переход в публичные разделы [TESTY-1157]', async ({ page }) => {
      await test.step('Маршруты', async () => {
        await menuPage.menuButton.click();
        await menuPage.routesButton.click();

        await expect(page).toHaveURL(/\/#\/routes\/?$/);

        // Меню закрывается слайдом и остаётся в DOM
        await expect(menuPage.menu).not.toBeInViewport();
      });

      await test.step('Остановки', async () => {
        await menuPage.goto();

        await menuPage.menuButton.click();
        await menuPage.stopsButton.click();

        await expect(page).toHaveURL(/\/#\/stops\/?$/);
        await expect(menuPage.menu).not.toBeInViewport();
      });

      await test.step('Новости', async () => {
        await menuPage.goto();

        await menuPage.menuButton.click();
        await menuPage.newsButton.click();

        await expect(page).toHaveURL(/\/#\/news\/?$/);
        await expect(menuPage.menu).not.toBeInViewport();
      });

      await test.step('Справка', async () => {
        await menuPage.goto();

        await menuPage.menuButton.click();
        await menuPage.infoButton.click();

        await expect(page).toHaveURL(/\/#\/info\/?$/);
        await expect(menuPage.menu).not.toBeInViewport();
      });

      await test.step('Гид по порталу', async () => {
        await menuPage.goto();

        await menuPage.menuButton.click();
        await menuPage.guideButton.click();

        await expect(page).toHaveURL(/\/#\/guide\/?$/);
        await expect(menuPage.menu).not.toBeInViewport();
      });
    });

    test('3. Права: Доступ гостя к «Избранному» и «Опросам» [TESTY-1158]', async ({ page }) => {
      const protectedSections = [
        { name: 'Избранное', button: menuPage.favoritesButton },
        { name: 'Опросы', button: menuPage.pollsButton },
      ];

      for (const [index, section] of protectedSections.entries()) {
        await test.step(section.name, async () => {
          if (index > 0) {
            // После первой проверки модалка входа остаётся открытой
            await menuPage.goto();
            await page.reload();
          }

          await menuPage.menuButton.click();
          await section.button.click();

          await expect(page).toHaveURL(/\/#\/login\/?$/);
          await expect(loginPage.loginModal).toBeVisible();
        });
      }
    });

    test('4. Авторизация: Переход к форме входа из меню [TESTY-1159]', async ({ page }) => {
      await menuPage.menuButton.click();

      await expect(menuPage.loginButton).toBeVisible();
      await expect(menuPage.logoutButton).toBeHidden();

      await menuPage.loginButton.click();

      await expect(page).toHaveURL(/\/#\/login\/?$/);
      await expect(loginPage.loginModal).toBeVisible();
    });

    test('7. Меню: Закрытие кликом вне меню [TESTY-1162]', async ({ page }) => {
      const initialUrl = page.url();
      const viewport = page.viewportSize();

      if (!viewport) {
        throw new Error('Для проверки закрытия меню требуется viewport');
      }

      await menuPage.menuButton.click();
      await expect(menuPage.menu).toBeVisible();

      // Кликаем по свободной области справа от меню
      await page.mouse.click(viewport.width - 20, Math.floor(viewport.height / 2));

      await expect(menuPage.menu).toBeHidden();
      await expect(page).toHaveURL(initialUrl);
    });
  });

  test.describe('Авторизованный режим', { tag: '@auth' }, () => {
    test.beforeEach(async () => {
      if (!USERS.user1.email || !USERS.user1.password) {
        throw new Error('Укажите USER1_EMAIL и USER1_PASSWORD');
      }

      // Подготавливаем авторизованное состояние для @auth
      await loginPage.openLogin();
      await loginPage.login(USERS.user1.email, USERS.user1.password);

      await expect(menuPage.logoutButton).toBeVisible();

      // Тест начинаем с закрытым меню
      if (await menuPage.menu.isVisible()) {
        await menuPage.closeButton.click();
      }
    });

    test('5. Меню: Состояние авторизованного пользователя [TESTY-1160]', async () => {
      await menuPage.menuButton.click();

      await expect(menuPage.profileButton(userName)).toBeVisible();
      await expect(menuPage.profileIcon(userName)).toBeVisible();
      await expect(menuPage.logoutButton).toBeVisible();
      await expect(menuPage.loginButton).toBeHidden();

      await expect(menuPage.favoritesButton).toBeVisible();
      await expect(menuPage.pollsButton).toBeVisible();
    });

    test('6. Права: Доступ авторизованного пользователя к «Избранному» и «Опросам» [TESTY-1161]', async ({ page }) => {
      await test.step('Избранное', async () => {
        await menuPage.menuButton.click();
        await menuPage.favoritesButton.click();

        await expect(page).toHaveURL(/\/#\/favorites\/?$/);

        // Меню закрывается слайдом и остаётся в DOM
        await expect(menuPage.menu).not.toBeInViewport();
      });

      await test.step('Опросы', async () => {
        await menuPage.goto();

        await menuPage.menuButton.click();
        await menuPage.pollsButton.click();

        await expect(page).toHaveURL(/\/#\/polls\/?$/);
        await expect(menuPage.menu).not.toBeInViewport();
      });
    });
  });
});
