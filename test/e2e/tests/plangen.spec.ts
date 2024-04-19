import { expect, test } from "@playwright/test";
import { Page } from "@playwright/test";

import { loginGui } from "../helper/helper";

test.describe("plangen", () => {
  let page: Page;
  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await loginGui(page);
  });
  test("has header", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Plan generation" }),
    ).toBeVisible();
  });
});
