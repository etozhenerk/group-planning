# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 16-dialog-motion.spec.ts >> dialog keeps content and scroll lock until exit ends at 1440px
- Location: tests/16-dialog-motion.spec.ts:5:3

# Error details

```
Error: expect(received).toBeCloseTo(expected, precision)

Expected: 461.796875
Received: 454.90391540527344

Expected precision:    -1
Expected difference: < 5
Received difference:   6.8929595947265625
```

# Page snapshot

```yaml
- generic [ref=f3e3]:
  - link "К содержимому" [ref=f3e4] [cursor=pointer]:
    - /url: "#main"
  - generic [ref=f3e5]: Демостенд · данные хранятся до перезапуска
  - generic [ref=f3e6]:
    - navigation "Основная навигация" [ref=f3e8]:
      - link "Somewhere — на главную" [ref=f3e10] [cursor=pointer]:
        - /url: /
        - generic [ref=f3e11]: somewhere
      - generic [ref=f3e12]:
        - link "Встречи" [ref=f3e13] [cursor=pointer]:
          - /url: /meetings
          - generic [ref=f3e16]: Мои встречи
        - link "Приглашения" [ref=f3e17] [cursor=pointer]:
          - /url: /invitations
        - link "Сообщить о проблеме" [ref=f3e22] [cursor=pointer]:
          - /url: /support
        - link "Профиль" [ref=f3e26] [cursor=pointer]:
          - /url: /profile
          - generic [aria-hidden] [ref=f3e28]: С
          - generic [ref=f3e29]:
            - strong [ref=f3e30]: Саша
            - generic [ref=f3e31]: Мой профиль
    - generic [ref=f3e32]:
      - main [ref=f3e33]:
        - generic [ref=f3e34]:
          - link "К моим встречам" [ref=f3e35] [cursor=pointer]:
            - /url: /meetings
          - generic [ref=f3e38]:
            - heading "Проверка анимации" [level=1] [ref=f3e39]
            - paragraph [ref=f3e40]: 1 участник · 24 октября · 19:00
          - button "Пригласить друзей" [ref=f3e42] [cursor=pointer]
          - button "Информация о встрече" [active] [ref=f3e46] [cursor=pointer]
        - generic [ref=f3e51]:
          - list "Разговор встречи" [ref=f3e52]:
            - listitem [ref=f3e53]:
              - time [ref=f3e54]: Сегодня · 01:13
              - paragraph [ref=f3e55]: Саша создал встречу
          - generic [ref=f3e56]:
            - heading "Позовём остальных?" [level=2] [ref=f3e61]
            - paragraph [ref=f3e62]: Отправьте друзьям ссылку на встречу.После ответа «Приду» они появятся в чате.
            - button "Пригласить друзей" [ref=f3e63] [cursor=pointer]
        - generic [ref=f3e70]:
          - button "Добавить к встрече" [ref=f3e72] [cursor=pointer]
          - generic [ref=f3e74]:
            - generic [ref=f3e75]:
              - generic [ref=f3e76]: Сообщение
              - textbox "Сообщение" [ref=f3e77]:
                - /placeholder: Сообщение…
            - button "Выбрать эмодзи" [ref=f3e78] [cursor=pointer]
            - button "Отправить сообщение" [disabled] [ref=f3e82]
      - complementary [ref=f3e85]:
        - generic [ref=f3e86]:
          - generic [ref=f3e87]:
            - generic [ref=f3e88]:
              - term [ref=f3e89]: Когда
              - definition [ref=f3e90]:
                - generic [ref=f3e91]: 24 октября в 19:00
                - generic [ref=f3e92]: Москва
            - generic [ref=f3e93]:
              - term [ref=f3e94]: Где
              - definition [ref=f3e95]: Место пока не выбрано
          - generic [ref=f3e96]:
            - heading "Кто придёт · 1" [level=3] [ref=f3e97]
            - button "Все участники встречи" [ref=f3e98] [cursor=pointer]:
              - generic "Саша" [ref=f3e99]:
                - generic [aria-hidden] [ref=f3e100]: С
                - text: Саша
```

# Test source

