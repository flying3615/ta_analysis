import { Meta, StoryObj } from "@storybook/react/*";

import { ExternalSurveyInfoDto } from "@/queries/survey";

import { SurveyDetails } from "../SurveyDetails";

const makeSurveyInfo = (surveyInfo?: Partial<ExternalSurveyInfoDto>): ExternalSurveyInfoDto =>
  ({
    datasetId: "123",
    datasetSeries: "LT",
    description: "Test",
    ...surveyInfo,
  }) as ExternalSurveyInfoDto;

export default {
  title: "PlanSheets/SurveyDetails",
  component: SurveyDetails,
  decorators: (Story) => (
    <div style={{ width: 300 }}>
      <Story />
    </div>
  ),
} as Meta<typeof SurveyDetails>;

type Story = StoryObj<typeof SurveyDetails>;

export const Default: Story = {
  args: { surveyInfo: makeSurveyInfo() },
};
