import { LuiModalAsyncContextProvider, useLuiModalPrefab } from "@linzjs/windows";
import { render, screen } from "@testing-library/react";
import { useEffect } from "react";

import { prepareDatasetErrorModal } from "@/components/DefineDiagrams/prepareDatasetErrorModal";
import { PrepareDatasetError } from "@/queries/prepareDataset";

describe("prepareDatasetErrorModal", () => {
  const prepareDatasetError = new PrepareDatasetError("prepare dataset application error", 20001);

  const TestPrepareDatasetErrorModal = (props: { error: PrepareDatasetError }) => {
    const { showPrefabModal, modalOwnerRef } = useLuiModalPrefab();

    useEffect(() => {
      void showPrefabModal(prepareDatasetErrorModal(props.error));
    }, [props.error, showPrefabModal]);

    return <div ref={modalOwnerRef} />;
  };
  test("verify prepareDatasetErrorModal elements", () => {
    const errorModal = prepareDatasetErrorModal(prepareDatasetError);
    expect(errorModal.level).toBe("error");
    expect(errorModal.title).toBe("Error preparing dataset");
    expect(errorModal.buttons).toHaveLength(1);
    expect(errorModal.buttons?.[0]?.title).toBe("Dismiss");
  });

  test("render prepareDatasetErrorModal", async () => {
    render(
      <LuiModalAsyncContextProvider>
        <TestPrepareDatasetErrorModal error={prepareDatasetError} />
      </LuiModalAsyncContextProvider>,
    );
    expect(await screen.findByText("Error preparing dataset")).toBeInTheDocument();
    expect(screen.getByText(/20001/)).toBeInTheDocument();
    expect(screen.getByText(/prepare dataset application error/)).toBeInTheDocument();
  });
});
