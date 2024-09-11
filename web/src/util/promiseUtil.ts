export interface NamedPromise<T> {
  promise: Promise<T>;
  name: string;
}

export const promiseWithTimeout = async <T>(
  namedPromise: NamedPromise<T>,
  timeout: number,
  errorMsg: string,
): Promise<T> => {
  let timeoutId: NodeJS.Timeout | undefined = undefined;
  try {
    const timeoutPromise = new Promise<T>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`${namedPromise.name} ${errorMsg}`));
      }, timeout);
    });

    return await Promise.race([
      namedPromise.promise.then((r) => {
        return r;
      }),
      timeoutPromise,
    ]);
  } finally {
    clearTimeout(timeoutId);
  }
};
