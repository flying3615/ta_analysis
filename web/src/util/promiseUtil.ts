export const promiseWithTimeout = async <T>(promise: Promise<T>, timeout: number, errorMsg: string): Promise<T> => {
  let timeoutId: NodeJS.Timeout | undefined = undefined;
  try {
    const timeoutPromise = new Promise<T>((resolve, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(errorMsg));
      }, timeout);
    });

    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
};
