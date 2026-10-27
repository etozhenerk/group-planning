# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: cursor-race.spec.ts >> TC-CHAT-SYNC-2D68FE69: ACK 102 does not skip received cursor 100 and foreign 101
- Location: .cache/qa/chat-reliability-and-sync/web-cursor-baseline/cursor-race.spec.ts:22:5

# Error details

```
Error: ACK must not advance the receive cursor beyond 100

expect(received).toBe(expected) // Object.is equality

Expected: "100"
Received: "102"
```

```
Error: foreign 101 must appear after catch-up even when own ACK 102 arrived first

expect(received).toBe(expected) // Object.is equality

Expected: 1
Received: 0
```

# Page snapshot

```yaml
- generic [ref=f2e3]:
  - link "К содержимому" [ref=f2e4] [cursor=pointer]:
    - /url: "#main"
  - generic [ref=f2e5]: Демостенд · данные хранятся до перезапуска
  - generic [ref=f2e6]:
    - navigation "Основная навигация" [ref=f2e8]:
      - link "Somewhere — на главную" [ref=f2e10] [cursor=pointer]:
        - /url: /
        - generic [ref=f2e11]: somewhere
      - generic [ref=f2e12]:
        - link "Встречи" [ref=f2e13] [cursor=pointer]:
          - /url: /meetings
          - generic [ref=f2e16]: Мои встречи
        - link "Приглашения" [ref=f2e17] [cursor=pointer]:
          - /url: /invitations
        - link "Сообщить о проблеме" [ref=f2e22] [cursor=pointer]:
          - /url: /support
        - link "Профиль" [ref=f2e26] [cursor=pointer]:
          - /url: /profile
          - generic [aria-hidden] [ref=f2e28]: Л
          - generic [ref=f2e29]:
            - strong [ref=f2e30]: Лена
            - generic [ref=f2e31]: Мой профиль
    - main [active] [ref=f2e33]:
      - heading "Мои встречи" [level=1] [ref=f2e36]
      - generic [ref=f2e37]:
        - navigation "Период встреч" [ref=f2e38]:
          - button "Предстоящие 0" [pressed] [ref=f2e39] [cursor=pointer]:
            - text: Предстоящие
            - generic [ref=f2e40]: "0"
          - button "Прошедшие 0" [ref=f2e41] [cursor=pointer]:
            - text: Прошедшие
            - generic [ref=f2e42]: "0"
        - navigation "Вид встреч" [ref=f2e43]:
          - button "Список" [pressed] [ref=f2e44] [cursor=pointer]
          - button "Календарь" [ref=f2e46] [cursor=pointer]
      - generic [ref=f2e49]:
        - heading "С чего начнём?" [level=2] [ref=f2e53]
        - paragraph [ref=f2e54]: Создайте встречу и пригласите друзей по ссылке.
        - link "Создать встречу" [ref=f2e55] [cursor=pointer]:
          - /url: /meetings/new
```

# Test source

```ts
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
  152 |     await expect.poll(() => ack102).toBe(true);
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
> 224 |       .toBe(1);
      |        ^ Error: foreign 101 must appear after catch-up even when own ACK 102 arrived first
  225 |     expect(actual.displayed102, "own 102 must appear exactly once").toBe(1);
  226 |   } finally {
  227 |     await friendContext.close();
  228 |   }
  229 | });
  230 | 
```