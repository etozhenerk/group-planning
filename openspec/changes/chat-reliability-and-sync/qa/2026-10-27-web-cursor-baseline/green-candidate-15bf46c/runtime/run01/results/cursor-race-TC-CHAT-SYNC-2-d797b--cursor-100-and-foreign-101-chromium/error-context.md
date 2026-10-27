# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: cursor-race.spec.ts >> TC-CHAT-SYNC-2D68FE69: ACK 102 does not skip received cursor 100 and foreign 101
- Location: .cache/qa/chat-receive-cursor/runtime/harness/cursor-race.spec.ts:22:5

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false

Call Log:
- Timeout 5000ms exceeded while waiting on the predicate
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
            - heading "Cursor race baseline 100/101/102" [level=1] [ref=f3e39]
            - paragraph [ref=f3e40]: 2 участника · 24 октября · 19:00
          - button "Пригласить друзей" [ref=f3e42] [cursor=pointer]
          - button "Информация о встрече" [ref=f3e46] [cursor=pointer]
        - generic [ref=f3e51]:
          - button "Предыдущие записи" [ref=f3e52] [cursor=pointer]
          - list "Разговор встречи" [ref=f3e53]:
            - listitem [ref=f3e54]: Сегодня
            - listitem [ref=f3e55]:
              - generic [aria-hidden] [ref=f3e56]: С
              - generic [ref=f3e57]:
                - generic [ref=f3e58]:
                  - strong [ref=f3e59]: Саша
                  - time [ref=f3e60]: 20:48
                - paragraph [ref=f3e61]: baseline-sequence-51
                - button "Добавить реакцию" [ref=f3e63] [cursor=pointer]
            - listitem [ref=f3e67]:
              - generic [aria-hidden] [ref=f3e68]: С
              - generic [ref=f3e69]:
                - generic [ref=f3e70]:
                  - strong [ref=f3e71]: Саша
                  - time [ref=f3e72]: 20:48
                - paragraph [ref=f3e73]: baseline-sequence-52
                - button "Добавить реакцию" [ref=f3e75] [cursor=pointer]
            - listitem [ref=f3e79]:
              - generic [aria-hidden] [ref=f3e80]: С
              - generic [ref=f3e81]:
                - generic [ref=f3e82]:
                  - strong [ref=f3e83]: Саша
                  - time [ref=f3e84]: 20:48
                - paragraph [ref=f3e85]: baseline-sequence-53
                - button "Добавить реакцию" [ref=f3e87] [cursor=pointer]
            - listitem [ref=f3e91]:
              - generic [aria-hidden] [ref=f3e92]: С
              - generic [ref=f3e93]:
                - generic [ref=f3e94]:
                  - strong [ref=f3e95]: Саша
                  - time [ref=f3e96]: 20:48
                - paragraph [ref=f3e97]: baseline-sequence-54
                - button "Добавить реакцию" [ref=f3e99] [cursor=pointer]
            - listitem [ref=f3e103]:
              - generic [aria-hidden] [ref=f3e104]: С
              - generic [ref=f3e105]:
                - generic [ref=f3e106]:
                  - strong [ref=f3e107]: Саша
                  - time [ref=f3e108]: 20:48
                - paragraph [ref=f3e109]: baseline-sequence-55
                - button "Добавить реакцию" [ref=f3e111] [cursor=pointer]
            - listitem [ref=f3e115]:
              - generic [aria-hidden] [ref=f3e116]: С
              - generic [ref=f3e117]:
                - generic [ref=f3e118]:
                  - strong [ref=f3e119]: Саша
                  - time [ref=f3e120]: 20:48
                - paragraph [ref=f3e121]: baseline-sequence-56
                - button "Добавить реакцию" [ref=f3e123] [cursor=pointer]
            - listitem [ref=f3e127]:
              - generic [aria-hidden] [ref=f3e128]: С
              - generic [ref=f3e129]:
                - generic [ref=f3e130]:
                  - strong [ref=f3e131]: Саша
                  - time [ref=f3e132]: 20:48
                - paragraph [ref=f3e133]: baseline-sequence-57
                - button "Добавить реакцию" [ref=f3e135] [cursor=pointer]
            - listitem [ref=f3e139]:
              - generic [aria-hidden] [ref=f3e140]: С
              - generic [ref=f3e141]:
                - generic [ref=f3e142]:
                  - strong [ref=f3e143]: Саша
                  - time [ref=f3e144]: 20:48
                - paragraph [ref=f3e145]: baseline-sequence-58
                - button "Добавить реакцию" [ref=f3e147] [cursor=pointer]
            - listitem [ref=f3e151]:
              - generic [aria-hidden] [ref=f3e152]: С
              - generic [ref=f3e153]:
                - generic [ref=f3e154]:
                  - strong [ref=f3e155]: Саша
                  - time [ref=f3e156]: 20:48
                - paragraph [ref=f3e157]: baseline-sequence-59
                - button "Добавить реакцию" [ref=f3e159] [cursor=pointer]
            - listitem [ref=f3e163]:
              - generic [aria-hidden] [ref=f3e164]: С
              - generic [ref=f3e165]:
                - generic [ref=f3e166]:
                  - strong [ref=f3e167]: Саша
                  - time [ref=f3e168]: 20:48
                - paragraph [ref=f3e169]: baseline-sequence-60
                - button "Добавить реакцию" [ref=f3e171] [cursor=pointer]
            - listitem [ref=f3e175]:
              - generic [aria-hidden] [ref=f3e176]: С
              - generic [ref=f3e177]:
                - generic [ref=f3e178]:
                  - strong [ref=f3e179]: Саша
                  - time [ref=f3e180]: 20:48
                - paragraph [ref=f3e181]: baseline-sequence-61
                - button "Добавить реакцию" [ref=f3e183] [cursor=pointer]
            - listitem [ref=f3e187]:
              - generic [aria-hidden] [ref=f3e188]: С
              - generic [ref=f3e189]:
                - generic [ref=f3e190]:
                  - strong [ref=f3e191]: Саша
                  - time [ref=f3e192]: 20:48
                - paragraph [ref=f3e193]: baseline-sequence-62
                - button "Добавить реакцию" [ref=f3e195] [cursor=pointer]
            - listitem [ref=f3e199]:
              - generic [aria-hidden] [ref=f3e200]: С
              - generic [ref=f3e201]:
                - generic [ref=f3e202]:
                  - strong [ref=f3e203]: Саша
                  - time [ref=f3e204]: 20:48
                - paragraph [ref=f3e205]: baseline-sequence-63
                - button "Добавить реакцию" [ref=f3e207] [cursor=pointer]
            - listitem [ref=f3e211]:
              - generic [aria-hidden] [ref=f3e212]: С
              - generic [ref=f3e213]:
                - generic [ref=f3e214]:
                  - strong [ref=f3e215]: Саша
                  - time [ref=f3e216]: 20:48
                - paragraph [ref=f3e217]: baseline-sequence-64
                - button "Добавить реакцию" [ref=f3e219] [cursor=pointer]
            - listitem [ref=f3e223]:
              - generic [aria-hidden] [ref=f3e224]: С
              - generic [ref=f3e225]:
                - generic [ref=f3e226]:
                  - strong [ref=f3e227]: Саша
                  - time [ref=f3e228]: 20:48
                - paragraph [ref=f3e229]: baseline-sequence-65
                - button "Добавить реакцию" [ref=f3e231] [cursor=pointer]
            - listitem [ref=f3e235]:
              - generic [aria-hidden] [ref=f3e236]: С
              - generic [ref=f3e237]:
                - generic [ref=f3e238]:
                  - strong [ref=f3e239]: Саша
                  - time [ref=f3e240]: 20:48
                - paragraph [ref=f3e241]: baseline-sequence-66
                - button "Добавить реакцию" [ref=f3e243] [cursor=pointer]
            - listitem [ref=f3e247]:
              - generic [aria-hidden] [ref=f3e248]: С
              - generic [ref=f3e249]:
                - generic [ref=f3e250]:
                  - strong [ref=f3e251]: Саша
                  - time [ref=f3e252]: 20:48
                - paragraph [ref=f3e253]: baseline-sequence-67
                - button "Добавить реакцию" [ref=f3e255] [cursor=pointer]
            - listitem [ref=f3e259]:
              - generic [aria-hidden] [ref=f3e260]: С
              - generic [ref=f3e261]:
                - generic [ref=f3e262]:
                  - strong [ref=f3e263]: Саша
                  - time [ref=f3e264]: 20:48
                - paragraph [ref=f3e265]: baseline-sequence-68
                - button "Добавить реакцию" [ref=f3e267] [cursor=pointer]
            - listitem [ref=f3e271]:
              - generic [aria-hidden] [ref=f3e272]: С
              - generic [ref=f3e273]:
                - generic [ref=f3e274]:
                  - strong [ref=f3e275]: Саша
                  - time [ref=f3e276]: 20:48
                - paragraph [ref=f3e277]: baseline-sequence-69
                - button "Добавить реакцию" [ref=f3e279] [cursor=pointer]
            - listitem [ref=f3e283]:
              - generic [aria-hidden] [ref=f3e284]: С
              - generic [ref=f3e285]:
                - generic [ref=f3e286]:
                  - strong [ref=f3e287]: Саша
                  - time [ref=f3e288]: 20:48
                - paragraph [ref=f3e289]: baseline-sequence-70
                - button "Добавить реакцию" [ref=f3e291] [cursor=pointer]
            - listitem [ref=f3e295]:
              - generic [aria-hidden] [ref=f3e296]: С
              - generic [ref=f3e297]:
                - generic [ref=f3e298]:
                  - strong [ref=f3e299]: Саша
                  - time [ref=f3e300]: 20:48
                - paragraph [ref=f3e301]: baseline-sequence-71
                - button "Добавить реакцию" [ref=f3e303] [cursor=pointer]
            - listitem [ref=f3e307]:
              - generic [aria-hidden] [ref=f3e308]: С
              - generic [ref=f3e309]:
                - generic [ref=f3e310]:
                  - strong [ref=f3e311]: Саша
                  - time [ref=f3e312]: 20:48
                - paragraph [ref=f3e313]: baseline-sequence-72
                - button "Добавить реакцию" [ref=f3e315] [cursor=pointer]
            - listitem [ref=f3e319]:
              - generic [aria-hidden] [ref=f3e320]: С
              - generic [ref=f3e321]:
                - generic [ref=f3e322]:
                  - strong [ref=f3e323]: Саша
                  - time [ref=f3e324]: 20:48
                - paragraph [ref=f3e325]: baseline-sequence-73
                - button "Добавить реакцию" [ref=f3e327] [cursor=pointer]
            - listitem [ref=f3e331]:
              - generic [aria-hidden] [ref=f3e332]: С
              - generic [ref=f3e333]:
                - generic [ref=f3e334]:
                  - strong [ref=f3e335]: Саша
                  - time [ref=f3e336]: 20:48
                - paragraph [ref=f3e337]: baseline-sequence-74
                - button "Добавить реакцию" [ref=f3e339] [cursor=pointer]
            - listitem [ref=f3e343]:
              - generic [aria-hidden] [ref=f3e344]: С
              - generic [ref=f3e345]:
                - generic [ref=f3e346]:
                  - strong [ref=f3e347]: Саша
                  - time [ref=f3e348]: 20:48
                - paragraph [ref=f3e349]: baseline-sequence-75
                - button "Добавить реакцию" [ref=f3e351] [cursor=pointer]
            - listitem [ref=f3e355]:
              - generic [aria-hidden] [ref=f3e356]: С
              - generic [ref=f3e357]:
                - generic [ref=f3e358]:
                  - strong [ref=f3e359]: Саша
                  - time [ref=f3e360]: 20:48
                - paragraph [ref=f3e361]: baseline-sequence-76
                - button "Добавить реакцию" [ref=f3e363] [cursor=pointer]
            - listitem [ref=f3e367]:
              - generic [aria-hidden] [ref=f3e368]: С
              - generic [ref=f3e369]:
                - generic [ref=f3e370]:
                  - strong [ref=f3e371]: Саша
                  - time [ref=f3e372]: 20:48
                - paragraph [ref=f3e373]: baseline-sequence-77
                - button "Добавить реакцию" [ref=f3e375] [cursor=pointer]
            - listitem [ref=f3e379]:
              - generic [aria-hidden] [ref=f3e380]: С
              - generic [ref=f3e381]:
                - generic [ref=f3e382]:
                  - strong [ref=f3e383]: Саша
                  - time [ref=f3e384]: 20:48
                - paragraph [ref=f3e385]: baseline-sequence-78
                - button "Добавить реакцию" [ref=f3e387] [cursor=pointer]
            - listitem [ref=f3e391]:
              - generic [aria-hidden] [ref=f3e392]: С
              - generic [ref=f3e393]:
                - generic [ref=f3e394]:
                  - strong [ref=f3e395]: Саша
                  - time [ref=f3e396]: 20:48
                - paragraph [ref=f3e397]: baseline-sequence-79
                - button "Добавить реакцию" [ref=f3e399] [cursor=pointer]
            - listitem [ref=f3e403]:
              - generic [aria-hidden] [ref=f3e404]: С
              - generic [ref=f3e405]:
                - generic [ref=f3e406]:
                  - strong [ref=f3e407]: Саша
                  - time [ref=f3e408]: 20:48
                - paragraph [ref=f3e409]: baseline-sequence-80
                - button "Добавить реакцию" [ref=f3e411] [cursor=pointer]
            - listitem [ref=f3e415]:
              - generic [aria-hidden] [ref=f3e416]: С
              - generic [ref=f3e417]:
                - generic [ref=f3e418]:
                  - strong [ref=f3e419]: Саша
                  - time [ref=f3e420]: 20:48
                - paragraph [ref=f3e421]: baseline-sequence-81
                - button "Добавить реакцию" [ref=f3e423] [cursor=pointer]
            - listitem [ref=f3e427]:
              - generic [aria-hidden] [ref=f3e428]: С
              - generic [ref=f3e429]:
                - generic [ref=f3e430]:
                  - strong [ref=f3e431]: Саша
                  - time [ref=f3e432]: 20:48
                - paragraph [ref=f3e433]: baseline-sequence-82
                - button "Добавить реакцию" [ref=f3e435] [cursor=pointer]
            - listitem [ref=f3e439]:
              - generic [aria-hidden] [ref=f3e440]: С
              - generic [ref=f3e441]:
                - generic [ref=f3e442]:
                  - strong [ref=f3e443]: Саша
                  - time [ref=f3e444]: 20:48
                - paragraph [ref=f3e445]: baseline-sequence-83
                - button "Добавить реакцию" [ref=f3e447] [cursor=pointer]
            - listitem [ref=f3e451]:
              - generic [aria-hidden] [ref=f3e452]: С
              - generic [ref=f3e453]:
                - generic [ref=f3e454]:
                  - strong [ref=f3e455]: Саша
                  - time [ref=f3e456]: 20:48
                - paragraph [ref=f3e457]: baseline-sequence-84
                - button "Добавить реакцию" [ref=f3e459] [cursor=pointer]
            - listitem [ref=f3e463]:
              - generic [aria-hidden] [ref=f3e464]: С
              - generic [ref=f3e465]:
                - generic [ref=f3e466]:
                  - strong [ref=f3e467]: Саша
                  - time [ref=f3e468]: 20:48
                - paragraph [ref=f3e469]: baseline-sequence-85
                - button "Добавить реакцию" [ref=f3e471] [cursor=pointer]
            - listitem [ref=f3e475]:
              - generic [aria-hidden] [ref=f3e476]: С
              - generic [ref=f3e477]:
                - generic [ref=f3e478]:
                  - strong [ref=f3e479]: Саша
                  - time [ref=f3e480]: 20:48
                - paragraph [ref=f3e481]: baseline-sequence-86
                - button "Добавить реакцию" [ref=f3e483] [cursor=pointer]
            - listitem [ref=f3e487]:
              - generic [aria-hidden] [ref=f3e488]: С
              - generic [ref=f3e489]:
                - generic [ref=f3e490]:
                  - strong [ref=f3e491]: Саша
                  - time [ref=f3e492]: 20:48
                - paragraph [ref=f3e493]: baseline-sequence-87
                - button "Добавить реакцию" [ref=f3e495] [cursor=pointer]
            - listitem [ref=f3e499]:
              - generic [aria-hidden] [ref=f3e500]: С
              - generic [ref=f3e501]:
                - generic [ref=f3e502]:
                  - strong [ref=f3e503]: Саша
                  - time [ref=f3e504]: 20:48
                - paragraph [ref=f3e505]: baseline-sequence-88
                - button "Добавить реакцию" [ref=f3e507] [cursor=pointer]
            - listitem [ref=f3e511]:
              - generic [aria-hidden] [ref=f3e512]: С
              - generic [ref=f3e513]:
                - generic [ref=f3e514]:
                  - strong [ref=f3e515]: Саша
                  - time [ref=f3e516]: 20:48
                - paragraph [ref=f3e517]: baseline-sequence-89
                - button "Добавить реакцию" [ref=f3e519] [cursor=pointer]
            - listitem [ref=f3e523]:
              - generic [aria-hidden] [ref=f3e524]: С
              - generic [ref=f3e525]:
                - generic [ref=f3e526]:
                  - strong [ref=f3e527]: Саша
                  - time [ref=f3e528]: 20:48
                - paragraph [ref=f3e529]: baseline-sequence-90
                - button "Добавить реакцию" [ref=f3e531] [cursor=pointer]
            - listitem [ref=f3e535]:
              - generic [aria-hidden] [ref=f3e536]: С
              - generic [ref=f3e537]:
                - generic [ref=f3e538]:
                  - strong [ref=f3e539]: Саша
                  - time [ref=f3e540]: 20:48
                - paragraph [ref=f3e541]: baseline-sequence-91
                - button "Добавить реакцию" [ref=f3e543] [cursor=pointer]
            - listitem [ref=f3e547]:
              - generic [aria-hidden] [ref=f3e548]: С
              - generic [ref=f3e549]:
                - generic [ref=f3e550]:
                  - strong [ref=f3e551]: Саша
                  - time [ref=f3e552]: 20:48
                - paragraph [ref=f3e553]: baseline-sequence-92
                - button "Добавить реакцию" [ref=f3e555] [cursor=pointer]
            - listitem [ref=f3e559]:
              - generic [aria-hidden] [ref=f3e560]: С
              - generic [ref=f3e561]:
                - generic [ref=f3e562]:
                  - strong [ref=f3e563]: Саша
                  - time [ref=f3e564]: 20:48
                - paragraph [ref=f3e565]: baseline-sequence-93
                - button "Добавить реакцию" [ref=f3e567] [cursor=pointer]
            - listitem [ref=f3e571]:
              - generic [aria-hidden] [ref=f3e572]: С
              - generic [ref=f3e573]:
                - generic [ref=f3e574]:
                  - strong [ref=f3e575]: Саша
                  - time [ref=f3e576]: 20:48
                - paragraph [ref=f3e577]: baseline-sequence-94
                - button "Добавить реакцию" [ref=f3e579] [cursor=pointer]
            - listitem [ref=f3e583]:
              - generic [aria-hidden] [ref=f3e584]: С
              - generic [ref=f3e585]:
                - generic [ref=f3e586]:
                  - strong [ref=f3e587]: Саша
                  - time [ref=f3e588]: 20:48
                - paragraph [ref=f3e589]: baseline-sequence-95
                - button "Добавить реакцию" [ref=f3e591] [cursor=pointer]
            - listitem [ref=f3e595]:
              - generic [aria-hidden] [ref=f3e596]: С
              - generic [ref=f3e597]:
                - generic [ref=f3e598]:
                  - strong [ref=f3e599]: Саша
                  - time [ref=f3e600]: 20:48
                - paragraph [ref=f3e601]: baseline-sequence-96
                - button "Добавить реакцию" [ref=f3e603] [cursor=pointer]
            - listitem [ref=f3e607]:
              - generic [aria-hidden] [ref=f3e608]: С
              - generic [ref=f3e609]:
                - generic [ref=f3e610]:
                  - strong [ref=f3e611]: Саша
                  - time [ref=f3e612]: 20:48
                - paragraph [ref=f3e613]: baseline-sequence-97
                - button "Добавить реакцию" [ref=f3e615] [cursor=pointer]
            - listitem [ref=f3e619]:
              - generic [aria-hidden] [ref=f3e620]: С
              - generic [ref=f3e621]:
                - generic [ref=f3e622]:
                  - strong [ref=f3e623]: Саша
                  - time [ref=f3e624]: 20:48
                - paragraph [ref=f3e625]: baseline-sequence-98
                - button "Добавить реакцию" [ref=f3e627] [cursor=pointer]
            - listitem [ref=f3e631]:
              - generic [aria-hidden] [ref=f3e632]: С
              - generic [ref=f3e633]:
                - generic [ref=f3e634]:
                  - strong [ref=f3e635]: Саша
                  - time [ref=f3e636]: 20:48
                - paragraph [ref=f3e637]: baseline-sequence-99
                - button "Добавить реакцию" [ref=f3e639] [cursor=pointer]
            - listitem [ref=f3e643]:
              - generic [aria-hidden] [ref=f3e644]: С
              - generic [ref=f3e645]:
                - generic [ref=f3e646]:
                  - strong [ref=f3e647]: Саша
                  - time [ref=f3e648]: 20:48
                - paragraph [ref=f3e649]: baseline-sequence-100
                - button "Добавить реакцию" [ref=f3e651] [cursor=pointer]
        - generic [ref=f3e657]:
          - button "Добавить к встрече" [ref=f3e659] [cursor=pointer]
          - generic [ref=f3e661]:
            - generic [ref=f3e662]:
              - generic [ref=f3e663]: Сообщение
              - textbox "Сообщение" [active] [ref=f3e664]:
                - /placeholder: Сообщение…
            - button "Выбрать эмодзи" [ref=f3e665] [cursor=pointer]
            - button "Отправить сообщение" [disabled] [ref=f3e669]
      - complementary [ref=f3e672]:
        - generic [ref=f3e673]:
          - generic [ref=f3e674]:
            - generic [ref=f3e675]:
              - term [ref=f3e676]: Когда
              - definition [ref=f3e677]:
                - generic [ref=f3e678]: 24 октября в 19:00
                - generic [ref=f3e679]: Москва
            - generic [ref=f3e680]:
              - term [ref=f3e681]: Где
              - definition [ref=f3e682]: Место пока не выбрано
          - generic [ref=f3e683]:
            - heading "Кто придёт · 2" [level=3] [ref=f3e684]
            - button "Все участники встречи" [ref=f3e685] [cursor=pointer]:
              - generic "Саша" [ref=f3e686]:
                - generic [aria-hidden] [ref=f3e687]: С
                - text: Саша
              - generic "Лена" [ref=f3e688]:
                - generic [aria-hidden] [ref=f3e689]: Л
                - text: Лена
