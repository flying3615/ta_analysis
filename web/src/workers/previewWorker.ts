import imageCompression from "browser-image-compression";

import { PNGFile } from "@/hooks/useCytoscapeCanvasExport.tsx";

onmessage = async (event: MessageEvent<PNGFile[]>) => {
  // TODO call preview api with successful responses to get S3 signed URLs
  const pngFiles = event.data;
  await Promise.all(pngFiles.map(processAndUploadFile));
  postMessage({ type: "COMPLETED", payload: "FAKE_URL" });
};

const processAndUploadFile = async (png: PNGFile) => {
  try {
    const processedFile = await convertImageDataTo1Bit(png.blob, png.name);
    // for test purpose
    postMessage({ type: "DOWNLOAD", payload: processedFile });
    return await secureFileUploading(processedFile);
  } catch (error) {
    new Error(`Error processing file ${png.name}:${error}`);
    return null;
  }
};

const secureFileUploading = (processedFile: Awaited<{ processedBlob: File; name: string }>) => {
  // TODO call SFU upload
  return new Promise((resolve) => {
    setTimeout(resolve, 100, processedFile.name);
  });
};

const convertImageDataTo1Bit = async (png: Blob, fileName: string) => {
  const bitmap = await createImageBitmap(png);
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

  const file = new File([blob], fileName, { type: blob.type });

  // Compress the Blob using browser-image-compression
  const options = {
    maxSizeMB: 1, // Maximum file size in MB
  };
  const processedBlob = await imageCompression(file, options);

  return { processedBlob, name: fileName };
};
