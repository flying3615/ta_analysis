import { PlanResponseDTO } from "@linz/survey-plan-generation-api-client";
import { LuiModalAsyncPrefabProps, useLuiModalPrefab } from "@linzjs/windows";
import { Dexie, type EntityTable } from "dexie";
import { PropsWithChildren, useEffect, useState } from "react";

import { DateTime } from "@/components/DateTime";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { selectLastUserEdit } from "@/modules/plan/selectGraphData";
import { recoverAutoSave, setPlanData, UserEdit } from "@/redux/planSheets/planSheetsSlice";
import { FEATUREFLAGS } from "@/split-functionality/FeatureFlags";
import useFeatureFlags from "@/split-functionality/UseFeatureFlags";
import { performanceMeasure } from "@/util/interactionMeasurementUtil";

interface RecoveryFile extends UserEdit {
  transactionId: number;
}

export const PLANGEN_LAYOUT_DB = new Dexie("PLANGEN_LAYOUT_DB") as Dexie & {
  autoSave: EntityTable<RecoveryFile, "transactionId">;
};
// must be integer
export const PLANGEN_LAYOUT_DB_VERSION = 1;
PLANGEN_LAYOUT_DB.version(PLANGEN_LAYOUT_DB_VERSION).stores({
  autoSave: "transactionId",
});

export async function clearAllRecoveryFiles() {
  await PLANGEN_LAYOUT_DB.autoSave.clear();
}

export async function clearRecoveryFile(transactionId: number) {
  await setRecoveryFile(transactionId, undefined);
}

export async function getRecoveryFile(transactionId: number): Promise<UserEdit | undefined> {
  return PLANGEN_LAYOUT_DB.autoSave.get(transactionId);
}

export async function getAndValidateRecoveryFile(
  transactionId: number,
  apiData: PlanResponseDTO,
): Promise<UserEdit | undefined> {
  const autoSave = await getRecoveryFile(transactionId);
  if (
    !autoSave?.lastChangedAt ||
    !autoSave?.lastModifiedAt ||
    !apiData.lastModifiedAt ||
    apiData.lastModifiedAt !== autoSave.lastModifiedAt ||
    new Date(autoSave.lastChangedAt).getTime() <= new Date(apiData.lastModifiedAt).getTime()
  ) {
    if (autoSave) {
      // clear invalid/outdated autosave
      await setRecoveryFile(transactionId, undefined);
    }
    return undefined;
  }
  return autoSave;
}

export async function setRecoveryFile(transactionId: number, data: UserEdit | undefined): Promise<unknown> {
  if (!data) {
    return PLANGEN_LAYOUT_DB.autoSave.delete(transactionId);
  } else {
    return PLANGEN_LAYOUT_DB.autoSave.put({ transactionId, ...data });
  }
}

interface AutoRecoveryModalProps {
  planData: PlanResponseDTO;
  recoveryFile: UserEdit;
}

/**
 * @returns true to use recovery file, false to start again
 */
function autoRecoveryModal({
  planData,
  recoveryFile,
}: AutoRecoveryModalProps): PropsWithChildren<Omit<LuiModalAsyncPrefabProps<boolean>, "close" | "resolve">> {
  return {
    buttons: [
      { level: "tertiary", title: "No", value: false },
      { default: true, level: "tertiary", title: "Yes", value: true },
    ],
    children: (
      <>
        Layout Plansheets previously closed with unsaved changes.
        <p>
          The last save was at <DateTime datetime={planData.lastModifiedAt} />.<br />
          The last unsaved change was at <DateTime datetime={recoveryFile.lastModifiedAt} />.
        </p>
        <p>Would you like to recover these unsaved changes?</p>
      </>
    ),
    closeOnOverlayClick: false,
    level: "info",
    style: {
      width: 500,
    },
    title: "Unsaved changes detected",
  };
}

export function usePlanAutoRecover(transactionId: number, planData?: PlanResponseDTO) {
  const dispatch = useAppDispatch();
  const lastUserEdit = useAppSelector(selectLastUserEdit);
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);
  const { showPrefabModal } = useLuiModalPrefab();

  const { result: isFeatureEnabled, loading: isFeatureLoading } = useFeatureFlags(
    FEATUREFLAGS.SURVEY_PLAN_GENERATION_AUTO_RECOVERY,
  );

  // automatically save/clear after user edit or plan save
  useEffect(() => {
    if (isFeatureLoading || !isFeatureEnabled) {
      return;
    }

    if (isInitialLoadComplete) {
      void setRecoveryFile(transactionId, lastUserEdit);
    }
  }, [isFeatureLoading, isFeatureEnabled, isInitialLoadComplete, lastUserEdit, transactionId]);

  // check for autosave on initial load
  useEffect(() => {
    // make sure we have plan data before doing anything
    // these are required fields, but appear to be missing in tests
    if (!planData || !planData.configs || !planData.diagrams || !planData.pages) {
      return;
    }

    if (isFeatureLoading) {
      return;
    } else if (!isFeatureEnabled) {
      // when feature not enabled
      const initialDataLoad = performanceMeasure("setPlanData", transactionId, {
        workflow: "loadPlanXML",
      })(() => Promise.resolve(dispatch(setPlanData(planData))));
      void initialDataLoad.then(() => setIsInitialLoadComplete(true));
      return;
    }

    const loadRecoveryFile = performanceMeasure("loadRecoveryFile", transactionId, {
      workflow: "loadPlanXML",
    })(() =>
      getAndValidateRecoveryFile(transactionId, planData).catch(() => {
        // error loading autosave, continue without autosave
        return undefined;
      }),
    );

    const promptToAutoRecover = loadRecoveryFile.then(
      async (recoveryFile: PlanResponseDTO | undefined): Promise<PlanResponseDTO | undefined> => {
        if (recoveryFile && (await showPrefabModal(autoRecoveryModal({ planData, recoveryFile })))) {
          return recoveryFile;
        }
        return undefined;
      },
    );

    const loadPlanData = promptToAutoRecover.then((recoveryFile: PlanResponseDTO | undefined) =>
      performanceMeasure("setPlanData", transactionId, {
        workflow: "loadPlanXML",
      })(() =>
        Promise.resolve().then(() => {
          if (recoveryFile) {
            return dispatch(recoverAutoSave(recoveryFile));
          } else {
            return dispatch(setPlanData(planData));
          }
        }),
      ),
    );

    void loadPlanData.then(() => setIsInitialLoadComplete(true));
  }, [dispatch, isFeatureEnabled, isFeatureLoading, planData, showPrefabModal, transactionId]);

  return isInitialLoadComplete;
}