```ts
  1   | import { expect, test } from '@playwright/test';
  2   | import { apiCreate, login } from '@tests/helpers';
  3   | 
  4   | for (const width of [390, 1440]) {
  5   |   test(`dialog keeps content and scroll lock until exit ends at ${width}px`, async ({
  6   |     page,
  7   |   }) => {
  8   |     await page.setViewportSize({ width, height: 900 });
  9   |     await login(page, 'Саша');
  10  |     const { meeting } = await apiCreate(page, 'Проверка анимации');
  11  |     await page.goto(`/meetings/${meeting.id}`);
  12  |     const open = page.getByRole('button', { name: 'Информация о встрече', exact: true });
  13  |     const dialog = page.getByRole('dialog', { name: 'Детали встречи' });
  14  |     await open.click();
  15  |     await expect(dialog).toHaveAttribute('data-motion', 'open');
  16  |     const height = (await dialog.boundingBox())?.height;
  17  | 
  18  |     if (width < 740) {
  19  |       await expect(
  20  |         dialog.getByRole('button', { name: 'Закрыть', exact: true }),
  21  |       ).toHaveCount(0);
  22  |       await page.keyboard.press('Escape');
  23  |     } else {
  24  |       await dialog.getByRole('button', { name: 'Закрыть', exact: true }).click();
  25  |     }
  26  | 
  27  |     await expect(dialog).toHaveAttribute('data-motion', 'closing');
  28  |     await expect(dialog).toBeVisible();
  29  |     await expect(dialog.getByRole('heading', { name: 'Кто придёт · 1' })).toBeVisible();
> 30  |     expect((await dialog.boundingBox())?.height).toBeCloseTo(height ?? 0, -1);
      |                                                  ^ Error: expect(received).toBeCloseTo(expected, precision)
  31  |     await expect(page.locator('body')).toHaveCSS('position', 'fixed');
  32  |     await expect(dialog).not.toBeVisible();
  33  |     await expect(open).toBeFocused();
  34  |     await expect(page.locator('body')).not.toHaveCSS('position', 'fixed');
  35  | 
  36  |     if (width === 390) {
  37  |       const info = page.getByRole('button', { name: 'Информация о встрече' });
  38  |       await info.click();
  39  |       const details = page.getByRole('dialog', { name: 'Детали встречи' });
  40  |       await expect(details).toHaveAttribute('data-motion', 'open');
  41  |       await page.keyboard.press('Escape');
  42  |       await expect(details).toHaveAttribute('data-motion', 'closing');
  43  |       await expect(details.getByRole('term').filter({ hasText: 'Когда' })).toBeVisible();
  44  |       await expect(details).not.toBeVisible();
  45  |       await expect(info).toBeFocused();
  46  |     }
  47  |   });
  48  | }
  49  | 
  50  | test('touch swipe follows the finger, returns after a short drag and dismisses after a long drag', async ({
  51  |   page,
  52  | }) => {
  53  |   await page.setViewportSize({ width: 390, height: 844 });
  54  |   await login(page, 'Саша');
  55  |   const { meeting } = await apiCreate(page, 'Свайп шторки');
  56  |   await page.goto(`/meetings/${meeting.id}`);
  57  |   const open = page.getByRole('button', { name: 'Информация о встрече' });
  58  |   await open.click();
  59  |   const dialog = page.getByRole('dialog', { name: 'Детали встречи' });
  60  |   await expect(dialog).toHaveAttribute('data-motion', 'open');
  61  |   const handle = dialog.getByTestId('dialog-drag-region');
  62  |   await expect(handle).toHaveCSS('touch-action', 'none');
  63  |   const bounds = await handle.boundingBox();
  64  |   const x = (bounds?.x ?? 0) + 80;
  65  |   const y = (bounds?.y ?? 0) + 20;
  66  |   const original = (await dialog.boundingBox())?.y ?? 0;
  67  |   const touch = await page.context().newCDPSession(page);
  68  |   await touch.send('Emulation.setTouchEmulationEnabled', { enabled: true });
  69  |   await touch.send('Input.dispatchTouchEvent', {
  70  |     type: 'touchStart',
  71  |     touchPoints: [{ x, y }],
  72  |   });
  73  |   await touch.send('Input.dispatchTouchEvent', {
  74  |     type: 'touchMove',
  75  |     touchPoints: [{ x, y: y + 12 }],
  76  |   });
  77  |   await expect(dialog).toHaveAttribute('data-dragging', 'true');
  78  |   expect((await dialog.boundingBox())?.y).toBeCloseTo(original + 12, 0);
  79  |   await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  80  |   await expect(dialog).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');
  81  |   await expect(dialog).toBeVisible();
  82  |   await touch.send('Input.dispatchTouchEvent', {
  83  |     type: 'touchStart',
  84  |     touchPoints: [{ x, y }],
  85  |   });
  86  |   await touch.send('Input.dispatchTouchEvent', {
  87  |     type: 'touchMove',
  88  |     touchPoints: [{ x, y: y + 160 }],
  89  |   });
  90  |   await expect(dialog).toHaveAttribute('data-dragging', 'true');
  91  |   expect((await dialog.boundingBox())?.y).toBeCloseTo(original + 160, 0);
  92  |   await page.screenshot({ path: 'test-results/poll-sheet-drag-390.png' });
  93  |   await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  94  |   await expect(dialog).toHaveAttribute('data-motion', 'closing');
  95  |   await expect(dialog).not.toBeVisible();
  96  |   await expect(page.locator('body')).not.toHaveCSS('position', 'fixed');
  97  |   await expect(open).toBeFocused();
  98  |   await touch.detach();
  99  |   await open.click();
  100 |   await expect(dialog).toHaveAttribute('data-motion', 'open');
  101 |   await expect(dialog).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');
  102 | });
  103 | 
  104 | for (const width of [320, 390]) {
  105 |   test(`swipe starts at the top edge, handle and side padding at ${width}px`, async ({
  106 |     page,
  107 |   }) => {
  108 |     await page.setViewportSize({ width, height: 844 });
  109 |     await login(page, 'Саша');
  110 |     const { meeting } = await apiCreate(page, 'Вся верхняя область шторки');
  111 |     await page.goto(`/meetings/${meeting.id}`);
  112 |     const open = page.getByRole('button', { name: 'Информация о встрече' });
  113 |     const dialog = page.getByRole('dialog', { name: 'Детали встречи' });
  114 |     const touch = await page.context().newCDPSession(page);
  115 |     await touch.send('Emulation.setTouchEmulationEnabled', { enabled: true });
  116 | 
  117 |     for (const point of [
  118 |       { x: width / 2, y: 3 },
  119 |       { x: width / 2, y: 14 },
  120 |       { x: 8, y: 32 },
  121 |     ]) {
  122 |       await open.click();
  123 |       await expect(dialog).toHaveAttribute('data-motion', 'open');
  124 |       await expect(
  125 |         dialog.getByRole('button', { name: 'Закрыть', exact: true }),
  126 |       ).toHaveCount(0);
  127 |       const bounds = await dialog.boundingBox();
  128 |       const top = bounds?.y ?? 0;
  129 |       const start = { x: point.x, y: top + point.y };
  130 |       await touch.send('Input.dispatchTouchEvent', {
```