```

# Test source

```ts
  52  |     await login(friend, baseURL, "Лена");
  53  |     const invitation = new URL(created.invitation_url).pathname.replace(
  54  |       "/i/",
  55  |       "/api/v1/invitations/",
  56  |     );
  57  |     const joined = await friend.request.put(baseURL + invitation + "/rsvp", {
  58  |       headers: await headers(friend, baseURL),
  59  |       data: { answer: "going", expected_revision: "0" },
  60  |     });
  61  |     expect(joined.status()).toBe(200);
  62  |     let tail = BigInt((await feed(page, baseURL, meeting)).latest_sequence);
  63  |     while (tail < 100n) {
  64  |       const next = tail + 1n;
  65  |       const entry = await send(
  66  |         page,
  67  |         baseURL,
  68  |         meeting,
  69  |         `baseline-sequence-${next}`,
  70  |       );
  71  |       tail = BigInt(entry.sequence);
  72  |       expect(tail).toBe(next);
  73  |     }
  74  |     expect(tail).toBe(100n);
  75  |     log("fixture.ready", {
  76  |       meeting,
  77  |       serverTail: String(tail),
  78  |       origin: baseURL,
  79  |     });
  80  | 
  81  |     const requests: { after: string | null; phase: string }[] = [];
  82  |     let phase = "initial";
  83  |     let ack102 = false;
  84  |     await page.route(
  85  |       `**/api/v1/meetings/${meeting}/{feed*,messages}`,
  86  |       async (route) => {
  87  |         const request = route.request();
  88  |         const url = new URL(request.url());
  89  |         const after = url.searchParams.get("after_sequence");
  90  |         if (request.method() === "GET") {
  91  |           requests.push({ after, phase });
  92  |         }
  93  |         log("browser.request", {
  94  |           method: request.method(),
  95  |           path: url.pathname,
  96  |           query: url.search,
  97  |           phase,
  98  |         });
  99  |         const response = await route.fetch();
  100 |         const raw: unknown = await response.json();
  101 |         log("browser.response", {
  102 |           method: request.method(),
  103 |           path: url.pathname,
  104 |           query: url.search,
  105 |           status: response.status(),
  106 |           body: raw,
  107 |           phase,
  108 |         });
  109 |         if (request.method() === "POST") {
  110 |           ack102 = entrySchema.parse(raw).sequence === "102";
  111 |         } else {
  112 |           feedSchema.parse(raw);
  113 |         }
  114 |         await route.fulfill({ response });
  115 |       },
  116 |     );
  117 | 
  118 |     const clockBase = new Date("2026-10-27T18:00:00Z");
  119 |     await page.clock.install({ time: clockBase });
  120 |     await page.goto(`${baseURL}/meetings/${meeting}`);
  121 |     await expect(
  122 |       page
  123 |         .getByTestId("feed-message")
  124 |         .filter({ hasText: "baseline-sequence-100" }),
  125 |     ).toHaveCount(1);
  126 |     await page.clock.pauseAt(await page.evaluate(() => Date.now() + 100));
  127 |     expect(requests.every((request) => request.after === null)).toBe(true);
  128 |     log("initial.applied", { receivedThrough: "100", requests: [...requests] });
  129 | 
  130 |     phase = "foreign-101";
  131 |     const foreign = await send(
  132 |       friend,
  133 |       baseURL,
  134 |       meeting,
  135 |       "foreign-sequence-101",
  136 |     );
  137 |     expect(foreign.sequence).toBe("101");
  138 |     log("server.commit", {
  139 |       source: "friend-api",
  140 |       method: "POST",
  141 |       path: `/api/v1/meetings/${meeting}/messages`,
  142 |       status: 201,
  143 |       body: foreign,
  144 |     });
  145 |     phase = "own-102";
  146 |     const composer = page.getByRole("textbox", {
  147 |       name: "Сообщение",
  148 |       exact: true,
  149 |     });
  150 |     await composer.fill("own-sequence-102");
  151 |     await composer.press("Enter");
