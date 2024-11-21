import "./CompileImagesViewer.scss";

import React, { useEffect, useState } from "react";

import { ExportedImage, fetchCompileImages } from "@/test-utils/idb-utils";

interface CompileImagesViewerProps {
  imageFilename: string;
}

const CompileImagesViewer = ({ imageFilename }: CompileImagesViewerProps) => {
  const [images, setImages] = useState<ExportedImage[]>([]);

  useEffect(() => {
    void fetchCompileImages().then((images) => setImages(images));
  }, []);

  const image = images.find((image) => image.filename === imageFilename);

  return (
    <div className="CompileImagesViewerContainer">
      {imageFilename === "all" && (
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
      {imageFilename === "all" &&
        images.map((image) => {
          const url = URL.createObjectURL(image.blob);
          return (
            <div key={image.filename}>
              <p className="filename">Image name: {image.filename}</p>
              <img src={url} alt={image.filename} />
            </div>
          );
        })}
      {image && (
        <div>
          <p className="filename">Image name: {image.filename}</p>
          <img src={URL.createObjectURL(image.blob)} alt={image.filename} />
        </div>
      )}
      {!image && (
        <div>
          <p>Compile plan test needs to be run first</p>
        </div>
      )}
    </div>
  );
};

export default CompileImagesViewer;
