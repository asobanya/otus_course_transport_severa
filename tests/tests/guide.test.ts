import { test, expect } from '@playwright/test';
import { GuidePage } from '../pages/GuidePage';

let guidePage: GuidePage;

test.beforeEach(async ({ page }) => {
  guidePage = new GuidePage(page);

  await guidePage.goto();
});

test('1. Открытие гида и проверка основных элементов', async () => {
  await expect(guidePage.sidebar).toBeVisible();
  await expect(guidePage.title).toBeVisible();

  await expect(guidePage.previousButton).toBeVisible();
  await expect(guidePage.nextButton).toBeVisible();

  await expect(guidePage.moreDetailsButton).toBeVisible();
  await expect(guidePage.closeGuideButton).toBeVisible();
});

test('2. Листание слайдов и проверка счетчика', async () => {
  await expect(guidePage.slideCounter).toContainText('1 / 9');

  await guidePage.goToNextSlide();

  await expect(guidePage.slideCounter).toContainText('2 / 9');
  await expect(guidePage.visibleSlide).toHaveCount(1);

  await guidePage.goToPreviousSlide();

  await expect(guidePage.slideCounter).toContainText('1 / 9');
});

test('3. Переход в FAQ по кнопке «Подробнее»', async () => {
  await guidePage.openFaq();

  await expect(guidePage.firstSlide).toBeHidden();
  await expect(guidePage.faq).toBeVisible();
  await expect(guidePage.faqQuestions).toHaveCount(8);
});

test('4. Навигация по вопросам FAQ', async () => {
  await guidePage.openFaq();

  await guidePage.selectFaqQuestion(1);

  await expect(guidePage.faqAnswer('p1')).toBeVisible();

  await guidePage.selectFaqQuestion(2);

  await expect(guidePage.faqAnswer('p2')).toBeVisible();
});

test('5. Закрытие панели гида', async () => {
  await guidePage.closeGuide();

  await expect(guidePage.firstSlide).toBeHidden();
  await expect(guidePage.faq).toBeVisible();

  await guidePage.closeGuide();

  await expect(guidePage.guide).toBeHidden();
});