import { expect, test } from "@playwright/test";
import * as fs from "fs";
import path from "path";

test.describe("Layout Plan Sheets", () => {
  const testOutputCompileImagesDirectoryPath = path.normalize(`${__dirname}/../compare/testOutputCompileImages/`);

  test.beforeAll(() => {
    fs.mkdirSync(testOutputCompileImagesDirectoryPath, { recursive: true });
  });

  test.afterAll(() => {
    if (process.env.CI) {
      // Copy to output directory when running in CI so it is included in the build artifacts
      fs.cpSync(
        testOutputCompileImagesDirectoryPath,
        path.normalize(`${__dirname}/../output/testOutputCompileImages/`),
        {
          recursive: true,
        },
      );
    }
  });

  test("Initiate compilation of title and survey plan documents", async ({ page }) => {
    test.setTimeout(120000);
    const transactionId = 5000056;
    const fileUlidSet = new Map<string, string>();

    await page.route("**/v1/file-uploads/s3/*", async (route) => {
      const request = route.request();
      const postData = request.postDataBuffer();

      if (postData) {
        const blob = new Blob([postData]);
        const fileUlid = request.url().split("/").pop();
        if (fileUlidSet.has(fileUlid)) {
          const imageFilename = `${testOutputCompileImagesDirectoryPath}${transactionId}-${fileUlidSet.get(fileUlid)}`;

          // Convert the blob to a buffer
          const arrayBuffer = await blob.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          // Save the buffer as a JPG file
          fs.writeFileSync(imageFilename, buffer);
        }
      }

      // Continue the request without modification
      await route.continue();
    });

    await page.route("**/v1/file-uploads", async (route) => {
      const request = route.request();
      const postData = request.postDataJSON() as { originalFileName: string };
      await route.continue();
      const response = await page.waitForResponse(request.url());
      const responseBody = (await response.json()) as { fileUlid: string; signedUrl: string };
      if (postData) {
        if (postData && responseBody.fileUlid) {
          if (!fileUlidSet.has(responseBody.fileUlid)) {
            console.log("Intercepted SFU file compile plan image:", responseBody.fileUlid, postData.originalFileName);
            fileUlidSet.set(responseBody.fileUlid, postData.originalFileName);
          }
        }
      }
    });

    await page.goto(`/plan-generation/${transactionId}/layout-plan-sheets`);
    await expect(page.getByRole("heading", { name: "Title sheet diagrams" })).toBeVisible({ timeout: 120000 });
    await page.getByRole("button", { name: "Compile plan(s)" }).click();

    // First time a compile plan image is requested, there is no confirmation dialog
    try {
      await page.getByRole("button", { name: "Yes" }).click({ timeout: 2000 });
    } catch (error) {
      console.log("No confirmation dialog found");
    }

    // Wait for the plan generation to complete
    await expect(page.getByText("Plan generation has been initiated successfully.")).toBeVisible();
  });
});
