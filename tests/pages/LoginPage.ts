import type { Locator, Page } from '@playwright/test';
import type { RegistrationUser } from '@data/auth';

import { BasePage } from './BasePage';
import { MenuPage } from './MenuPage';

export class LoginPage extends BasePage {
  readonly mainMenu: MenuPage;

  // Вход
  readonly loginModal: Locator;
  readonly loginWithVkButton: Locator;
  readonly loginWithYandexButton: Locator;
  readonly authEmailInput: Locator;
  readonly authPasswordInput: Locator;
  readonly rememberMeCheckbox: Locator;
  readonly submitLoginButton: Locator;
  readonly registrationLink: Locator;

  // Регистрация
  readonly registrationModal: Locator;
  readonly nameInput: Locator;
  readonly surnameInput: Locator;
  readonly registrationEmailInput: Locator;
  readonly registrationPasswordInput: Locator;
  readonly passwordConfirmationInput: Locator;
  readonly submitRegistrationButton: Locator;

  // Группы полей регистрации
  readonly nameGroup: Locator;
  readonly registrationEmailGroup: Locator;
  readonly registrationPasswordGroup: Locator;
  readonly passwordConfirmationGroup: Locator;

  // Уведомления
  readonly flashSuccess: Locator;
  readonly flashError: Locator;
  readonly captcha: Locator;

  constructor(page: Page) {
    super(page);

    this.mainMenu = new MenuPage(page);

    // Форма входа
    this.loginModal = page.locator('.t-modal').filter({
      has: page.locator('.t-modal__title', {
        hasText: /^Вход$/,
      }),
    });

    this.loginWithYandexButton = this.loginModal.getByRole('button', {
      name: 'Я Яндекс',
    });

    this.loginWithVkButton = this.loginModal.getByRole('button', {
      name: 'VK ВКонтакте',
    });

    this.authEmailInput = this.loginModal.getByRole('textbox', {
      name: 'Электронная почта',
    });

    this.authPasswordInput = this.loginModal.getByRole('textbox', {
      name: 'Пароль',
    });

    this.rememberMeCheckbox = this.loginModal.getByRole('checkbox', {
      name: 'Оставаться в системе',
    });

    this.submitLoginButton = this.loginModal.getByRole('button', {
      name: 'Войти',
    });

    this.registrationLink = this.loginModal.getByText('Зарегистрируйтесь');

    // Форма регистрации
    this.registrationModal = page.locator('.t-modal').filter({
      has: page.locator('.t-modal__title', {
        hasText: /^Регистрация$/,
      }),
    });

    this.nameInput = this.registrationModal.getByRole('textbox', {
      name: 'Имя *',
    });

    this.surnameInput = this.registrationModal.getByRole('textbox', {
      name: 'Фамилия',
    });

    this.registrationEmailInput = this.registrationModal.getByRole('textbox', {
      name: 'Электронная почта *',
    });

    this.registrationPasswordInput = this.registrationModal.getByRole('textbox', {
      name: 'Пароль *',
    });

    this.passwordConfirmationInput = this.registrationModal.getByRole('textbox', {
      name: 'Подтверждение пароля *',
    });

    this.submitRegistrationButton = this.registrationModal.getByRole('button', {
      name: 'Зарегистрироваться',
    });

    // Находим группу каждого поля, а класс ошибки проверяем уже в тесте
    const inputGroups = this.registrationModal.locator('.t-input-group');

    this.nameGroup = inputGroups.filter({
      has: page.getByRole('textbox', {
        name: 'Имя *',
      }),
    });

    this.registrationEmailGroup = inputGroups.filter({
      has: page.getByRole('textbox', {
        name: 'Электронная почта *',
      }),
    });

    this.registrationPasswordGroup = inputGroups.filter({
      has: page.getByRole('textbox', {
        name: 'Пароль *',
      }),
    });

    this.passwordConfirmationGroup = inputGroups.filter({
      has: page.getByRole('textbox', {
        name: 'Подтверждение пароля *',
      }),
    });

    // Flash-уведомления
    this.flashSuccess = page.locator('.flash.success').last();
    this.flashError = page.locator('.flash.error').last();

    this.captcha = page.locator('iframe[src*="captcha" i], [class*="captcha" i], [id*="captcha" i]');
  }

  async goto(): Promise<void> {
    await this.open('/#/');
  }

  async openLogin(): Promise<void> {
    await this.mainMenu.menuButton.click();
    await this.mainMenu.loginButton.click();
  }

  async openRegistration(): Promise<void> {
    await this.openLogin();
    await this.registrationLink.click();
  }

  async login(email: string, password: string): Promise<void> {
    await this.authEmailInput.fill(email);
    await this.authPasswordInput.fill(password);
    await this.submitLoginButton.click();
  }

  async fillRegistration(user: RegistrationUser): Promise<void> {
    await this.nameInput.fill(user.name);
    await this.surnameInput.fill(user.surname);
    await this.registrationEmailInput.fill(user.email);
    await this.registrationPasswordInput.fill(user.password);
    await this.passwordConfirmationInput.fill(user.passwordConfirmation);
  }
}
