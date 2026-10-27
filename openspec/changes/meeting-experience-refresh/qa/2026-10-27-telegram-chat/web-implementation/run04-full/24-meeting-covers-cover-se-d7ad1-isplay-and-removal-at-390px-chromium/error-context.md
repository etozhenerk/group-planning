# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 24-meeting-covers.spec.ts >> cover selection, validation, display and removal at 390px
- Location: tests/24-meeting-covers.spec.ts:92:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByTestId('conversation-title')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByTestId('conversation-title') with timeout 5000ms
  - waiting for getByTestId('conversation-title')

```

```yaml
- link "К содержимому":
  - /url: "#main"
- text: Демостенд · данные хранятся до перезапуска
- main:
  - link "К моим встречам":
    - /url: /meetings
  - button "Сведения о встрече «Встреча с фото 390»":
    - heading "Встреча с фото 390" [level=1]
    - text: 1 участник · 29 февраля · время пока не выбрано
  - button "Информация о встрече"
  - list "Разговор встречи":
    - listitem:
      - time: Сегодня · 15:31
      - paragraph: Саша создал встречу
    - listitem:
      - time: Сегодня · 15:31
      - paragraph: День встречи уже выбран. Осталось договориться о времени — обсудите его здесь, а организатор добавит в детали встречи.
  - heading "Позовём остальных?" [level=2]
  - paragraph: Отправьте друзьям ссылку на встречу. После ответа «Приду» они появятся в чате.
  - button "Пригласить друзей"
  - button "Добавить к встрече"
  - text: Сообщение
  - textbox "Сообщение":
    - /placeholder: Сообщение…
  - button "Выбрать эмодзи"
  - button "Отправить сообщение" [disabled]
