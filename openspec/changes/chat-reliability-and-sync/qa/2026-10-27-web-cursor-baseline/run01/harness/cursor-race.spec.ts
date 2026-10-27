import { expect, test } from "@playwright/test";
import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  create,
  entrySchema,
  feed,
  feedSchema,
  headers,
  login,
  send,
} from "./fixture";

const root = "/Users/misha/Documents/Codex/projects/group-planning";
const evidence =
  process.env.CURSOR_BASELINE_OUTPUT ??
  path.join(
    root,
    "openspec/changes/chat-reliability-and-sync/qa/2026-10-27-web-cursor-baseline/run01",
  );

test("TC-CHAT-SYNC-2D68FE69: ACK 102 does not skip received cursor 100 and foreign 101", async ({
  page,
  browser,
  baseURL,
}) => {
  if (!baseURL) {
    throw new Error("Missing isolated fixture origin");
  }
  mkdirSync(evidence, { recursive: true });
  const networkPath = path.join(evidence, "network.jsonl");
  writeFileSync(networkPath, "");
  let order = 0;
  const log = (event: string, details: object) => {
    appendFileSync(
      networkPath,
      JSON.stringify({
        order: ++order,
        at: new Date().toISOString(),
        event,
        ...details,
      }) + "\n",
    );
  };
  await login(page, baseURL, "Саша");
  const created = await create(page, baseURL);
  const meeting = created.meeting.id;
  const friendContext = await browser.newContext({ ignoreHTTPSErrors: true });
  const friend = await friendContext.newPage();

  try {
    await login(friend, baseURL, "Лена");
    const invitation = new URL(created.invitation_url).pathname.replace(
      "/i/",
      "/api/v1/invitations/",
    );
    const joined = await friend.request.put(baseURL + invitation + "/rsvp", {
      headers: await headers(friend, baseURL),
      data: { answer: "going", expected_revision: "0" },
    });
    expect(joined.status()).toBe(200);
    let tail = BigInt((await feed(page, baseURL, meeting)).latest_sequence);
    while (tail < 100n) {
      const next = tail + 1n;
      const entry = await send(
        page,
        baseURL,
        meeting,
        `baseline-sequence-${next}`,
      );
      tail = BigInt(entry.sequence);
      expect(tail).toBe(next);
    }
    expect(tail).toBe(100n);
    log("fixture.ready", {
      meeting,
      serverTail: String(tail),
      origin: baseURL,
    });

    const requests: { after: string | null; phase: string }[] = [];
    let phase = "initial";
    let ack102 = false;
    await page.route(
      `**/api/v1/meetings/${meeting}/{feed*,messages}`,
      async (route) => {
        const request = route.request();
        const url = new URL(request.url());
        const after = url.searchParams.get("after_sequence");
        if (request.method() === "GET") {
          requests.push({ after, phase });
        }
        log("browser.request", {
          method: request.method(),
          path: url.pathname,
          query: url.search,
          phase,
        });
        const response = await route.fetch();
        const raw: unknown = await response.json();
        log("browser.response", {
          method: request.method(),
          path: url.pathname,
          query: url.search,
          status: response.status(),
          body: raw,
          phase,
        });
        if (request.method() === "POST") {
          ack102 = entrySchema.parse(raw).sequence === "102";
        } else {
          feedSchema.parse(raw);
        }
        await route.fulfill({ response });
      },
    );

    const clockBase = new Date("2026-10-27T18:00:00Z");
    await page.clock.install({ time: clockBase });
    await page.clock.pauseAt(new Date(clockBase.getTime() + 1_000));
    await page.goto(`${baseURL}/meetings/${meeting}`);
    await page.clock.runFor(250);
    await expect(
      page
        .getByTestId("feed-message")
        .filter({ hasText: "baseline-sequence-100" }),
    ).toHaveCount(1);
    expect(requests.every((request) => request.after === null)).toBe(true);
    log("initial.applied", { receivedThrough: "100", requests: [...requests] });

    phase = "foreign-101";
    const foreign = await send(
      friend,
      baseURL,
      meeting,
      "foreign-sequence-101",
    );
    expect(foreign.sequence).toBe("101");
    log("server.commit", {
      source: "friend-api",
      method: "POST",
      path: `/api/v1/meetings/${meeting}/messages`,
      status: 201,
      body: foreign,
    });
    phase = "own-102";
    const composer = page.getByRole("textbox", {
      name: "Сообщение",
      exact: true,
    });
    await composer.fill("own-sequence-102");
    await composer.press("Enter");
    await expect.poll(() => ack102).toBe(true);
    await expect(
      page.getByTestId("feed-message").filter({ hasText: "own-sequence-102" }),
    ).toHaveCount(1);
    expect(requests.filter((request) => request.after !== null)).toHaveLength(
      0,
    );
    log("ack.applied.before.catchup", {
      ownSequence: "102",
      displayContains102: true,
      incrementalRequests: 0,
    });

    phase = "catchup";
    await page.clock.runFor(3_100);
    await expect
      .poll(() => requests.filter((request) => request.after !== null).length)
      .toBeGreaterThan(0);
    await page.clock.runFor(3_100);
    await expect
      .poll(() => requests.filter((request) => request.after !== null).length)
      .toBeGreaterThanOrEqual(2);
    const authority = await feed(page, baseURL, meeting, "100");
    log("server.authoritative.after100", {
      method: "GET",
      path: `/api/v1/meetings/${meeting}/feed`,
      query: "?limit=50&after_sequence=100",
      status: 200,
      body: authority,
    });
    expect(authority.entries.map((entry) => entry.sequence)).toEqual([
      "101",
      "102",
    ]);
    expect(authority.entries[0]?.actor.id).not.toBe(
      authority.entries[1]?.actor.id,
    );
    const actual = {
      caseId: "TC-CHAT-SYNC-2D68FE69",
      initialReceivedThrough: "100",
      serverSequences: authority.entries.map((entry) => entry.sequence),
      nextRequests: requests.filter((request) => request.after !== null),
      displayed100: await page
        .getByTestId("feed-message")
        .filter({ hasText: "baseline-sequence-100" })
        .count(),
      displayed101: await page
        .getByTestId("feed-message")
        .filter({ hasText: "foreign-sequence-101" })
        .count(),
      displayed102: await page
        .getByTestId("feed-message")
        .filter({ hasText: "own-sequence-102" })
        .count(),
    };
    writeFileSync(
      path.join(evidence, "actual.json"),
      JSON.stringify(actual, null, 2) + "\n",
    );
    await page.screenshot({ path: path.join(evidence, "baseline-ui.png") });
    expect
      .soft(
        actual.nextRequests[0]?.after,
        "ACK must not advance the receive cursor beyond 100",
      )
      .toBe("100");
    expect
      .soft(
        actual.displayed101,
        "foreign 101 must appear after catch-up even when own ACK 102 arrived first",
      )
      .toBe(1);
    expect(actual.displayed102, "own 102 must appear exactly once").toBe(1);
  } finally {
    await friendContext.close();
  }
});
