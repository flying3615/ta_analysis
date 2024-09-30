import cytoscape from "cytoscape";

export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 10.0;
export const ZOOM_DELTA = 0.5;
export const SCROLL_THRESHOLD = 1.3;
export const pixelsPerPoint = 0.75;
export const pointsPerCm = 28.3465;
let _panX: number;
let _panY: number;
let _prevZoomX: number;
let _prevZoomY: number;

const zoomToFit = (cy?: cytoscape.Core) => {
  cy?.reset();
};

const zoomByDelta = (delta: number, cy?: cytoscape.Core) => {
  if (!cy) return;

  const container = cy.container();
  if (!container) return;

  const currentZoom = cy.zoom();
  const deltaDec = (1 - MIN_ZOOM) / 2; // legacy steps
  const deltaInc = (MAX_ZOOM - 1) / 4; // legacy steps
  const newZoom =
    delta > 0
      ? currentZoom < 1
        ? currentZoom + deltaDec
        : currentZoom + deltaInc
      : currentZoom <= 1
        ? currentZoom - deltaDec
        : currentZoom - deltaInc;

  if (newZoom < MIN_ZOOM || newZoom > MAX_ZOOM) return;

  const centerX = container.clientWidth / 2;
  const centerY = container.clientHeight / 2;
  if ((cy.zoom() <= 1 && delta < 0) || (cy.zoom() < 1 && delta > 0)) {
    cy.pan({ x: 0, y: 0 });
    cy.zoom(newZoom);
  } else {
    cy.zoom({
      level: newZoom,
      renderedPosition: { x: centerX, y: centerY },
    });
  }
};

const zoomToSelectedRegion = (x1: number, y1: number, x2: number, y2: number, cy?: cytoscape.Core) => {
  if (cy) {
    const width = Math.abs(x2 - x1);
    const height = Math.abs(y2 - y1);
    const centerX = (x2 + x1) / 2;
    const centerY = (y2 + y1) / 2;
    const zoomLevel = Math.min(cy.width() / width, cy.height() / height);
    cy.panningEnabled(true);
    cy.zoom({
      level: zoomLevel,
      renderedPosition: { x: centerX, y: centerY },
    });
  }
};

const scrollToZoom = (cy: cytoscape.Core) => {
  if (cy.zoom() < SCROLL_THRESHOLD) {
    cy.pan({ x: 0, y: 0 });
  }
};

const keepPanWithinBoundaries = (cy: cytoscape.Core) => {
  if (cy.zoom() <= 1) {
    cy.pan({ x: 0, y: 0 });
    return;
  }

  const { x1, x2, y1, y2 } = cy.extent();
  const container = cy.container();
  const disableUserPanning = () => cy.userPanningEnabled(false);

  if (!container) return;

  const { clientWidth, clientHeight } = container;
  const pan = cy.pan();

  let newX = pan.x;
  let newY = pan.y;

  if (x1 < 0) {
    newX = 0;
  }
  if (y1 < 0) {
    newY = 0;
  }
  if (x2 > clientWidth) {
    if (_panX === undefined || _prevZoomX !== cy.zoom()) {
      _panX = pan.x;
    }
    newX = _panX;
    _prevZoomX = cy.zoom();
  }
  if (y2 > clientHeight) {
    if (_panY === undefined || _prevZoomY !== cy.zoom()) {
      _panY = pan.y;
    }
    newY = _panY;
    _prevZoomY = cy.zoom();
  }

  if (newX !== pan.x || newY !== pan.y) {
    disableUserPanning();
    cy.pan({ x: newX, y: newY });
  }
};

const onViewportChange = (cy: cytoscape.Core) => {
  if (!cy.userPanningEnabled()) {
    cy.userPanningEnabled(true);
  }
};

export const cytoscapeUtils = {
  zoomToFit,
  zoomByDelta,
  zoomToSelectedRegion,
  scrollToZoom,
  keepPanWithinBoundaries,
  onViewportChange,
};
