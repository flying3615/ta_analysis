import {
  createLineBreakRestrictedEditRegex,
  escapeRegexReservedCharacters,
} from "@/components/PlanSheets/properties/LabelPropertiesUtils";

describe("Line break restricted regex", () => {
  it("escapes regex reserved characters", () => {
    const testString = "$^(){}[]*+?.";
    expect(escapeRegexReservedCharacters(testString)).toBe("\\$\\^\\(\\)\\{\\}\\[\\]\\*\\+\\?\\.");
  });

  it("Generates a valid regex for a label surrounded by parentheses", () => {
    const testString = "(This is a valid mark description.)";
    expect(RegExp(createLineBreakRestrictedEditRegex(testString))).toStrictEqual(
      /^\(This([\r\n ]*)is([\r\n ]*)a([\r\n ]*)valid([\r\n ]*)mark([\r\n ]*)description\.\)$/,
    );
  });
});
