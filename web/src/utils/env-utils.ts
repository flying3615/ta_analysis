export async function initializeEnv(): Promise<void> {
  const { splitKey, oidcIssuer } = await fetch("/plan-generation/config/env.json").then((r) => r.json());

  // Add to window, so we can check in console the current build versions
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).buildDetail = __BUILDDETAIL__;
  } catch (_ex) {
    // ignore
  }

  window._env_ = {
    splitKey,
    oidcIssuer,
  };
}
