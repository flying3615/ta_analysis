import ReactGA from "react-ga4";
import { Location } from "react-router-dom";

export enum GACategory {
  DEFINE_DIAGRAMS = "Define Diagrams",
  LAYOUT_PLAN_SHEETS = "Layout Plan Sheets",
  LANDING_PAGE = "Landing Page",
}

export enum GAAction {
  DEFINE_DIAGRAMS = "Define Diagrams",
  LAYOUT_PLAN_SHEETS = "Layout Plan Sheets",
  BACK_LANDING_PAGE = "Back to Landing Page",
  MAINTAIN_DIAGRAM_LAYERS = "Maintain Diagram Layers",
  UNSAVED_CHANGES_LEAVE = "Unsaved Changes Leave",
  UNSAVED_CHANGES_SAVE_LEAVE = "Unsaved Changes Save and Leave",
  SAVE_LAYOUT = "Save Layout",
  PREVIEW_LAYOUT = "Preview Layout",
  COMPILE_LAYOUT = "Compile Layout",
}

export enum GALabel {
  SUCCESS = "Success",
  FAILURE = "Failed",
  ERROR = "Error",
}

export function isInitialised(): boolean {
  const gaKey = window._env_.gaKey;
  return !(gaKey === undefined || "not-configured" === gaKey);
}

export function trackGAPageView(location: Location): void {
  if (isInitialised()) {
    ReactGA.send({ hitType: "pageview", page: location.pathname });
  }
}

export function sendGAEvent(category: GACategory, action: GAAction | string, label?: string, value?: number): void {
  if (isInitialised()) {
    const eventData = {
      category,
      action,
      label,
      value,
    };
    ReactGA.event(eventData);
  }
}
