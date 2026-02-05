import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tagApi } from '@/lib/api';

export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: () => tagApi.getAll(),
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; type?: string }) => tagApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });
}
