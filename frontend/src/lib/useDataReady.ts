import { useMemo } from "react";

/**
 * Aggregates multiple boolean readiness flags and returns true only when all are true.
 * Use to gate page rendering behind data fetch completion alongside auth loading states.
 */
export const useDataReady = (flags: boolean[]): boolean => {
  return useMemo(() => flags.every(Boolean), [flags]);
};
