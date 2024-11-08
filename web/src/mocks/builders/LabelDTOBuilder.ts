import { DisplayStateEnum, LabelDTO, LabelDTOLabelTypeEnum } from "@linz/survey-plan-generation-api-client";

import { BaseBuilder } from "@/mocks/builders/BaseBuilder";

export class LabelDTOBuilder implements BaseBuilder<LabelDTO> {
  constructor(
    private labelDTO: LabelDTO = {
      anchorAngle: 72.7,
      displayState: DisplayStateEnum.display,
      displayText: "Rotated user added text",
      effect: "none",
      fontSize: 14,
      fontStyle: "italic",
      font: "Tahoma",
      labelType: LabelDTOLabelTypeEnum.userAnnotation,
      pointOffset: 0,
      position: { x: 0.25, y: -0.05 },
      rotationAngle: 25,
      textAlignment: "centerCenter",
      userEdited: false,
      id: 23,
      featureId: 1,
      featureType: "parcel",
    },
  ) {}

  static empty(): LabelDTOBuilder {
    return new LabelDTOBuilder();
  }

  build(): LabelDTO {
    return this.labelDTO;
  }

  withAnchorAngle(value: number): LabelDTOBuilder {
    this.labelDTO.anchorAngle = value;
    return this;
  }

  withDisplayState(value: DisplayStateEnum): LabelDTOBuilder {
    this.labelDTO.displayState = value;
    return this;
  }

  withDisplayText(value: string): LabelDTOBuilder {
    this.labelDTO.displayText = value;
    return this;
  }

  withEffect(value: string): LabelDTOBuilder {
    this.labelDTO.effect = value;
    return this;
  }

  withFontSize(value: number): LabelDTOBuilder {
    this.labelDTO.fontSize = value;
    return this;
  }

  withFontStyle(value: string): LabelDTOBuilder {
    this.labelDTO.fontStyle = value;
    return this;
  }

  withFont(value: string): LabelDTOBuilder {
    this.labelDTO.font = value;
    return this;
  }

  withLabelType(value: LabelDTOLabelTypeEnum): LabelDTOBuilder {
    this.labelDTO.labelType = value;
    return this;
  }

  withPointOffset(value: number): LabelDTOBuilder {
    this.labelDTO.pointOffset = value;
    return this;
  }

  withPosition(value: { x: number; y: number }): LabelDTOBuilder {
    this.labelDTO.position = value;
    return this;
  }

  withRotationAngle(value: number): LabelDTOBuilder {
    this.labelDTO.rotationAngle = value;
    return this;
  }

  withTextAlignment(value: string): LabelDTOBuilder {
    this.labelDTO.textAlignment = value;
    return this;
  }

  withUserEdited(value: boolean): LabelDTOBuilder {
    this.labelDTO.userEdited = value;
    return this;
  }

  withId(value: number): LabelDTOBuilder {
    this.labelDTO.id = value;
    return this;
  }

  withFeatureId(value: number): LabelDTOBuilder {
    this.labelDTO.featureId = value;
    return this;
  }

  withFeatureType(value: string): LabelDTOBuilder {
    this.labelDTO.featureType = value;
    return this;
  }
}
