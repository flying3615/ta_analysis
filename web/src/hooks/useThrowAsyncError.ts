import { useState } from "react";

/**
 * This hook means that you can throw an error in an async context (such as an event listener)
 * and it will be caught by the global error boundary.
 */
export const useThrowAsyncError = (): ((error: Error) => void) => {
  const [, setState] = useState();

  return (error: Error): void => {
    setState(() => {
      throw error;
    });
  };
};
