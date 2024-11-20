import type { FullResult, Reporter } from "@playwright/test/reporter";
import * as fsExtra from "fs-extra";
import path from "path";

class PlanImageOutputReporter implements Reporter {
  onEnd(result: FullResult): void {
    console.log(
      "Copying plan files to output directory, ",
      `Result: ${result.status}`,
      `Total Duration: ${result.duration}ms`,
    );
    // Source directories
    const sourceDirImage: string = path.join(__dirname, "compare/planSheetImages");
    const sourceDirPdf: string = path.join(__dirname, "compare/planSheetPdfs");
    const sourceCompileJpg: string = path.join(__dirname, "compare/testOutputCompileImages");

    // destination directories
    const destDirImages: string = path.join(__dirname, "output/planSheetImages");
    const destDirPdf: string = path.join(__dirname, "output/planSheetImagesPdf");
    const destCompileJpg: string = path.join(__dirname, "output/testOutputCompileImages");

    fsExtra.copySync(sourceDirImage, destDirImages);
    fsExtra.copySync(sourceDirPdf, destDirPdf);
    fsExtra.copySync(sourceCompileJpg, destCompileJpg);
  }
}

export default PlanImageOutputReporter;
