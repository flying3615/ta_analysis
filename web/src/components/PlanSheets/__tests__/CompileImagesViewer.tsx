import "./CompileImagesViewer.scss";

import React, { useEffect, useState } from "react";

import { ExportedImage, fetchCompileImages } from "@/test-utils/idb-utils";

interface CompileImagesViewerProps {
  imageIndex: "all" | number;
}

const CompileImagesViewer = ({ imageIndex }: CompileImagesViewerProps) => {
  const [images, setImages] = useState<ExportedImage[]>([]);

  useEffect(() => {
    void fetchCompileImages().then((images) => setImages(images));
  }, []);

  return (
    <div className="CompileImagesViewerContainer">
      {imageIndex === "all" && (
        <>
          <h3>Compile Plan Image output</h3>
          <p className="notes">
            This component displays the images that are compiled from the &#39;Compile Plans&#39; test. Since chromatic
            invokes the tests in the order that they are declared, the compile plans test will run first to provide the
            image data that this test depends on. The images are the exported output from the cytoscape canvas. Note
            that the bounding box of the images is not displayed here and that the border is just to provide a visual
            separation between the images.
          </p>
        </>
      )}
      {imageIndex === "all" &&
        images.map((image) => {
          const url = URL.createObjectURL(image.blob);
          return (
            <div key={image.filename}>
              <p className="filename">Image name: {image.filename}</p>
              <img src={url} alt={image.filename} />
            </div>
          );
        })}
      {typeof imageIndex === "number" && images[imageIndex] && (
        <div>
          <p className="filename">Image name: {images[imageIndex].filename}</p>
          <img src={URL.createObjectURL(images[imageIndex].blob)} alt={images[imageIndex].filename} />
        </div>
      )}
      {typeof imageIndex === "number" && !images[imageIndex] && (
        <div>
          <p>Compile plan test needs to be run first</p>
        </div>
      )}
    </div>
  );
};

export default CompileImagesViewer;
