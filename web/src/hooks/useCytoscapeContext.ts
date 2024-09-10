import { useContext } from "react";

import { CytoscapeContext, CytoscapeContextType } from "@/components/CytoscapeCanvas/CytoscapeContextProvider";

export const useCytoscapeContext = (): CytoscapeContextType => {
  const context = useContext(CytoscapeContext);
  if (!context) {
    throw new Error("useCytoscapeContext requires CytoscapeContextProvider");
  }
  return context;
};
