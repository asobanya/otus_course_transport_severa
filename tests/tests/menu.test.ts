import { test, expect, type Locator, type Page } from '@playwright/test';
import { MenuPage } from '../pages';

type MenuRoute = {
  button: Locator;
  url: RegExp;
};

async function selectMenuRoute(page: Page, menuPage: MenuPage, route: MenuRoute): Promise<void> {
  await menuPage.goto();
  await menuPage.menuButton.click();
  await route.button.click();

  await expect(page).toHaveURL(route.url);
  await expect(menuPage.menu).toBeHidden();
}

test.describe('Боковое меню', () => {
  let menuPage: MenuPage;

  test.beforeEach(async ({ page }) => {
    menuPage = new MenuPage(page);
    await menuPage.goto();
  });

  test.describe('Гостевой режим', { tag: '@no-auth' }, () => {
    test('1. Меню: Открытие, состав и закрытие меню гостя [TESTY-1156]', async ({ page }) => {
      const initialUrl = page.url();

      await menuPage.menuButton.click();

      await expect(menuPage.menu).toBeVisible();
      await expect(menuPage.logo).toBeVisible();
      await expect(menuPage.closeButton).toBeVisible();

      for (const menuItem of [
        menuPage.routesButton,
        menuPage.stopsButton,
        menuPage.favoritesButton,
        menuPage.newsButton,
        menuPage.pollsButton,
        menuPage.infoButton,
        menuPage.guideButton,
      ]) {
        await expect(menuItem).toBeVisible();
      }

      await expect(menuPage.loginButton).toBeVisible();
      await expect(menuPage.logoutButton).toBeHidden();
      await expect(menuPage.profileButton('Иван Иванов')).toBeHidden();

      await menuPage.closeButton.click();

      await expect(menuPage.menu).toBeHidden();
      await expect(page).toHaveURL(initialUrl);
    });

    test('2. Навигация: Переход в публичные разделы [TESTY-1157]', async ({ page }) => {
      const routes: MenuRoute[] = [
        { button: menuPage.routesButton, url: /\/#\/routes\/?$/ },
        { button: menuPage.stopsButton, url: /\/#\/stops\/?$/ },
        { button: menuPage.newsButton, url: /\/#\/news\/?$/ },
        { button: menuPage.infoButton, url: /\/#\/info\/?$/ },
        { button: menuPage.guideButton, url: /\/#\/guide\/?$/ },
      ];

      for (const route of routes) {
        await selectMenuRoute(page, menuPage, route);
      }
    });

    test('3. Права: Доступ гостя к «Избранному» и «Опросам» [TESTY-1158]', async ({ page }) => {
      for (const protectedButton of [menuPage.favoritesButton, menuPage.pollsButton]) {
        await menuPage.goto();
        await menuPage.menuButton.click();
        await protectedButton.click();

        await expect(page).toHaveURL(/\/#\/login\/?$/);
      }
    });

    test('4. Авторизация: Переход к форме входа из меню [TESTY-1159]', async ({ page }) => {
      await menuPage.menuButton.click();

      await expect(menuPage.loginButton).toBeVisible();
      await expect(menuPage.logoutButton).toBeHidden();

      await menuPage.loginButton.click();

      await expect(page).toHaveURL(/\/#\/login\/?$/);
      await expect(menuPage.loginModal).toBeVisible();
    });

    test('7. Меню: Закрытие кликом вне меню [TESTY-1162]', async ({ page }) => {
      const initialUrl = page.url();
      const viewport = page.viewportSize();
      if (!viewport) {
        throw new Error('Для проверки закрытия меню требуется viewport');
      }

      await menuPage.menuButton.click();
      await expect(menuPage.menu).toBeVisible();

      await page.mouse.click(viewport.width - 20, Math.floor(viewport.height / 2));

      await expect(menuPage.menu).toBeHidden();
      await expect(page).toHaveURL(initialUrl);
    });
  });

  test.describe('Авторизованный режим', { tag: '@auth' }, () => {
    const email = process.env.USER1_EMAIL ?? '';
    const password = process.env.USER1_PASSWORD ?? '';
    const userName = 'Иван Иванов';

    test.skip(!email || !password, 'Укажите USER1_EMAIL и USER1_PASSWORD в .env');

    test.beforeEach(async () => {
      await menuPage.login(email, password);
      await expect(menuPage.logoutButton).toBeVisible();
      await menuPage.closeButton.click();
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
      const routes: MenuRoute[] = [
        { button: menuPage.favoritesButton, url: /\/#\/favorites\/?$/ },
        { button: menuPage.pollsButton, url: /\/#\/polls\/?$/ },
      ];

      for (const route of routes) {
        await selectMenuRoute(page, menuPage, route);
      }
    });
  });
});
