/* eslint-disable */
import * as fsExtra from "fs-extra";
import path from "path";

const sourceDir: string = path.join(__dirname, "compare/planSheetImages");
const destDir: string = path.join(__dirname, "output/planSheetImages");

fsExtra.copy(sourceDir, destDir, (err: Error | null) => {
  if (err) {
    console.warn(`Error copying ${sourceDir}folder: ${err.message}`);
  } else {
    console.log(`Folder ${sourceDir} copied successfully! to ${destDir}`);
  }
});
