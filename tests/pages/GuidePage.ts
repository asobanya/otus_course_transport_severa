import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class GuidePage extends BasePage {
  private readonly guideContainer: Locator;
  private readonly guideSidebar: Locator;
  private readonly guideTitle: Locator;
  private readonly slides: Locator;
  private readonly currentSlide: Locator;
  private readonly prevSlideButton: Locator;
  private readonly nextSlideButton: Locator;
  private readonly counter: Locator;
  private readonly detailsButton: Locator;
  private readonly closeGuideButton: Locator;
  private readonly faqNav: Locator;
  private readonly questions: Locator;

  constructor(page: Page) {
    super(page);

    this.guideContainer = page.locator('.guide');
    this.guideSidebar = page.locator('.guide .sidebar');

    this.guideTitle = this.guideSidebar.getByText(
      'Гид портала Транспорт Севера',
    );

    this.slides = this.guideSidebar.locator('.slide');

    this.currentSlide = this.guideSidebar.locator(
      '.slide:not([style*="display: none"])',
    );

    this.prevSlideButton = this.guideSidebar
      .locator('.counter button')
      .filter({ has: page.getByAltText('arrow_left') });

    this.nextSlideButton = this.guideSidebar
      .locator('.counter button')
      .filter({ has: page.getByAltText('arrow_right') });

    this.counter = this.guideSidebar.locator('.counter');

    this.detailsButton = this.guideSidebar.getByRole('button', {
      name: 'Подробнее',
    });

    this.closeGuideButton = this.guideSidebar.locator('.close-btn');

    this.faqNav = this.guideSidebar.locator('.guide__nav');
    this.questions = this.faqNav.getByRole('button');
  }

  async goto(): Promise<void> {
    await this.page.goto('/#/guide');
  }

  async goToNextSlide(): Promise<void> {
    await this.nextSlideButton.click();
  }

  async goToPreviousSlide(): Promise<void> {
    await this.prevSlideButton.click();
  }

  async openFaq(): Promise<void> {
    await this.detailsButton.click();
  }

  async selectFaqQuestion(index: number): Promise<void> {
    await this.questions.nth(index).click();
  }

  async closeGuide(): Promise<void> {
    await this.closeGuideButton.click();
  }

  get guide(): Locator {
    return this.guideContainer;
  }

  get sidebar(): Locator {
    return this.guideSidebar;
  }

  get title(): Locator {
    return this.guideTitle;
  }

  get previousButton(): Locator {
    return this.prevSlideButton;
  }

  get nextButton(): Locator {
    return this.nextSlideButton;
  }

  get moreDetailsButton(): Locator {
    return this.detailsButton;
  }

  get closeButton(): Locator {
    return this.closeGuideButton;
  }

  get slideCounter(): Locator {
    return this.counter;
  }

  get activeSlide(): Locator {
    return this.currentSlide;
  }

  get firstSlide(): Locator {
    return this.slides.first();
  }

  get faq(): Locator {
    return this.faqNav;
  }

  get faqQuestions(): Locator {
    return this.questions;
  }

  get firstFaqAnswer(): Locator {
    return this.guideContainer.locator('.guide-item:has(h2#p1)');
  }

  get secondFaqAnswer(): Locator {
    return this.guideContainer.locator('.guide-item:has(h2#p2)');
  }
}