```

# Test source

```ts
  1   | import { createdSchema } from '@/shared/api';
  2   | import { test, expect } from '@playwright/test';
  3   | import type { Page } from '@playwright/test';
  4   | import {
  5   |   apiCreate,
  6   |   apiMeeting,
  7   |   inviteLink,
  8   |   login,
  9   |   setDate,
  10  |   writeHeaders,
  11  | } from '@tests/helpers';
  12  | 
  13  | const photo = async (page: Page, color: string) => ({
  14  |   name: 'cover.png',
  15  |   mimeType: 'image/png',
  16  |   buffer: Buffer.from(
  17  |     await page.evaluate((fill) => {
  18  |       const canvas = document.createElement('canvas');
  19  |       canvas.width = 1920;
  20  |       canvas.height = 1080;
  21  |       const context = canvas.getContext('2d');
  22  | 
  23  |       if (!context) {
  24  |         throw new Error('Canvas unavailable');
  25  |       }
  26  | 
  27  |       context.fillStyle = fill;
  28  |       context.fillRect(0, 0, canvas.width, canvas.height);
  29  |       context.fillStyle = '#fbe4be';
  30  |       context.beginPath();
  31  |       context.arc(960, 540, 240, 0, Math.PI * 2);
  32  |       context.fill();
  33  | 
  34  |       return canvas.toDataURL('image/png').split(',')[1] ?? '';
  35  |     }, color),
  36  |     'base64',
  37  |   ),
  38  | });
  39  | 
  40  | const edit = async (page: Page) => {
> 41  |   await expect(page.getByTestId('conversation-title')).toBeVisible();
      |                                                        ^ Error: expect(locator).toBeVisible() failed
  42  |   const details = page.getByRole('button', { name: 'Информация о встрече' });
  43  | 
  44  |   if (!(await page.getByRole('dialog').isVisible())) {
  45  |     await details.click();
  46  |   }
  47  | 
  48  |   await page
  49  |     .getByRole('dialog')
  50  |     .getByRole('button', {
  51  |       name:
  52  |         (page.viewportSize()?.width ?? 1440) < 740
  53  |           ? 'Настройки встречи'
  54  |           : 'Изменить настройки',
  55  |       exact: true,
  56  |     })
  57  |     .click();
  58  | 
  59  |   return page.getByRole('dialog', { name: 'Настройки встречи' });
  60  | };
  61  | 
  62  | const imageColor = async (page: Page) => {
  63  |   const image = page.getByRole('img', { name: 'Обложка встречи', exact: true }).first();
  64  |   await expect(image).toBeVisible();
  65  |   await expect(image).toHaveAttribute('data-ready', 'true');
  66  | 
  67  |   return image.evaluate((node) => {
  68  |     if (!(node instanceof HTMLImageElement)) {
  69  |       throw new Error('Not an image');
  70  |     }
  71  | 
  72  |     const canvas = document.createElement('canvas');
  73  |     canvas.width = node.naturalWidth;
  74  |     canvas.height = node.naturalHeight;
  75  |     const context = canvas.getContext('2d');
  76  | 
  77  |     if (!context) {
  78  |       throw new Error('No pixels');
  79  |     }
  80  | 
  81  |     context.drawImage(node, 0, 0);
  82  | 
  83  |     return {
  84  |       width: node.naturalWidth,
  85  |       height: node.naturalHeight,
  86  |       rgb: [...context.getImageData(0, 0, 1, 1).data],
  87  |     };
  88  |   });
  89  | };
  90  | 
  91  | for (const width of [320, 390, 1440]) {
  92  |   test(`cover selection, validation, display and removal at ${width}px`, async ({
  93  |     page,
  94  |   }) => {
  95  |     test.setTimeout(60_000);
  96  |     await page.setViewportSize({ width, height: 900 });
  97  |     await login(page, 'Саша');
  98  |     await page.goto('/meetings/new');
  99  |     await page.getByText('Обложка', { exact: true }).click();
  100 |     await page.getByLabel('Название', { exact: true }).fill(`Встреча с фото ${width}`);
  101 |     await setDate(page, '29.02.2028');
  102 |     const file = page.getByLabel('Выбрать фото', { exact: true });
  103 |     await file.setInputFiles(await photo(page, '#a13932'));
  104 |     const preview = page.getByRole('img', { name: 'Выбранная обложка' });
  105 |     await expect(preview).toBeVisible();
  106 |     const original = await preview.getAttribute('src');
  107 |     await file.setInputFiles([]);
  108 |     await expect(preview).toHaveAttribute('src', original ?? '');
  109 |     await file.setInputFiles({
  110 |       name: 'broken.png',
  111 |       mimeType: 'image/png',
  112 |       buffer: Buffer.from('not a photo'),
  113 |     });
  114 |     await expect(
  115 |       page.getByRole('alert').filter({ hasText: 'Не удалось открыть фото' }),
  116 |     ).toBeVisible();
  117 |     await expect(preview).toHaveAttribute('src', original ?? '');
  118 |     await expect(page.getByLabel('Название', { exact: true })).toHaveValue(
  119 |       `Встреча с фото ${width}`,
  120 |     );
  121 |     await page.screenshot({
  122 |       path: `test-results/cover-form-${width}.png`,
  123 |       animations: 'disabled',
  124 |       fullPage: true,
  125 |     });
  126 |     await page.getByRole('button', { name: 'Создать встречу', exact: true }).click();
  127 |     await expect(page.getByLabel('Сообщение', { exact: true })).toBeVisible();
  128 |     const id = page.url().split('/').at(-1) ?? '';
  129 |     const invitation = await inviteLink(page);
  130 |     await page.goto(invitation);
  131 |     const pixels = await imageColor(page);
  132 |     expect(pixels.width).toBe(1600);
  133 |     expect(pixels.height).toBe(900);
  134 |     expect(pixels.rgb[0]).toBeGreaterThan(pixels.rgb[2] ?? 0);
  135 |     await page.screenshot({
  136 |       path: `test-results/cover-invitation-${width}.png`,
  137 |       animations: 'disabled',
  138 |       fullPage: true,
  139 |     });
  140 |     await page.goto(`/meetings/${id}`);
  141 |     let form = await edit(page);
```