> 152 |     await expect.poll(() => ack102).toBe(true);
      |                                     ^ Error: expect(received).toBe(expected) // Object.is equality
  153 |     await page.clock.runFor(250);
  154 |     await expect(
  155 |       page.getByTestId("feed-message").filter({ hasText: "own-sequence-102" }),
  156 |     ).toHaveCount(1);
  157 |     expect(requests.filter((request) => request.after !== null)).toHaveLength(
  158 |       0,
  159 |     );
  160 |     log("ack.applied.before.catchup", {
  161 |       ownSequence: "102",
  162 |       displayContains102: true,
  163 |       incrementalRequests: 0,
  164 |     });
  165 | 
  166 |     phase = "catchup";
  167 |     await page.clock.runFor(3_100);
  168 |     await expect
  169 |       .poll(() => requests.filter((request) => request.after !== null).length)
  170 |       .toBeGreaterThan(0);
  171 |     await page.clock.runFor(3_100);
  172 |     await expect
  173 |       .poll(() => requests.filter((request) => request.after !== null).length)
  174 |       .toBeGreaterThanOrEqual(2);
  175 |     const authority = await feed(page, baseURL, meeting, "100");
  176 |     log("server.authoritative.after100", {
  177 |       method: "GET",
  178 |       path: `/api/v1/meetings/${meeting}/feed`,
  179 |       query: "?limit=50&after_sequence=100",
  180 |       status: 200,
  181 |       body: authority,
  182 |     });
  183 |     expect(authority.entries.map((entry) => entry.sequence)).toEqual([
  184 |       "101",
  185 |       "102",
  186 |     ]);
  187 |     expect(authority.entries[0]?.actor.id).not.toBe(
  188 |       authority.entries[1]?.actor.id,
  189 |     );
  190 |     const actual = {
  191 |       caseId: "TC-CHAT-SYNC-2D68FE69",
  192 |       initialReceivedThrough: "100",
  193 |       serverSequences: authority.entries.map((entry) => entry.sequence),
  194 |       nextRequests: requests.filter((request) => request.after !== null),
  195 |       displayed100: await page
  196 |         .getByTestId("feed-message")
  197 |         .filter({ hasText: "baseline-sequence-100" })
  198 |         .count(),
  199 |       displayed101: await page
  200 |         .getByTestId("feed-message")
  201 |         .filter({ hasText: "foreign-sequence-101" })
  202 |         .count(),
  203 |       displayed102: await page
  204 |         .getByTestId("feed-message")
  205 |         .filter({ hasText: "own-sequence-102" })
  206 |         .count(),
  207 |     };
  208 |     writeFileSync(
  209 |       path.join(evidence, "actual.json"),
  210 |       JSON.stringify(actual, null, 2) + "\n",
  211 |     );
  212 |     await page.screenshot({ path: path.join(evidence, "baseline-ui.png") });
  213 |     expect
  214 |       .soft(
  215 |         actual.nextRequests[0]?.after,
  216 |         "ACK must not advance the receive cursor beyond 100",
  217 |       )
  218 |       .toBe("100");
  219 |     expect
  220 |       .soft(
  221 |         actual.displayed101,
  222 |         "foreign 101 must appear after catch-up even when own ACK 102 arrived first",
  223 |       )
  224 |       .toBe(1);
  225 |     expect(actual.displayed102, "own 102 must appear exactly once").toBe(1);
  226 |   } finally {
  227 |     await friendContext.close();
  228 |   }
  229 | });
  230 | 
```