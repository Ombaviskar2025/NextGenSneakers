import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Prevents aggressive query refetching when window gains focus
      retry: 1,                    // Retry once on failure
      staleTime: 5 * 60 * 1000,    // 5 minutes caching duration
    },
  },
});
