import {
  findQuick,
  getAllQuick,
  getMatcher,
  getQuick,
  IQueryQuick,
  queryQuick,
} from "@linzjs/step-ag-grid/src/utils/testQuick";
import { expect } from "@storybook/jest";
import { userEvent, waitFor, within } from "@storybook/testing-library";
import { isEqual } from "lodash-es";

export const countRows = (within?: HTMLElement): Promise<number> => {
  return Promise.resolve(getAllQuick({ tagName: `div[row-id]:not(:empty)` }, within).length);
};

export const findRowByIndex = async (rowIndex: number | string, within?: HTMLElement): Promise<HTMLDivElement> => {
  await waitFor(async () => {
    await expect(getAllQuick({ classes: ".ag-row" }).length > 0).toBe(true);
  });

  const row: HTMLDivElement = await findQuick<HTMLDivElement>(
    { tagName: `.ag-center-cols-container div[row-index='${rowIndex}']:not(:empty)` },
    within,
  );

  // eslint-disable-next-line testing-library/no-node-access
  let combineChildren = [...Array.from(row.children)];

  const leftCols = queryQuick<HTMLDivElement>(
    { tagName: `.ag-pinned-left-cols-container div[row-index='${rowIndex}']` },
    within,
  );
  if (leftCols) {
    // eslint-disable-next-line testing-library/no-node-access
    combineChildren = [...Array.from(leftCols.children), ...combineChildren];
  }

  const rightCols = queryQuick<HTMLDivElement>(
    { tagName: `.ag-pinned-right-cols-container div[row-index='${rowIndex}']` },
    within,
  );
  if (rightCols) {
    // eslint-disable-next-line testing-library/no-node-access
    combineChildren = [...Array.from(rightCols.children), ...combineChildren];
  }

  row.replaceChildren(...combineChildren);

  return row;
};

export const findRow = async (rowId: number | string, within?: HTMLElement): Promise<HTMLDivElement> => {
  await waitFor(async () => {
    await expect(getAllQuick({ classes: ".ag-row" }).length > 0).toBe(true);
  });
  const row: HTMLDivElement = await findQuick<HTMLDivElement>(
    { tagName: `.ag-center-cols-container div[row-id='${rowId}']:not(:empty)` },
    within,
  );

  // eslint-disable-next-line testing-library/no-node-access
  let combineChildren = [...Array.from(row.children)];

  const leftCols = queryQuick<HTMLDivElement>(
    { tagName: `.ag-pinned-left-cols-container div[row-id='${rowId}']` },
    within,
  );
  if (leftCols) {
    // eslint-disable-next-line testing-library/no-node-access
    combineChildren = [...Array.from(leftCols.children), ...combineChildren];
  }

  const rightCols = queryQuick<HTMLDivElement>(
    { tagName: `.ag-pinned-right-cols-container div[row-id='${rowId}']` },
    within,
  );
  if (rightCols) {
    // eslint-disable-next-line testing-library/no-node-access
    combineChildren = [...Array.from(rightCols.children), ...combineChildren];
  }

  row.replaceChildren(...combineChildren);

  return row;
};

export const queryRow = (rowId: number | string, within?: HTMLElement): Promise<HTMLDivElement | null> => {
  return Promise.resolve(queryQuick<HTMLDivElement>({ tagName: `div[row-id='${rowId}']:not(:empty)` }, within));
};

const _selectRow = async (
  select: "select" | "deselect" | "toggle",
  rowId: string | number,
  within?: HTMLElement,
): Promise<void> => {
  const row = await findRow(rowId, within);
  const isSelected = row.className.includes("ag-row-selected");
  if (select === "toggle" || (select === "select" && !isSelected) || (select === "deselect" && isSelected)) {
    const cell = await findCell(rowId, "selection", within);
    await userEvent.click(cell);
    await waitFor(async () => {
      const row = await findRow(rowId, within);
      const nowSelected = row.className.includes("ag-row-selected");
      if (nowSelected === isSelected) throw `Row ${rowId} won't select`;
    });
  }
};

