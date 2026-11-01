# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 58-reaction-range-error.spec.ts >> a failed reaction GET after a virtual range change retains confirmed chips and supports retry
- Location: tests/58-reaction-range-error.spec.ts:7:1

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  - 1
+ Received  + 3

- Array []
+ Array [
+   "ResizeObserver loop completed with undelivered notifications.",
+ ]
```

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  - 1
+ Received  + 3

- Array []
+ Array [
+   "ResizeObserver loop completed with undelivered notifications.",
+ ]
```

# Page snapshot

```yaml
- generic [ref=f3e3]:
  - link "К содержимому" [ref=f3e4]:
    - /url: "#main"
  - generic [ref=f3e5]: Демостенд · данные хранятся до перезапуска
  - generic [ref=f3e6]:
    - navigation "Основная навигация" [ref=f3e8]:
      - link "Somewhere — на главную" [ref=f3e10]:
        - /url: /
        - generic [ref=f3e11]: somewhere
      - generic [ref=f3e12]:
        - link "Встречи" [ref=f3e13]:
          - /url: /meetings
          - generic [ref=f3e16]: Мои встречи
        - link "Приглашения" [ref=f3e17]:
          - /url: /invitations
        - link "Сообщить о проблеме" [ref=f3e22]:
          - /url: /support
        - link "Профиль" [ref=f3e26]:
          - /url: /profile
          - generic [aria-hidden] [ref=f3e28]: С
          - generic [ref=f3e29]:
            - strong [ref=f3e30]: Саша
            - generic [ref=f3e31]: Мой профиль
    - main [ref=f3e33]:
      - generic [ref=f3e34]:
        - link "К моим встречам" [ref=f3e35]:
          - /url: /meetings
        - generic [ref=f3e38]:
          - heading "Диапазон и ошибка реакций" [level=1] [ref=f3e39]
          - paragraph [ref=f3e40]: 1 участник · 24 октября · 19:00
        - button "Пригласить друзей" [ref=f3e42] [cursor=pointer]
        - button "Информация о встрече" [ref=f3e45] [cursor=pointer]
      - list "Разговор встречи" [ref=f3e51]:
        - listitem [ref=f3e53]:
          - generic [aria-hidden] [ref=f3e54]: С
          - generic [ref=f3e55]:
            - generic [ref=f3e56]:
              - strong [ref=f3e57]: Саша
              - time [ref=f3e58]: 11:44
            - 'group "Реакции на сообщение: Строка 30. Сохраняем подтверждённую реакцию." [ref=f3e60]':
              - paragraph [ref=f3e61]: Строка 30. Сохраняем подтверждённую реакцию.
        - listitem [ref=f3e63]:
          - generic [aria-hidden] [ref=f3e64]: С
          - generic [ref=f3e65]:
            - generic [ref=f3e66]:
              - strong [ref=f3e67]: Саша
              - time [ref=f3e68]: 11:44
            - 'group "Реакции на сообщение: Строка 31. Сохраняем подтверждённую реакцию. Сохраняем подтверждённую реакцию." [ref=f3e70]':
              - paragraph [ref=f3e71]: Строка 31. Сохраняем подтверждённую реакцию. Сохраняем подтверждённую реакцию.
        - listitem [ref=f3e73]:
          - generic [aria-hidden] [ref=f3e74]: С
          - generic [ref=f3e75]:
            - generic [ref=f3e76]:
              - strong [ref=f3e77]: Саша
              - time [ref=f3e78]: 11:44
            - 'group "Реакции на сообщение: Строка 32. Сохраняем подтверждённую реакцию. Сохраняем подтверждённую реакцию. Сохраняем подтверждённую реакцию." [ref=f3e80]':
              - paragraph [ref=f3e81]: Строка 32. Сохраняем подтверждённую реакцию. Сохраняем подтверждённую реакцию. Сохраняем подтверждённую реакцию.
        - listitem [ref=f3e83]:
          - generic [aria-hidden] [ref=f3e84]: С
          - generic [ref=f3e85]:
            - generic [ref=f3e86]:
              - strong [ref=f3e87]: Саша
              - time [ref=f3e88]: 11:44
            - 'group "Реакции на сообщение: Строка 33. Сохраняем подтверждённую реакцию." [ref=f3e90]':
              - paragraph [ref=f3e91]: Строка 33. Сохраняем подтверждённую реакцию.
        - listitem [ref=f3e93]:
          - generic [aria-hidden] [ref=f3e94]: С
          - generic [ref=f3e95]:
            - generic [ref=f3e96]:
              - strong [ref=f3e97]: Саша
              - time [ref=f3e98]: 11:44
            - 'group "Реакции на сообщение: Строка 34. Сохраняем подтверждённую реакцию. Сохраняем подтверждённую реакцию." [ref=f3e100]':
              - paragraph [ref=f3e101]: Строка 34. Сохраняем подтверждённую реакцию. Сохраняем подтверждённую реакцию.
        - listitem [ref=f3e103]:
          - generic [aria-hidden] [ref=f3e104]: С
          - generic [ref=f3e105]:
            - generic [ref=f3e106]:
              - strong [ref=f3e107]: Саша
              - time [ref=f3e108]: 11:44
            - 'group "Реакции на сообщение: Строка 35. Сохраняем подтверждённую реакцию. Сохраняем подтверждённую реакцию. Сохраняем подтверждённую реакцию." [ref=f3e110]':
              - paragraph [ref=f3e111]: Строка 35. Сохраняем подтверждённую реакцию. Сохраняем подтверждённую реакцию. Сохраняем подтверждённую реакцию.
        - listitem [ref=f3e113]:
          - generic [aria-hidden] [ref=f3e114]: С
          - generic [ref=f3e115]:
            - generic [ref=f3e116]:
              - strong [ref=f3e117]: Саша
              - time [ref=f3e118]: 11:44
            - 'group "Реакции на сообщение: Строка 36. Сохраняем подтверждённую реакцию." [ref=f3e120]':
              - paragraph [ref=f3e121]: Строка 36. Сохраняем подтверждённую реакцию.
        - listitem [ref=f3e123]:
          - generic [aria-hidden] [ref=f3e124]: С
          - generic [ref=f3e125]:
            - generic [ref=f3e126]:
              - strong [ref=f3e127]: Саша
              - time [ref=f3e128]: 11:44
            - 'group "Реакции на сообщение: Строка 37. Сохраняем подтверждённую реакцию. Сохраняем подтверждённую реакцию." [ref=f3e130]':
              - paragraph [ref=f3e131]: Строка 37. Сохраняем подтверждённую реакцию. Сохраняем подтверждённую реакцию.
        - listitem [ref=f3e133]:
          - generic [aria-hidden] [ref=f3e134]: С
          - generic [ref=f3e135]:
            - generic [ref=f3e136]:
              - strong [ref=f3e137]: Саша
              - time [ref=f3e138]: 11:44
            - 'group "Реакции на сообщение: Строка 38. Сохраняем подтверждённую реакцию. Сохраняем подтверждённую реакцию. Сохраняем подтверждённую реакцию." [ref=f3e140]':
              - paragraph [ref=f3e141]: Строка 38. Сохраняем подтверждённую реакцию. Сохраняем подтверждённую реакцию. Сохраняем подтверждённую реакцию.
        - listitem [ref=f3e143]:
          - generic [aria-hidden] [ref=f3e144]: С
          - generic [ref=f3e145]:
            - generic [ref=f3e146]:
              - strong [ref=f3e147]: Саша
              - time [ref=f3e148]: 11:44
            - 'group "Реакции на сообщение: Строка 39. Сохраняем подтверждённую реакцию." [ref=f3e150]':
              - paragraph [ref=f3e151]: Строка 39. Сохраняем подтверждённую реакцию.
        - listitem [ref=f3e153]:
          - generic [aria-hidden] [ref=f3e154]: С
          - generic [ref=f3e155]:
            - generic [ref=f3e156]:
              - strong [ref=f3e157]: Саша
              - time [ref=f3e158]: 11:44
            - 'group "Реакции на сообщение: Строка 40. Сохраняем подтверждённую реакцию. Сохраняем подтверждённую реакцию." [ref=f3e160]':
              - paragraph [ref=f3e161]: Строка 40. Сохраняем подтверждённую реакцию. Сохраняем подтверждённую реакцию.
            - 'button "🍕: 1" [pressed] [ref=f3e163] [cursor=pointer]':
              - generic [ref=f3e164]: 🍕
              - generic [ref=f3e165]: "1"
        - listitem [ref=f3e169]:
          - generic [aria-hidden] [ref=f3e170]: С
          - generic [ref=f3e171]:
            - generic [ref=f3e172]:
              - strong [ref=f3e173]: Саша
              - time [ref=f3e174]: 11:44
            - 'group "Реакции на сообщение: Строка 41. Сохраняем подтверждённую реакцию. Сохраняем подтверждённую реакцию. Сохраняем подтверждённую реакцию." [ref=f3e176]':
              - paragraph [ref=f3e177]: Строка 41. Сохраняем подтверждённую реакцию. Сохраняем подтверждённую реакцию. Сохраняем подтверждённую реакцию.
        - listitem [ref=f3e179]:
          - generic [aria-hidden] [ref=f3e180]: С
          - generic [ref=f3e181]:
            - generic [ref=f3e182]:
              - strong [ref=f3e183]: Саша
              - time [ref=f3e184]: 11:44
            - 'group "Реакции на сообщение: Строка 42. Сохраняем подтверждённую реакцию." [ref=f3e186]':
              - paragraph [ref=f3e187]: Строка 42. Сохраняем подтверждённую реакцию.
        - listitem [ref=f3e189]:
          - generic [aria-hidden] [ref=f3e190]: С
          - generic [ref=f3e191]:
            - generic [ref=f3e192]:
              - strong [ref=f3e193]: Саша
              - time [ref=f3e194]: 11:44
            - 'group "Реакции на сообщение: Строка 43. Сохраняем подтверждённую реакцию. Сохраняем подтверждённую реакцию." [ref=f3e196]':
              - paragraph [ref=f3e197]: Строка 43. Сохраняем подтверждённую реакцию. Сохраняем подтверждённую реакцию.
        - listitem [ref=f3e199]:
          - generic [aria-hidden] [ref=f3e200]: С
          - generic [ref=f3e201]:
            - generic [ref=f3e202]:
              - strong [ref=f3e203]: Саша
              - time [ref=f3e204]: 11:44
            - 'group "Реакции на сообщение: Строка 44. Сохраняем подтверждённую реакцию. Сохраняем подтверждённую реакцию. Сохраняем подтверждённую реакцию." [ref=f3e206]':
              - paragraph [ref=f3e207]: Строка 44. Сохраняем подтверждённую реакцию. Сохраняем подтверждённую реакцию. Сохраняем подтверждённую реакцию.
        - listitem [ref=f3e209]:
          - generic [aria-hidden] [ref=f3e210]: С
          - generic [ref=f3e211]:
            - generic [ref=f3e212]:
              - strong [ref=f3e213]: Саша
              - time [ref=f3e214]: 11:44
            - 'group "Реакции на сообщение: Строка 45. Сохраняем подтверждённую реакцию." [ref=f3e216]':
              - paragraph [ref=f3e217]: Строка 45. Сохраняем подтверждённую реакцию.
        - listitem [ref=f3e219]:
          - generic [aria-hidden] [ref=f3e220]: С
          - generic [ref=f3e221]:
            - generic [ref=f3e222]:
              - strong [ref=f3e223]: Саша
              - time [ref=f3e224]: 11:44
            - 'group "Реакции на сообщение: Строка 46. Сохраняем подтверждённую реакцию. Сохраняем подтверждённую реакцию." [ref=f3e226]':
              - paragraph [ref=f3e227]: Строка 46. Сохраняем подтверждённую реакцию. Сохраняем подтверждённую реакцию.
        - listitem [ref=f3e229]:
          - generic [aria-hidden] [ref=f3e230]: С
          - generic [ref=f3e231]:
            - generic [ref=f3e232]:
              - strong [ref=f3e233]: Саша
              - time [ref=f3e234]: 11:44
            - 'group "Реакции на сообщение: Строка 47. Сохраняем подтверждённую реакцию. Сохраняем подтверждённую реакцию. Сохраняем подтверждённую реакцию." [ref=f3e236]':
              - paragraph [ref=f3e237]: Строка 47. Сохраняем подтверждённую реакцию. Сохраняем подтверждённую реакцию. Сохраняем подтверждённую реакцию.
        - listitem [ref=f3e239]:
          - generic [aria-hidden] [ref=f3e240]: С
          - generic [ref=f3e241]:
            - generic [ref=f3e242]:
              - strong [ref=f3e243]: Саша
              - time [ref=f3e244]: 11:44
            - 'group "Реакции на сообщение: Строка 48. Сохраняем подтверждённую реакцию." [ref=f3e246]':
              - paragraph [ref=f3e247]: Строка 48. Сохраняем подтверждённую реакцию.
        - listitem [ref=f3e249]:
          - generic [aria-hidden] [ref=f3e250]: С
          - generic [ref=f3e251]:
            - generic [ref=f3e252]:
              - strong [ref=f3e253]: Саша
              - time [ref=f3e254]: 11:44
            - 'group "Реакции на сообщение: Строка 49. Сохраняем подтверждённую реакцию. Сохраняем подтверждённую реакцию." [ref=f3e256]':
              - paragraph [ref=f3e257]: Строка 49. Сохраняем подтверждённую реакцию. Сохраняем подтверждённую реакцию.
        - listitem [ref=f3e259]:
          - generic [aria-hidden] [ref=f3e260]: С
          - generic [ref=f3e261]:
            - generic [ref=f3e262]:
              - strong [ref=f3e263]: Саша
              - time [ref=f3e264]: 11:44
            - 'group "Реакции на сообщение: Строка 50. Сохраняем подтверждённую реакцию. Сохраняем подтверждённую реакцию. Сохраняем подтверждённую реакцию." [ref=f3e266]':
              - paragraph [ref=f3e267]: Строка 50. Сохраняем подтверждённую реакцию. Сохраняем подтверждённую реакцию. Сохраняем подтверждённую реакцию.
        - listitem [ref=f3e269]:
          - generic [aria-hidden] [ref=f3e270]: С
          - generic [ref=f3e271]:
            - generic [ref=f3e272]:
              - strong [ref=f3e273]: Саша
              - time [ref=f3e274]: 11:44
            - 'group "Реакции на сообщение: Строка 51. Сохраняем подтверждённую реакцию." [ref=f3e276]':
              - paragraph [ref=f3e277]: Строка 51. Сохраняем подтверждённую реакцию.
        - listitem [ref=f3e279]:
          - generic [aria-hidden] [ref=f3e280]: С
          - generic [ref=f3e281]:
            - generic [ref=f3e282]:
              - strong [ref=f3e283]: Саша
              - time [ref=f3e284]: 11:44
            - 'group "Реакции на сообщение: Строка 52. Сохраняем подтверждённую реакцию. Сохраняем подтверждённую реакцию." [ref=f3e286]':
              - paragraph [ref=f3e287]: Строка 52. Сохраняем подтверждённую реакцию. Сохраняем подтверждённую реакцию.
      - generic [ref=f3e290]:
        - button "Добавить к встрече" [ref=f3e292] [cursor=pointer]
        - generic [ref=f3e295]:
          - generic [ref=f3e296]:
            - generic [ref=f3e297]: Сообщение
            - textbox "Сообщение" [ref=f3e298]:
              - /placeholder: Сообщение…
          - button "Выбрать эмодзи" [ref=f3e299] [cursor=pointer]
        - button "Отправить сообщение" [disabled] [ref=f3e305]
```

