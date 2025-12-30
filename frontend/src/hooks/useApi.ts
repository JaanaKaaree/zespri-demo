import { useState, useCallback } from 'react';

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: any) => void;
}

export function useApi<T>() {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const execute = useCallback(
    async (
      apiCall: () => Promise<T>,
      options?: UseApiOptions<T>,
    ): Promise<T | null> => {
      setLoading(true);
      setError(null);

      try {
        const result = await apiCall();
        setData(result);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        setError(err);
        options?.onError?.(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { data, error, loading, execute };
}
