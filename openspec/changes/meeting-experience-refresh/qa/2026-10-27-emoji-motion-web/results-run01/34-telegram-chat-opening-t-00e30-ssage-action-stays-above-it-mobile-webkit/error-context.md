# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 34-telegram-chat.spec.ts >> opening the emoji dock preserves the reading position and the new-message action stays above it
- Location: frontend/web/tests/34-telegram-chat.spec.ts:147:1

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
      - button "Сведения о встрече «Позиция чтения»" [ref=f3e17] [cursor=pointer]:
        - heading "Позиция чтения" [level=1] [ref=f3e18]
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
          - 'group "Реакции на сообщение: Сообщение истории 0" [ref=f3e39]':
            - paragraph [ref=f3e40]: Сообщение истории 0
      - listitem [ref=f3e41]:
        - generic [aria-hidden] [ref=f3e42]: С
        - generic [ref=f3e43]:
          - generic [ref=f3e44]:
            - strong [ref=f3e45]: Саша
            - time [ref=f3e46]: 21:38
          - 'group "Реакции на сообщение: Сообщение истории 1" [ref=f3e47]':
            - paragraph [ref=f3e48]: Сообщение истории 1
      - listitem [ref=f3e49]:
        - generic [aria-hidden] [ref=f3e50]: С
        - generic [ref=f3e51]:
          - generic [ref=f3e52]:
            - strong [ref=f3e53]: Саша
            - time [ref=f3e54]: 21:38
          - 'group "Реакции на сообщение: Сообщение истории 2" [ref=f3e55]':
            - paragraph [ref=f3e56]: Сообщение истории 2
      - listitem [ref=f3e57]:
        - generic [aria-hidden] [ref=f3e58]: С
        - generic [ref=f3e59]:
          - generic [ref=f3e60]:
            - strong [ref=f3e61]: Саша
            - time [ref=f3e62]: 21:38
          - 'group "Реакции на сообщение: Сообщение истории 3" [ref=f3e63]':
            - paragraph [ref=f3e64]: Сообщение истории 3
      - listitem [ref=f3e65]:
        - generic [aria-hidden] [ref=f3e66]: С
        - generic [ref=f3e67]:
          - generic [ref=f3e68]:
            - strong [ref=f3e69]: Саша
            - time [ref=f3e70]: 21:38
          - 'group "Реакции на сообщение: Сообщение истории 4" [ref=f3e71]':
            - paragraph [ref=f3e72]: Сообщение истории 4
      - listitem [ref=f3e73]:
        - generic [aria-hidden] [ref=f3e74]: С
        - generic [ref=f3e75]:
          - generic [ref=f3e76]:
            - strong [ref=f3e77]: Саша
            - time [ref=f3e78]: 21:38
          - 'group "Реакции на сообщение: Сообщение истории 5" [ref=f3e79]':
            - paragraph [ref=f3e80]: Сообщение истории 5
      - listitem [ref=f3e81]:
        - generic [aria-hidden] [ref=f3e82]: С
        - generic [ref=f3e83]:
          - generic [ref=f3e84]:
            - strong [ref=f3e85]: Саша
            - time [ref=f3e86]: 21:38
          - 'group "Реакции на сообщение: Сообщение истории 6" [ref=f3e87]':
            - paragraph [ref=f3e88]: Сообщение истории 6
      - listitem [ref=f3e89]:
        - generic [aria-hidden] [ref=f3e90]: С
        - generic [ref=f3e91]:
          - generic [ref=f3e92]:
            - strong [ref=f3e93]: Саша
            - time [ref=f3e94]: 21:38
          - 'group "Реакции на сообщение: Сообщение истории 7" [ref=f3e95]':
            - paragraph [ref=f3e96]: Сообщение истории 7
      - listitem [ref=f3e97]:
        - generic [aria-hidden] [ref=f3e98]: С
        - generic [ref=f3e99]:
          - generic [ref=f3e100]:
            - strong [ref=f3e101]: Саша
            - time [ref=f3e102]: 21:38
          - 'group "Реакции на сообщение: Сообщение истории 8" [ref=f3e103]':
            - paragraph [ref=f3e104]: Сообщение истории 8
      - listitem [ref=f3e105]:
        - generic [aria-hidden] [ref=f3e106]: С
        - generic [ref=f3e107]:
          - generic [ref=f3e108]:
            - strong [ref=f3e109]: Саша
            - time [ref=f3e110]: 21:38
          - 'group "Реакции на сообщение: Сообщение истории 9" [ref=f3e111]':
            - paragraph [ref=f3e112]: Сообщение истории 9
      - listitem [ref=f3e113]:
        - generic [aria-hidden] [ref=f3e114]: С
        - generic [ref=f3e115]:
          - generic [ref=f3e116]:
            - strong [ref=f3e117]: Саша
            - time [ref=f3e118]: 21:38
          - 'group "Реакции на сообщение: Сообщение истории 10" [ref=f3e119]':
            - paragraph [ref=f3e120]: Сообщение истории 10
      - listitem [ref=f3e121]:
        - generic [aria-hidden] [ref=f3e122]: С
        - generic [ref=f3e123]:
          - generic [ref=f3e124]:
            - strong [ref=f3e125]: Саша
            - time [ref=f3e126]: 21:38
          - 'group "Реакции на сообщение: Сообщение истории 11" [ref=f3e127]':
            - paragraph [ref=f3e128]: Сообщение истории 11
      - listitem [ref=f3e129]:
        - generic [aria-hidden] [ref=f3e130]: С
        - generic [ref=f3e131]:
          - generic [ref=f3e132]:
            - strong [ref=f3e133]: Саша
            - time [ref=f3e134]: 21:38
          - 'group "Реакции на сообщение: Сообщение истории 12" [ref=f3e135]':
            - paragraph [ref=f3e136]: Сообщение истории 12
      - listitem [ref=f3e137]:
        - generic [aria-hidden] [ref=f3e138]: С
        - generic [ref=f3e139]:
          - generic [ref=f3e140]:
            - strong [ref=f3e141]: Саша
            - time [ref=f3e142]: 21:38
          - 'group "Реакции на сообщение: Сообщение истории 13" [ref=f3e143]':
            - paragraph [ref=f3e144]: Сообщение истории 13
      - listitem [ref=f3e145]:
        - generic [aria-hidden] [ref=f3e146]: С
        - generic [ref=f3e147]:
          - generic [ref=f3e148]:
            - strong [ref=f3e149]: Саша
            - time [ref=f3e150]: 21:38
          - 'group "Реакции на сообщение: Сообщение истории 14" [ref=f3e151]':
            - paragraph [ref=f3e152]: Сообщение истории 14
      - listitem [ref=f3e153]:
        - generic [aria-hidden] [ref=f3e154]: С
        - generic [ref=f3e155]:
          - generic [ref=f3e156]:
            - strong [ref=f3e157]: Саша
            - time [ref=f3e158]: 21:38
          - 'group "Реакции на сообщение: Сообщение истории 15" [ref=f3e159]':
            - paragraph [ref=f3e160]: Сообщение истории 15
      - listitem [ref=f3e161]:
        - generic [aria-hidden] [ref=f3e162]: С
        - generic [ref=f3e163]:
          - generic [ref=f3e164]:
            - strong [ref=f3e165]: Саша
            - time [ref=f3e166]: 21:38
          - 'group "Реакции на сообщение: Сообщение истории 16" [ref=f3e167]':
            - paragraph [ref=f3e168]: Сообщение истории 16
      - listitem [ref=f3e169]:
        - generic [aria-hidden] [ref=f3e170]: С
        - generic [ref=f3e171]:
          - generic [ref=f3e172]:
            - strong [ref=f3e173]: Саша
            - time [ref=f3e174]: 21:38
          - 'group "Реакции на сообщение: Сообщение истории 17" [ref=f3e175]':
            - paragraph [ref=f3e176]: Сообщение истории 17
      - listitem [ref=f3e177]:
        - generic [aria-hidden] [ref=f3e178]: С
        - generic [ref=f3e179]:
          - generic [ref=f3e180]:
            - strong [ref=f3e181]: Саша
            - time [ref=f3e182]: 21:38
          - 'group "Реакции на сообщение: Сообщение истории 18" [ref=f3e183]':
            - paragraph [ref=f3e184]: Сообщение истории 18
      - listitem [ref=f3e185]:
        - generic [aria-hidden] [ref=f3e186]: С
        - generic [ref=f3e187]:
          - generic [ref=f3e188]:
            - strong [ref=f3e189]: Саша
            - time [ref=f3e190]: 21:38
          - 'group "Реакции на сообщение: Сообщение истории 19" [ref=f3e191]':
            - paragraph [ref=f3e192]: Сообщение истории 19
      - listitem [ref=f3e193]:
        - generic [aria-hidden] [ref=f3e194]: С
        - generic [ref=f3e195]:
          - generic [ref=f3e196]:
            - strong [ref=f3e197]: Саша
            - time [ref=f3e198]: 21:38
          - 'group "Реакции на сообщение: Сообщение истории 20" [ref=f3e199]':
            - paragraph [ref=f3e200]: Сообщение истории 20
      - listitem [ref=f3e201]:
        - generic [aria-hidden] [ref=f3e202]: С
        - generic [ref=f3e203]:
          - generic [ref=f3e204]:
            - strong [ref=f3e205]: Саша
            - time [ref=f3e206]: 21:38
          - 'group "Реакции на сообщение: Сообщение истории 21" [ref=f3e207]':
            - paragraph [ref=f3e208]: Сообщение истории 21
      - listitem [ref=f3e209]:
        - generic [aria-hidden] [ref=f3e210]: С
        - generic [ref=f3e211]:
          - generic [ref=f3e212]:
            - strong [ref=f3e213]: Саша
            - time [ref=f3e214]: 21:38
          - 'group "Реакции на сообщение: Сообщение истории 22" [ref=f3e215]':
            - paragraph [ref=f3e216]: Сообщение истории 22
      - listitem [ref=f3e217]:
        - generic [aria-hidden] [ref=f3e218]: С
        - generic [ref=f3e219]:
          - generic [ref=f3e220]:
            - strong [ref=f3e221]: Саша
            - time [ref=f3e222]: 21:38
          - 'group "Реакции на сообщение: Сообщение истории 23" [ref=f3e223]':
            - paragraph [ref=f3e224]: Сообщение истории 23
      - listitem [ref=f3e225]:
        - generic [aria-hidden] [ref=f3e226]: С
        - generic [ref=f3e227]:
          - generic [ref=f3e228]:
            - strong [ref=f3e229]: Саша
            - time [ref=f3e230]: 21:38
          - 'group "Реакции на сообщение: Сообщение истории 24" [ref=f3e231]':
            - paragraph [ref=f3e232]: Сообщение истории 24
      - listitem [ref=f3e233]:
        - generic [aria-hidden] [ref=f3e234]: С
        - generic [ref=f3e235]:
          - generic [ref=f3e236]:
            - strong [ref=f3e237]: Саша
            - time [ref=f3e238]: 21:38
          - 'group "Реакции на сообщение: Новое сообщение внизу" [ref=f3e239]':
            - paragraph [ref=f3e240]: Новое сообщение внизу
    - button "Новые сообщения ↓" [ref=f3e241] [cursor=pointer]
    - generic [ref=f3e243]:
      - generic [ref=f3e244]:
        - button "Добавить к встрече" [ref=f3e246] [cursor=pointer]
        - generic [ref=f3e249]:
          - generic [ref=f3e250]:
            - generic [ref=f3e251]: Сообщение
            - textbox "Сообщение" [ref=f3e252]:
              - /placeholder: Сообщение…
          - button "Вернуться к клавиатуре" [expanded] [ref=f3e253] [cursor=pointer]
        - button "Отправить сообщение" [disabled] [ref=f3e257]
      - region "Выбор эмодзи" [ref=f3e261]:
        - generic [ref=f3e262]:
          - searchbox "Найти эмодзи" [ref=f3e267]
          - button "Удалить символ перед курсором сообщения" [ref=f3e268] [cursor=pointer]
        - group "Категории эмодзи" [ref=f3e272]:
          - button "Недавние" [pressed] [ref=f3e273] [cursor=pointer]:
            - generic [aria-hidden] [ref=f3e274]: ◷
          - button "Эмоции" [ref=f3e275] [cursor=pointer]:
            - generic [aria-hidden] [ref=f3e276]: 🙂
          - button "Люди" [ref=f3e277] [cursor=pointer]:
            - generic [aria-hidden] [ref=f3e278]: 👋
          - button "Природа" [ref=f3e279] [cursor=pointer]:
            - generic [aria-hidden] [ref=f3e280]: 🐻
          - button "Еда" [ref=f3e281] [cursor=pointer]:
            - generic [aria-hidden] [ref=f3e282]: 🍕
          - button "Путешествия" [ref=f3e283] [cursor=pointer]:
            - generic [aria-hidden] [ref=f3e284]: ✈️
          - button "Занятия" [ref=f3e285] [cursor=pointer]:
            - generic [aria-hidden] [ref=f3e286]: ⚽
          - button "Предметы" [ref=f3e287] [cursor=pointer]:
            - generic [aria-hidden] [ref=f3e288]: 💡
          - button "Символы" [ref=f3e289] [cursor=pointer]:
            - generic [aria-hidden] [ref=f3e290]: ♡
          - button "Флаги" [ref=f3e291] [cursor=pointer]:
            - generic [aria-hidden] [ref=f3e292]: ⚑
        - generic [ref=f3e294]:
          - heading "Смайлы и эмоции" [level=3] [ref=f3e295]
          - generic [ref=f3e296]:
            - 'button "Вставить: широко улыбается" [ref=f3e297] [cursor=pointer]': 😀
            - 'button "Вставить: смеется" [ref=f3e298] [cursor=pointer]': 😃
            - 'button "Вставить: смеется с закрытыми глазами" [ref=f3e299] [cursor=pointer]': 😄
            - 'button "Вставить: светится от счастья" [ref=f3e300] [cursor=pointer]': 😁
            - 'button "Вставить: смеется с прищуренными глазами" [ref=f3e301] [cursor=pointer]': 😆
            - 'button "Вставить: нервно смеется" [ref=f3e302] [cursor=pointer]': 😅
            - 'button "Вставить: катается со смеху" [ref=f3e303] [cursor=pointer]': 🤣
            - 'button "Вставить: смеется до слез" [ref=f3e304] [cursor=pointer]': 😂
            - 'button "Вставить: слегка улыбается" [ref=f3e305] [cursor=pointer]': 🙂
            - 'button "Вставить: вверх тормашками" [ref=f3e306] [cursor=pointer]': 🙃
            - 'button "Вставить: тает" [ref=f3e307] [cursor=pointer]': 🫠
            - 'button "Вставить: подмигивает" [ref=f3e308] [cursor=pointer]': 😉
            - 'button "Вставить: довольно улыбается" [ref=f3e309] [cursor=pointer]': 😊
            - 'button "Вставить: с нимбом" [ref=f3e310] [cursor=pointer]': 😇
            - 'button "Вставить: улыбающееся лицо с сердечками" [ref=f3e311] [cursor=pointer]': 🥰
            - 'button "Вставить: влюбленное лицо" [ref=f3e312] [cursor=pointer]': 😍
            - 'button "Вставить: звезды в глазах" [ref=f3e313] [cursor=pointer]': 🤩
            - 'button "Вставить: воздушный поцелуй" [ref=f3e314] [cursor=pointer]': 😘
            - 'button "Вставить: целует" [ref=f3e315] [cursor=pointer]': 😗
            - 'button "Вставить: улыбается" [ref=f3e316] [cursor=pointer]': ☺️
            - 'button "Вставить: целует с закрытыми глазами" [ref=f3e317] [cursor=pointer]': 😚
            - 'button "Вставить: счастливый поцелуй" [ref=f3e318] [cursor=pointer]': 😙
            - 'button "Вставить: улыбающееся лицо со слезой" [ref=f3e319] [cursor=pointer]': 🥲
            - 'button "Вставить: вкусно" [ref=f3e320] [cursor=pointer]': 😋
            - 'button "Вставить: показывает язык" [ref=f3e321] [cursor=pointer]': 😛
            - 'button "Вставить: показывает язык и подмигивает" [ref=f3e322] [cursor=pointer]': 😜
            - 'button "Вставить: сумасшедшее лицо" [ref=f3e323] [cursor=pointer]': 🤪
            - 'button "Вставить: морщится и показывает язык" [ref=f3e324] [cursor=pointer]': 😝
            - 'button "Вставить: деньги в глазах" [ref=f3e325] [cursor=pointer]': 🤑
            - 'button "Вставить: обнимает" [ref=f3e326] [cursor=pointer]': 🤗
            - 'button "Вставить: прикрывает рот рукой" [ref=f3e327] [cursor=pointer]': 🤭
            - 'button "Вставить: прикрывает рот рукой с открытыми глазами" [ref=f3e328] [cursor=pointer]': 🫢
            - 'button "Вставить: подсматривает" [ref=f3e329] [cursor=pointer]': 🫣
            - 'button "Вставить: тс-с-с" [ref=f3e330] [cursor=pointer]': 🤫
            - 'button "Вставить: думает" [ref=f3e331] [cursor=pointer]': 🤔
            - 'button "Вставить: воинское приветствие" [ref=f3e332] [cursor=pointer]': 🫡
            - 'button "Вставить: рот на замке" [ref=f3e333] [cursor=pointer]': 🤐
            - 'button "Вставить: не верит" [ref=f3e334] [cursor=pointer]': 🤨
            - 'button "Вставить: все равно" [ref=f3e335] [cursor=pointer]': 😐
            - 'button "Вставить: без эмоций" [ref=f3e336] [cursor=pointer]': 😑
            - 'button "Вставить: лицо без рта" [ref=f3e337] [cursor=pointer]': 😶
            - 'button "Вставить: лицо пунктиром" [ref=f3e338] [cursor=pointer]': 🫥
            - 'button "Вставить: лицо в облаках" [ref=f3e339] [cursor=pointer]': 😶‍🌫️
            - 'button "Вставить: ухмыляется" [ref=f3e340] [cursor=pointer]': 😏
            - 'button "Вставить: скучает" [ref=f3e341] [cursor=pointer]': 😒
            - 'button "Вставить: закатывает глаза" [ref=f3e342] [cursor=pointer]': 🙄
            - 'button "Вставить: гримаса" [ref=f3e343] [cursor=pointer]': 😬
            - 'button "Вставить: выдыхает" [ref=f3e344] [cursor=pointer]': 😮‍💨
            - 'button "Вставить: лжец" [ref=f3e345] [cursor=pointer]': 🤥
            - 'button "Вставить: трясущееся лицо" [ref=f3e346] [cursor=pointer]': 🫨
            - 'button "Вставить: отрицательно качает головой" [ref=f3e347] [cursor=pointer]': 🙂‍↔️
            - 'button "Вставить: положительно качает головой" [ref=f3e348] [cursor=pointer]': 🙂‍↕️
            - 'button "Вставить: испытывает облегчение" [ref=f3e349] [cursor=pointer]': 😌
            - 'button "Вставить: размышляет" [ref=f3e350] [cursor=pointer]': 😔
            - 'button "Вставить: хочет спать" [ref=f3e351] [cursor=pointer]': 😪
            - 'button "Вставить: пускает слюни" [ref=f3e352] [cursor=pointer]': 🤤
            - 'button "Вставить: спит" [ref=f3e353] [cursor=pointer]': 😴
            - 'button "Вставить: лицо с мешками под глазами" [ref=f3e354] [cursor=pointer]': 🫩
            - 'button "Вставить: в медицинской маске" [ref=f3e355] [cursor=pointer]': 😷
            - 'button "Вставить: с градусником во рту" [ref=f3e356] [cursor=pointer]': 🤒
            - 'button "Вставить: с перевязанной головой" [ref=f3e357] [cursor=pointer]': 🤕
            - 'button "Вставить: тошнит" [ref=f3e358] [cursor=pointer]': 🤢
            - 'button "Вставить: рвота" [ref=f3e359] [cursor=pointer]': 🤮
            - 'button "Вставить: чихает" [ref=f3e360] [cursor=pointer]': 🤧
            - 'button "Вставить: жар" [ref=f3e361] [cursor=pointer]': 🥵
            - 'button "Вставить: мерзнет" [ref=f3e362] [cursor=pointer]': 🥶
            - 'button "Вставить: чувствует головокружение" [ref=f3e363] [cursor=pointer]': 🥴
            - 'button "Вставить: головокружение" [ref=f3e364] [cursor=pointer]': 😵
            - 'button "Вставить: ошеломление" [ref=f3e365] [cursor=pointer]': 😵‍💫
            - 'button "Вставить: взрыв мозга" [ref=f3e366] [cursor=pointer]': 🤯
            - 'button "Вставить: в ковбойской шляпе" [ref=f3e367] [cursor=pointer]': 🤠
            - 'button "Вставить: на вечеринке" [ref=f3e368] [cursor=pointer]': 🥳
            - 'button "Вставить: маскировка" [ref=f3e369] [cursor=pointer]': 🥸
            - 'button "Вставить: лицо в темных очках" [ref=f3e370] [cursor=pointer]': 😎
            - 'button "Вставить: очкарик" [ref=f3e371] [cursor=pointer]': 🤓
            - 'button "Вставить: с моноклем" [ref=f3e372] [cursor=pointer]': 🧐
            - 'button "Вставить: в замешательстве" [ref=f3e373] [cursor=pointer]': 😕
            - 'button "Вставить: с перекошенным ртом" [ref=f3e374] [cursor=pointer]': 🫤
            - 'button "Вставить: беспокоится" [ref=f3e375] [cursor=pointer]': 😟
            - 'button "Вставить: немного грустит" [ref=f3e376] [cursor=pointer]': 🙁
            - 'button "Вставить: грустит" [ref=f3e377] [cursor=pointer]': ☹️
            - 'button "Вставить: удивление" [ref=f3e378] [cursor=pointer]': 😮
            - 'button "Вставить: неприятный сюрприз" [ref=f3e379] [cursor=pointer]': 😯
            - 'button "Вставить: в шоке" [ref=f3e380] [cursor=pointer]': 😲
            - 'button "Вставить: краснеет" [ref=f3e381] [cursor=pointer]': 😳
            - 'button "Вставить: лицо перекосило" [ref=f3e382] [cursor=pointer]': 🫪
            - 'button "Вставить: умоляет" [ref=f3e383] [cursor=pointer]': 🥺
            - 'button "Вставить: еле сдерживает слезы" [ref=f3e384] [cursor=pointer]': 🥹
            - 'button "Вставить: в изумлении" [ref=f3e385] [cursor=pointer]': 😦
            - 'button "Вставить: страдает" [ref=f3e386] [cursor=pointer]': 😧
            - 'button "Вставить: боится" [ref=f3e387] [cursor=pointer]': 😨
            - 'button "Вставить: сильно беспокоится" [ref=f3e388] [cursor=pointer]': 😰
            - 'button "Вставить: обошлось" [ref=f3e389] [cursor=pointer]': 😥
            - 'button "Вставить: плачет" [ref=f3e390] [cursor=pointer]': 😢
            - 'button "Вставить: слезы рекой" [ref=f3e391] [cursor=pointer]': 😭
            - 'button "Вставить: в ужасе" [ref=f3e392] [cursor=pointer]': 😱
            - 'button "Вставить: в растерянности" [ref=f3e393] [cursor=pointer]': 😖
            - 'button "Вставить: упорство" [ref=f3e394] [cursor=pointer]': 😣
            - 'button "Вставить: разочарование" [ref=f3e395] [cursor=pointer]': 😞
            - 'button "Вставить: в холодном поту" [ref=f3e396] [cursor=pointer]': 😓
            - 'button "Вставить: усталость" [ref=f3e397] [cursor=pointer]': 😩
            - 'button "Вставить: сильная усталость" [ref=f3e398] [cursor=pointer]': 😫
            - 'button "Вставить: зевает" [ref=f3e399] [cursor=pointer]': 🥱
            - 'button "Вставить: в ожидании успеха" [ref=f3e400] [cursor=pointer]': 😤
            - 'button "Вставить: злится" [ref=f3e401] [cursor=pointer]': 😡
            - 'button "Вставить: сердится" [ref=f3e402] [cursor=pointer]': 😠
            - 'button "Вставить: цензура" [ref=f3e403] [cursor=pointer]': 🤬
            - 'button "Вставить: улыбающийся чертенок" [ref=f3e404] [cursor=pointer]': 😈
            - 'button "Вставить: злой чертенок" [ref=f3e405] [cursor=pointer]': 👿
            - 'button "Вставить: череп" [ref=f3e406] [cursor=pointer]': 💀
            - 'button "Вставить: череп и кости" [ref=f3e407] [cursor=pointer]': ☠️
            - 'button "Вставить: какашка" [ref=f3e408] [cursor=pointer]': 💩
            - 'button "Вставить: клоун" [ref=f3e409] [cursor=pointer]': 🤡
            - 'button "Вставить: чудовище" [ref=f3e410] [cursor=pointer]': 👹
            - 'button "Вставить: японский гоблин" [ref=f3e411] [cursor=pointer]': 👺
            - 'button "Вставить: привидение" [ref=f3e412] [cursor=pointer]': 👻
            - 'button "Вставить: инопланетянин" [ref=f3e413] [cursor=pointer]': 👽
            - 'button "Вставить: космический монстр" [ref=f3e414] [cursor=pointer]': 👾
            - 'button "Вставить: робот" [ref=f3e415] [cursor=pointer]': 🤖
            - 'button "Вставить: улыбающийся кот" [ref=f3e416] [cursor=pointer]': 😺
            - 'button "Вставить: смеющийся кот" [ref=f3e417] [cursor=pointer]': 😸
            - 'button "Вставить: смеющийся до слез кот" [ref=f3e418] [cursor=pointer]': 😹
            - 'button "Вставить: влюбленный кот" [ref=f3e419] [cursor=pointer]': 😻
            - 'button "Вставить: ухмыляющийся кот" [ref=f3e420] [cursor=pointer]': 😼
            - 'button "Вставить: целующий кот" [ref=f3e421] [cursor=pointer]': 😽
            - 'button "Вставить: кот в шоке" [ref=f3e422] [cursor=pointer]': 🙀
            - 'button "Вставить: плачущий кот" [ref=f3e423] [cursor=pointer]': 😿
            - 'button "Вставить: злой кот" [ref=f3e424] [cursor=pointer]': 😾
            - 'button "Вставить: ничего не вижу" [ref=f3e425] [cursor=pointer]': 🙈
            - 'button "Вставить: ничего не слышу" [ref=f3e426] [cursor=pointer]': 🙉
            - 'button "Вставить: ничего никому не скажу" [ref=f3e427] [cursor=pointer]': 🙊
            - 'button "Вставить: любовное письмо" [ref=f3e428] [cursor=pointer]': 💌
            - 'button "Вставить: сердце, пронзенное стрелой" [ref=f3e429] [cursor=pointer]': 💘
            - 'button "Вставить: сердце с лентой" [ref=f3e430] [cursor=pointer]': 💝
            - 'button "Вставить: сверкающее сердце" [ref=f3e431] [cursor=pointer]': 💖
            - 'button "Вставить: растущее сердце" [ref=f3e432] [cursor=pointer]': 💗
            - 'button "Вставить: пульсирующее сердце" [ref=f3e433] [cursor=pointer]': 💓
            - 'button "Вставить: вращающиеся сердца" [ref=f3e434] [cursor=pointer]': 💞
            - 'button "Вставить: два сердца" [ref=f3e435] [cursor=pointer]': 💕
            - 'button "Вставить: значок «сердце»" [ref=f3e436] [cursor=pointer]': 💟
            - 'button "Вставить: восклицательный знак в виде сердца" [ref=f3e437] [cursor=pointer]': ❣️
            - 'button "Вставить: разбитое сердце" [ref=f3e438] [cursor=pointer]': 💔
            - 'button "Вставить: горящее сердце" [ref=f3e439] [cursor=pointer]': ❤️‍🔥
            - 'button "Вставить: заживающее сердце" [ref=f3e440] [cursor=pointer]': ❤️‍🩹
            - 'button "Вставить: алое сердце" [ref=f3e441] [cursor=pointer]': ❤️
            - 'button "Вставить: розовое сердце" [ref=f3e442] [cursor=pointer]': 🩷
            - 'button "Вставить: оранжевое сердце" [ref=f3e443] [cursor=pointer]': 🧡
            - 'button "Вставить: желтое сердце" [ref=f3e444] [cursor=pointer]': 💛
            - 'button "Вставить: зеленое сердце" [ref=f3e445] [cursor=pointer]': 💚
            - 'button "Вставить: синее сердце" [ref=f3e446] [cursor=pointer]': 💙
            - 'button "Вставить: голубое сердце" [ref=f3e447] [cursor=pointer]': 🩵
            - 'button "Вставить: фиолетовое сердце" [ref=f3e448] [cursor=pointer]': 💜
            - 'button "Вставить: коричневое сердце" [ref=f3e449] [cursor=pointer]': 🤎
            - 'button "Вставить: черное сердце" [ref=f3e450] [cursor=pointer]': 🖤
            - 'button "Вставить: серое сердце" [ref=f3e451] [cursor=pointer]': 🩶
            - 'button "Вставить: белое сердце" [ref=f3e452] [cursor=pointer]': 🤍
            - 'button "Вставить: след от поцелуя" [ref=f3e453] [cursor=pointer]': 💋
            - 'button "Вставить: сто баллов" [ref=f3e454] [cursor=pointer]': 💯
            - 'button "Вставить: значок «гнев»" [ref=f3e455] [cursor=pointer]': 💢
            - 'button "Вставить: драка" [ref=f3e456] [cursor=pointer]': 🫯
            - 'button "Вставить: взрыв" [ref=f3e457] [cursor=pointer]': 💥
            - 'button "Вставить: кружащаяся звезда" [ref=f3e458] [cursor=pointer]': 💫
            - 'button "Вставить: капли пота" [ref=f3e459] [cursor=pointer]': 💦
            - 'button "Вставить: исчезновение" [ref=f3e460] [cursor=pointer]': 💨
            - 'button "Вставить: дыра" [ref=f3e461] [cursor=pointer]': 🕳️
            - 'button "Вставить: облачко с многоточием" [ref=f3e462] [cursor=pointer]': 💬
            - 'button "Вставить: значок свидетеля" [ref=f3e463] [cursor=pointer]': 👁️‍🗨️
            - 'button "Вставить: пустое облачко" [ref=f3e464] [cursor=pointer]': 🗨️
            - 'button "Вставить: гневное облачко" [ref=f3e465] [cursor=pointer]': 🗯️
            - 'button "Вставить: облачко с мыслями" [ref=f3e466] [cursor=pointer]': 💭
            - 'button "Вставить: сон" [ref=f3e467] [cursor=pointer]': 💤
