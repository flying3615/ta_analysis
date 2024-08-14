export const promiseWithTimeout = async <T>(promise: Promise<T>, timeout: number): Promise<T> => {
  let timeoutId: NodeJS.Timeout | undefined = undefined;
  try {
    const timeoutPromise = new Promise<T>((resolve, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error("Promise timed out"));
      }, timeout);
    });

    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
};
