/* eslint-disable */
import * as fsExtra from "fs-extra";
import path from "path";

const sourceDirImage: string = path.join(__dirname, "compare/planSheetImages");
const sourceDirPdf: string = path.join(__dirname, "compare/planSheetPdfs");
const sourceCompileJpg: string = path.join(__dirname, "compare/testOutputCompileImages");
const destDirImages: string = path.join(__dirname, "output/planSheetImages");
const destDirPdf: string = path.join(__dirname, "output/planSheetImagesPdf");
const destCompileJpg: string = path.join(__dirname, "output/testOutputCompileImages");

function copyFiles(sourceDir: string, destDir: string) {
  fsExtra.copy(sourceDir, destDir, (err: Error | null) => {
    if (err) {
      console.warn(`Error copying ${sourceDir}folder: ${err.message}`);
    } else {
      console.log(`Folder ${sourceDir} copied successfully! to ${destDir}`);
    }
  });
}

copyFiles(sourceDirImage, destDirImages);
copyFiles(sourceDirPdf, destDirPdf);
copyFiles(sourceCompileJpg, destCompileJpg);
