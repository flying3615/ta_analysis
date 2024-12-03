import { expect, test } from "@playwright/test";

test.describe("Layout Plan Sheets Updating hidden label preference", () => {
  test("Selecting/unselecting view hidden label option changes the icon dynamically in plan sheet header menu", async ({
    page,
  }) => {
    await page.goto("/plan-generation/5000056");
    await expect(page.getByRole("heading", { name: "Plan generation" })).toBeVisible();

    const labelPreferencesButton = page.getByText("Label Preferences");
    await labelPreferencesButton.click();

    const hiddenObjectVisibility = page.getByRole("checkbox", { name: "Hidden objects visible by default" });
    await expect(hiddenObjectVisibility).toBeChecked();

    await page.goto("/plan-generation/5000056/layout-plan-sheets");

    const visibilityIcon = page.getByTitle("View hidden objects");
    await expect(visibilityIcon).toHaveAttribute("data-icon", "ic_view");

    await page.goto("/plan-generation/5000056");
    await expect(page.getByRole("heading", { name: "Plan generation" })).toBeVisible();

    await labelPreferencesButton.click();
    await hiddenObjectVisibility.scrollIntoViewIfNeeded();
    await page.getByText("Hidden objects visible by default").click();
    await expect(hiddenObjectVisibility).not.toBeChecked();

    await page.goto("/plan-generation/5000056/layout-plan-sheets");
    await expect(visibilityIcon).toHaveAttribute("data-icon", "ic_visiblity_off");
  });
});
