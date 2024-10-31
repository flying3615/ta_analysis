export const performanceMeasure =
  (interactionName: string, surveyTransactionId: number, otherAttributes: Record<string, string> = {}) =>
  async <T>(callback: () => Promise<T>): Promise<T> => {
    if (!performance || !performance.mark || !performance.measure) {
      return await callback();
    }
    const interactionAttributes = {
      transactionId: surveyTransactionId.toString(),
      interactionName,
      ...otherAttributes,
    };

    const start = performance.mark("start", { detail: interactionAttributes });
    const result = await callback();
    const end = performance.mark("end", { detail: interactionAttributes });
    const measure = performance.measure(interactionName, {
      detail: interactionAttributes,
      start: start.startTime,
      end: end.startTime,
    });
    console.debug(measure);
    return result;
  };
