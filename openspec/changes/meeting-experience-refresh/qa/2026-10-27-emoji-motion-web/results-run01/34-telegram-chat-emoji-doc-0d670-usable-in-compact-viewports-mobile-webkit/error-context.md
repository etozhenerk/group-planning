# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 34-telegram-chat.spec.ts >> emoji dock and expanded reactions keep the composer usable in compact viewports
- Location: frontend/web/tests/34-telegram-chat.spec.ts:60:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Page snapshot

```yaml
- generic [ref=f3e3]:
  - link "К содержимому" [ref=f3e4]:
    - /url: "#main"
  - generic [ref=f3e5]: Демостенд · данные хранятся до перезапуска
  - main [ref=f3e8]:
    - generic [ref=f3e9]:
      - link "К моим встречам" [ref=f3e10]:
        - /url: /meetings
      - button "Сведения о встрече «Панели на маленьком экране»" [ref=f3e17] [cursor=pointer]:
        - heading "Панели на маленьком экране" [level=1] [ref=f3e18]
        - generic [ref=f3e19]: 24 октября · 19:00 · 1 участник
      - button "Пригласить друзей" [ref=f3e21] [cursor=pointer]
      - button "Информация о встрече" [ref=f3e24] [cursor=pointer]
    - list "Разговор встречи" [ref=f3e29]:
      - listitem [ref=f3e30]:
        - time [ref=f3e31]: Сегодня · 21:38
        - paragraph [ref=f3e32]: Саша создал встречу
      - listitem [ref=f3e33]:
        - generic [aria-hidden] [ref=f3e34]: С
        - generic [ref=f3e35]:
          - generic [ref=f3e36]:
            - strong [ref=f3e37]: Саша
            - time [ref=f3e38]: 21:38
          - 'group "Реакции на сообщение: Принесу игры" [ref=f3e39]':
            - paragraph [ref=f3e40]: Принесу игры
    - generic [ref=f3e42]:
      - generic [ref=f3e43]:
        - button "Добавить к встрече" [ref=f3e45] [cursor=pointer]
        - generic [ref=f3e48]:
          - generic [ref=f3e49]:
            - generic [ref=f3e50]: Сообщение
            - textbox "Сообщение" [ref=f3e51]:
              - /placeholder: Сообщение…
          - button "Вернуться к клавиатуре" [expanded] [ref=f3e52] [cursor=pointer]
        - button "Отправить сообщение" [disabled] [ref=f3e56]
      - region "Выбор эмодзи" [ref=f3e60]:
        - generic [ref=f3e61]:
          - searchbox "Найти эмодзи" [ref=f3e66]
          - button "Удалить символ перед курсором сообщения" [ref=f3e67] [cursor=pointer]
        - group "Категории эмодзи" [ref=f3e71]:
          - button "Недавние" [pressed] [ref=f3e72] [cursor=pointer]:
            - generic [aria-hidden] [ref=f3e73]: ◷
          - button "Эмоции" [ref=f3e74] [cursor=pointer]:
            - generic [aria-hidden] [ref=f3e75]: 🙂
          - button "Люди" [ref=f3e76] [cursor=pointer]:
            - generic [aria-hidden] [ref=f3e77]: 👋
          - button "Природа" [ref=f3e78] [cursor=pointer]:
            - generic [aria-hidden] [ref=f3e79]: 🐻
          - button "Еда" [ref=f3e80] [cursor=pointer]:
            - generic [aria-hidden] [ref=f3e81]: 🍕
          - button "Путешествия" [ref=f3e82] [cursor=pointer]:
            - generic [aria-hidden] [ref=f3e83]: ✈️
          - button "Занятия" [ref=f3e84] [cursor=pointer]:
            - generic [aria-hidden] [ref=f3e85]: ⚽
          - button "Предметы" [ref=f3e86] [cursor=pointer]:
            - generic [aria-hidden] [ref=f3e87]: 💡
          - button "Символы" [ref=f3e88] [cursor=pointer]:
            - generic [aria-hidden] [ref=f3e89]: ♡
          - button "Флаги" [ref=f3e90] [cursor=pointer]:
            - generic [aria-hidden] [ref=f3e91]: ⚑
        - generic [ref=f3e93]:
          - heading "Смайлы и эмоции" [level=3] [ref=f3e94]
          - generic [ref=f3e95]:
            - 'button "Вставить: широко улыбается" [ref=f3e96] [cursor=pointer]': 😀
            - 'button "Вставить: смеется" [ref=f3e97] [cursor=pointer]': 😃
            - 'button "Вставить: смеется с закрытыми глазами" [ref=f3e98] [cursor=pointer]': 😄
            - 'button "Вставить: светится от счастья" [ref=f3e99] [cursor=pointer]': 😁
            - 'button "Вставить: смеется с прищуренными глазами" [ref=f3e100] [cursor=pointer]': 😆
            - 'button "Вставить: нервно смеется" [ref=f3e101] [cursor=pointer]': 😅
            - 'button "Вставить: катается со смеху" [ref=f3e102] [cursor=pointer]': 🤣
            - 'button "Вставить: смеется до слез" [ref=f3e103] [cursor=pointer]': 😂
            - 'button "Вставить: слегка улыбается" [ref=f3e104] [cursor=pointer]': 🙂
            - 'button "Вставить: вверх тормашками" [ref=f3e105] [cursor=pointer]': 🙃
            - 'button "Вставить: тает" [ref=f3e106] [cursor=pointer]': 🫠
            - 'button "Вставить: подмигивает" [ref=f3e107] [cursor=pointer]': 😉
            - 'button "Вставить: довольно улыбается" [ref=f3e108] [cursor=pointer]': 😊
            - 'button "Вставить: с нимбом" [ref=f3e109] [cursor=pointer]': 😇
            - 'button "Вставить: улыбающееся лицо с сердечками" [ref=f3e110] [cursor=pointer]': 🥰
            - 'button "Вставить: влюбленное лицо" [ref=f3e111] [cursor=pointer]': 😍
            - 'button "Вставить: звезды в глазах" [ref=f3e112] [cursor=pointer]': 🤩
            - 'button "Вставить: воздушный поцелуй" [ref=f3e113] [cursor=pointer]': 😘
            - 'button "Вставить: целует" [ref=f3e114] [cursor=pointer]': 😗
            - 'button "Вставить: улыбается" [ref=f3e115] [cursor=pointer]': ☺️
            - 'button "Вставить: целует с закрытыми глазами" [ref=f3e116] [cursor=pointer]': 😚
            - 'button "Вставить: счастливый поцелуй" [ref=f3e117] [cursor=pointer]': 😙
            - 'button "Вставить: улыбающееся лицо со слезой" [ref=f3e118] [cursor=pointer]': 🥲
            - 'button "Вставить: вкусно" [ref=f3e119] [cursor=pointer]': 😋
            - 'button "Вставить: показывает язык" [ref=f3e120] [cursor=pointer]': 😛
            - 'button "Вставить: показывает язык и подмигивает" [ref=f3e121] [cursor=pointer]': 😜
            - 'button "Вставить: сумасшедшее лицо" [ref=f3e122] [cursor=pointer]': 🤪
            - 'button "Вставить: морщится и показывает язык" [ref=f3e123] [cursor=pointer]': 😝
            - 'button "Вставить: деньги в глазах" [ref=f3e124] [cursor=pointer]': 🤑
            - 'button "Вставить: обнимает" [ref=f3e125] [cursor=pointer]': 🤗
            - 'button "Вставить: прикрывает рот рукой" [ref=f3e126] [cursor=pointer]': 🤭
            - 'button "Вставить: прикрывает рот рукой с открытыми глазами" [ref=f3e127] [cursor=pointer]': 🫢
            - 'button "Вставить: подсматривает" [ref=f3e128] [cursor=pointer]': 🫣
            - 'button "Вставить: тс-с-с" [ref=f3e129] [cursor=pointer]': 🤫
            - 'button "Вставить: думает" [ref=f3e130] [cursor=pointer]': 🤔
            - 'button "Вставить: воинское приветствие" [ref=f3e131] [cursor=pointer]': 🫡
            - 'button "Вставить: рот на замке" [ref=f3e132] [cursor=pointer]': 🤐
            - 'button "Вставить: не верит" [ref=f3e133] [cursor=pointer]': 🤨
            - 'button "Вставить: все равно" [ref=f3e134] [cursor=pointer]': 😐
            - 'button "Вставить: без эмоций" [ref=f3e135] [cursor=pointer]': 😑
            - 'button "Вставить: лицо без рта" [ref=f3e136] [cursor=pointer]': 😶
            - 'button "Вставить: лицо пунктиром" [ref=f3e137] [cursor=pointer]': 🫥
            - 'button "Вставить: лицо в облаках" [ref=f3e138] [cursor=pointer]': 😶‍🌫️
            - 'button "Вставить: ухмыляется" [ref=f3e139] [cursor=pointer]': 😏
            - 'button "Вставить: скучает" [ref=f3e140] [cursor=pointer]': 😒
            - 'button "Вставить: закатывает глаза" [ref=f3e141] [cursor=pointer]': 🙄
            - 'button "Вставить: гримаса" [ref=f3e142] [cursor=pointer]': 😬
            - 'button "Вставить: выдыхает" [ref=f3e143] [cursor=pointer]': 😮‍💨
            - 'button "Вставить: лжец" [ref=f3e144] [cursor=pointer]': 🤥
            - 'button "Вставить: трясущееся лицо" [ref=f3e145] [cursor=pointer]': 🫨
            - 'button "Вставить: отрицательно качает головой" [ref=f3e146] [cursor=pointer]': 🙂‍↔️
            - 'button "Вставить: положительно качает головой" [ref=f3e147] [cursor=pointer]': 🙂‍↕️
            - 'button "Вставить: испытывает облегчение" [ref=f3e148] [cursor=pointer]': 😌
            - 'button "Вставить: размышляет" [ref=f3e149] [cursor=pointer]': 😔
            - 'button "Вставить: хочет спать" [ref=f3e150] [cursor=pointer]': 😪
            - 'button "Вставить: пускает слюни" [ref=f3e151] [cursor=pointer]': 🤤
            - 'button "Вставить: спит" [ref=f3e152] [cursor=pointer]': 😴
            - 'button "Вставить: лицо с мешками под глазами" [ref=f3e153] [cursor=pointer]': 🫩
            - 'button "Вставить: в медицинской маске" [ref=f3e154] [cursor=pointer]': 😷
            - 'button "Вставить: с градусником во рту" [ref=f3e155] [cursor=pointer]': 🤒
            - 'button "Вставить: с перевязанной головой" [ref=f3e156] [cursor=pointer]': 🤕
            - 'button "Вставить: тошнит" [ref=f3e157] [cursor=pointer]': 🤢
            - 'button "Вставить: рвота" [ref=f3e158] [cursor=pointer]': 🤮
            - 'button "Вставить: чихает" [ref=f3e159] [cursor=pointer]': 🤧
            - 'button "Вставить: жар" [ref=f3e160] [cursor=pointer]': 🥵
            - 'button "Вставить: мерзнет" [ref=f3e161] [cursor=pointer]': 🥶
            - 'button "Вставить: чувствует головокружение" [ref=f3e162] [cursor=pointer]': 🥴
            - 'button "Вставить: головокружение" [ref=f3e163] [cursor=pointer]': 😵
            - 'button "Вставить: ошеломление" [ref=f3e164] [cursor=pointer]': 😵‍💫
            - 'button "Вставить: взрыв мозга" [ref=f3e165] [cursor=pointer]': 🤯
            - 'button "Вставить: в ковбойской шляпе" [ref=f3e166] [cursor=pointer]': 🤠
            - 'button "Вставить: на вечеринке" [ref=f3e167] [cursor=pointer]': 🥳
            - 'button "Вставить: маскировка" [ref=f3e168] [cursor=pointer]': 🥸
            - 'button "Вставить: лицо в темных очках" [ref=f3e169] [cursor=pointer]': 😎
            - 'button "Вставить: очкарик" [ref=f3e170] [cursor=pointer]': 🤓
            - 'button "Вставить: с моноклем" [ref=f3e171] [cursor=pointer]': 🧐
            - 'button "Вставить: в замешательстве" [ref=f3e172] [cursor=pointer]': 😕
            - 'button "Вставить: с перекошенным ртом" [ref=f3e173] [cursor=pointer]': 🫤
            - 'button "Вставить: беспокоится" [ref=f3e174] [cursor=pointer]': 😟
            - 'button "Вставить: немного грустит" [ref=f3e175] [cursor=pointer]': 🙁
            - 'button "Вставить: грустит" [ref=f3e176] [cursor=pointer]': ☹️
            - 'button "Вставить: удивление" [ref=f3e177] [cursor=pointer]': 😮
            - 'button "Вставить: неприятный сюрприз" [ref=f3e178] [cursor=pointer]': 😯
            - 'button "Вставить: в шоке" [ref=f3e179] [cursor=pointer]': 😲
            - 'button "Вставить: краснеет" [ref=f3e180] [cursor=pointer]': 😳
            - 'button "Вставить: лицо перекосило" [ref=f3e181] [cursor=pointer]': 🫪
            - 'button "Вставить: умоляет" [ref=f3e182] [cursor=pointer]': 🥺
            - 'button "Вставить: еле сдерживает слезы" [ref=f3e183] [cursor=pointer]': 🥹
            - 'button "Вставить: в изумлении" [ref=f3e184] [cursor=pointer]': 😦
            - 'button "Вставить: страдает" [ref=f3e185] [cursor=pointer]': 😧
            - 'button "Вставить: боится" [ref=f3e186] [cursor=pointer]': 😨
            - 'button "Вставить: сильно беспокоится" [ref=f3e187] [cursor=pointer]': 😰
            - 'button "Вставить: обошлось" [ref=f3e188] [cursor=pointer]': 😥
            - 'button "Вставить: плачет" [ref=f3e189] [cursor=pointer]': 😢
            - 'button "Вставить: слезы рекой" [ref=f3e190] [cursor=pointer]': 😭
            - 'button "Вставить: в ужасе" [ref=f3e191] [cursor=pointer]': 😱
            - 'button "Вставить: в растерянности" [ref=f3e192] [cursor=pointer]': 😖
            - 'button "Вставить: упорство" [ref=f3e193] [cursor=pointer]': 😣
            - 'button "Вставить: разочарование" [ref=f3e194] [cursor=pointer]': 😞
            - 'button "Вставить: в холодном поту" [ref=f3e195] [cursor=pointer]': 😓
            - 'button "Вставить: усталость" [ref=f3e196] [cursor=pointer]': 😩
            - 'button "Вставить: сильная усталость" [ref=f3e197] [cursor=pointer]': 😫
            - 'button "Вставить: зевает" [ref=f3e198] [cursor=pointer]': 🥱
            - 'button "Вставить: в ожидании успеха" [ref=f3e199] [cursor=pointer]': 😤
            - 'button "Вставить: злится" [ref=f3e200] [cursor=pointer]': 😡
            - 'button "Вставить: сердится" [ref=f3e201] [cursor=pointer]': 😠
            - 'button "Вставить: цензура" [ref=f3e202] [cursor=pointer]': 🤬
            - 'button "Вставить: улыбающийся чертенок" [ref=f3e203] [cursor=pointer]': 😈
            - 'button "Вставить: злой чертенок" [ref=f3e204] [cursor=pointer]': 👿
            - 'button "Вставить: череп" [ref=f3e205] [cursor=pointer]': 💀
            - 'button "Вставить: череп и кости" [ref=f3e206] [cursor=pointer]': ☠️
            - 'button "Вставить: какашка" [ref=f3e207] [cursor=pointer]': 💩
            - 'button "Вставить: клоун" [ref=f3e208] [cursor=pointer]': 🤡
            - 'button "Вставить: чудовище" [ref=f3e209] [cursor=pointer]': 👹
            - 'button "Вставить: японский гоблин" [ref=f3e210] [cursor=pointer]': 👺
            - 'button "Вставить: привидение" [ref=f3e211] [cursor=pointer]': 👻
            - 'button "Вставить: инопланетянин" [ref=f3e212] [cursor=pointer]': 👽
            - 'button "Вставить: космический монстр" [ref=f3e213] [cursor=pointer]': 👾
            - 'button "Вставить: робот" [ref=f3e214] [cursor=pointer]': 🤖
            - 'button "Вставить: улыбающийся кот" [ref=f3e215] [cursor=pointer]': 😺
            - 'button "Вставить: смеющийся кот" [ref=f3e216] [cursor=pointer]': 😸
            - 'button "Вставить: смеющийся до слез кот" [ref=f3e217] [cursor=pointer]': 😹
            - 'button "Вставить: влюбленный кот" [ref=f3e218] [cursor=pointer]': 😻
            - 'button "Вставить: ухмыляющийся кот" [ref=f3e219] [cursor=pointer]': 😼
            - 'button "Вставить: целующий кот" [ref=f3e220] [cursor=pointer]': 😽
            - 'button "Вставить: кот в шоке" [ref=f3e221] [cursor=pointer]': 🙀
            - 'button "Вставить: плачущий кот" [ref=f3e222] [cursor=pointer]': 😿
            - 'button "Вставить: злой кот" [ref=f3e223] [cursor=pointer]': 😾
            - 'button "Вставить: ничего не вижу" [ref=f3e224] [cursor=pointer]': 🙈
            - 'button "Вставить: ничего не слышу" [ref=f3e225] [cursor=pointer]': 🙉
            - 'button "Вставить: ничего никому не скажу" [ref=f3e226] [cursor=pointer]': 🙊
            - 'button "Вставить: любовное письмо" [ref=f3e227] [cursor=pointer]': 💌
            - 'button "Вставить: сердце, пронзенное стрелой" [ref=f3e228] [cursor=pointer]': 💘
            - 'button "Вставить: сердце с лентой" [ref=f3e229] [cursor=pointer]': 💝
            - 'button "Вставить: сверкающее сердце" [ref=f3e230] [cursor=pointer]': 💖
            - 'button "Вставить: растущее сердце" [ref=f3e231] [cursor=pointer]': 💗
            - 'button "Вставить: пульсирующее сердце" [ref=f3e232] [cursor=pointer]': 💓
            - 'button "Вставить: вращающиеся сердца" [ref=f3e233] [cursor=pointer]': 💞
            - 'button "Вставить: два сердца" [ref=f3e234] [cursor=pointer]': 💕
            - 'button "Вставить: значок «сердце»" [ref=f3e235] [cursor=pointer]': 💟
            - 'button "Вставить: восклицательный знак в виде сердца" [ref=f3e236] [cursor=pointer]': ❣️
            - 'button "Вставить: разбитое сердце" [ref=f3e237] [cursor=pointer]': 💔
            - 'button "Вставить: горящее сердце" [ref=f3e238] [cursor=pointer]': ❤️‍🔥
            - 'button "Вставить: заживающее сердце" [ref=f3e239] [cursor=pointer]': ❤️‍🩹
            - 'button "Вставить: алое сердце" [ref=f3e240] [cursor=pointer]': ❤️
            - 'button "Вставить: розовое сердце" [ref=f3e241] [cursor=pointer]': 🩷
            - 'button "Вставить: оранжевое сердце" [ref=f3e242] [cursor=pointer]': 🧡
            - 'button "Вставить: желтое сердце" [ref=f3e243] [cursor=pointer]': 💛
            - 'button "Вставить: зеленое сердце" [ref=f3e244] [cursor=pointer]': 💚
            - 'button "Вставить: синее сердце" [ref=f3e245] [cursor=pointer]': 💙
            - 'button "Вставить: голубое сердце" [ref=f3e246] [cursor=pointer]': 🩵
            - 'button "Вставить: фиолетовое сердце" [ref=f3e247] [cursor=pointer]': 💜
            - 'button "Вставить: коричневое сердце" [ref=f3e248] [cursor=pointer]': 🤎
            - 'button "Вставить: черное сердце" [ref=f3e249] [cursor=pointer]': 🖤
            - 'button "Вставить: серое сердце" [ref=f3e250] [cursor=pointer]': 🩶
            - 'button "Вставить: белое сердце" [ref=f3e251] [cursor=pointer]': 🤍
            - 'button "Вставить: след от поцелуя" [ref=f3e252] [cursor=pointer]': 💋
            - 'button "Вставить: сто баллов" [ref=f3e253] [cursor=pointer]': 💯
            - 'button "Вставить: значок «гнев»" [ref=f3e254] [cursor=pointer]': 💢
            - 'button "Вставить: драка" [ref=f3e255] [cursor=pointer]': 🫯
            - 'button "Вставить: взрыв" [ref=f3e256] [cursor=pointer]': 💥
            - 'button "Вставить: кружащаяся звезда" [ref=f3e257] [cursor=pointer]': 💫
            - 'button "Вставить: капли пота" [ref=f3e258] [cursor=pointer]': 💦
            - 'button "Вставить: исчезновение" [ref=f3e259] [cursor=pointer]': 💨
            - 'button "Вставить: дыра" [ref=f3e260] [cursor=pointer]': 🕳️
            - 'button "Вставить: облачко с многоточием" [ref=f3e261] [cursor=pointer]': 💬
            - 'button "Вставить: значок свидетеля" [ref=f3e262] [cursor=pointer]': 👁️‍🗨️
            - 'button "Вставить: пустое облачко" [ref=f3e263] [cursor=pointer]': 🗨️
            - 'button "Вставить: гневное облачко" [ref=f3e264] [cursor=pointer]': 🗯️
            - 'button "Вставить: облачко с мыслями" [ref=f3e265] [cursor=pointer]': 💭
            - 'button "Вставить: сон" [ref=f3e266] [cursor=pointer]': 💤
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { randomUUID } from 'node:crypto';
  3   | import { apiCreate, login, writeHeaders } from '@tests/helpers';
  4   | 
  5   | test.use({ hasTouch: true });
  6   | 
  7   | test('emoji dock preserves selection, supports repeated insertion and restores the keyboard', async ({
  8   |   page,
  9   | }) => {
  10  |   await page.setViewportSize({ width: 390, height: 844 });
  11  |   await login(page, 'Саша');
  12  |   const { meeting } = await apiCreate(page, 'Док эмодзи');
  13  |   await page.goto(`/meetings/${meeting.id}`);
  14  |   const input = page.getByRole('textbox', { name: 'Сообщение', exact: true });
  15  |   await input.fill('Возьму чай завтра');
  16  |   await input.evaluate((element) => {
  17  |     if (element instanceof HTMLTextAreaElement) {
  18  |       element.setSelectionRange(7, 10);
  19  |       element.dispatchEvent(new Event('select', { bubbles: true }));
  20  |     }
  21  |   });
  22  |   await page.getByRole('button', { name: 'Выбрать эмодзи', exact: true }).click();
  23  |   const dock = page.getByRole('region', { name: 'Выбор эмодзи', exact: true });
  24  |   const search = dock.getByRole('searchbox', { name: 'Найти эмодзи' });
  25  |   await expect(search).not.toBeFocused();
  26  |   await expect(search).toHaveCSS('font-size', '16px');
  27  |   await search.fill('пицца');
  28  |   await dock.getByRole('button', { name: 'Вставить: пицца', exact: true }).click();
  29  |   await dock.getByRole('button', { name: 'Вставить: пицца', exact: true }).click();
  30  |   await expect(input).toHaveValue('Возьму 🍕🍕 завтра');
  31  |   await expect(dock).toBeVisible();
  32  |   await page.screenshot({ path: test.info().outputPath('emoji-dock-selection.png') });
  33  |   await dock
  34  |     .getByRole('button', { name: 'Удалить символ перед курсором сообщения' })
  35  |     .click();
  36  |   await expect(input).toHaveValue('Возьму 🍕 завтра');
  37  |   await page.getByRole('button', { name: 'Вернуться к клавиатуре', exact: true }).click();
  38  |   await expect(dock).toHaveCount(0);
  39  |   await expect(input).toBeFocused();
  40  |   await input.pressSequentially(' и чай');
  41  |   await expect(input).toHaveValue('Возьму 🍕 и чай завтра');
  42  |   await page.getByRole('button', { name: 'Выбрать эмодзи', exact: true }).click();
  43  |   await expect(dock).toBeVisible();
  44  |   await page.keyboard.press('Escape');
  45  |   await expect(dock).toHaveCount(0);
  46  |   await expect(
  47  |     page.getByRole('button', { name: 'Выбрать эмодзи', exact: true }),
  48  |   ).toBeFocused();
  49  |   await page.getByRole('button', { name: 'Выбрать эмодзи', exact: true }).click();
  50  |   await expect(dock).toBeVisible();
  51  |   await page.goBack();
  52  |   await expect(dock).toHaveCount(0);
  53  |   await expect(input).toHaveValue('Возьму 🍕 и чай завтра');
  54  |   await expect(
  55  |     page.getByRole('button', { name: 'Выбрать эмодзи', exact: true }),
  56  |   ).toBeFocused();
  57  |   await expect(page.getByTestId('feed-message')).toHaveCount(0);
  58  | });
  59  | 
  60  | test('emoji dock and expanded reactions keep the composer usable in compact viewports', async ({
  61  |   page,
  62  | }) => {
  63  |   await page.setViewportSize({ width: 390, height: 844 });
  64  |   await login(page, 'Саша');
  65  |   const { meeting } = await apiCreate(page, 'Панели на маленьком экране');
  66  |   await page.goto(`/meetings/${meeting.id}`);
  67  |   await page.getByLabel('Сообщение', { exact: true }).fill('Принесу игры');
  68  |   await page.getByRole('button', { name: 'Отправить сообщение' }).click();
  69  |   const row = page.getByTestId('feed-message').filter({ hasText: 'Принесу игры' });
  70  |   await expect(row).toBeVisible();
  71  | 
  72  |   for (const viewport of [
  73  |     { width: 320, height: 760 },
  74  |     { width: 390, height: 430 },
  75  |     { width: 844, height: 390 },
  76  |   ]) {
  77  |     await page.setViewportSize(viewport);
  78  |     await page.getByRole('button', { name: 'Выбрать эмодзи', exact: true }).click();
  79  |     const input = page.getByLabel('Сообщение', { exact: true });
  80  |     const dock = page.getByRole('region', { name: 'Выбор эмодзи', exact: true });
  81  |     await expect(input).toBeInViewport({ ratio: 1 });
  82  |     await expect(
  83  |       page.getByRole('button', { name: 'Отправить сообщение' }),
  84  |     ).toBeInViewport({ ratio: 1 });
  85  |     const inputBox = await input.boundingBox();
  86  |     const dockBox = await dock.boundingBox();
> 87  |     expect(inputBox && dockBox && inputBox.y + inputBox.height <= dockBox.y).toBe(true);
      |                                                                              ^ Error: expect(received).toBe(expected) // Object.is equality
  88  |     await row.getByTestId('message-actions').press('Enter');
  89  |     await expect(dock).toHaveCount(0);
  90  |     const reactions = page.getByRole('dialog', { name: 'Реакция', exact: true });
  91  |     await reactions.getByRole('button', { name: 'Все эмодзи' }).click();
  92  |     await expect(reactions).toBeInViewport({ ratio: 1 });
  93  |     await expect(input).toBeInViewport({ ratio: 1 });
  94  |     await page.screenshot({
  95  |       path: test
  96  |         .info()
  97  |         .outputPath(`full-reactions-${viewport.width}-${viewport.height}.png`),
  98  |     });
  99  |     await page.keyboard.press('Escape');
  100 |     await expect(row.getByTestId('message-actions')).toBeFocused();
  101 |     expect(
  102 |       await page.evaluate(() => document.documentElement.scrollWidth),
  103 |     ).toBeLessThanOrEqual(viewport.width);
  104 |   }
  105 | });
  106 | 
  107 | test('settings and sharing return to the same information sheet and retain the draft', async ({
  108 |   page,
  109 | }) => {
  110 |   await page.setViewportSize({ width: 390, height: 844 });
  111 |   await login(page, 'Саша');
  112 |   const { meeting } = await apiCreate(page, 'Родительская панель');
  113 |   await page.goto(`/meetings/${meeting.id}`);
  114 |   await page.getByLabel('Сообщение', { exact: true }).fill('Черновик сообщения');
  115 |   await page.getByRole('button', { name: 'Информация о встрече' }).click();
  116 |   const info = page.getByRole('dialog', { name: meeting.title, exact: true });
  117 |   await info.getByRole('button', { name: 'Настройки встречи' }).click();
  118 |   const settings = page.getByRole('dialog', { name: 'Настройки встречи' });
  119 |   await expect(page.locator('dialog:modal')).toHaveCount(1);
  120 |   await settings.getByLabel('Название', { exact: true }).fill('Несохранённое название');
  121 |   await expect(settings.getByLabel('Название', { exact: true })).toHaveCSS(
  122 |     'font-size',
  123 |     '16px',
  124 |   );
  125 |   await page.screenshot({ path: test.info().outputPath('meeting-settings-draft.png') });
  126 |   await page.goBack();
  127 |   await expect(info).toBeVisible();
  128 |   await expect(info.getByRole('button', { name: 'Настройки встречи' })).toBeFocused();
  129 |   await info.getByRole('button', { name: 'Настройки встречи' }).click();
  130 |   await expect(settings.getByLabel('Название', { exact: true })).toHaveValue(
  131 |     'Несохранённое название',
  132 |   );
  133 |   await settings.getByRole('button', { name: 'Закрыть', exact: true }).click();
  134 |   await info.getByRole('button', { name: 'Пригласить друзей' }).click();
  135 |   const share = page.getByRole('dialog', { name: 'Пригласить друзей', exact: true });
  136 |   await expect(page.locator('dialog:modal')).toHaveCount(1);
  137 |   await share.getByRole('button', { name: 'Закрыть', exact: true }).click();
  138 |   await expect(info).toBeVisible();
  139 |   await expect(info.getByRole('button', { name: 'Пригласить друзей' })).toBeFocused();
  140 |   await page.screenshot({ path: test.info().outputPath('meeting-info-return.png') });
  141 |   await info.getByRole('button', { name: 'Закрыть', exact: true }).click();
  142 |   await expect(page.getByLabel('Сообщение', { exact: true })).toHaveValue(
  143 |     'Черновик сообщения',
  144 |   );
  145 | });
  146 | 
  147 | test('opening the emoji dock preserves the reading position and the new-message action stays above it', async ({
  148 |   page,
  149 | }) => {
  150 |   await page.setViewportSize({ width: 390, height: 844 });
  151 |   await login(page, 'Саша');
  152 |   const { meeting } = await apiCreate(page, 'Позиция чтения');
  153 |   const headers = await writeHeaders(page);
  154 |   const send = async (text: string) => {
  155 |     const key = randomUUID();
  156 |     const response = await page.request.post(`/api/v1/meetings/${meeting.id}/messages`, {
  157 |       headers: { ...headers, 'Idempotency-Key': key },
  158 |       data: { text, client_request_id: key },
  159 |     });
  160 | 
  161 |     expect(response.status()).toBe(201);
  162 |   };
  163 | 
  164 |   for (let index = 0; index < 25; index++) {
  165 |     await send(`Сообщение истории ${index}`);
  166 |   }
  167 | 
  168 |   await page.goto(`/meetings/${meeting.id}`);
  169 |   const history = page.getByRole('list', { name: 'Разговор встречи' }).locator('..');
  170 |   await expect(page.getByText('Сообщение истории 24', { exact: true })).toBeInViewport();
  171 |   await history.evaluate((node) => {
  172 |     node.scrollTop = 120;
  173 |     node.dispatchEvent(new Event('scroll'));
  174 |   });
  175 |   await send('Новое сообщение внизу');
  176 |   const latest = page.getByRole('button', { name: 'Новые сообщения ↓' });
  177 |   await expect(latest).toBeVisible();
  178 |   const before = await history.evaluate((node) => node.scrollTop);
  179 |   await page.getByRole('button', { name: 'Выбрать эмодзи', exact: true }).click();
  180 |   await expect(page.getByRole('region', { name: 'Выбор эмодзи' })).toBeVisible();
  181 |   await expect
  182 |     .poll(() => history.evaluate((node) => node.scrollTop))
  183 |     .toBeCloseTo(before, 0);
  184 |   await expect(latest).toBeInViewport({ ratio: 1 });
  185 |   const latestBox = await latest.boundingBox();
  186 |   const inputBox = await page.getByLabel('Сообщение', { exact: true }).boundingBox();
  187 |   expect(latestBox && inputBox && latestBox.y + latestBox.height <= inputBox.y).toBe(
```