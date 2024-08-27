import jsPDF from "jspdf";
import { memoize } from "lodash-es";

import { PNGFile } from "@/hooks/usePlanGenPreview.tsx";

export interface INCOMING_EVENT {
  PNGFiles: PNGFile[];
}

onmessage = async (event: MessageEvent<INCOMING_EVENT>) => {
  const pngFiles = event.data.PNGFiles;
  const pdfUrl = await generatePDF(pngFiles);
  postMessage({ type: "COMPLETED", payload: pdfUrl });
};

const generatePDF = async (pngFiles: PNGFile[]): Promise<string> => {
  const doc = new jsPDF("landscape");

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 0; i < pngFiles.length; i++) {
    const file = pngFiles[i];
    if (!file) continue;
    const pngBlob = file.blob;

    // Convert blob to data URL
    const dataURL = (await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(pngBlob);
    })) as string;

    const { width, height } = await memoize(getPngDimensions)("size", pngBlob);
    const scaleX = (pageWidth - 10) / width; // give some margin
    const scaleY = (pageHeight - 10) / height; // give some margin
    // uses the smaller one to ensure that the image fits within the page
    // without exceeding either dimension
    const scale = Math.min(scaleX, scaleY);

    const scaledWidth = width * scale;
    const scaledHeight = height * scale;

    // Calculate the x and y coordinates to center the image
    const x = (pageWidth - scaledWidth) / 2;
    const y = (pageHeight - scaledHeight) / 2;
    // Add image to PDF
    doc.addImage(dataURL, "PNG", x, y, scaledWidth, scaledHeight, undefined, "FAST");

    // Add new page for next image except for the last one
    if (i < pngFiles.length - 1) {
      doc.addPage();
    }
  }

  return doc.output("bloburl").toString();
};

const getPngDimensions = async (_: string, blob: Blob): Promise<{ width: number; height: number }> => {
  const bitmap = await createImageBitmap(blob);
  const offscreenCanvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = offscreenCanvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  ctx.drawImage(bitmap, 0, 0);
  const imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);

  return { width: imageData.width, height: imageData.height };
};
