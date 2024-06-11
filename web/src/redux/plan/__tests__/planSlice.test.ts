import { setupStore } from "@/redux/store";
import {
  fetchPlan,
  getDiagrams,
  getEdgeDataForPage,
  getPlanError,
  getNodeDataForPage,
  isPlanFetching,
  planSlice,
} from "@/redux/plan/planSlice";
import { waitFor } from "@testing-library/react";
import { PlanState } from "@/redux/plan/planSlice.ts";
import { diagrams, lineEdges, markNodes } from "@/components/CytoscapeCanvas/__tests__/mockDiagramData";

describe("planSlice", () => {
  const initialState: PlanState = {
    isPlanFetching: false,
    diagrams: [],
    pages: [],
    nodeData: [],
    edgeData: [],
    error: undefined,
  };

  let store = setupStore();

  beforeEach(() => {
    store = setupStore({ plan: initialState });
  });

  it("should handle initial state", () => {
    expect(planSlice.reducer(undefined, { type: "unknown" })).toStrictEqual({
      isPlanFetching: true,
      diagrams: [],
      pages: [],
      nodeData: [],
      edgeData: [],
      error: undefined,
    });
  });

  it("should handle fetchPlan for successful response", async () => {
    expect(isPlanFetching(store.getState())).toBe(false);

    store.dispatch(fetchPlan(123));

    // while waiting for fetch response
    expect(isPlanFetching(store.getState())).toBe(true);

    // when response available, isFetching will switch over to false
    await waitFor(() => expect(isPlanFetching(store.getState())).toBe(false));

    expect(getPlanError(store.getState())).toBeUndefined();

    const diagrams = getDiagrams(store.getState());
    expect(diagrams).toHaveLength(2);
    expect(diagrams[0]?.bottomRightPoint).toStrictEqual({ x: 80, y: -90 });
    expect(diagrams[0]?.coordinates).toHaveLength(10);
    expect(diagrams[0]?.lines).toHaveLength(9);

    const nodeDataForPage = getNodeDataForPage(store.getState(), 1);
    expect(nodeDataForPage).toHaveLength(14);
    expect(nodeDataForPage[0]?.id).toBe("10001");
    expect(nodeDataForPage[1]?.id).toBe("10002");
    expect(nodeDataForPage[2]?.id).toBe("10003");

    const edgeDataForPage = getEdgeDataForPage(store.getState(), 1);
    expect(edgeDataForPage).toHaveLength(9);
    expect(edgeDataForPage[0]?.id).toBe("1001");
    expect(edgeDataForPage[1]?.id).toBe("1002");
    expect(edgeDataForPage[2]?.id).toBe("1003");
  });

  it("should handle fetchPlan for unsuccessful response", async () => {
    expect(isPlanFetching(store.getState())).toBe(false);

    store.dispatch(fetchPlan(404));

    // while waiting for fetch response
    expect(isPlanFetching(store.getState())).toBe(true);

    // when response available, isFetching will switch over to false
    await waitFor(() => expect(isPlanFetching(store.getState())).toBe(false));

    expect(getDiagrams(store.getState())).toStrictEqual([]);

    // assert individual keys to avoid the "stack" value
    const error = getPlanError(store.getState());
    expect(error?.code).toBe(404);
    expect(error?.name).toBe("Not found");
    expect(error?.message).toBe("Not found");
  });

  it("should handle fetchPlan after error state", async () => {
    const mockErrorState = {
      ...initialState,
      error: { code: "500", message: "Server error", name: "Server error" },
    };

    store = setupStore({ plan: mockErrorState });
    expect(getDiagrams(store.getState())).toHaveLength(0);
    expect(getPlanError(store.getState())).toStrictEqual({
      code: "500",
      message: "Server error",
      name: "Server error",
    });

    store.dispatch(fetchPlan(123));

    expect(isPlanFetching(store.getState())).toBe(true);
    await waitFor(() => expect(isPlanFetching(store.getState())).toBe(false));
    expect(getDiagrams(store.getState())).toHaveLength(2);
    expect(getPlanError(store.getState())).toBeUndefined();
  });

  describe("planSlice selectors", () => {
    it("isFetching selector", async () => {
      const mockState = {
        ...initialState,
        isPlanFetching: true,
      };
      store = setupStore({ plan: mockState });

      const selected = isPlanFetching(store.getState());

      expect(selected).toBe(true);
    });

    it("getError selector", async () => {
      const mockState = {
        ...initialState,
        error: { code: "500", message: "Server error", name: "Server error" },
      };
      store = setupStore({ plan: mockState });

      const selected = getPlanError(store.getState());

      expect(selected).toStrictEqual({ code: "500", message: "Server error", name: "Server error" });
    });

    it("getNodeDataForPage selector gets first diagram data (current iteration)", async () => {
      const diagram2Node = { ...markNodes[0]!, diagramIndex: 1 };
      const mockState = {
        ...initialState,
        nodeData: [...markNodes, diagram2Node],
      };
      store = setupStore({ plan: mockState });
      expect(store.getState().plan.nodeData).toHaveLength(6);

      const selectedNodeDataForPage = getNodeDataForPage(store.getState(), 2);

      expect(selectedNodeDataForPage).toHaveLength(5); // current implementation always returns first diagram data
      expect(selectedNodeDataForPage[0]?.diagramIndex).toBe(0); // current implementation always returns first diagram data
      expect(selectedNodeDataForPage[0]).toStrictEqual({
        id: "n-1",
        label: "IS IX DP 7441",
        position: { x: 1102, y: -354 },
        diagramIndex: 0,
        properties: {
          font: "Times New Roman",
          fontSize: 16,
        },
      });
    });

    it("getEdgeDataForPage selector gets first diagram data (current iteration)", async () => {
      const diagram2Edge = { ...lineEdges[0]!, diagramIndex: 1 };
      const mockState = {
        ...initialState,
        edgeData: [...lineEdges, diagram2Edge],
      };
      store = setupStore({ plan: mockState });
      expect(store.getState().plan.edgeData).toHaveLength(7);

      const selectedEdgeDataForPage = getEdgeDataForPage(store.getState(), 2);

      expect(selectedEdgeDataForPage).toHaveLength(6); // current implementation always returns first diagram data
      expect(selectedEdgeDataForPage[0]?.diagramIndex).toBe(0); // current implementation always returns first diagram data
      expect(selectedEdgeDataForPage[0]).toStrictEqual({
        id: "e-1",
        label: "235°22'57.8\"\n20.379",
        sourceNodeId: "n-1",
        destNodeId: "n-2",
        diagramIndex: 0,
        properties: { pointWidth: 2 },
      });
    });

    it("getDiagrams selector", async () => {
      const mockState = {
        ...initialState,
        diagrams: [...diagrams, ...diagrams],
      };
      store = setupStore({ plan: mockState });

      const selectedDiagrams = getDiagrams(store.getState());

      expect(selectedDiagrams).toHaveLength(2);
      expect(selectedDiagrams[0]).toStrictEqual({
        bottomRightPoint: { x: 1500, y: -1000 },
        diagramType: "sysGenPrimaryDiag",
        coordinateLabels: [],
        coordinates: [],
        labels: [],
        lineLabels: [],
        lines: [],
        originPageOffset: { x: 0, y: -0 },
        parcelLabels: [],
      });
    });
  });
});
