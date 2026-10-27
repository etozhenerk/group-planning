import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { z } from "zod";

export const entrySchema = z
  .object({
    id: z.string(),
    sequence: z.string(),
    actor: z.object({ id: z.string() }),
  })
  .passthrough();
export const feedSchema = z
  .object({
    entries: z.array(entrySchema),
    latest_sequence: z.string(),
    has_more: z.boolean(),
  })
  .passthrough();
const sessionSchema = z.object({ csrf_token: z.string() });
const createdSchema = z.object({
  meeting: z.object({ id: z.string() }),
  invitation_url: z.string(),
});

export const login = async (page: Page, origin: string, name: string) => {
  await page.goto(`${origin}/meetings`);
  await page.getByRole("button", { name: "Войти через Яндекс ID" }).click();
  await page.getByRole("link", { name: `Войти как ${name}` }).click();
  await expect(page).toHaveURL(`${origin}/meetings`);
};

export const headers = async (page: Page, origin: string) => {
  const response = await page.request.get(`${origin}/api/v1/me`);
  const session = sessionSchema.parse(await response.json());

  return {
    Origin: origin,
    "X-CSRF-Token": session.csrf_token,
    "Idempotency-Key": randomUUID(),
  };
};

export const create = async (page: Page, origin: string) => {
  const response = await page.request.post(`${origin}/api/v1/meetings`, {
    headers: await headers(page, origin),
    data: {
      title: "Cursor race baseline 100/101/102",
      starts_at: "2099-10-24T19:00:00+03:00",
      timezone: "Europe/Moscow",
    },
  });
  expect(response.status()).toBe(201);

  return createdSchema.parse(await response.json());
};

export const send = async (
  page: Page,
  origin: string,
  meeting: string,
  text: string,
) => {
  const requestHeaders = await headers(page, origin);
  const response = await page.request.post(
    `${origin}/api/v1/meetings/${meeting}/messages`,
    {
      headers: requestHeaders,
      data: { text, client_request_id: requestHeaders["Idempotency-Key"] },
    },
  );
  expect(response.status()).toBe(201);

  return entrySchema.parse(await response.json());
};

export const feed = async (
  page: Page,
  origin: string,
  meeting: string,
  after?: string,
) => {
  const response = await page.request.get(
    `${origin}/api/v1/meetings/${meeting}/feed?limit=50${after ? `&after_sequence=${after}` : ""}`,
  );
  expect(response.status()).toBe(200);

  return feedSchema.parse(await response.json());
};
