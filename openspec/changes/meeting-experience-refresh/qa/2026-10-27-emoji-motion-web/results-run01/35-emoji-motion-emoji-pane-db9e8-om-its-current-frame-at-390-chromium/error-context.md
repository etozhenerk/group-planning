# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 35-emoji-motion.spec.ts >> emoji panel retains exit and reverses from its current frame at 390
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
  - main [ref=f3e8]:
    - generic [ref=f3e9]:
      - link "К моим встречам" [ref=f3e10] [cursor=pointer]:
        - /url: /meetings
      - button "Сведения о встрече «Движение эмодзи»" [ref=f3e17] [cursor=pointer]:
        - heading "Движение эмодзи" [level=1] [ref=f3e18]
        - generic [ref=f3e19]: 24 октября · 19:00 · 1 участник
      - button "Пригласить друзей" [ref=f3e21] [cursor=pointer]
      - button "Информация о встрече" [ref=f3e24] [cursor=pointer]
    - generic [ref=f3e28]:
      - list "Разговор встречи" [ref=f3e29]:
        - listitem [ref=f3e30]:
          - time [ref=f3e31]: Сегодня · 21:38
          - paragraph [ref=f3e32]: Саша создал встречу
      - generic [ref=f3e33]:
        - heading "Позовём остальных?" [level=2] [ref=f3e38]
        - paragraph [ref=f3e39]: Отправьте друзьям ссылку на встречу.После ответа «Приду» они появятся в чате.
        - button "Пригласить друзей" [ref=f3e40] [cursor=pointer]
    - generic [ref=f3e45]:
      - generic [ref=f3e46]:
        - button "Добавить к встрече" [ref=f3e48] [cursor=pointer]
        - generic [ref=f3e51]:
          - generic [ref=f3e52]:
            - generic [ref=f3e53]: Сообщение
            - textbox "Сообщение" [ref=f3e54]:
              - /placeholder: Сообщение…
              - text: До XX после
          - button "Вернуться к клавиатуре" [expanded] [active] [ref=f3e55] [cursor=pointer]
        - button "Отправить сообщение" [ref=f3e59] [cursor=pointer]
      - region "Выбор эмодзи" [ref=f3e63]:
        - generic [ref=f3e64]:
          - searchbox "Найти эмодзи" [ref=f3e69]
          - button "Удалить символ перед курсором сообщения" [ref=f3e70] [cursor=pointer]
        - group "Категории эмодзи" [ref=f3e74]:
          - button "Недавние" [pressed] [ref=f3e75] [cursor=pointer]:
            - generic [aria-hidden] [ref=f3e76]: ◷
          - button "Эмоции" [ref=f3e77] [cursor=pointer]:
            - generic [aria-hidden] [ref=f3e78]: 🙂
          - button "Люди" [ref=f3e79] [cursor=pointer]:
            - generic [aria-hidden] [ref=f3e80]: 👋
          - button "Природа" [ref=f3e81] [cursor=pointer]:
            - generic [aria-hidden] [ref=f3e82]: 🐻
          - button "Еда" [ref=f3e83] [cursor=pointer]:
            - generic [aria-hidden] [ref=f3e84]: 🍕
          - button "Путешествия" [ref=f3e85] [cursor=pointer]:
            - generic [aria-hidden] [ref=f3e86]: ✈️
          - button "Занятия" [ref=f3e87] [cursor=pointer]:
            - generic [aria-hidden] [ref=f3e88]: ⚽
          - button "Предметы" [ref=f3e89] [cursor=pointer]:
            - generic [aria-hidden] [ref=f3e90]: 💡
          - button "Символы" [ref=f3e91] [cursor=pointer]:
            - generic [aria-hidden] [ref=f3e92]: ♡
          - button "Флаги" [ref=f3e93] [cursor=pointer]:
            - generic [aria-hidden] [ref=f3e94]: ⚑
        - generic [ref=f3e96]:
          - heading "Смайлы и эмоции" [level=3] [ref=f3e97]
          - generic [ref=f3e98]:
            - 'button "Вставить: широко улыбается" [ref=f3e99] [cursor=pointer]': 😀
            - 'button "Вставить: смеется" [ref=f3e100] [cursor=pointer]': 😃
            - 'button "Вставить: смеется с закрытыми глазами" [ref=f3e101] [cursor=pointer]': 😄
            - 'button "Вставить: светится от счастья" [ref=f3e102] [cursor=pointer]': 😁
            - 'button "Вставить: смеется с прищуренными глазами" [ref=f3e103] [cursor=pointer]': 😆
            - 'button "Вставить: нервно смеется" [ref=f3e104] [cursor=pointer]': 😅
            - 'button "Вставить: катается со смеху" [ref=f3e105] [cursor=pointer]': 🤣
            - 'button "Вставить: смеется до слез" [ref=f3e106] [cursor=pointer]': 😂
            - 'button "Вставить: слегка улыбается" [ref=f3e107] [cursor=pointer]': 🙂
            - 'button "Вставить: вверх тормашками" [ref=f3e108] [cursor=pointer]': 🙃
            - 'button "Вставить: тает" [ref=f3e109] [cursor=pointer]': 🫠
            - 'button "Вставить: подмигивает" [ref=f3e110] [cursor=pointer]': 😉
            - 'button "Вставить: довольно улыбается" [ref=f3e111] [cursor=pointer]': 😊
            - 'button "Вставить: с нимбом" [ref=f3e112] [cursor=pointer]': 😇
            - 'button "Вставить: улыбающееся лицо с сердечками" [ref=f3e113] [cursor=pointer]': 🥰
            - 'button "Вставить: влюбленное лицо" [ref=f3e114] [cursor=pointer]': 😍
            - 'button "Вставить: звезды в глазах" [ref=f3e115] [cursor=pointer]': 🤩
            - 'button "Вставить: воздушный поцелуй" [ref=f3e116] [cursor=pointer]': 😘
            - 'button "Вставить: целует" [ref=f3e117] [cursor=pointer]': 😗
            - 'button "Вставить: улыбается" [ref=f3e118] [cursor=pointer]': ☺️
            - 'button "Вставить: целует с закрытыми глазами" [ref=f3e119] [cursor=pointer]': 😚
            - 'button "Вставить: счастливый поцелуй" [ref=f3e120] [cursor=pointer]': 😙
            - 'button "Вставить: улыбающееся лицо со слезой" [ref=f3e121] [cursor=pointer]': 🥲
            - 'button "Вставить: вкусно" [ref=f3e122] [cursor=pointer]': 😋
            - 'button "Вставить: показывает язык" [ref=f3e123] [cursor=pointer]': 😛
            - 'button "Вставить: показывает язык и подмигивает" [ref=f3e124] [cursor=pointer]': 😜
            - 'button "Вставить: сумасшедшее лицо" [ref=f3e125] [cursor=pointer]': 🤪
            - 'button "Вставить: морщится и показывает язык" [ref=f3e126] [cursor=pointer]': 😝
            - 'button "Вставить: деньги в глазах" [ref=f3e127] [cursor=pointer]': 🤑
            - 'button "Вставить: обнимает" [ref=f3e128] [cursor=pointer]': 🤗
            - 'button "Вставить: прикрывает рот рукой" [ref=f3e129] [cursor=pointer]': 🤭
            - 'button "Вставить: прикрывает рот рукой с открытыми глазами" [ref=f3e130] [cursor=pointer]': 🫢
            - 'button "Вставить: подсматривает" [ref=f3e131] [cursor=pointer]': 🫣
            - 'button "Вставить: тс-с-с" [ref=f3e132] [cursor=pointer]': 🤫
            - 'button "Вставить: думает" [ref=f3e133] [cursor=pointer]': 🤔
            - 'button "Вставить: воинское приветствие" [ref=f3e134] [cursor=pointer]': 🫡
            - 'button "Вставить: рот на замке" [ref=f3e135] [cursor=pointer]': 🤐
            - 'button "Вставить: не верит" [ref=f3e136] [cursor=pointer]': 🤨
            - 'button "Вставить: все равно" [ref=f3e137] [cursor=pointer]': 😐
            - 'button "Вставить: без эмоций" [ref=f3e138] [cursor=pointer]': 😑
            - 'button "Вставить: лицо без рта" [ref=f3e139] [cursor=pointer]': 😶
            - 'button "Вставить: лицо пунктиром" [ref=f3e140] [cursor=pointer]': 🫥
            - 'button "Вставить: лицо в облаках" [ref=f3e141] [cursor=pointer]': 😶‍🌫️
            - 'button "Вставить: ухмыляется" [ref=f3e142] [cursor=pointer]': 😏
            - 'button "Вставить: скучает" [ref=f3e143] [cursor=pointer]': 😒
            - 'button "Вставить: закатывает глаза" [ref=f3e144] [cursor=pointer]': 🙄
            - 'button "Вставить: гримаса" [ref=f3e145] [cursor=pointer]': 😬
            - 'button "Вставить: выдыхает" [ref=f3e146] [cursor=pointer]': 😮‍💨
            - 'button "Вставить: лжец" [ref=f3e147] [cursor=pointer]': 🤥
            - 'button "Вставить: трясущееся лицо" [ref=f3e148] [cursor=pointer]': 🫨
            - 'button "Вставить: отрицательно качает головой" [ref=f3e149] [cursor=pointer]': 🙂‍↔️
            - 'button "Вставить: положительно качает головой" [ref=f3e150] [cursor=pointer]': 🙂‍↕️
            - 'button "Вставить: испытывает облегчение" [ref=f3e151] [cursor=pointer]': 😌
            - 'button "Вставить: размышляет" [ref=f3e152] [cursor=pointer]': 😔
            - 'button "Вставить: хочет спать" [ref=f3e153] [cursor=pointer]': 😪
            - 'button "Вставить: пускает слюни" [ref=f3e154] [cursor=pointer]': 🤤
            - 'button "Вставить: спит" [ref=f3e155] [cursor=pointer]': 😴
            - 'button "Вставить: лицо с мешками под глазами" [ref=f3e156] [cursor=pointer]': 🫩
            - 'button "Вставить: в медицинской маске" [ref=f3e157] [cursor=pointer]': 😷
            - 'button "Вставить: с градусником во рту" [ref=f3e158] [cursor=pointer]': 🤒
            - 'button "Вставить: с перевязанной головой" [ref=f3e159] [cursor=pointer]': 🤕
            - 'button "Вставить: тошнит" [ref=f3e160] [cursor=pointer]': 🤢
            - 'button "Вставить: рвота" [ref=f3e161] [cursor=pointer]': 🤮
            - 'button "Вставить: чихает" [ref=f3e162] [cursor=pointer]': 🤧
            - 'button "Вставить: жар" [ref=f3e163] [cursor=pointer]': 🥵
            - 'button "Вставить: мерзнет" [ref=f3e164] [cursor=pointer]': 🥶
            - 'button "Вставить: чувствует головокружение" [ref=f3e165] [cursor=pointer]': 🥴
            - 'button "Вставить: головокружение" [ref=f3e166] [cursor=pointer]': 😵
            - 'button "Вставить: ошеломление" [ref=f3e167] [cursor=pointer]': 😵‍💫
            - 'button "Вставить: взрыв мозга" [ref=f3e168] [cursor=pointer]': 🤯
            - 'button "Вставить: в ковбойской шляпе" [ref=f3e169] [cursor=pointer]': 🤠
            - 'button "Вставить: на вечеринке" [ref=f3e170] [cursor=pointer]': 🥳
            - 'button "Вставить: маскировка" [ref=f3e171] [cursor=pointer]': 🥸
            - 'button "Вставить: лицо в темных очках" [ref=f3e172] [cursor=pointer]': 😎
            - 'button "Вставить: очкарик" [ref=f3e173] [cursor=pointer]': 🤓
            - 'button "Вставить: с моноклем" [ref=f3e174] [cursor=pointer]': 🧐
            - 'button "Вставить: в замешательстве" [ref=f3e175] [cursor=pointer]': 😕
            - 'button "Вставить: с перекошенным ртом" [ref=f3e176] [cursor=pointer]': 🫤
            - 'button "Вставить: беспокоится" [ref=f3e177] [cursor=pointer]': 😟
            - 'button "Вставить: немного грустит" [ref=f3e178] [cursor=pointer]': 🙁
            - 'button "Вставить: грустит" [ref=f3e179] [cursor=pointer]': ☹️
            - 'button "Вставить: удивление" [ref=f3e180] [cursor=pointer]': 😮
            - 'button "Вставить: неприятный сюрприз" [ref=f3e181] [cursor=pointer]': 😯
            - 'button "Вставить: в шоке" [ref=f3e182] [cursor=pointer]': 😲
            - 'button "Вставить: краснеет" [ref=f3e183] [cursor=pointer]': 😳
            - 'button "Вставить: лицо перекосило" [ref=f3e184] [cursor=pointer]': 🫪
            - 'button "Вставить: умоляет" [ref=f3e185] [cursor=pointer]': 🥺
            - 'button "Вставить: еле сдерживает слезы" [ref=f3e186] [cursor=pointer]': 🥹
            - 'button "Вставить: в изумлении" [ref=f3e187] [cursor=pointer]': 😦
            - 'button "Вставить: страдает" [ref=f3e188] [cursor=pointer]': 😧
            - 'button "Вставить: боится" [ref=f3e189] [cursor=pointer]': 😨
            - 'button "Вставить: сильно беспокоится" [ref=f3e190] [cursor=pointer]': 😰
            - 'button "Вставить: обошлось" [ref=f3e191] [cursor=pointer]': 😥
            - 'button "Вставить: плачет" [ref=f3e192] [cursor=pointer]': 😢
            - 'button "Вставить: слезы рекой" [ref=f3e193] [cursor=pointer]': 😭
            - 'button "Вставить: в ужасе" [ref=f3e194] [cursor=pointer]': 😱
            - 'button "Вставить: в растерянности" [ref=f3e195] [cursor=pointer]': 😖
            - 'button "Вставить: упорство" [ref=f3e196] [cursor=pointer]': 😣
            - 'button "Вставить: разочарование" [ref=f3e197] [cursor=pointer]': 😞
            - 'button "Вставить: в холодном поту" [ref=f3e198] [cursor=pointer]': 😓
            - 'button "Вставить: усталость" [ref=f3e199] [cursor=pointer]': 😩
            - 'button "Вставить: сильная усталость" [ref=f3e200] [cursor=pointer]': 😫
            - 'button "Вставить: зевает" [ref=f3e201] [cursor=pointer]': 🥱
            - 'button "Вставить: в ожидании успеха" [ref=f3e202] [cursor=pointer]': 😤
            - 'button "Вставить: злится" [ref=f3e203] [cursor=pointer]': 😡
            - 'button "Вставить: сердится" [ref=f3e204] [cursor=pointer]': 😠
            - 'button "Вставить: цензура" [ref=f3e205] [cursor=pointer]': 🤬
            - 'button "Вставить: улыбающийся чертенок" [ref=f3e206] [cursor=pointer]': 😈
            - 'button "Вставить: злой чертенок" [ref=f3e207] [cursor=pointer]': 👿
            - 'button "Вставить: череп" [ref=f3e208] [cursor=pointer]': 💀
            - 'button "Вставить: череп и кости" [ref=f3e209] [cursor=pointer]': ☠️
            - 'button "Вставить: какашка" [ref=f3e210] [cursor=pointer]': 💩
            - 'button "Вставить: клоун" [ref=f3e211] [cursor=pointer]': 🤡
            - 'button "Вставить: чудовище" [ref=f3e212] [cursor=pointer]': 👹
            - 'button "Вставить: японский гоблин" [ref=f3e213] [cursor=pointer]': 👺
            - 'button "Вставить: привидение" [ref=f3e214] [cursor=pointer]': 👻
            - 'button "Вставить: инопланетянин" [ref=f3e215] [cursor=pointer]': 👽
            - 'button "Вставить: космический монстр" [ref=f3e216] [cursor=pointer]': 👾
            - 'button "Вставить: робот" [ref=f3e217] [cursor=pointer]': 🤖
            - 'button "Вставить: улыбающийся кот" [ref=f3e218] [cursor=pointer]': 😺
            - 'button "Вставить: смеющийся кот" [ref=f3e219] [cursor=pointer]': 😸
            - 'button "Вставить: смеющийся до слез кот" [ref=f3e220] [cursor=pointer]': 😹
            - 'button "Вставить: влюбленный кот" [ref=f3e221] [cursor=pointer]': 😻
            - 'button "Вставить: ухмыляющийся кот" [ref=f3e222] [cursor=pointer]': 😼
            - 'button "Вставить: целующий кот" [ref=f3e223] [cursor=pointer]': 😽
            - 'button "Вставить: кот в шоке" [ref=f3e224] [cursor=pointer]': 🙀
            - 'button "Вставить: плачущий кот" [ref=f3e225] [cursor=pointer]': 😿
            - 'button "Вставить: злой кот" [ref=f3e226] [cursor=pointer]': 😾
            - 'button "Вставить: ничего не вижу" [ref=f3e227] [cursor=pointer]': 🙈
            - 'button "Вставить: ничего не слышу" [ref=f3e228] [cursor=pointer]': 🙉
            - 'button "Вставить: ничего никому не скажу" [ref=f3e229] [cursor=pointer]': 🙊
            - 'button "Вставить: любовное письмо" [ref=f3e230] [cursor=pointer]': 💌
            - 'button "Вставить: сердце, пронзенное стрелой" [ref=f3e231] [cursor=pointer]': 💘
            - 'button "Вставить: сердце с лентой" [ref=f3e232] [cursor=pointer]': 💝
            - 'button "Вставить: сверкающее сердце" [ref=f3e233] [cursor=pointer]': 💖
            - 'button "Вставить: растущее сердце" [ref=f3e234] [cursor=pointer]': 💗
            - 'button "Вставить: пульсирующее сердце" [ref=f3e235] [cursor=pointer]': 💓
            - 'button "Вставить: вращающиеся сердца" [ref=f3e236] [cursor=pointer]': 💞
            - 'button "Вставить: два сердца" [ref=f3e237] [cursor=pointer]': 💕
            - 'button "Вставить: значок «сердце»" [ref=f3e238] [cursor=pointer]': 💟
            - 'button "Вставить: восклицательный знак в виде сердца" [ref=f3e239] [cursor=pointer]': ❣️
            - 'button "Вставить: разбитое сердце" [ref=f3e240] [cursor=pointer]': 💔
            - 'button "Вставить: горящее сердце" [ref=f3e241] [cursor=pointer]': ❤️‍🔥
            - 'button "Вставить: заживающее сердце" [ref=f3e242] [cursor=pointer]': ❤️‍🩹
            - 'button "Вставить: алое сердце" [ref=f3e243] [cursor=pointer]': ❤️
            - 'button "Вставить: розовое сердце" [ref=f3e244] [cursor=pointer]': 🩷
            - 'button "Вставить: оранжевое сердце" [ref=f3e245] [cursor=pointer]': 🧡
            - 'button "Вставить: желтое сердце" [ref=f3e246] [cursor=pointer]': 💛
            - 'button "Вставить: зеленое сердце" [ref=f3e247] [cursor=pointer]': 💚
            - 'button "Вставить: синее сердце" [ref=f3e248] [cursor=pointer]': 💙
            - 'button "Вставить: голубое сердце" [ref=f3e249] [cursor=pointer]': 🩵
            - 'button "Вставить: фиолетовое сердце" [ref=f3e250] [cursor=pointer]': 💜
            - 'button "Вставить: коричневое сердце" [ref=f3e251] [cursor=pointer]': 🤎
            - 'button "Вставить: черное сердце" [ref=f3e252] [cursor=pointer]': 🖤
            - 'button "Вставить: серое сердце" [ref=f3e253] [cursor=pointer]': 🩶
            - 'button "Вставить: белое сердце" [ref=f3e254] [cursor=pointer]': 🤍
            - 'button "Вставить: след от поцелуя" [ref=f3e255] [cursor=pointer]': 💋
            - 'button "Вставить: сто баллов" [ref=f3e256] [cursor=pointer]': 💯
            - 'button "Вставить: значок «гнев»" [ref=f3e257] [cursor=pointer]': 💢
            - 'button "Вставить: драка" [ref=f3e258] [cursor=pointer]': 🫯
            - 'button "Вставить: взрыв" [ref=f3e259] [cursor=pointer]': 💥
            - 'button "Вставить: кружащаяся звезда" [ref=f3e260] [cursor=pointer]': 💫
            - 'button "Вставить: капли пота" [ref=f3e261] [cursor=pointer]': 💦
            - 'button "Вставить: исчезновение" [ref=f3e262] [cursor=pointer]': 💨
            - 'button "Вставить: дыра" [ref=f3e263] [cursor=pointer]': 🕳️
            - 'button "Вставить: облачко с многоточием" [ref=f3e264] [cursor=pointer]': 💬
            - 'button "Вставить: значок свидетеля" [ref=f3e265] [cursor=pointer]': 👁️‍🗨️
            - 'button "Вставить: пустое облачко" [ref=f3e266] [cursor=pointer]': 🗨️
            - 'button "Вставить: гневное облачко" [ref=f3e267] [cursor=pointer]': 🗯️
            - 'button "Вставить: облачко с мыслями" [ref=f3e268] [cursor=pointer]': 💭
            - 'button "Вставить: сон" [ref=f3e269] [cursor=pointer]': 💤
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
> 66  |     expect(reopened.opacity).toBeCloseTo(closing.opacity, 3);
      |                              ^ Error: expect(received).toBeCloseTo(expected, precision)
  67  |     expect(reopened.height).toBeCloseTo(closing.height, 1);
  68  |     await expect(panel).not.toHaveAttribute('inert');
  69  |     await finishEmojiMotion(panel);
  70  |     await expect(panel).toHaveAttribute('data-motion', 'open');
  71  |     await expect(input).toHaveValue('До XX после');
  72  |     await page
  73  |       .getByRole('button', { name: 'Вернуться к клавиатуре', exact: true })
  74  |       .click();
  75  |     await expect(input).toBeFocused();
  76  |     expect(
  77  |       await input.evaluate(
  78  |         (element) =>
  79  |           element instanceof HTMLTextAreaElement && [
  80  |             element.selectionStart,
  81  |             element.selectionEnd,
  82  |           ],
  83  |       ),
  84  |     ).toEqual([3, 5]);
  85  |     await finishEmojiMotion(panel);
  86  |     await expect(panel).toHaveCount(0);
  87  |     await test.info().attach('motion-samples', {
  88  |       body: JSON.stringify({ first, middle, opened, closing, reopened }, null, 2),
  89  |       contentType: 'application/json',
  90  |     });
  91  |   });
  92  | 
  93  |   test(`reduced emoji motion is immediate and returns focus at ${width}`, async ({
  94  |     page,
  95  |   }) => {
  96  |     await page.setViewportSize({ width, height: 844 });
  97  |     await page.emulateMedia({ reducedMotion: 'reduce' });
  98  |     await controlEmojiMotion(page);
  99  |     await login(page, 'Саша');
  100 |     const { meeting } = await apiCreate(page, 'Эмодзи без движения');
  101 |     await page.goto(`/meetings/${meeting.id}`);
  102 |     const input = page.getByRole('textbox', { name: 'Сообщение', exact: true });
  103 |     await input.fill('Сохранённый черновик');
  104 |     const opener = page.getByRole('button', { name: 'Выбрать эмодзи', exact: true });
  105 |     await opener.click();
  106 |     const panel = page.locator('[data-emoji-panel]');
  107 |     await expect(panel).toHaveAttribute('data-motion', 'open');
  108 |     expect(await panel.evaluate((element) => element.getAnimations().length)).toBe(0);
  109 |     await panel.getByRole('searchbox').focus();
  110 |     await page.keyboard.press('Escape');
  111 |     await expect(panel).toHaveCount(0);
  112 |     await expect(opener).toBeFocused();
  113 |     await expect(input).toHaveValue('Сохранённый черновик');
  114 |     await page.screenshot({ path: test.info().outputPath('emoji-reduced-closed.png') });
  115 |   });
  116 | }
  117 | 
```