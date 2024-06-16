import { LuiModalAsyncContextProvider, useLuiModalPrefab } from "@linzjs/windows";
import { render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { PostDiagramsResponseDTO } from "@linz/survey-plan-generation-api-client";
import { prepareDatasetErrorModal } from "@/components/LandingPage/prepareDatasetErrorModal.tsx";

describe("prepareDatasetErrorModal", () => {
  const prepareDatasetError: PostDiagramsResponseDTO = {
    ok: false,
    statusCode: 20001,
    message: "prepare dataset application error",
  };

  const TestPrepareDatasetErrorModal = (props: { error: PostDiagramsResponseDTO }) => {
    const { showPrefabModal, modalOwnerRef } = useLuiModalPrefab();

    useEffect(() => {
      showPrefabModal(prepareDatasetErrorModal(props.error));
    }, [props.error, showPrefabModal]);

    return <div ref={modalOwnerRef} />;
  };
  test("verify prepareDatasetErrorModal elements", () => {
    const errorModal = prepareDatasetErrorModal(prepareDatasetError);
    expect(errorModal.level).toBe("error");
    expect(errorModal.title).toBe("Error preparing dataset");
    expect(errorModal.buttons).toHaveLength(1);
    expect(errorModal.buttons?.[0]?.title).toBe("Continue");
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
