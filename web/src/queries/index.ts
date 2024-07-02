import { QueryClient } from "@tanstack/react-query";

const commonDefaultOptions = {
  // Don't retry in storybook to avoid chromatic screenshot timing issues
  retry: window.isStorybook ? 0 : 2,
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      ...commonDefaultOptions,
    },
    mutations: {
      ...commonDefaultOptions,
    },
  },
});