export const selectRow = async (rowId: string | number, within?: HTMLElement): Promise<void> =>
  _selectRow("select", rowId, within);

export const deselectRow = async (rowId: string | number, within?: HTMLElement): Promise<void> =>
  _selectRow("deselect", rowId, within);

export const findCell = async (rowId: number | string, colId: string, within?: HTMLElement): Promise<HTMLElement> => {
  const row = await findRow(rowId, within);
  return await findQuick({ tagName: `[col-id='${colId}']` }, row);
};

export const findCellContains = async (
  rowId: number | string,
  colId: string,
  text: string | RegExp,
  within?: HTMLElement,
) => {
  return await waitFor(
    async () => {
      const row = await findRow(rowId, within);
      return getQuick({ tagName: `[col-id='${colId}']`, text }, row);
    },
    { timeout: 10000 },
  );
};

export const selectCell = async (rowId: string | number, colId: string, within?: HTMLElement): Promise<void> => {
  await waitFor(
    async () => {
      const cell = await findCell(rowId, colId, within);
      await userEvent.click(cell);
    },
    { timeout: 10000 },
  );
};

export const editCell = async (rowId: number | string, colId: string, within?: HTMLElement): Promise<void> => {
  await waitFor(
    async () => {
      const cell = await findCell(rowId, colId, within);
      await userEvent.dblClick(cell);
      await waitFor(findOpenPopover, { timeout: 1000 });
    },
    { timeout: 10000 },
  );
};

export const isCellReadOnly = async (rowId: number | string, colId: string, within?: HTMLElement): Promise<boolean> => {
  const cell = await findCell(rowId, colId, within);
  return cell.className.includes("GridCell-readonly");
};

export const findOpenPopover = () => findQuick({ classes: ".szh-menu--state-open" });

export const queryMenuOption = async (menuOptionText: string | RegExp): Promise<HTMLElement | null> => {
  const openMenu = await findOpenPopover();
  const els = await within(openMenu).findAllByRole("menuitem");
  const matcher = getMatcher(menuOptionText);
  const result = els.find(matcher);
  return result ?? null;
};

export const findMenuOption = async (menuOptionText: string | RegExp): Promise<HTMLElement> => {
  return await waitFor(
    async () => {
      const menuOption = await queryMenuOption(menuOptionText);
      if (menuOption == null) {
        throw Error(`Unable to find menu option ${menuOptionText}`);
      }
      return menuOption;
    },
    { timeout: 5000 },
  );
};

export const validateMenuOptions = async (
  rowId: number | string,
  colId: string,
  expectedMenuOptions: Array<string>,
): Promise<boolean> => {
  await editCell(rowId, colId);
  const openMenu = await findOpenPopover();
  const actualOptions = (await within(openMenu).findAllByRole("menuitem")).map((menuItem) => menuItem.textContent);
  return isEqual(actualOptions, expectedMenuOptions);
};

export const getLayerSelectedState = async (
  rowId: number | string,
  container?: HTMLElement,
): Promise<string | null> => {
  const cell = await findCell(rowId, "selected", container);
  const button = await findQuick({ tagName: "button" }, cell);
  const actualSelectedSpan = await findQuick({ tagName: "span" }, button);
  const actualSelectedState = actualSelectedSpan.ariaLabel;
  return actualSelectedState;
};

export const clickMenuOption = async (menuOptionText: string | RegExp): Promise<void> => {
  const menuOption = await findMenuOption(menuOptionText);
  await userEvent.click(menuOption);
};

export const openAndClickMenuOption = async (
  rowId: number | string,
  colId: string,
  menuOptionText: string | RegExp,
  within?: HTMLElement,
): Promise<void> => {
  await editCell(rowId, colId, within);
  await clickMenuOption(menuOptionText);
};

export const openAndFindMenuOption = async (
  rowId: number | string,
  colId: string,
  menuOptionText: string | RegExp,
  within?: HTMLElement,
): Promise<HTMLElement> => {
  await editCell(rowId, colId, within);
  return await findMenuOption(menuOptionText);
};

