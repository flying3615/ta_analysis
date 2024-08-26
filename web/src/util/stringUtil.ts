/**
 * This function wraps a given text to a specified width and height in pixels.
 * It uses an OffscreenCanvas to measure the width of the text and inserts newline characters to wrap the text.
 *
 * @param {string} text - The text to be wrapped.
 * @param {number} maxWidth - The maximum width in pixels that a line of text can occupy.
 * @param {number} maxHeight - The maximum height in pixels that a line of text can occupy.
 * @param {number} maxHeight - The maximum height in pixels that a line of text can occupy.
 * @param {number} lineHeightFactor - The line height factor.
 * @param {number} fontSize - The size of the font in pixels.
 * @param {string} fontFamily - The font family of the text.
 *
 * @returns {string} The wrapped text.
 */
export const wrapText = (
  text: string,
  maxWidth: number,
  maxHeight: number,
  lineHeightFactor: number,
  fontSize: number,
  fontFamily: string,
): string => {
  const offscreenCanvas = new OffscreenCanvas(0, 0);
  const context = offscreenCanvas.getContext("2d")!;
  context.font = `${fontSize}px ${fontFamily}`;

  const words = text.split(" ");
  let line = "";
  let lineCount = 1;
  const lines = [];

  // Calculate the height of each line
  const lineHeight = fontSize * lineHeightFactor;
  const maxLines = Math.floor(maxHeight / lineHeight);

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const testLine = line + word + " ";
    const testLineWidth = context.measureText(testLine).width;

    if (testLineWidth > maxWidth && i > 0) {
      if (lineCount === maxLines) {
        // drop the last word and put ellipsis
        const lastWhitespaceIndex = line.lastIndexOf(" ");
        lines.push(line.substring(0, line.lastIndexOf(" ", lastWhitespaceIndex - 1)) + "...");
        break;
      } else {
        // push current and start a new line
        lines.push(line);
        line = word + " ";
        if (i === words.length - 1) {
          // push new line if the last word already reached limit
          lines.push(line.trim());
        }
        lineCount++;
      }
    } else {
      line = testLine;
      if (i === words.length - 1) {
        // push last line if the last word not reached limit yet
        lines.push(line.trim());
      }
    }
  }
  return lines.join("\n");
};

/**
 * For pluralisation, returns "s" if array is bigger than 1
 */
export const s = (arr: unknown[]) => (arr.length > 1 ? "s" : "");