```

# Test source

```ts
  87  |     expect(inputBox && dockBox && inputBox.y + inputBox.height <= dockBox.y).toBe(true);
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
> 187 |   expect(latestBox && inputBox && latestBox.y + latestBox.height <= inputBox.y).toBe(
      |                                                                                 ^ Error: expect(received).toBe(expected) // Object.is equality
  188 |     true,
  189 |   );
  190 |   await page.screenshot({
  191 |     path: test.info().outputPath('reading-position-emoji-dock.png'),
  192 |   });
  193 |   await latest.click();
  194 |   await expect(latest).toHaveCount(0);
  195 |   await expect(page.getByText('Новое сообщение внизу', { exact: true })).toBeInViewport();
  196 | });
  197 | 
  198 | test('reaction people replace the picker and browser Back returns to the same message', async ({
  199 |   page,
  200 | }) => {
  201 |   await page.setViewportSize({ width: 390, height: 844 });
  202 |   await login(page, 'Саша');
  203 |   const { meeting } = await apiCreate(page, 'Люди и реакции');
  204 |   await page.goto(`/meetings/${meeting.id}`);
  205 |   await page.getByLabel('Сообщение', { exact: true }).fill('Беру настолки');
  206 |   await page.getByRole('button', { name: 'Отправить сообщение' }).click();
  207 |   const row = page.getByTestId('feed-message').filter({ hasText: 'Беру настолки' });
  208 |   await row.getByTestId('message-actions').press('Enter');
  209 |   const picker = page.getByRole('dialog', { name: 'Реакция', exact: true });
  210 |   await picker.getByRole('button', { name: '❤️', exact: true }).click();
  211 |   const reaction = row.getByRole('button', { name: '❤️: 1', exact: true });
  212 |   await expect(reaction).toHaveAttribute('aria-pressed', 'true');
  213 |   await expect(row.getByRole('button', { name: 'Добавить реакцию' })).toHaveCount(0);
  214 |   await expect(row.getByRole('button', { name: 'Кто отреагировал' })).toHaveCount(0);
  215 |   await expect(picker).toHaveCount(0);
  216 |   await row.getByTestId('message-actions').press('Enter');
  217 |   await expect(picker).toBeVisible();
  218 |   await expect(picker.getByRole('button', { name: '❤️', exact: true })).toBeFocused();
  219 |   const opener = reaction;
  220 |   await opener.press('Shift+F10');
  221 |   const people = page.getByRole('dialog', { name: 'Кто отреагировал', exact: true });
  222 |   await expect(people).toBeVisible();
  223 |   await expect(picker).toHaveCount(0);
  224 |   await expect(page.locator('dialog:modal')).toHaveCount(1);
  225 |   const filter = people.getByRole('button', { name: 'Реакция ❤️', exact: true });
  226 |   await expect(filter).toHaveAttribute('aria-pressed', 'true');
  227 |   await filter.click();
  228 |   await expect(filter).toBeFocused();
  229 |   await expect(people.getByRole('list')).toContainText('Саша');
  230 |   await page.screenshot({ path: test.info().outputPath('reaction-people-filter.png') });
  231 |   await page.goBack();
  232 |   await expect(people).not.toBeVisible();
  233 |   await expect(page).toHaveURL(new RegExp(`/meetings/${meeting.id}$`));
  234 |   await expect(opener).toBeFocused();
  235 |   await expect(reaction).toHaveAttribute('aria-pressed', 'true');
  236 |   await reaction.click();
  237 |   await expect(reaction).toHaveCount(0);
  238 |   const draft = page.getByLabel('Сообщение', { exact: true });
  239 |   await draft.fill('Черновик под приглашением');
  240 |   const timeline = page.getByRole('list', { name: 'Разговор встречи' });
  241 |   const position = await timeline.evaluate((element) => element.parentElement?.scrollTop);
  242 |   await row.getByTestId('message-actions').press('Enter');
  243 |   await expect(picker).toBeVisible();
  244 |   await page
  245 |     .locator('main#main > header')
  246 |     .getByRole('button', {
  247 |       name: 'Пригласить друзей',
  248 |       exact: true,
  249 |     })
  250 |     .click();
  251 |   const share = page.getByRole('dialog', { name: 'Пригласить друзей', exact: true });
  252 |   await expect(share).toBeVisible();
  253 |   await expect(picker).toHaveCount(0);
  254 |   await page.keyboard.press('Escape');
  255 |   await expect(share).not.toBeVisible();
  256 |   await expect(picker).toHaveCount(0);
  257 |   await expect(
  258 |     page
  259 |       .locator('main#main > header')
  260 |       .getByRole('button', { name: 'Пригласить друзей', exact: true }),
  261 |   ).toBeFocused();
  262 |   await expect(draft).toHaveValue('Черновик под приглашением');
  263 |   expect(await timeline.evaluate((element) => element.parentElement?.scrollTop)).toBe(
  264 |     position,
  265 |   );
  266 |   await expect(page).toHaveURL(new RegExp(`/meetings/${meeting.id}$`));
  267 | });
  268 | 
  269 | test('desktop chat actions stay modal over the conversation and restore the draft', async ({
  270 |   page,
  271 | }) => {
  272 |   await page.setViewportSize({ width: 1440, height: 1000 });
  273 |   await login(page, 'Саша');
  274 |   const { meeting } = await apiCreate(page, 'Модальные действия');
  275 |   await page.goto(`/meetings/${meeting.id}`);
  276 |   const input = page.getByRole('textbox', { name: 'Сообщение', exact: true });
  277 |   await input.fill('Сохранённый черновик');
  278 | 
  279 |   for (const [label, title] of [
  280 |     ['Предложить дату', 'Предложить дату'],
  281 |     ['Предложить место', 'Предложить место'],
  282 |     ['Предложить задачу', 'Предложить задачу'],
  283 |   ] as const) {
  284 |     await page.getByRole('button', { name: 'Добавить к встрече', exact: true }).click();
  285 |     await page.getByRole('menuitem', { name: label, exact: true }).click();
  286 |     const dialog = page.getByRole('dialog', { name: title, exact: true });
  287 |     await expect(dialog).toBeVisible();
```