import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class GuidePage extends BasePage {
  readonly guide: Locator;
  readonly sidebar: Locator;
  readonly title: Locator;
  readonly slides: Locator;
  readonly previousButton: Locator;
  readonly nextButton: Locator;
  readonly slideCounter: Locator;
  readonly moreDetailsButton: Locator;
  readonly closeButton: Locator;
  readonly faq: Locator;
  readonly faqQuestions: Locator;

  constructor(page: Page) {
    super(page);

    this.guide = page.locator('.guide');
    this.sidebar = this.guide.locator('.sidebar');

    this.title = this.sidebar.getByText('Гид портала Транспорт Севера');

    this.slides = this.sidebar.locator('.slide');

    this.previousButton = this.sidebar.locator('.counter button').filter({
      has: page.getByAltText('arrow_left'),
    });

    this.nextButton = this.sidebar.locator('.counter button').filter({
      has: page.getByAltText('arrow_right'),
    });

    this.slideCounter = this.sidebar.locator('.counter');

    this.moreDetailsButton = this.sidebar.getByRole('button', {
      name: 'Подробнее',
    });

    this.closeButton = this.sidebar.locator('.close-btn');

    this.faq = this.sidebar.locator('.guide__nav');
    this.faqQuestions = this.faq.getByRole('button');
  }

  async goto(): Promise<void> {
    await this.open('/#/guide');
  }

  faqAnswer(id: string): Locator {
    return this.guide.locator(`.guide-item:has(h2#${id})`);
  }
}
