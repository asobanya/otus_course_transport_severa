import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class GuidePage extends BasePage {
  private readonly guideContainer: Locator;
  private readonly guideSidebar: Locator;
  private readonly guideTitle: Locator;

  private readonly slides: Locator;
  private readonly activeSlide: Locator;

  private readonly previousSlideButton: Locator;
  private readonly nextSlideButton: Locator;
  private readonly counter: Locator;

  private readonly detailsButton: Locator;
  private readonly closeButton: Locator;

  private readonly faqNavigation: Locator;
  private readonly questions: Locator;

  constructor(page: Page) {
    super(page);

    this.guideContainer = page.locator('.guide');
    this.guideSidebar = page.locator('.guide .sidebar');

    this.guideTitle = this.guideSidebar.getByText(
      'Гид портала Транспорт Севера',
    );

    this.slides = this.guideSidebar.locator('.slide');

    this.activeSlide = this.guideSidebar.locator(
      '.slide:not([style*="display: none"])',
    );

    this.previousSlideButton = this.guideSidebar
      .locator('.counter button')
      .filter({
        has: page.getByAltText('arrow_left'),
      });

    this.nextSlideButton = this.guideSidebar
      .locator('.counter button')
      .filter({
        has: page.getByAltText('arrow_right'),
      });

    this.counter = this.guideSidebar.locator('.counter');

    this.detailsButton = this.guideSidebar.getByRole('button', {
      name: 'Подробнее',
    });

    this.closeButton = this.guideSidebar.locator('.close-btn');

    this.faqNavigation = this.guideSidebar.locator('.guide__nav');

    this.questions = this.faqNavigation.getByRole('button');
  }

  // ===== НАВИГАЦИЯ =====

  async goto(): Promise<void> {
    await this.open('/#/guide');
  }

  // ===== ДЕЙСТВИЯ ПОЛЬЗОВАТЕЛЯ =====

  async goToNextSlide(): Promise<void> {
    await this.nextSlideButton.click();
  }

  async goToPreviousSlide(): Promise<void> {
    await this.previousSlideButton.click();
  }

  async openFaq(): Promise<void> {
    await this.detailsButton.click();
  }

  async selectFaqQuestion(questionNumber: number): Promise<void> {
    await this.questions.nth(questionNumber - 1).click();
  }

  async closeGuide(): Promise<void> {
    await this.closeButton.click();
  }

  // ===== СОСТОЯНИЕ СТРАНИЦЫ =====

  get guide() {
    return this.guideContainer;
  }

  get sidebar() {
    return this.guideSidebar;
  }

  get title() {
    return this.guideTitle;
  }

  get previousButton() {
    return this.previousSlideButton;
  }

  get nextButton() {
    return this.nextSlideButton;
  }

  get moreDetailsButton() {
    return this.detailsButton;
  }

  get closeGuideButton() {
    return this.closeButton;
  }

  get slideCounter() {
    return this.counter;
  }

  get visibleSlide() {
    return this.activeSlide;
  }

  get firstSlide() {
    return this.slides.first();
  }

  get faq() {
    return this.faqNavigation;
  }

  get faqQuestions() {
    return this.questions;
  }

  faqAnswer(id: string): Locator {
    return this.guideContainer.locator(
      `.guide-item:has(h2#${id})`,
    );
  }
}