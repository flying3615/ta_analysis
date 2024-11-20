import { expect, test } from "@playwright/test";
import * as fs from "fs";
import path from "path";
import pdf2img from "pdf-img-convert";
import { PNG } from "pngjs";

import { PlanSheetsPage } from "../pages/PlanSheetsPage";

test.describe("Layout Plan Sheets compare with expected result", () => {
  const pdfDirectoryPath = path.normalize(`${__dirname}/../compare/planSheetPdfs/`);
  const imageDirectoryPath = path.normalize(`${__dirname}/../compare/planSheetImages/`);

  test.beforeAll(() => {
    fs.mkdirSync(imageDirectoryPath, { recursive: true });
  });

  [{ transactionId: 5000059 }].forEach(({ transactionId }) => {
    test(`Compare layout plan sheet with expected result file for ${transactionId} after hiding a label`, async ({
      page,
      baseURL,
    }) => {
      const planSheetsPage = new PlanSheetsPage(page, baseURL);
      const diffPath = `${imageDirectoryPath}/${transactionId}-preview-diff.png`;
      const downloadPath = `${pdfDirectoryPath}/${transactionId}-actual.pdf`;

      await page.goto(`/plan-generation/${transactionId}/layout-plan-sheets`);
      await expect(page.getByRole("heading", { name: "Title sheet diagrams" })).toBeVisible({ timeout: 60000 });
      const nodeLabelToHide = "0.0411Ha";
      (await planSheetsPage.fetchCytoscapeData()).getCytoscapeData();
      const { position: cytoscapeNodePosition } = planSheetsPage.getCytoscapeNodeByLabel(nodeLabelToHide);
      console.log(`From position: ${JSON.stringify(cytoscapeNodePosition)}`);

      //select hide label option
      await page.getByRole("button", { name: "Select Labels" }).click();

      // Move the mouse to the label to the coordinate of the label to hide
      await planSheetsPage.getCytoscapeCanvas().hover({
        position: {
          x: cytoscapeNodePosition.x,
          y: cytoscapeNodePosition.y,
        },
        force: true,
      });

      // Select the label to be hidden
      await planSheetsPage.getCytoscapeCanvas().click({
        position: {
          x: cytoscapeNodePosition.x,
          y: cytoscapeNodePosition.y,
        },
        button: "right",
        force: true,
      });

      await page.getByRole("menuitem", { name: "Hide" }).click();

      // Wait 2 seconds for the debounced layout change events to trigger
      await page.waitForTimeout(2000);

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

      const img1Path = `${imageDirectoryPath}/${transactionId}-expected.png`;
      const img2Path = `${imageDirectoryPath}/${transactionId}-actual.png`;

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
        { threshold: 0 },
      );
      fs.mkdirSync(path.dirname(diffPath), { recursive: true });
      fs.writeFileSync(diffPath, PNG.sync.write(diff));

      console.log(`No of diff pixels for ${transactionId} are -> ${diffPixel}`);
      expect(diffPixel).toEqual(0);
    });
    // copyComparePngsToPwOutput.ts script moves compare pngs to pw output folder to see diff in pipeline
  }, 20000);
});
