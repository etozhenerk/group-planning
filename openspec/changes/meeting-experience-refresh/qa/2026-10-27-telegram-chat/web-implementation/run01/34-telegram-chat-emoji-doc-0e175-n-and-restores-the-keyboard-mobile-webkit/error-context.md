# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 34-telegram-chat.spec.ts >> emoji dock preserves selection, supports repeated insertion and restores the keyboard
- Location: tests/34-telegram-chat.spec.ts:6:1

# Error details

```
Error: expect(locator).toHaveValue(expected) failed

Locator:  getByRole('textbox', { name: 'Сообщение', exact: true })
Expected: "Возьму 🍕 и чай завтра"
Received: "Возьму 🍕  завтраи чай"
Timeout:  5000ms

Call log:
  - Expect "toHaveValue" getByRole('textbox', { name: 'Сообщение', exact: true }) with timeout 5000ms
  - waiting for getByRole('textbox', { name: 'Сообщение', exact: true })
    14 × locator resolved to <textarea rows="1" maxlength="4000" aria-label="Сообщение" placeholder="Сообщение…">Возьму 🍕  завтраи чай</textarea>
       - unexpected value "Возьму 🍕  завтраи чай"

```

```yaml
- textbox "Сообщение":
  - /placeholder: Сообщение…
  - text: Возьму 🍕 завтраи чай
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { apiCreate, login } from '@tests/helpers';
  3   | 
  4   | test.use({ hasTouch: true });
  5   | 
  6   | test('emoji dock preserves selection, supports repeated insertion and restores the keyboard', async ({
  7   |   page,
  8   | }) => {
  9   |   await page.setViewportSize({ width: 390, height: 844 });
  10  |   await login(page, 'Саша');
  11  |   const { meeting } = await apiCreate(page, 'Док эмодзи');
  12  |   await page.goto(`/meetings/${meeting.id}`);
  13  |   const input = page.getByRole('textbox', { name: 'Сообщение', exact: true });
  14  |   await input.fill('Возьму чай завтра');
  15  |   await input.evaluate((element) => {
  16  |     if (element instanceof HTMLTextAreaElement) {
  17  |       element.setSelectionRange(7, 10);
  18  |       element.dispatchEvent(new Event('select', { bubbles: true }));
  19  |     }
  20  |   });
  21  |   await page.getByRole('button', { name: 'Выбрать эмодзи', exact: true }).click();
  22  |   const dock = page.getByRole('region', { name: 'Выбор эмодзи', exact: true });
  23  |   const search = dock.getByRole('searchbox', { name: 'Найти эмодзи' });
  24  |   await expect(search).not.toBeFocused();
  25  |   await search.fill('пицца');
  26  |   await dock.getByRole('button', { name: 'Вставить: пицца', exact: true }).click();
  27  |   await dock.getByRole('button', { name: 'Вставить: пицца', exact: true }).click();
  28  |   await expect(input).toHaveValue('Возьму 🍕🍕 завтра');
  29  |   await expect(dock).toBeVisible();
  30  |   await dock
  31  |     .getByRole('button', { name: 'Удалить символ перед курсором сообщения' })
  32  |     .click();
  33  |   await expect(input).toHaveValue('Возьму 🍕 завтра');
  34  |   await page.getByRole('button', { name: 'Вернуться к клавиатуре', exact: true }).click();
  35  |   await expect(dock).toHaveCount(0);
  36  |   await expect(input).toBeFocused();
  37  |   await input.pressSequentially(' и чай');
> 38  |   await expect(input).toHaveValue('Возьму 🍕 и чай завтра');
      |                       ^ Error: expect(locator).toHaveValue(expected) failed
  39  |   await page.getByRole('button', { name: 'Выбрать эмодзи', exact: true }).click();
  40  |   await page.keyboard.press('Escape');
  41  |   await expect(dock).toHaveCount(0);
  42  |   await expect(
  43  |     page.getByRole('button', { name: 'Выбрать эмодзи', exact: true }),
  44  |   ).toBeFocused();
  45  |   await expect(page.getByTestId('feed-message')).toHaveCount(0);
  46  | });
  47  | 
  48  | test('emoji dock and expanded reactions keep the composer usable in compact viewports', async ({
  49  |   page,
  50  | }) => {
  51  |   await page.setViewportSize({ width: 390, height: 844 });
  52  |   await login(page, 'Саша');
  53  |   const { meeting } = await apiCreate(page, 'Панели на маленьком экране');
  54  |   await page.goto(`/meetings/${meeting.id}`);
  55  |   await page.getByLabel('Сообщение', { exact: true }).fill('Принесу игры');
  56  |   await page.getByRole('button', { name: 'Отправить сообщение' }).click();
  57  |   const row = page.getByTestId('feed-message').filter({ hasText: 'Принесу игры' });
  58  |   await expect(row).toBeVisible();
  59  | 
  60  |   for (const viewport of [
  61  |     { width: 320, height: 760 },
  62  |     { width: 390, height: 430 },
  63  |     { width: 844, height: 390 },
  64  |   ]) {
  65  |     await page.setViewportSize(viewport);
  66  |     await page.getByRole('button', { name: 'Выбрать эмодзи', exact: true }).click();
  67  |     const input = page.getByLabel('Сообщение', { exact: true });
  68  |     const dock = page.getByRole('region', { name: 'Выбор эмодзи', exact: true });
  69  |     await expect(input).toBeInViewport({ ratio: 1 });
  70  |     await expect(
  71  |       page.getByRole('button', { name: 'Отправить сообщение' }),
  72  |     ).toBeInViewport({ ratio: 1 });
  73  |     const inputBox = await input.boundingBox();
  74  |     const dockBox = await dock.boundingBox();
  75  |     expect(inputBox && dockBox && inputBox.y + inputBox.height <= dockBox.y).toBe(true);
  76  |     await row.getByRole('button', { name: 'Добавить реакцию' }).click();
  77  |     await expect(dock).toHaveCount(0);
  78  |     const reactions = page.getByRole('dialog', { name: 'Реакция', exact: true });
  79  |     await reactions.getByRole('button', { name: 'Все эмодзи' }).click();
  80  |     await expect(reactions).toBeInViewport({ ratio: 1 });
  81  |     await expect(input).toBeInViewport({ ratio: 1 });
  82  |     await page.keyboard.press('Escape');
  83  |     await expect(row.getByRole('button', { name: 'Добавить реакцию' })).toBeFocused();
  84  |     expect(
  85  |       await page.evaluate(() => document.documentElement.scrollWidth),
  86  |     ).toBeLessThanOrEqual(viewport.width);
  87  |   }
  88  | });
  89  | 
  90  | test('settings and sharing return to the same information sheet and retain the draft', async ({
  91  |   page,
  92  | }) => {
  93  |   await page.setViewportSize({ width: 390, height: 844 });
  94  |   await login(page, 'Саша');
  95  |   const { meeting } = await apiCreate(page, 'Родительская панель');
  96  |   await page.goto(`/meetings/${meeting.id}`);
  97  |   await page.getByLabel('Сообщение', { exact: true }).fill('Черновик сообщения');
  98  |   await page.getByRole('button', { name: 'Информация о встрече' }).click();
  99  |   const info = page.getByRole('dialog', { name: meeting.title, exact: true });
  100 |   await info.getByRole('button', { name: 'Настройки встречи' }).click();
  101 |   const settings = page.getByRole('dialog', { name: 'Настройки встречи' });
  102 |   await expect(page.locator('dialog:modal')).toHaveCount(1);
  103 |   await settings.getByLabel('Название', { exact: true }).fill('Несохранённое название');
  104 |   await settings.getByRole('button', { name: 'Закрыть', exact: true }).click();
  105 |   await expect(info).toBeVisible();
  106 |   await expect(info.getByRole('button', { name: 'Настройки встречи' })).toBeFocused();
  107 |   await info.getByRole('button', { name: 'Настройки встречи' }).click();
  108 |   await expect(settings.getByLabel('Название', { exact: true })).toHaveValue(
  109 |     'Несохранённое название',
  110 |   );
  111 |   await settings.getByRole('button', { name: 'Закрыть', exact: true }).click();
  112 |   await info.getByRole('button', { name: 'Пригласить друзей' }).click();
  113 |   const share = page.getByRole('dialog', { name: 'Пригласить друзей', exact: true });
  114 |   await expect(page.locator('dialog:modal')).toHaveCount(1);
  115 |   await share.getByRole('button', { name: 'Закрыть', exact: true }).click();
  116 |   await expect(info).toBeVisible();
  117 |   await expect(info.getByRole('button', { name: 'Пригласить друзей' })).toBeFocused();
  118 |   await info.getByRole('button', { name: 'Закрыть', exact: true }).click();
  119 |   await expect(page.getByLabel('Сообщение', { exact: true })).toHaveValue(
  120 |     'Черновик сообщения',
  121 |   );
  122 | });
  123 | 
```