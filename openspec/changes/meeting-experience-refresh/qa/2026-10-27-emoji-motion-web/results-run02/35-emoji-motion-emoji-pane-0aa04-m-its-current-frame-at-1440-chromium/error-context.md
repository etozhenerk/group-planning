# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 35-emoji-motion.spec.ts >> emoji panel retains exit and reverses from its current frame at 1440
- Location: frontend/web/tests/35-emoji-motion.spec.ts:12:3

# Error details

```
Error: expect(received).toBeCloseTo(expected, precision)

Expected: 0.0900279
Received: 1

Expected precision:    3
Expected difference: < 0.0005
Received difference:   0.9099721000000001
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
            - heading "Движение эмодзи" [level=1] [ref=f3e39]
            - paragraph [ref=f3e40]: 1 участник · 24 октября · 19:00
          - button "Пригласить друзей" [ref=f3e42] [cursor=pointer]
          - button "Информация о встрече" [ref=f3e45] [cursor=pointer]
        - generic [ref=f3e50]:
          - list "Разговор встречи" [ref=f3e51]:
            - listitem [ref=f3e52]:
              - time [ref=f3e53]: Сегодня · 21:39
              - paragraph [ref=f3e54]: Саша создал встречу
          - generic [ref=f3e55]:
            - heading "Позовём остальных?" [level=2] [ref=f3e60]
            - paragraph [ref=f3e61]: Отправьте друзьям ссылку на встречу.После ответа «Приду» они появятся в чате.
            - button "Пригласить друзей" [ref=f3e62] [cursor=pointer]
        - generic [ref=f3e67]:
          - region "Выбор эмодзи" [ref=f3e69]:
            - generic [ref=f3e70]:
              - generic [ref=f3e71]:
                - generic [ref=f3e72]: Найти эмодзи
                - searchbox "Найти эмодзи" [ref=f3e73]
              - button "Закрыть эмодзи" [ref=f3e74] [cursor=pointer]
            - generic [ref=f3e77]:
              - generic [ref=f3e78]:
                - heading "Недавние" [level=3] [ref=f3e79]
                - paragraph [ref=f3e80]: Здесь появятся недавно выбранные эмодзи.
              - generic [ref=f3e81]:
                - heading "Смайлы и эмоции" [level=3] [ref=f3e82]
                - generic [ref=f3e83]:
                  - button "широко улыбается" [ref=f3e84] [cursor=pointer]: 😀
                  - button "смеется" [ref=f3e85] [cursor=pointer]: 😃
                  - button "смеется с закрытыми глазами" [ref=f3e86] [cursor=pointer]: 😄
                  - button "светится от счастья" [ref=f3e87] [cursor=pointer]: 😁
                  - button "смеется с прищуренными глазами" [ref=f3e88] [cursor=pointer]: 😆
                  - button "нервно смеется" [ref=f3e89] [cursor=pointer]: 😅
                  - button "катается со смеху" [ref=f3e90] [cursor=pointer]: 🤣
                  - button "смеется до слез" [ref=f3e91] [cursor=pointer]: 😂
                  - button "слегка улыбается" [ref=f3e92] [cursor=pointer]: 🙂
                  - button "вверх тормашками" [ref=f3e93] [cursor=pointer]: 🙃
                  - button "тает" [ref=f3e94] [cursor=pointer]: 🫠
                  - button "подмигивает" [ref=f3e95] [cursor=pointer]: 😉
                  - button "довольно улыбается" [ref=f3e96] [cursor=pointer]: 😊
                  - button "с нимбом" [ref=f3e97] [cursor=pointer]: 😇
                  - button "улыбающееся лицо с сердечками" [ref=f3e98] [cursor=pointer]: 🥰
                  - button "влюбленное лицо" [ref=f3e99] [cursor=pointer]: 😍
                  - button "звезды в глазах" [ref=f3e100] [cursor=pointer]: 🤩
                  - button "воздушный поцелуй" [ref=f3e101] [cursor=pointer]: 😘
                  - button "целует" [ref=f3e102] [cursor=pointer]: 😗
                  - button "улыбается" [ref=f3e103] [cursor=pointer]: ☺️
                  - button "целует с закрытыми глазами" [ref=f3e104] [cursor=pointer]: 😚
                  - button "счастливый поцелуй" [ref=f3e105] [cursor=pointer]: 😙
                  - button "улыбающееся лицо со слезой" [ref=f3e106] [cursor=pointer]: 🥲
                  - button "вкусно" [ref=f3e107] [cursor=pointer]: 😋
                  - button "показывает язык" [ref=f3e108] [cursor=pointer]: 😛
                  - button "показывает язык и подмигивает" [ref=f3e109] [cursor=pointer]: 😜
                  - button "сумасшедшее лицо" [ref=f3e110] [cursor=pointer]: 🤪
                  - button "морщится и показывает язык" [ref=f3e111] [cursor=pointer]: 😝
                  - button "деньги в глазах" [ref=f3e112] [cursor=pointer]: 🤑
                  - button "обнимает" [ref=f3e113] [cursor=pointer]: 🤗
                  - button "прикрывает рот рукой" [ref=f3e114] [cursor=pointer]: 🤭
                  - button "прикрывает рот рукой с открытыми глазами" [ref=f3e115] [cursor=pointer]: 🫢
                  - button "подсматривает" [ref=f3e116] [cursor=pointer]: 🫣
                  - button "тс-с-с" [ref=f3e117] [cursor=pointer]: 🤫
                  - button "думает" [ref=f3e118] [cursor=pointer]: 🤔
                  - button "воинское приветствие" [ref=f3e119] [cursor=pointer]: 🫡
                  - button "рот на замке" [ref=f3e120] [cursor=pointer]: 🤐
                  - button "не верит" [ref=f3e121] [cursor=pointer]: 🤨
                  - button "все равно" [ref=f3e122] [cursor=pointer]: 😐
                  - button "без эмоций" [ref=f3e123] [cursor=pointer]: 😑
                  - button "лицо без рта" [ref=f3e124] [cursor=pointer]: 😶
                  - button "лицо пунктиром" [ref=f3e125] [cursor=pointer]: 🫥
                  - button "лицо в облаках" [ref=f3e126] [cursor=pointer]: 😶‍🌫️
                  - button "ухмыляется" [ref=f3e127] [cursor=pointer]: 😏
                  - button "скучает" [ref=f3e128] [cursor=pointer]: 😒
                  - button "закатывает глаза" [ref=f3e129] [cursor=pointer]: 🙄
                  - button "гримаса" [ref=f3e130] [cursor=pointer]: 😬
                  - button "выдыхает" [ref=f3e131] [cursor=pointer]: 😮‍💨
                  - button "лжец" [ref=f3e132] [cursor=pointer]: 🤥
                  - button "трясущееся лицо" [ref=f3e133] [cursor=pointer]: 🫨
                  - button "отрицательно качает головой" [ref=f3e134] [cursor=pointer]: 🙂‍↔️
                  - button "положительно качает головой" [ref=f3e135] [cursor=pointer]: 🙂‍↕️
                  - button "испытывает облегчение" [ref=f3e136] [cursor=pointer]: 😌
                  - button "размышляет" [ref=f3e137] [cursor=pointer]: 😔
                  - button "хочет спать" [ref=f3e138] [cursor=pointer]: 😪
                  - button "пускает слюни" [ref=f3e139] [cursor=pointer]: 🤤
                  - button "спит" [ref=f3e140] [cursor=pointer]: 😴
                  - button "лицо с мешками под глазами" [ref=f3e141] [cursor=pointer]: 🫩
                  - button "в медицинской маске" [ref=f3e142] [cursor=pointer]: 😷
                  - button "с градусником во рту" [ref=f3e143] [cursor=pointer]: 🤒
                  - button "с перевязанной головой" [ref=f3e144] [cursor=pointer]: 🤕
                  - button "тошнит" [ref=f3e145] [cursor=pointer]: 🤢
                  - button "рвота" [ref=f3e146] [cursor=pointer]: 🤮
                  - button "чихает" [ref=f3e147] [cursor=pointer]: 🤧
                  - button "жар" [ref=f3e148] [cursor=pointer]: 🥵
                  - button "мерзнет" [ref=f3e149] [cursor=pointer]: 🥶
                  - button "чувствует головокружение" [ref=f3e150] [cursor=pointer]: 🥴
                  - button "головокружение" [ref=f3e151] [cursor=pointer]: 😵
                  - button "ошеломление" [ref=f3e152] [cursor=pointer]: 😵‍💫
                  - button "взрыв мозга" [ref=f3e153] [cursor=pointer]: 🤯
                  - button "в ковбойской шляпе" [ref=f3e154] [cursor=pointer]: 🤠
                  - button "на вечеринке" [ref=f3e155] [cursor=pointer]: 🥳
                  - button "маскировка" [ref=f3e156] [cursor=pointer]: 🥸
                  - button "лицо в темных очках" [ref=f3e157] [cursor=pointer]: 😎
                  - button "очкарик" [ref=f3e158] [cursor=pointer]: 🤓
                  - button "с моноклем" [ref=f3e159] [cursor=pointer]: 🧐
                  - button "в замешательстве" [ref=f3e160] [cursor=pointer]: 😕
                  - button "с перекошенным ртом" [ref=f3e161] [cursor=pointer]: 🫤
                  - button "беспокоится" [ref=f3e162] [cursor=pointer]: 😟
                  - button "немного грустит" [ref=f3e163] [cursor=pointer]: 🙁
                  - button "грустит" [ref=f3e164] [cursor=pointer]: ☹️
                  - button "удивление" [ref=f3e165] [cursor=pointer]: 😮
                  - button "неприятный сюрприз" [ref=f3e166] [cursor=pointer]: 😯
                  - button "в шоке" [ref=f3e167] [cursor=pointer]: 😲
                  - button "краснеет" [ref=f3e168] [cursor=pointer]: 😳
                  - button "лицо перекосило" [ref=f3e169] [cursor=pointer]: 🫪
                  - button "умоляет" [ref=f3e170] [cursor=pointer]: 🥺
                  - button "еле сдерживает слезы" [ref=f3e171] [cursor=pointer]: 🥹
                  - button "в изумлении" [ref=f3e172] [cursor=pointer]: 😦
                  - button "страдает" [ref=f3e173] [cursor=pointer]: 😧
                  - button "боится" [ref=f3e174] [cursor=pointer]: 😨
                  - button "сильно беспокоится" [ref=f3e175] [cursor=pointer]: 😰
                  - button "обошлось" [ref=f3e176] [cursor=pointer]: 😥
                  - button "плачет" [ref=f3e177] [cursor=pointer]: 😢
                  - button "слезы рекой" [ref=f3e178] [cursor=pointer]: 😭
                  - button "в ужасе" [ref=f3e179] [cursor=pointer]: 😱
                  - button "в растерянности" [ref=f3e180] [cursor=pointer]: 😖
                  - button "упорство" [ref=f3e181] [cursor=pointer]: 😣
                  - button "разочарование" [ref=f3e182] [cursor=pointer]: 😞
                  - button "в холодном поту" [ref=f3e183] [cursor=pointer]: 😓
                  - button "усталость" [ref=f3e184] [cursor=pointer]: 😩
                  - button "сильная усталость" [ref=f3e185] [cursor=pointer]: 😫
                  - button "зевает" [ref=f3e186] [cursor=pointer]: 🥱
                  - button "в ожидании успеха" [ref=f3e187] [cursor=pointer]: 😤
                  - button "злится" [ref=f3e188] [cursor=pointer]: 😡
                  - button "сердится" [ref=f3e189] [cursor=pointer]: 😠
                  - button "цензура" [ref=f3e190] [cursor=pointer]: 🤬
                  - button "улыбающийся чертенок" [ref=f3e191] [cursor=pointer]: 😈
                  - button "злой чертенок" [ref=f3e192] [cursor=pointer]: 👿
                  - button "череп" [ref=f3e193] [cursor=pointer]: 💀
                  - button "череп и кости" [ref=f3e194] [cursor=pointer]: ☠️
                  - button "какашка" [ref=f3e195] [cursor=pointer]: 💩
                  - button "клоун" [ref=f3e196] [cursor=pointer]: 🤡
                  - button "чудовище" [ref=f3e197] [cursor=pointer]: 👹
                  - button "японский гоблин" [ref=f3e198] [cursor=pointer]: 👺
                  - button "привидение" [ref=f3e199] [cursor=pointer]: 👻
                  - button "инопланетянин" [ref=f3e200] [cursor=pointer]: 👽
                  - button "космический монстр" [ref=f3e201] [cursor=pointer]: 👾
                  - button "робот" [ref=f3e202] [cursor=pointer]: 🤖
                  - button "улыбающийся кот" [ref=f3e203] [cursor=pointer]: 😺
                  - button "смеющийся кот" [ref=f3e204] [cursor=pointer]: 😸
                  - button "смеющийся до слез кот" [ref=f3e205] [cursor=pointer]: 😹
                  - button "влюбленный кот" [ref=f3e206] [cursor=pointer]: 😻
                  - button "ухмыляющийся кот" [ref=f3e207] [cursor=pointer]: 😼
                  - button "целующий кот" [ref=f3e208] [cursor=pointer]: 😽
                  - button "кот в шоке" [ref=f3e209] [cursor=pointer]: 🙀
                  - button "плачущий кот" [ref=f3e210] [cursor=pointer]: 😿
                  - button "злой кот" [ref=f3e211] [cursor=pointer]: 😾
                  - button "ничего не вижу" [ref=f3e212] [cursor=pointer]: 🙈
                  - button "ничего не слышу" [ref=f3e213] [cursor=pointer]: 🙉
                  - button "ничего никому не скажу" [ref=f3e214] [cursor=pointer]: 🙊
                  - button "любовное письмо" [ref=f3e215] [cursor=pointer]: 💌
                  - button "сердце, пронзенное стрелой" [ref=f3e216] [cursor=pointer]: 💘
                  - button "сердце с лентой" [ref=f3e217] [cursor=pointer]: 💝
                  - button "сверкающее сердце" [ref=f3e218] [cursor=pointer]: 💖
                  - button "растущее сердце" [ref=f3e219] [cursor=pointer]: 💗
                  - button "пульсирующее сердце" [ref=f3e220] [cursor=pointer]: 💓
                  - button "вращающиеся сердца" [ref=f3e221] [cursor=pointer]: 💞
                  - button "два сердца" [ref=f3e222] [cursor=pointer]: 💕
                  - button "значок «сердце»" [ref=f3e223] [cursor=pointer]: 💟
                  - button "восклицательный знак в виде сердца" [ref=f3e224] [cursor=pointer]: ❣️
                  - button "разбитое сердце" [ref=f3e225] [cursor=pointer]: 💔
                  - button "горящее сердце" [ref=f3e226] [cursor=pointer]: ❤️‍🔥
                  - button "заживающее сердце" [ref=f3e227] [cursor=pointer]: ❤️‍🩹
                  - button "алое сердце" [ref=f3e228] [cursor=pointer]: ❤️
                  - button "розовое сердце" [ref=f3e229] [cursor=pointer]: 🩷
                  - button "оранжевое сердце" [ref=f3e230] [cursor=pointer]: 🧡
                  - button "желтое сердце" [ref=f3e231] [cursor=pointer]: 💛
                  - button "зеленое сердце" [ref=f3e232] [cursor=pointer]: 💚
                  - button "синее сердце" [ref=f3e233] [cursor=pointer]: 💙
                  - button "голубое сердце" [ref=f3e234] [cursor=pointer]: 🩵
                  - button "фиолетовое сердце" [ref=f3e235] [cursor=pointer]: 💜
                  - button "коричневое сердце" [ref=f3e236] [cursor=pointer]: 🤎
                  - button "черное сердце" [ref=f3e237] [cursor=pointer]: 🖤
                  - button "серое сердце" [ref=f3e238] [cursor=pointer]: 🩶
                  - button "белое сердце" [ref=f3e239] [cursor=pointer]: 🤍
                  - button "след от поцелуя" [ref=f3e240] [cursor=pointer]: 💋
                  - button "сто баллов" [ref=f3e241] [cursor=pointer]: 💯
                  - button "значок «гнев»" [ref=f3e242] [cursor=pointer]: 💢
                  - button "драка" [ref=f3e243] [cursor=pointer]: 🫯
                  - button "взрыв" [ref=f3e244] [cursor=pointer]: 💥
                  - button "кружащаяся звезда" [ref=f3e245] [cursor=pointer]: 💫
                  - button "капли пота" [ref=f3e246] [cursor=pointer]: 💦
                  - button "исчезновение" [ref=f3e247] [cursor=pointer]: 💨
                  - button "дыра" [ref=f3e248] [cursor=pointer]: 🕳️
                  - button "облачко с многоточием" [ref=f3e249] [cursor=pointer]: 💬
                  - button "значок свидетеля" [ref=f3e250] [cursor=pointer]: 👁️‍🗨️
                  - button "пустое облачко" [ref=f3e251] [cursor=pointer]: 🗨️
                  - button "гневное облачко" [ref=f3e252] [cursor=pointer]: 🗯️
                  - button "облачко с мыслями" [ref=f3e253] [cursor=pointer]: 💭
                  - button "сон" [ref=f3e254] [cursor=pointer]: 💤
            - generic "Категории эмодзи" [ref=f3e255]:
              - button "Недавние" [pressed] [ref=f3e256] [cursor=pointer]:
                - generic [aria-hidden] [ref=f3e257]: ◷
              - button "Эмоции" [ref=f3e258] [cursor=pointer]:
                - generic [aria-hidden] [ref=f3e259]: 🙂
              - button "Люди" [ref=f3e260] [cursor=pointer]:
                - generic [aria-hidden] [ref=f3e261]: 👋
              - button "Природа" [ref=f3e262] [cursor=pointer]:
                - generic [aria-hidden] [ref=f3e263]: 🐻
              - button "Еда" [ref=f3e264] [cursor=pointer]:
                - generic [aria-hidden] [ref=f3e265]: 🍕
              - button "Путешествия" [ref=f3e266] [cursor=pointer]:
                - generic [aria-hidden] [ref=f3e267]: ✈️
              - button "Занятия" [ref=f3e268] [cursor=pointer]:
                - generic [aria-hidden] [ref=f3e269]: ⚽
              - button "Предметы" [ref=f3e270] [cursor=pointer]:
                - generic [aria-hidden] [ref=f3e271]: 💡
              - button "Символы" [ref=f3e272] [cursor=pointer]:
                - generic [aria-hidden] [ref=f3e273]: ♡
              - button "Флаги" [ref=f3e274] [cursor=pointer]:
                - generic [aria-hidden] [ref=f3e275]: ⚑
          - generic [ref=f3e276]:
            - button "Добавить к встрече" [ref=f3e278] [cursor=pointer]
            - generic [ref=f3e281]:
              - generic [ref=f3e282]:
                - generic [ref=f3e283]: Сообщение
                - textbox "Сообщение" [ref=f3e284]:
                  - /placeholder: Сообщение…
                  - text: До XX после
              - button "Вернуться к клавиатуре" [expanded] [active] [ref=f3e285] [cursor=pointer]
            - button "Отправить сообщение" [ref=f3e289] [cursor=pointer]
      - complementary [ref=f3e292]:
        - generic [ref=f3e293]:
          - generic [ref=f3e294]:
            - generic [ref=f3e295]:
              - term [ref=f3e296]: Когда
              - definition [ref=f3e297]:
                - generic [ref=f3e298]: 24 октября в 19:00
                - generic [ref=f3e299]: Москва
            - generic [ref=f3e300]:
              - term [ref=f3e301]: Где
              - definition [ref=f3e302]: Место пока не выбрано
          - generic [ref=f3e303]:
            - heading "Кто придёт · 1" [level=3] [ref=f3e304]
            - 'button "Все участники встречи. Придут: 1" [ref=f3e305] [cursor=pointer]':
              - generic "Саша" [ref=f3e306]:
                - generic [aria-hidden] [ref=f3e307]: С
                - text: Саша
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { apiCreate, login } from '@tests/helpers';
  3   | import {
  4   |   controlEmojiMotion,
  5   |   finishEmojiMotion,
  6   |   sampleEmojiMotion,
  7   | } from '@tests/helpers/emoji-motion';
  8   | 
  9   | test.use({ hasTouch: true });
  10  | 
  11  | for (const width of [390, 1440]) {
  12  |   test(`emoji panel retains exit and reverses from its current frame at ${width}`, async ({
  13  |     page,
  14  |   }) => {
  15  |     await page.setViewportSize({ width, height: 844 });
  16  |     await page.emulateMedia({ reducedMotion: 'no-preference' });
  17  |     await controlEmojiMotion(page);
  18  |     await login(page, 'Саша');
  19  |     const { meeting } = await apiCreate(page, 'Движение эмодзи');
  20  |     await page.goto(`/meetings/${meeting.id}`);
  21  |     const input = page.getByRole('textbox', { name: 'Сообщение', exact: true });
  22  |     await input.fill('До XX после');
  23  |     await input.evaluate((element) => {
  24  |       if (element instanceof HTMLTextAreaElement) {
  25  |         element.setSelectionRange(3, 5);
  26  |         element.dispatchEvent(new Event('select', { bubbles: true }));
  27  |       }
  28  |     });
  29  |     await page.getByRole('button', { name: 'Выбрать эмодзи', exact: true }).click();
  30  |     const panel = page.locator('[data-emoji-panel]');
  31  |     const first = await sampleEmojiMotion(panel, 0);
  32  |     const middle = await sampleEmojiMotion(panel, 90);
  33  |     expect(first.opacity).toBe(0);
  34  |     expect(middle.duration).toBe(180);
  35  |     expect(middle.opacity).toBeGreaterThan(0);
  36  |     expect(middle.opacity).toBeLessThan(1);
  37  | 
  38  |     if (width < 740) {
  39  |       expect(first.height).toBe(0);
  40  |       expect(middle.height).toBeGreaterThan(0);
  41  |     } else {
  42  |       expect(middle.height).toBe(first.height);
  43  |       expect(middle.keyframes.every((frame) => !('height' in frame))).toBe(true);
  44  |     }
  45  | 
  46  |     await page.screenshot({ path: test.info().outputPath('emoji-enter-middle.png') });
  47  |     await finishEmojiMotion(panel);
  48  |     await expect(panel).toHaveAttribute('data-motion', 'open');
  49  |     const opened = await sampleEmojiMotion(panel);
  50  |     expect(opened.opacity).toBe(1);
  51  |     await page.keyboard.press('Escape');
  52  |     await expect(panel).toHaveAttribute('inert', '');
  53  |     await expect(panel).toHaveAttribute('aria-hidden', 'true');
  54  |     await expect(panel).toHaveCSS('pointer-events', 'none');
  55  |     await expect(page.getByRole('region', { name: 'Выбор эмодзи' })).toHaveCount(0);
  56  |     const closing = await sampleEmojiMotion(panel, 75);
  57  |     expect(closing.duration).toBe(150);
  58  |     expect(closing.opacity).toBeGreaterThan(0);
  59  |     expect(closing.opacity).toBeLessThan(1);
  60  |     await expect(
  61  |       page.getByRole('button', { name: 'Выбрать эмодзи', exact: true }),
  62  |     ).toBeFocused();
  63  |     await page.screenshot({ path: test.info().outputPath('emoji-exit-middle.png') });
  64  |     await page.getByRole('button', { name: 'Выбрать эмодзи', exact: true }).click();
  65  |     const reopened = await sampleEmojiMotion(panel, 0);
  66  |     await test.info().attach('reopen-samples', {
  67  |       body: JSON.stringify({ closing, reopened }, null, 2),
  68  |       contentType: 'application/json',
  69  |     });
> 70  |     expect(reopened.opacity).toBeCloseTo(closing.opacity, 3);
      |                              ^ Error: expect(received).toBeCloseTo(expected, precision)
  71  |     expect(reopened.height).toBeCloseTo(closing.height, 1);
  72  |     await expect(panel).not.toHaveAttribute('inert');
  73  |     await finishEmojiMotion(panel);
  74  |     await expect(panel).toHaveAttribute('data-motion', 'open');
  75  |     await expect(input).toHaveValue('До XX после');
  76  |     await page
  77  |       .getByRole('button', { name: 'Вернуться к клавиатуре', exact: true })
  78  |       .click();
  79  |     await expect(input).toBeFocused();
  80  |     expect(
  81  |       await input.evaluate(
  82  |         (element) =>
  83  |           element instanceof HTMLTextAreaElement && [
  84  |             element.selectionStart,
  85  |             element.selectionEnd,
  86  |           ],
  87  |       ),
  88  |     ).toEqual([3, 5]);
  89  |     await finishEmojiMotion(panel);
  90  |     await expect(panel).toHaveCount(0);
  91  |     await test.info().attach('motion-samples', {
  92  |       body: JSON.stringify({ first, middle, opened, closing, reopened }, null, 2),
  93  |       contentType: 'application/json',
  94  |     });
  95  |   });
  96  | 
  97  |   test(`reduced emoji motion is immediate and returns focus at ${width}`, async ({
  98  |     page,
  99  |   }) => {
  100 |     await page.setViewportSize({ width, height: 844 });
  101 |     await page.emulateMedia({ reducedMotion: 'reduce' });
  102 |     await controlEmojiMotion(page);
  103 |     await login(page, 'Саша');
  104 |     const { meeting } = await apiCreate(page, 'Эмодзи без движения');
  105 |     await page.goto(`/meetings/${meeting.id}`);
  106 |     const input = page.getByRole('textbox', { name: 'Сообщение', exact: true });
  107 |     await input.fill('Сохранённый черновик');
  108 |     const opener = page.getByRole('button', { name: 'Выбрать эмодзи', exact: true });
  109 |     await opener.click();
  110 |     const panel = page.locator('[data-emoji-panel]');
  111 |     await expect(panel).toHaveAttribute('data-motion', 'open');
  112 |     expect(await panel.evaluate((element) => element.getAnimations().length)).toBe(0);
  113 |     await panel.getByRole('searchbox').focus();
  114 |     await page.keyboard.press('Escape');
  115 |     await expect(panel).toHaveCount(0);
  116 |     await expect(opener).toBeFocused();
  117 |     await expect(input).toHaveValue('Сохранённый черновик');
  118 |     await page.screenshot({ path: test.info().outputPath('emoji-reduced-closed.png') });
  119 |   });
  120 | }
  121 | 
```