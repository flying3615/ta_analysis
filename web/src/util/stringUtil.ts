import { padEnd, padStart } from "lodash-es";

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

/**
 * Converts a radian or degree in string to a degree within -180 to 180
 * @return
 *  a degree from -180 to 180
 * @param input radian in string
 */
export const convertToDegrees = (input: string) => {
  let value = parseFloat(input);
  if (input.includes("rad")) {
    // Convert radians to degrees
    value = value * (180 / Math.PI);
    value = ((value + 180) % 360) - 180;
  }
  return value;
};

/**
 * convert degrees to DMS format
 * @param degrees
 */
export const convertDegreesToDms = (degrees: number): string => {
  let deg = Math.floor(degrees);
  let min = Math.floor((degrees - deg) * 60);
  let sec = Math.round((degrees - deg - min / 60) * 3600);

  if (sec === 60) {
    sec = 0;
    min += 1;
  }

  if (min === 60) {
    min = 0;
    deg += 1;
  }

  return `${deg}.${padStart(min.toString(), 2, "0")}${padStart(sec.toString(), 2, "0")}`;
};

/**
 * format DMS to human-readable format
 * @param input
 */
export const formatDms = (input: string): string => {
  const dms = paddingMMSS(input);

  const deg = dms.split(".")[0]!;
  const mmss = dms.split(".")[1]!;

  const min = mmss.substring(0, 2);
  const sec = mmss.substring(2, 4);

  return `${deg}° ${min}' ${sec}"`;
};

/**
 * Convert DMS to degrees in 4 dp format
 * @param dmsValue
 */
export const convertDmsToDegrees = (dmsValue: number): number => {
  const dms = paddingMMSS(dmsValue.toString());
  const deg = parseInt(dms.split(".")[0]!);
  const mmss = dms.split(".")[1]!;

  const min = parseInt(mmss.substring(0, 2));
  const sec = parseInt(mmss.substring(2, 4));

  return Number((deg + min / 60 + sec / 3600).toFixed(4));
};

/**
 * Pads a number with leading zeros to ensure it is at least 4 characters long
 * @param value
 */
export const paddingMMSS = (value: string): string => {
  const dms = value.split(".");

  const deg = dms[0] ?? "0";
  const mmss = padEnd(dms[1], 4, "0");

  return `${deg}.${mmss}`;
};
