import { test, expect } from '@playwright/test';
import { GuidePage } from '../pages';

test.describe('Гид портала', () => {
  let guidePage: GuidePage;

  test.beforeEach(async ({ page }) => {
    guidePage = new GuidePage(page);

    await guidePage.goto();
  });

  test('1. Открытие гида и проверка основных элементов [TESTY-1168]', async () => {
    await expect(guidePage.sidebar).toBeVisible();
    await expect(guidePage.title).toBeVisible();

    await expect(guidePage.previousButton).toBeVisible();
    await expect(guidePage.nextButton).toBeVisible();

    await expect(guidePage.moreDetailsButton).toBeVisible();
    await expect(guidePage.closeButton).toBeVisible();
  });

  test('2. Листание слайдов и проверка счетчика [TESTY-1169]', async () => {
    await expect(guidePage.slideCounter).toHaveText('1 / 9');

    await guidePage.nextButton.click();

    await expect(guidePage.slideCounter).toHaveText('2 / 9');
    await expect(guidePage.slides.nth(1)).toBeVisible();

    await guidePage.previousButton.click();

    await expect(guidePage.slideCounter).toHaveText('1 / 9');
  });

  test('3. Переход в FAQ по кнопке «Подробнее» [TESTY-1170]', async () => {
    await guidePage.moreDetailsButton.click();

    await expect(guidePage.slides.first()).toBeHidden();
    await expect(guidePage.faq).toBeVisible();
    await expect(guidePage.faqQuestions).toHaveCount(8);
  });

  test('4. Навигация по вопросам FAQ [TESTY-1171]', async () => {
    await guidePage.moreDetailsButton.click();

    await guidePage.faqQuestions.first().click();

    await expect(guidePage.faqAnswer('p1')).toBeVisible();

    await guidePage.faqQuestions.nth(1).click();

    await expect(guidePage.faqAnswer('p2')).toBeVisible();
  });

  test('5. Переход из слайдов в FAQ и закрытие гида [TESTY-1172]', async () => {
    await guidePage.closeButton.click();

    await expect(guidePage.slides.first()).toBeHidden();
    await expect(guidePage.faq).toBeVisible();

    await guidePage.closeButton.click();

    await expect(guidePage.guide).toBeHidden();
  });
});
