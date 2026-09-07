import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class InfoPage extends BasePage {
  readonly panel: Locator;
  readonly title: Locator;
  readonly body: Locator;
  readonly closeButton: Locator;
  readonly transflowLink: Locator;
  readonly toggleButton: Locator;

  constructor(page: Page) {
    super(page);

    this.panel = page.locator('.sidebar').filter({
      hasText: 'Справка',
    });

    this.title = this.panel
      .getByText('Справка', {
        exact: true,
      })
      .first();

    this.body = this.panel.locator('.sidebar__body');
    this.closeButton = this.panel.locator('.close-btn');

    this.transflowLink = this.panel.getByRole('link', {
      name: /трансфлоу/i,
    });

    // Кнопка раскрытия Левой Панели
    this.toggleButton = page.locator('button.t-btn_toggle');
  }

  async goto(): Promise<void> {
    await this.open('/#/info');
  }
}
