import imageCompression from "browser-image-compression";
import jsPDF from "jspdf";

import { PNGFile } from "@/hooks/useCytoscapeCanvasExport.tsx";

export interface INCOMING_EVENT {
  type: "PREVIEW" | "COMPILATION";
  PNGFiles: PNGFile[];
}

onmessage = async (event: MessageEvent<INCOMING_EVENT>) => {
  const pngFiles = event.data.PNGFiles;
  if (event.data.type === "COMPILATION") {
    // TODO only call image compression here for compilation
    await Promise.all(pngFiles.map(processAndUploadFile));
    postMessage({ type: "COMPLETED", payload: "FAKE_URL" });
  } else {
    const pdfUrl = await generatePDF(pngFiles);
    postMessage({ type: "COMPLETED", payload: pdfUrl });
  }
};

const processAndUploadFile = async (pngFile: PNGFile) => {
  try {
    const processedFile = await convertImageDataTo1Bit(pngFile);
    // for test purpose
    postMessage({ type: "DOWNLOAD", payload: processedFile });
    return await secureFileUploading(processedFile);
  } catch (error) {
    new Error(`Error processing file ${pngFile.name}:${error}`);
    return null;
  }
};

const secureFileUploading = (processedFile: Awaited<{ processedBlob: File; name: string }>) => {
  // TODO call SFU upload
  return new Promise((resolve) => {
    setTimeout(resolve, 100, processedFile.name);
  });
};

const convertImageDataTo1Bit = async (pngFile: PNGFile) => {
  const bitmap = await createImageBitmap(pngFile.blob);
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  ctx.drawImage(bitmap, 0, 0);
  const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const brightness = (data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) / 1000;
    const threshold = 128; // Adjust based on desired contrast
    data[i] = brightness > threshold ? 255 : 0; // R
    data[i + 1] = brightness > threshold ? 255 : 0; // G
    data[i + 2] = brightness > threshold ? 255 : 0; // B
    data[i + 3] = 255; // Alpha
  }

  ctx.putImageData(imageData, 0, 0);
  const blob = await canvas.convertToBlob();

  const file = new File([blob], pngFile.name, { type: blob.type });

  // Compress the Blob using browser-image-compression
  const options = {
    maxSizeMB: 1, // Maximum file size in MB
  };
  const processedBlob = await imageCompression(file, options);

  return { processedBlob, name: pngFile.name };
};

const generatePDF = async (pngFiles: PNGFile[]): Promise<string> => {
  const doc = new jsPDF("landscape");

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 0; i < pngFiles.length; i++) {
    if (!pngFiles[i]) continue;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const pngBlob = (await convertImageDataTo1Bit(pngFiles[i])).processedBlob;

    // Convert blob to data URL
    const dataURL = (await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(pngBlob);
    })) as string;

    const { width, height } = await getPngDimensions(pngBlob);
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
  // Output PDF as a blob
  const pdfBlob = doc.output("blob");

  // Create a blob URL representing the PDF
  return URL.createObjectURL(pdfBlob);
};

const getPngDimensions = async (blob: Blob): Promise<{ width: number; height: number }> => {
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
