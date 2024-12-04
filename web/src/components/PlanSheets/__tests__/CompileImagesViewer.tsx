import "./CompileImagesViewer.scss";

import { LuiButton } from "@linzjs/lui";
import React, { ReactNode, useEffect, useState } from "react";

import { ExportedImage, fetchCompileImages } from "@/test-utils/idb-utils";

interface CompileImagesViewerProps {
  imageFilename: string;
  planSheetsTemplate: ReactNode;
}

const CompileImagesViewer = ({ imageFilename, planSheetsTemplate }: CompileImagesViewerProps) => {
  const [images, setImages] = useState<ExportedImage[]>([]);

  const load = () => {
    void fetchCompileImages().then((images) => setImages(images));
  };
  useEffect(() => load, []);

  const image = images.find((image) => image.filename === imageFilename);

  return (
    <div className="CompileImagesViewerContainer">
      {!image && !images.length && (
        <div>
          {planSheetsTemplate}
          <LuiButton title="Refresh" level="tertiary" onClick={load}>
            Refresh it
          </LuiButton>
        </div>
      )}
      {image && (
        <div>
          <img src={URL.createObjectURL(image.blob)} alt={image.filename} />
          <p className="filename">Image name: {image.filename}</p>
        </div>
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
    </div>
  );
};

export default CompileImagesViewer;
