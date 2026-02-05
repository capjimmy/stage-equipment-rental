import { useQuery } from '@tanstack/react-query';
import { categoryApi } from '@/lib/api';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.getAll(),
  });
}

export function useCategoryByName(name: string) {
  return useQuery({
    queryKey: ['categories', 'by-name', name],
    queryFn: () => categoryApi.getByName(name),
    enabled: !!name,
  });
}
