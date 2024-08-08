/**
 * For pluralisation, returns "s" if array is bigger than 1
 */
export const s = (arr: unknown[]) => (arr.length > 1 ? "s" : "");