export const getMultiSelectOptions = async () => {
  const openMenu = await findOpenPopover();
  return getAllQuick<HTMLInputElement>({ role: "menuitem", child: { tagName: "input,textarea" } }, openMenu).map(
    (input) => {
      return {
        v: input.value,
        c: input.checked ?? true,
      };
    },
  );
};

export const findMultiSelectOption = async (value: string): Promise<HTMLElement> => {
  const openMenu = await findOpenPopover();
  return getQuick({ role: "menuitem", child: { tagName: `input[value='${value}']` } }, openMenu);
};

export const clickMultiSelectOption = async (value: string): Promise<void> => {
  const menuItem = await findMultiSelectOption(value);
  // eslint-disable-next-line testing-library/no-node-access
  menuItem.parentElement && (await userEvent.click(menuItem.parentElement));
};

const typeInput = async (value: string, filter: IQueryQuick): Promise<void> => {
  const openMenu = await findOpenPopover();
  const input = await findQuick(filter, openMenu);
  await userEvent.clear(input);
  //'typing' an empty string will cause a console error, and it's also unnecessary after the previous clear call
  if (value.length > 0) {
    await userEvent.type(input, value);
  }
};

export const typeOnlyInput = async (value: string): Promise<void> =>
  typeInput(value, { child: { tagName: "input[type='text'], textarea" } });

export const typeInputByLabel = async (value: string, labelText: string): Promise<void> => {
  const labels = getAllQuick({ child: { tagName: "label" } }).filter((l) => l.textContent === labelText);
  if (labels.length === 0) {
    throw Error(`Label not found for text: ${labelText}`);
  }
  if (labels.length > 1) {
    throw Error(`Multiple labels found for text: ${labelText}`);
  }
  const inputId = labels[0]!.getAttribute("for");
  await typeInput(value, { child: { tagName: `input[id='${inputId}'], textarea[id='${inputId}']` } });
};

export const typeInputByPlaceholder = async (value: string, placeholder: string): Promise<void> =>
  typeInput(value, {
    child: { tagName: `input[placeholder='${placeholder}'], textarea[placeholder='${placeholder}']` },
  });

export const typeOtherInput = async (value: string): Promise<void> =>
  typeInput(value, { classes: ".subComponent", child: { tagName: "input[type='text']" } });

export const typeOtherTextArea = async (value: string): Promise<void> =>
  typeInput(value, { classes: ".subComponent", child: { tagName: "textarea" } });

export const closeMenu = () => userEvent.click(document.body);
export const closePopover = () => userEvent.click(document.body);

export const findActionButton = (text: string, container?: HTMLElement): Promise<HTMLElement> =>
  findQuick({ tagName: "button", child: { classes: ".ActionButton-minimalAreaDisplay", text: text } }, container);

export const clickActionButton = async (text: string, container?: HTMLElement): Promise<void> => {
  const button = await findActionButton(text, container);
  await userEvent.click(button);
};

export const clickLayersSelectButton = async (rowId: number | string, within?: HTMLElement): Promise<void> => {
  const cell = await findCell(rowId, "selected", within);
  const button = await findQuick({ tagName: "button" }, cell);
  await userEvent.click(button);
};

export const clickLayersLabelCheckbox = async (rowId: number | string, within?: HTMLElement): Promise<void> => {
  const cell = await findCell(rowId, "label", within);
  await userEvent.click(cell);
};

export const getLayersLabelCheckbox = async (rowId: number | string, within?: HTMLElement): Promise<HTMLElement> => {
  const cell = await findCell(rowId, "label", within);
  return findQuick({ tagName: "input" }, cell);
};

export const waitForGridReady = async (props?: { grid?: HTMLElement; timeout?: number }) =>
  waitFor(() => expect(getAllQuick({ classes: ".Grid-ready" }, props?.grid)).toBeInTheDocument(), {
    timeout: props?.timeout ?? 5000,
  });

export const waitForGridRows = async (props?: { grid?: HTMLElement; timeout?: number }) =>
  waitFor(async () => expect(getAllQuick({ classes: ".ag-row" }, props?.grid).length > 0).toBe(true), {
    timeout: props?.timeout ?? 5000,
  });
