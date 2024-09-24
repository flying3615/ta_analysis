/* eslint-disable */
import { expect, test } from "@playwright/test";
import * as fs from "fs";
import path from "path";
import pdf2img from "pdf-img-convert";
import { PNG } from "pngjs";
// TODO: unskip it when this ticket is fixed and get updated pdf from legacy for layout plan sheets
// https://toitutewhenua.atlassian.net/browse/SJ-1756
test.describe.skip("Layout Plan Sheets compare", () => {
  [{ transactionId: 5000059 }, { transactionId: 5000060 }].forEach(({ transactionId }) => {
    test(`Compare layout plan sheet with legacy for ${transactionId}`, async ({ page }) => {
      const pdfDirectoryPath = path.normalize(`${__dirname}/../compare/planSheetPdfs/`);
      const imageDirectoryPath = path.normalize(`${__dirname}/../compare/planSheetImages/`);
      fs.mkdirSync(imageDirectoryPath, { recursive: true });
      const diffPath = `${imageDirectoryPath}/${transactionId}-diff.png`;
      const downloadPath = `${pdfDirectoryPath}/${transactionId}-new-app.pdf`;

      // Mocking as we are ignoring survey-info in screen compare
      await page.route(`**/api/survey/${transactionId}/survey-info`, (route) =>
        route.fulfill({
          status: 200,
          json: {
            corporateName: "Test Corporate Name",
            datasetId: "99999",
            datasetSeries: "LT",
            description: "Test Description",
            givenNames: "John",
            localityName: "Wellington",
            officeCode: "WLG",
            surname: "Doe",
            surveyDate: "01/01/2024",
            systemCodeDescription: "Survey",
          },
        }),
      );

      await page.goto(`/plan-generation/layout-plan-sheets/${transactionId}`);
      await expect(page.getByRole("heading", { name: "Title sheet diagrams" })).toBeVisible({ timeout: 60000 });

      await Promise.all([page.waitForEvent("popup"), page.getByRole("button", { name: "Preview layout" }).click()]);

      await page.evaluate(async () => {
        // eslint-disable-next-line
        const pdfBlobUrl = (window as any).pdfBlobUrl as string;
        const blob = await fetch(pdfBlobUrl).then((r) => r.blob());
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.title = "downloadPdf";
        const link = document.createTextNode("Pdf Download link");
        a.appendChild(link);
        document.body.appendChild(a);
      });

      const [download] = await Promise.all([
        page.waitForEvent("download"),
        await page.getByTitle("downloadPdf").click({ force: true }),
      ]);

      await download.saveAs(downloadPath);

      expect(fs.existsSync(downloadPath)).toBe(true);

      const writePngs = async (): Promise<void> => {
        try {
          const files = await fs.promises.readdir(pdfDirectoryPath);
          for (const file of files) {
            if (file.startsWith(transactionId.toString())) {
              const outputImages2 = await pdf2img.convert(pdfDirectoryPath + file);
              for (let i = 0; i < outputImages2.length; i++) {
                fs.writeFileSync(imageDirectoryPath + file.split(".")[0] + ".png", outputImages2[i]);
              }
            }
          }
        } catch (err) {
          console.log(`Unable to scan pdf directory: ${(err as Error).message}`);
          throw err;
        }
      };

      await writePngs();

      const img1Path = `${imageDirectoryPath}/${transactionId}-legacy-app.png`;
      const img2Path = `${imageDirectoryPath}/${transactionId}-new-app.png`;

      if (!fs.existsSync(img1Path) || !fs.existsSync(img2Path)) {
        throw new Error("One or both image files do not exist");
      }

      const img1: InstanceType<typeof PNG> = PNG.sync.read(fs.readFileSync(img1Path));
      const img2: InstanceType<typeof PNG> = PNG.sync.read(fs.readFileSync(img2Path));

      // Ignore footer from png when comparing images as Generated on: date will always be different
      function createResized(img: InstanceType<typeof PNG>): InstanceType<typeof PNG> {
        const dimensions = { width: img.width, height: 536 };
        const resized = new PNG(dimensions);
        PNG.bitblt(img, resized, 0, 0, dimensions.width, dimensions.height);

        return resized;
      }

      const img1Resized: InstanceType<typeof PNG> = createResized(img1);
      const img2Resized: InstanceType<typeof PNG> = createResized(img2);

      const { width, height } = img1Resized;
      const diff: InstanceType<typeof PNG> = new PNG({ width, height });

      const { default: pixelmatch } = await import("pixelmatch");
      const diffPixel = pixelmatch(
        img1Resized.data as Buffer | Uint8Array | Uint8ClampedArray,
        img2Resized.data as Buffer | Uint8Array | Uint8ClampedArray,
        diff.data as Buffer | Uint8Array | Uint8ClampedArray,
        width,
        height,
        { threshold: 0.1 },
      );
      fs.mkdirSync(path.dirname(diffPath), { recursive: true });
      fs.writeFileSync(diffPath, PNG.sync.write(diff));

      console.log(`No of diff pixels for ${transactionId} are -> ${diffPixel}`);
      expect(diffPixel).toEqual(0);
    });
    // copyComparePngsToPwOutput.ts script moves compare pngs to pw output folder to see diff in pipeline
  }, 20000);
});
