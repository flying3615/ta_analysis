export const performanceMeasure =
  (interactionName: string, surveyTransactionId: number, otherAttributes: Record<string, string> = {}) =>
  async <T>(callback: () => Promise<T>): Promise<T> => {
    let interaction: newrelic.BrowserInteraction | undefined;

    const interactionAttributes = {
      transactionId: surveyTransactionId.toString(),
      interactionName,
      ...otherAttributes,
    };
    if (window.newrelic && window.newrelic.interaction) {
      interaction = window.newrelic.interaction().setName(interactionName).save();
      for (const [key, value] of Object.entries(interactionAttributes)) {
        interaction.setAttribute(key, value);
      }
    }

    // start timers
    const tracer = interaction?.createTracer(`${interactionName}-tracer`);
    const start = createMark("start");

    // run the callback
    const result = await callback();

    // stop timers and send data to New Relic
    const end = createMark("end");
    try {
      interaction?.end();
      tracer?.();
    } catch (e) {
      console.error(`Couldn't log interaction to New Relic.`, e);
    }
    const measure = createMeasure(interactionName, start, end, interactionAttributes);
    measure && console.debug(measure);
    return result;
  };

// performance.mark should be part of the browser runtime, but wrap it, so it doesn't break if it is not
const createMark = (name: string): PerformanceMark | undefined =>
  performance && performance.mark && performance.mark(name);

// performance.measure should be part of the browser runtime, but wrap it, so it doesn't break if it is not
const createMeasure = (
  name: string,
  start: PerformanceMark | undefined,
  end: PerformanceMark | undefined,
  detail: Record<string, string>,
): PerformanceMeasure | undefined =>
  performance &&
  performance.measure &&
  start &&
  end &&
  performance.measure(name, {
    detail: detail,
    start: start.startTime,
    end: end.startTime,
  });
