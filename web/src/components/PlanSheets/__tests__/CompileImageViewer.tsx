import "./CompileImagesViewer.scss";

import React from "react";

interface CompileImageViewerProps {
  filename?: string;
  image?: Blob;
}

const CompileImageViewer = ({ filename, image }: CompileImageViewerProps) => {
  if (!filename || !image) {
    return (
      <div className="CompileImagesViewerContainer">
        <h3>Compile Plan Image output</h3>
        <p className="notes">
          If you are seeing this, you need to run the Compile Plans test first. This will generate the images that this
          component displays. Since chromatic invokes the tests in the order that they are declared, the compile plans
          test will run first to provide the image data that this test depends on. The images are the exported output
          from the cytoscape canvas. Note that the bounding box of the images is not displayed here and that the border
          is just to provide a visual separation the image.
        </p>
      </div>
    );
  }
  return (
    <div className="CompileImagesViewerContainer">
      <div key={filename}>
        <p className="filename">Image name: {filename}</p>
        <img src={URL.createObjectURL(image)} alt={filename} />
      </div>
    </div>
  );
};

export default CompileImageViewer;
