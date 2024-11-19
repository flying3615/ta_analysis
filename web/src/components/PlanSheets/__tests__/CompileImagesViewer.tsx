import "./CompileImagesViewer.scss";

import { openDB } from "idb";
import React, { useEffect, useState } from "react";

const CompileImagesViewer: React.FC = () => {
  const [images, setImages] = useState<Array<[string, Blob]>>([]);

  useEffect(() => {
    const fetchImages = async () => {
      const db = await openDB("compileImages", 1);
      const tx = db.transaction("images", "readonly");
      const store = tx.objectStore("images");
      const allKeys = await store.getAllKeys();
      const allImages = await Promise.all(
        allKeys.map(async (key) => {
          const blob = (await store.get(key)) as Blob;
          return [key, blob] as [string, Blob];
        }),
      );
      setImages(allImages);
    };

    void fetchImages().then();
  }, []);

  return (
    <div className="CompileImagesViewerContainer">
      <h3>Compile Plan Image output</h3>
      <p className="notes">
        This component displays the images that are compiled from the &#39;Compile Plans&#39; test. Since chromatic
        invokes the tests in the order that they are declared, the compile plans test will run first to provide the
        image data that this test depends on. The images are the exported output from the cytoscape canvas. Note that
        the bounding box of the images is not displayed here and that the border is just to provide a visual separation
        between the images.
      </p>
      {images.map(([filename, blob]) => {
        const url = URL.createObjectURL(blob);
        return (
          <div key={filename}>
            <p className="filename">Image name: {filename}</p>
            <img src={url} alt={filename} />
          </div>
        );
      })}
    </div>
  );
};

export default CompileImagesViewer;
