import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class MenuPage extends BasePage {
  readonly menuButton: Locator;
  readonly menu: Locator;
  readonly menuHeader: Locator;
  readonly menuBody: Locator;
  readonly closeButton: Locator;
  readonly logo: Locator;

  readonly routesButton: Locator;
  readonly stopsButton: Locator;
  readonly favoritesButton: Locator;
  readonly newsButton: Locator;
  readonly pollsButton: Locator;
  readonly infoButton: Locator;
  readonly guideButton: Locator;

  readonly loginButton: Locator;
  readonly logoutButton: Locator;
  readonly loginModal: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitLoginButton: Locator;

  constructor(page: Page) {
    super(page);

    this.menuButton = page.getByTitle(/Открыть меню/i);
    this.menu = page.locator('.menu');
    this.menuHeader = this.menu.locator('.menu__header');
    this.menuBody = this.menu.locator('.menu__body');
    this.closeButton = this.menuHeader.getByTitle('Закрыть');
    this.logo = this.menuHeader.getByRole('img', { name: 'NorthTransport' });

    const menuList = this.menuBody.locator('.menu-list');
    this.routesButton = menuList.getByRole('button', { name: 'Маршруты' });
    this.stopsButton = menuList.getByRole('button', { name: 'Остановки' });
    this.favoritesButton = menuList.getByRole('button', { name: 'Избранное' });
    this.newsButton = menuList.getByRole('button', { name: 'Новости' });
    this.pollsButton = menuList.getByRole('button', { name: 'Опросы' });
    this.infoButton = menuList.getByRole('button', { name: 'Справка' });
    this.guideButton = menuList.getByRole('button', { name: 'Гид по порталу' });

    this.loginButton = menuList.getByRole('button', { name: 'Вход' });
    this.logoutButton = this.menu.getByRole('button', { name: 'Выход' });

    this.loginModal = page.locator('.t-modal').filter({
      has: page.locator('.t-modal__title', { hasText: /^Вход$/ }),
    });
    this.emailInput = this.loginModal.getByRole('textbox', {
      name: 'Электронная почта',
    });
    this.passwordInput = this.loginModal.getByRole('textbox', {
      name: 'Пароль',
      exact: true,
    });
    this.submitLoginButton = this.loginModal.getByRole('button', {
      name: 'Войти',
      exact: true,
    });
  }

  async goto(): Promise<void> {
    await this.open('/#/');
  }

  async login(email: string, password: string): Promise<void> {
    await this.menuButton.click();
    await this.loginButton.click();
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitLoginButton.click();
  }

  profileButton(userName: string): Locator {
    return this.menu.getByRole('button', { name: userName });
  }

  profileIcon(userName: string): Locator {
    return this.profileButton(userName).locator('img, svg, [class*="icon"]').first();
  }
}
