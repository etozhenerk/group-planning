# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 27-mobile-scroll.spec.ts >> chat and sheet follow the visible viewport without creating a second page scroll
- Location: tests/27-mobile-scroll.spec.ts:144:1

# Error details

```
Error: expect(locator).toHaveCSS(expected) failed

Locator:  getByLabel('Сообщение', { exact: true })
Expected: "16px"
Received: "15px"
Timeout:  5000ms

Call log:
  - Expect "toHaveCSS" getByLabel('Сообщение', { exact: true }) with timeout 5000ms
  - waiting for getByLabel('Сообщение', { exact: true })
    14 × locator resolved to <textarea rows="1" maxlength="4000" aria-label="Сообщение" placeholder="Сообщение…"></textarea>
       - unexpected value "15px"

```

```yaml
- textbox "Сообщение":
  - /placeholder: Сообщение…
```

# Test source

```ts
  53  |       );
  54  | 
  55  |     expect(fonts.length).toBeGreaterThan(3);
  56  |     expect(fonts.every((size) => size >= 16)).toBe(true);
  57  |     const created = await apiCreate(page, 'Длинноеназвание'.repeat(8));
  58  |     const patched = await page.request.patch(`/api/v1/meetings/${created.meeting.id}`, {
  59  |       headers: await writeHeaders(page),
  60  |       data: {
  61  |         expected_revision: created.meeting.revision,
  62  |         place: 'Длинныйадрес'.repeat(15),
  63  |         description: 'Длиннаяссылка'.repeat(60),
  64  |       },
  65  |     });
  66  | 
  67  |     expect(patched.status()).toBe(200);
  68  |     await page.goto(new URL(created.invitation_url).pathname);
  69  |     await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  70  |     await expectFitsWidth(page.locator('html'));
  71  |     await page.goto(`/meetings/${created.meeting.id}`);
  72  |     await expect(page.getByLabel('Сообщение', { exact: true })).toBeVisible();
  73  |     await expectFitsWidth(page.locator('html'));
  74  |     const header = page.locator('main#main > header');
  75  |     const heading = header.getByRole('button', {
  76  |       name: `Сведения о встрече «${created.meeting.title}»`,
  77  |       exact: true,
  78  |     });
  79  | 
  80  |     await expect(heading.getByRole('heading', { level: 1 })).toHaveText(
  81  |       created.meeting.title,
  82  |     );
  83  |     await expectFitsWidth(heading);
  84  | 
  85  |     for (const text of await heading.locator('span').all()) {
  86  |       await expect(text).toHaveCSS('text-overflow', 'ellipsis');
  87  |       await expect(text).toHaveCSS('overflow-x', 'hidden');
  88  |       await expect
  89  |         .poll(() => text.evaluate((node) => node.scrollHeight - node.clientHeight))
  90  |         .toBeLessThanOrEqual(1);
  91  |     }
  92  | 
  93  |     const back = header.getByRole('link', { name: 'К моим встречам', exact: true });
  94  |     const controls = [
  95  |       back,
  96  |       heading,
  97  |       header.getByRole('button', { name: 'Информация о встрече', exact: true }),
  98  |     ];
  99  | 
  100 |     for (const control of controls) {
  101 |       await expect(control).toBeInViewport();
  102 |       const bounds = await control.boundingBox();
  103 |       const minimum = Number.parseFloat(designTokens.targetWeb);
  104 |       expect(bounds?.width).toBeGreaterThanOrEqual(minimum);
  105 |       expect(bounds?.height).toBeGreaterThanOrEqual(minimum);
  106 |       await control.click({ trial: true });
  107 |     }
  108 | 
  109 |     expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(874);
  110 |     await page.getByRole('button', { name: 'Информация о встрече' }).click();
  111 |     const dialog = page.getByRole('dialog', { name: created.meeting.title });
  112 |     await expect(
  113 |       dialog.getByRole('heading', { name: created.meeting.title, exact: true }),
  114 |     ).toHaveText(created.meeting.title);
  115 |     await expect(dialog).toHaveAttribute('data-motion', 'open');
  116 |     await expectFitsWidth(dialog);
  117 |     // The body scrolls under a fixed header, so close stays reachable.
  118 |     const content = dialog.getByTestId('meeting-info-scroll');
  119 |     expect(await content.evaluate((node) => node.scrollHeight > node.clientHeight)).toBe(
  120 |       true,
  121 |     );
  122 |     await content.evaluate((node) => {
  123 |       node.scrollTop = node.scrollHeight;
  124 |     });
  125 |     await expect(
  126 |       dialog.getByRole('button', { name: 'Закрыть', exact: true }),
  127 |     ).toBeInViewport({ ratio: 1 });
  128 |     await page.screenshot({
  129 |       path: `test-results/mobile-facts-${test.info().project.name}-${width}.png`,
  130 |     });
  131 |     await page.keyboard.press('Escape');
  132 |     await expect(dialog).not.toBeVisible();
  133 |     expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(874);
  134 |     await back.click();
  135 |     await expect(page).toHaveURL(/\/meetings$/);
  136 |     await expect(
  137 |       page.locator(
  138 |         `[data-testid="meeting-card"] a[href="/meetings/${created.meeting.id}"]`,
  139 |       ),
  140 |     ).toBeVisible();
  141 |   });
  142 | }
  143 | 
  144 | test('chat and sheet follow the visible viewport without creating a second page scroll', async ({
  145 |   page,
  146 | }) => {
  147 |   await page.setViewportSize({ width: 402, height: 874 });
  148 |   await login(page, 'Саша');
  149 |   const created = await apiCreate(page, 'Проверка клавиатуры');
  150 |   await page.goto(`/meetings/${created.meeting.id}`);
  151 |   const message = page.getByLabel('Сообщение', { exact: true });
  152 |   await expect(message).toBeVisible();
> 153 |   await expect(message).toHaveCSS('font-size', '16px');
      |                         ^ Error: expect(locator).toHaveCSS(expected) failed
  154 |   const original = await message.boundingBox();
  155 |   await message.focus();
  156 |   await changeVisualViewport(page, 500, 12);
  157 |   await expect
  158 |     .poll(async () => {
  159 |       const box = await message.boundingBox();
  160 | 
  161 |       return (box?.y ?? 0) + (box?.height ?? 0);
  162 |     })
  163 |     .toBeLessThanOrEqual(512);
  164 |   await expectFitsWidth(page.locator('html'));
  165 |   expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(874);
  166 |   await page.getByRole('button', { name: 'Информация о встрече' }).click();
  167 |   const dialog = page.getByRole('dialog', { name: created.meeting.title });
  168 |   await expect(dialog).toHaveAttribute('data-motion', 'open');
  169 |   await expectFitsWidth(dialog);
  170 |   const bounds = await dialog.boundingBox();
  171 |   expect((bounds?.y ?? 0) + (bounds?.height ?? 0)).toBeLessThanOrEqual(512);
  172 |   expect(bounds?.y).toBeGreaterThanOrEqual(12);
  173 |   await expect(
  174 |     dialog.getByRole('heading', { name: created.meeting.title, exact: true }),
  175 |   ).toBeInViewport();
  176 |   await page.screenshot({
  177 |     path: `test-results/mobile-keyboard-${test.info().project.name}.png`,
  178 |   });
  179 |   await page.keyboard.press('Escape');
  180 |   await expect(dialog).not.toBeVisible();
  181 |   await changeVisualViewport(page, 874);
  182 |   await expect
  183 |     .poll(async () => (await message.boundingBox())?.y)
  184 |     .toBeCloseTo(original?.y ?? 0, 0);
  185 |   const restored = await message.boundingBox();
  186 |   await changeVisualViewport(page, 400, 100, 2);
  187 |   expect(await message.boundingBox()).toEqual(restored);
  188 |   await changeVisualViewport(page, 874);
  189 | });
  190 | 
  191 | test('closing a mobile sheet restores the background position and permits normal page scrolling', async ({
  192 |   page,
  193 |   isMobile,
  194 | }) => {
  195 |   await page.setViewportSize({ width: 402, height: 600 });
  196 |   await login(page, 'Саша');
  197 |   const title = `Прокрутка ${test.info().project.name}`;
  198 | 
  199 |   for (let index = 0; index < 5; index++) {
  200 |     await apiCreate(page, `${title} ${index}`);
  201 |   }
  202 | 
  203 |   await page.goto('/meetings');
  204 |   await page.getByRole('button', { name: /Предстоящие/ }).click();
  205 |   await expect(page.getByRole('link', { name: new RegExp(`${title} 4`) })).toBeVisible();
  206 |   await page.evaluate(() => scrollTo(0, 200));
  207 |   await page.getByRole('link', { name: 'Профиль', exact: true }).click();
  208 |   await page.evaluate(() => scrollTo(0, 200));
  209 |   await expect(
  210 |     page.getByRole('heading', { name: 'Мой профиль', exact: true }),
  211 |   ).toBeVisible();
  212 |   await page
  213 |     .getByRole('button', { name: 'Удалить аккаунт', exact: true })
  214 |     .evaluate((element) => element.scrollIntoView({ block: 'center' }));
  215 |   const before = await page.evaluate(() => scrollY);
  216 |   const profile = page.getByRole('link', { name: 'Профиль', exact: true });
  217 |   const profileBefore = await profile.boundingBox();
  218 |   expect(before).toBeGreaterThan(0);
  219 |   await page.getByRole('button', { name: 'Удалить аккаунт', exact: true }).click();
  220 |   const dialog = page.getByRole('dialog', { name: 'Удалить аккаунт?' });
  221 |   await expect(dialog).toHaveAttribute('data-motion', 'open');
  222 |   await expect(page.locator('body')).toHaveCSS('position', 'fixed');
  223 |   await expect(page.locator('body')).toHaveCSS('top', `${-before}px`);
  224 |   expect((await profile.boundingBox())?.y).toBe(profileBefore?.y);
  225 | 
  226 |   if (!isMobile) {
  227 |     await page.mouse.move(2, 2);
  228 |     await page.mouse.wheel(0, 200);
  229 |   }
  230 | 
  231 |   await page.evaluate(() => scrollBy(0, 200));
  232 |   await expect(page.locator('body')).toHaveCSS('top', `${-before}px`);
  233 |   expect((await profile.boundingBox())?.y).toBe(profileBefore?.y);
  234 |   await page.keyboard.press('Escape');
  235 |   await expect(dialog).not.toBeVisible();
  236 |   await expect.poll(() => page.evaluate(() => scrollY)).toBe(before);
  237 |   await expect(page.locator('body')).not.toHaveCSS('position', 'fixed');
  238 |   await page.evaluate(() => scrollTo(0, 0));
  239 |   expect(await page.evaluate(() => scrollY)).toBe(0);
  240 | });
  241 | 
```