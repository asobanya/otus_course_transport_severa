import { expect, test } from '@playwright/test';
import { INFO_EXPECTED_DATA } from '@data/info';
import { GuidePage, InfoPage } from '@pages';

test.describe('Справка и гид по порталу', () => {
  let guidePage: GuidePage;
  let infoPage: InfoPage;

  test.beforeEach(async ({ page }) => {
    guidePage = new GuidePage(page);
    infoPage = new InfoPage(page);
  });

  test.describe('Гид портала', { tag: '@no-auth' }, () => {
    test.beforeEach(async () => {
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

    test('3. FAQ: Переход из слайдера к списку вопросов [TESTY-1170]', async () => {
      await guidePage.moreDetailsButton.click();

      await expect(guidePage.slides.first()).toBeHidden();
      await expect(guidePage.faq).toBeVisible();
      await expect(guidePage.faqQuestions).toHaveCount(8);
    });

    test('4. FAQ: Навигация по вопросам и отображение ответов [TESTY-1171]', async () => {
      await guidePage.moreDetailsButton.click();

      await guidePage.faqQuestions.first().click();

      await expect(guidePage.faqAnswer('p1')).toBeVisible();

      await guidePage.faqQuestions.nth(1).click();

      await expect(guidePage.faqAnswer('p2')).toBeVisible();
    });

    test('5. Гид: Двухэтапное закрытие панели [TESTY-1172]', async () => {
      await guidePage.closeButton.click();

      await expect(guidePage.slides.first()).toBeHidden();
      await expect(guidePage.faq).toBeVisible();

      await guidePage.closeButton.click();

      await expect(guidePage.guide).toBeHidden();
    });
  });

  test.describe('Справка', { tag: '@no-auth' }, () => {
    test.beforeEach(async () => {
      await infoPage.goto();
    });

    test('6. Справка: Открытие и проверка контента [TESTY-1173]', async () => {
      await test.step('Проверить панель и заголовок', async () => {
        await expect(infoPage.panel).toBeVisible();
        await expect(infoPage.title).toBeVisible();
        await expect(infoPage.title).toHaveText(INFO_EXPECTED_DATA.title);

        await expect(infoPage.closeButton).toBeVisible();
      });

      await test.step('Проверить текст Справки', async () => {
        await expect(infoPage.body).toBeVisible();

        await expect(infoPage.body).toContainText(INFO_EXPECTED_DATA.copyright);

        // Проверяем ключевые части статичного текста отдельно
        for (const text of INFO_EXPECTED_DATA.textSnippets) {
          await expect(infoPage.body).toContainText(text);
        }
      });

      await test.step('Проверить ссылку на Трансфлоу', async () => {
        await expect(infoPage.transflowLink).toBeVisible();

        await expect(infoPage.transflowLink).toHaveAttribute('href', INFO_EXPECTED_DATA.transflowUrl);
      });
    });

    test('7. Справка: Закрытие панели [TESTY-1174]', async ({ page }) => {
      await test.step('Проверить исходное состояние панели', async () => {
        await expect(infoPage.panel).toBeVisible();
        await expect(infoPage.toggleButton).toHaveClass(/active/);
      });

      await test.step('Закрыть панель', async () => {
        await infoPage.closeButton.click();

        await expect(infoPage.panel).toBeHidden();

        // После закрытия возвращаемся на главную
        await expect(page).toHaveURL(/\/#\/?$/);
      });

      await test.step('Проверить кнопку Левой Панели', async () => {
        await expect(infoPage.toggleButton).not.toHaveClass(/active/);
      });
    });
  });
});
