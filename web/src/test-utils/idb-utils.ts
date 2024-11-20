import { openDB } from "idb";

export interface ExportedImage {
  filename: string;
  blob: Blob;
}

export const fetchCompileImages: () => Promise<ExportedImage[]> = async () => {
  const db = await openDB("compileImages", 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("images")) {
        db.createObjectStore("images");
      }
    },
  });
  const tx = db.transaction("images", "readonly");
  const store = tx.objectStore("images");
  const allKeys = await store.getAllKeys();
  return await Promise.all(
    allKeys.map(async (key) => {
      const blob = (await store.get(key)) as Blob;
      return { filename: key as string, blob: blob };
    }),
  );
};

export const writeCompileImage = async (filename: string, image: Blob) => {
  const db = await openDB("compileImages", 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("images")) {
        db.createObjectStore("images");
      }
    },
  });

  // Write data into the database
  const tx = db.transaction("images", "readwrite");
  const store = tx.objectStore("images");
  await store.put(image, filename);
  await tx.done;
};
