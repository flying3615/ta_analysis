import { Dexie, type EntityTable } from "dexie";
export interface ExportedImage {
  filename: string;
  blob: Blob;
}

const COMPILE_IMAGES_DB = new Dexie("PLANGEN_COMPILE_IMAGES") as Dexie & {
  compileImages: EntityTable<ExportedImage, "filename">;
};
// must be integer
export const PLANGEN_COMPILE_IMAGES_DB_VERSION = 1;
COMPILE_IMAGES_DB.version(PLANGEN_COMPILE_IMAGES_DB_VERSION).stores({
  compileImages: "filename",
});

export const clearCompileImages: () => Promise<void> = async () => {
  return await COMPILE_IMAGES_DB.compileImages.clear();
};

export const fetchCompileImages: () => Promise<ExportedImage[]> = async () => {
  return await COMPILE_IMAGES_DB.compileImages.toArray();
};

export const writeCompileImage = async (filename: string, image: Blob) => {
  return await COMPILE_IMAGES_DB.compileImages.put({ filename, blob: image });
};