# Test source

```ts
  22  |   const { meeting } = await apiCreate(page, 'Диапазон и ошибка реакций');
  23  |   const headers = await writeHeaders(page);
  24  |   const entries = [];
  25  | 
  26  |   for (let index = 0; index < 80; index++) {
  27  |     const key = randomUUID();
  28  |     const response = await page.request.post(`/api/v1/meetings/${meeting.id}/messages`, {
  29  |       headers: { ...headers, 'Idempotency-Key': key },
  30  |       data: {
  31  |         text: `Строка ${index}. ${'Сохраняем подтверждённую реакцию. '.repeat((index % 3) + 1)}`,
  32  |         client_request_id: key,
  33  |       },
  34  |     });
  35  | 
  36  |     expect(response.status()).toBe(201);
  37  |     entries.push(entrySchema.parse(await response.json()));
  38  |   }
  39  | 
  40  |   const entry = entries[40]!;
  41  |   expect(
  42  |     (
  43  |       await page.request.put(
  44  |         `/api/v1/meetings/${meeting.id}/messages/${entry.id}/reactions`,
  45  |         {
  46  |           headers: { ...headers, 'Idempotency-Key': randomUUID() },
  47  |           data: { emoji: '🍕', active: true },
  48  |         },
  49  |       )
  50  |     ).status(),
  51  |   ).toBe(200);
  52  |   await page.goto(`/meetings/${meeting.id}`);
  53  |   const row = page.getByTestId('feed-message').filter({ hasText: 'Строка 40.' });
  54  |   const history = page.getByRole('list', { name: 'Разговор встречи' }).locator('..');
  55  |   await expect(history).toBeVisible();
  56  |   await history.evaluate((element) => element.scrollTo({ top: 0 }));
  57  |   await expect(row).toBeAttached();
  58  |   await row.scrollIntoViewIfNeeded();
  59  |   await row.getByTestId('message-actions').focus();
  60  |   const chip = row.getByRole('button', { name: '🍕: 1', exact: true });
  61  |   await expect(chip).toBeVisible();
  62  |   await page.waitForTimeout(100);
  63  |   const requests: string[] = [];
  64  |   const gate = { fail: true };
  65  |   await page.route(`**/meetings/${meeting.id}/reactions?*`, async (route) => {
  66  |     requests.push(route.request().url());
  67  | 
  68  |     if (gate.fail) {
  69  |       await route.fulfill({
  70  |         status: 503,
  71  |         json: {
  72  |           error: { code: 'unavailable', field_errors: {}, request_id: 'range-reactions' },
  73  |         },
  74  |       });
  75  |     } else {
  76  |       await route.continue();
  77  |     }
  78  |   });
  79  |   await page.setViewportSize({ width: 844, height: 520 });
  80  | 
  81  |   for (let step = 0; step < 6 && requests.length === 0; step++) {
  82  |     await history.evaluate((element) => {
  83  |       element.scrollTop += 80;
  84  |     });
  85  |     await page.waitForTimeout(50);
  86  |   }
  87  | 
  88  |   await expect.poll(() => requests.length).toBeGreaterThan(0);
  89  |   await page.waitForTimeout(750);
  90  |   const error = page
  91  |     .getByRole('status')
  92  |     .filter({ hasText: 'Не удалось обновить реакции' });
  93  | 
  94  |   const observation = {
  95  |     errors,
  96  |     requests: requests.length,
  97  |     confirmedChips: await chip.count(),
  98  |     errorVisible: await error.isVisible(),
  99  |   };
  100 | 
  101 |   await writeFile(
  102 |     test.info().outputPath('range-error-observation.json'),
  103 |     JSON.stringify(observation),
  104 |   );
  105 |   await test.info().attach('range-error-observation', {
  106 |     body: JSON.stringify(observation),
  107 |     contentType: 'application/json',
  108 |   });
  109 |   expect.soft(errors).toEqual([]);
  110 |   expect.soft(requests.length).toBeLessThan(10);
  111 |   expect.soft(await chip.count()).toBe(1);
  112 |   await expect(error).toBeVisible();
  113 |   // The error is after the virtual list. Focus without auto-scroll so this action
  114 |   // retries the failed window instead of navigating to a different query range.
  115 |   await error
  116 |     .getByRole('button', { name: 'Повторить', exact: true })
  117 |     .evaluate((button) => button.focus({ preventScroll: true }));
  118 |   gate.fail = false;
  119 |   await page.keyboard.press('Enter');
  120 |   await expect(error).toHaveCount(0);
  121 |   await expect(chip).toBeVisible();
> 122 |   expect(errors).toEqual([]);
      |                  ^ Error: expect(received).toEqual(expected) // deep equality
  123 | });
  124 | 
```