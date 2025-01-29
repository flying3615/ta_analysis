import { FEATUREFLAGS } from "@/split-functionality/FeatureFlags";
import useFeatureFlags from "@/split-functionality/UseFeatureFlags";

const useChildDiagLabelMoveSyncEnabled = () => {
  const { result: isChildDiagLabelMoveSyncEnabled } = useFeatureFlags(
    FEATUREFLAGS.SURVEY_PLAN_GENERATION_CHILD_DIAG_LABEL_MOVE_SYNC,
  );
  return isChildDiagLabelMoveSyncEnabled;
};

export default useChildDiagLabelMoveSyncEnabled;
