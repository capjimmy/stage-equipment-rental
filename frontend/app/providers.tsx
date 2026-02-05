'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes - 캐시 유지 시간 증가
            gcTime: 10 * 60 * 1000, // 10 minutes - 가비지 컬렉션 시간
            refetchOnWindowFocus: false,
            refetchOnMount: false, // 마운트 시 재요청 방지
            retry: 1, // 재시도 횟수 감소
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
