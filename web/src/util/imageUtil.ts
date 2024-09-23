import imageCompression from "browser-image-compression";

import { ImageFile } from "@/hooks/usePlanGenPreview.tsx";

/**
 *  Convert the image data to 1 bit
 * @param imageFile
 */
export const convertImageDataTo1Bit = async (imageFile: ImageFile) => {
  const bitmap = await createImageBitmap(imageFile.blob);
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
  const blob = await canvas.convertToBlob({ type: "image/jpeg", quality: 1 });

  const file = new File([blob], imageFile.name, { type: blob.type });

  // Compress the Blob using browser-image-compression
  const options = {
    maxSizeMB: 1, // Maximum file size in MB
  };
  const processedBlob = await imageCompression(file, options);
  return { processedBlob, name: imageFile.name };
};

/**
 * This function generates a blank jpeg image with the specified width and height.
 *
 * @param width - The width of the image in pixels.
 * @param height - The height of the image in pixels.
 *
 * @returns A Promise that resolves with a Blob representing the image data.
 */
export const generateBlankJpegBlob = async (width: number, height: number): Promise<Blob> => {
  // Create a new OffscreenCanvas object
  let canvas: OffscreenCanvas | HTMLCanvasElement;
  if (typeof OffscreenCanvas !== "undefined") {
    canvas = new OffscreenCanvas(width, height);
  } else {
    canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
  }
  // const canvas = new OffscreenCanvas(width, height);

  // Get the 2D rendering context from the canvas
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  // Fill the canvas with a color (white for a blank image)
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Convert the canvas to a Blob object
  if ("convertToBlob" in canvas) {
    return await (canvas as OffscreenCanvas).convertToBlob({ type: "image/jpeg", quality: 1 });
  } else {
    return new Promise<Blob>((resolve, reject) => {
      (canvas as HTMLCanvasElement).toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Blob conversion failed"));
          }
        },
        "image/jpeg",
        1,
      );
    });
  }
};
