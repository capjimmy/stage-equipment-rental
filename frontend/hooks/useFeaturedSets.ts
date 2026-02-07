import { useQuery } from '@tanstack/react-query';
import { featuredSetApi, productApi } from '@/lib/api';
import { Product } from '@/types';

interface FeaturedSet {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  productIds: string[];
  order: number;
  isActive: boolean;
}

export function useFeaturedSets() {
  return useQuery({
    queryKey: ['featuredSets'],
    queryFn: () => featuredSetApi.getAll(),
  });
}

export function useActiveFeaturedSets() {
  return useQuery({
    queryKey: ['featuredSets', 'active'],
    queryFn: async () => {
      const sets = await featuredSetApi.getActive();
      return sets;
    },
  });
}

// Get products from active featured sets
export function useFeaturedProducts() {
  return useQuery({
    queryKey: ['featuredProducts'],
    queryFn: async () => {
      // Get active featured sets
      const sets: FeaturedSet[] = await featuredSetApi.getActive();

      if (!sets || sets.length === 0) {
        // No featured sets, return empty array (will show fallback)
        return [];
      }

      // Collect all unique product IDs from featured sets
      const productIds = new Set<string>();
      sets.forEach(set => {
        if (set.productIds) {
          set.productIds.forEach(id => productIds.add(id));
        }
      });

      if (productIds.size === 0) {
        return [];
      }

      // Fetch all products and filter to only featured ones
      const allProducts = await productApi.getAll();
      const featuredProducts = allProducts.filter((p: Product) => productIds.has(p.id));

      return featuredProducts;
    },
  });
}
