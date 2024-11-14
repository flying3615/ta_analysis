import { CoordinateDTO, LineDTO } from "@linz/survey-plan-generation-api-client";

export const userCoordinate1: CoordinateDTO = {
  id: 10014,
  coordType: "userDefined",
  position: {
    x: 15,
    y: -15,
  },
};
export const userCoordinate2: CoordinateDTO = {
  id: 10015,
  coordType: "userDefined",
  position: {
    x: 20,
    y: -5,
  },
};

export const multipleSegmentPageLineArrowHead: LineDTO = {
  id: 10020,
  lineType: "userDefined",
  style: "doubleArrow1",
  coordRefs: [10011, 10014, 10015],
  pointWidth: 2.0,
  displayState: "display",
};

export const hiddenPageLine: LineDTO = {
  id: 10021,
  lineType: "userDefined",
  style: "doubleArrow1",
  coordRefs: [10011, 10015],
  pointWidth: 2.0,
  displayState: "systemHide",
};
