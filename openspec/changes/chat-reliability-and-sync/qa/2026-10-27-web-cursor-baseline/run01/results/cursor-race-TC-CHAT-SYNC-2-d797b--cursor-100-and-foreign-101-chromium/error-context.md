# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: cursor-race.spec.ts >> TC-CHAT-SYNC-2D68FE69: ACK 102 does not skip received cursor 100 and foreign 101
- Location: .cache/qa/chat-reliability-and-sync/web-cursor-baseline/cursor-race.spec.ts:22:5

# Error details

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  getByTestId('feed-message').filter({ hasText: 'baseline-sequence-100' })
Expected: 1
Received: 0
Timeout:  5000ms

Call log:
  - Expect "toHaveCount" getByTestId('feed-message').filter({ hasText: 'baseline-sequence-100' }) with timeout 5000ms
  - waiting for getByTestId('feed-message').filter({ hasText: 'baseline-sequence-100' })
    14 × locator resolved to 0 elements
       - unexpected value "0"

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
        - status "Загрузка разговора" [ref=f3e37]
      - complementary [ref=f3e66]:
        - status "Загрузка деталей" [ref=f3e67]
        - status "Загрузка участников" [ref=f3e76]
```

# Test source

```ts
  27  |   if (!baseURL) {
  28  |     throw new Error("Missing isolated fixture origin");
  29  |   }
  30  |   mkdirSync(evidence, { recursive: true });
  31  |   const networkPath = path.join(evidence, "network.jsonl");
  32  |   writeFileSync(networkPath, "");
  33  |   let order = 0;
  34  |   const log = (event: string, details: object) => {
  35  |     appendFileSync(
  36  |       networkPath,
  37  |       JSON.stringify({
  38  |         order: ++order,
  39  |         at: new Date().toISOString(),
  40  |         event,
  41  |         ...details,
  42  |       }) + "\n",
  43  |     );
  44  |   };
  45  |   await login(page, baseURL, "Саша");
  46  |   const created = await create(page, baseURL);
  47  |   const meeting = created.meeting.id;
  48  |   const friendContext = await browser.newContext({ ignoreHTTPSErrors: true });
  49  |   const friend = await friendContext.newPage();
  50  | 
  51  |   try {
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
  120 |     await page.clock.pauseAt(new Date(clockBase.getTime() + 1_000));
  121 |     await page.goto(`${baseURL}/meetings/${meeting}`);
  122 |     await page.clock.runFor(250);
  123 |     await expect(
  124 |       page
  125 |         .getByTestId("feed-message")
  126 |         .filter({ hasText: "baseline-sequence-100" }),
> 127 |     ).toHaveCount(1);
      |       ^ Error: expect(locator).toHaveCount(expected) failed
  128 |     expect(requests.every((request) => request.after === null)).toBe(true);
  129 |     log("initial.applied", { receivedThrough: "100", requests: [...requests] });
  130 | 
  131 |     phase = "foreign-101";
  132 |     const foreign = await send(
  133 |       friend,
  134 |       baseURL,
  135 |       meeting,
  136 |       "foreign-sequence-101",
  137 |     );
  138 |     expect(foreign.sequence).toBe("101");
  139 |     log("server.commit", {
  140 |       source: "friend-api",
  141 |       method: "POST",
  142 |       path: `/api/v1/meetings/${meeting}/messages`,
  143 |       status: 201,
  144 |       body: foreign,
  145 |     });
  146 |     phase = "own-102";
  147 |     const composer = page.getByRole("textbox", {
  148 |       name: "Сообщение",
  149 |       exact: true,
  150 |     });
  151 |     await composer.fill("own-sequence-102");
  152 |     await composer.press("Enter");
  153 |     await expect.poll(() => ack102).toBe(true);
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
```