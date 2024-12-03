import { PlanResponseDTO } from "@linz/survey-plan-generation-api-client";
import { LuiModalAsyncPrefabProps, useLuiModalPrefab } from "@linzjs/windows";
import { Dexie, type EntityTable } from "dexie";
import { PropsWithChildren, useEffect, useState } from "react";

import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { selectLastUserEdit } from "@/modules/plan/selectGraphData";
import { recoverAutoSave, setPlanData } from "@/redux/planSheets/planSheetsSlice";
import { FEATUREFLAGS } from "@/split-functionality/FeatureFlags";
import useFeatureFlags from "@/split-functionality/UseFeatureFlags";
import { performanceMeasure } from "@/util/interactionMeasurementUtil";

interface TransactionPlanResponseDTO extends PlanResponseDTO {
  transactionId: number;
}

export const PLANGEN_LAYOUT_DB = new Dexie("PLANGEN_LAYOUT_DB") as Dexie & {
  autoSave: EntityTable<TransactionPlanResponseDTO, "transactionId">;
};
// must be integer
export const PLANGEN_LAYOUT_DB_VERSION = 1;
PLANGEN_LAYOUT_DB.version(PLANGEN_LAYOUT_DB_VERSION).stores({
  autoSave: "transactionId",
});

export async function clearLayoutAutoSave(): Promise<void> {
  return PLANGEN_LAYOUT_DB.autoSave.clear();
}

export async function getLayoutAutoSave(transactionId: number): Promise<PlanResponseDTO | undefined> {
  return PLANGEN_LAYOUT_DB.autoSave.get(transactionId);
}

export async function getAndValidateAutoSave(
  transactionId: number,
  apiData: PlanResponseDTO,
): Promise<PlanResponseDTO | undefined> {
  const autoSave = await getLayoutAutoSave(transactionId);
  if (
    !autoSave?.lastModifiedAt ||
    !apiData.lastModifiedAt ||
    new Date(autoSave.lastModifiedAt).getTime() <= new Date(apiData.lastModifiedAt).getTime()
  ) {
    if (autoSave) {
      // clear invalid/outdated autosave
      await setLayoutAutoSave(transactionId, undefined);
    }
    return undefined;
  }
  return autoSave;
}

export async function setLayoutAutoSave(transactionId: number, data: PlanResponseDTO | undefined): Promise<unknown> {
  if (!data) {
    return PLANGEN_LAYOUT_DB.autoSave.delete(transactionId);
  } else {
    return PLANGEN_LAYOUT_DB.autoSave.put({ transactionId, ...data });
  }
}

/**
 * @returns true to recover auto save, false to start again
 */
const AUTO_RECOVER_MODAL: PropsWithChildren<Omit<LuiModalAsyncPrefabProps<boolean>, "close" | "resolve">> = {
  buttons: [
    { level: "tertiary", title: "Last user-edited save", value: false },
    { default: true, level: "tertiary", title: "Auto-recovery version", value: true },
  ],
  children: (
    <>
      It looks like the last time you were using Plan Generation it closed unexpectedly. Would you like to use the last
      user-edited save or the auto-recovery version?
    </>
  ),
  closeOnOverlayClick: false,
  level: "info",
  style: {
    width: 480,
  },
  title: "Last saved state",
};

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
      void setLayoutAutoSave(transactionId, lastUserEdit);
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

    const loadAutoSave = performanceMeasure("getAutoSave", transactionId, {
      workflow: "loadPlanXML",
    })(() =>
      getAndValidateAutoSave(transactionId, planData).catch(() => {
        // error loading autosave, continue without autosave
        return undefined;
      }),
    );

    const promptToRecoverAutoSave = loadAutoSave.then(
      async (autoSave: PlanResponseDTO | undefined): Promise<PlanResponseDTO | undefined> => {
        if (autoSave && (await showPrefabModal(AUTO_RECOVER_MODAL))) {
          return autoSave;
        }
        return undefined;
      },
    );

    const initialDataLoad = promptToRecoverAutoSave.then((autoSave: PlanResponseDTO | undefined) =>
      performanceMeasure("setPlanData", transactionId, {
        workflow: "loadPlanXML",
      })(() =>
        Promise.resolve().then(() => {
          if (autoSave) {
            return dispatch(recoverAutoSave(autoSave));
          } else {
            return dispatch(setPlanData(planData));
          }
        }),
      ),
    );

    void initialDataLoad.then(() => setIsInitialLoadComplete(true));
  }, [dispatch, isFeatureEnabled, isFeatureLoading, planData, showPrefabModal, transactionId]);

  return isInitialLoadComplete;
}
