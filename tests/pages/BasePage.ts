import type { Page } from '@playwright/test';

export class BasePage {
  constructor(private readonly page: Page) {}

  protected async open(path: string): Promise<void> {
    await this.page.goto(path);
  }
}
