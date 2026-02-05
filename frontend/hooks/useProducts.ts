import { useQuery } from '@tanstack/react-query';
import { productApi } from '@/lib/api';

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: () => productApi.getAll(),
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: () => productApi.getById(id),
    enabled: !!id,
  });
}

export function useProductSearch(params: {
  startDate?: string;
  endDate?: string;
  q?: string;
  tags?: string;
  categoryId?: string;
}) {
  return useQuery({
    queryKey: ['products', 'search', params],
    queryFn: () => productApi.search(params),
    enabled: Object.keys(params).some(key => params[key as keyof typeof params]),
  });
}

export function useBlockedPeriods(productId: string) {
  return useQuery({
    queryKey: ['products', productId, 'blocked-periods'],
    queryFn: () => productApi.getBlockedPeriods(productId),
    enabled: !!productId,
  });
}
