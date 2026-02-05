'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Package } from 'lucide-react';
import Link from 'next/link';
import { useCategoryByName } from '@/hooks/useCategories';
import { useProductSearch } from '@/hooks/useProducts';
import { Product, Tag } from '@/types';

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const categoryName = decodeURIComponent(params.name as string);

  const { data: category, isLoading: categoryLoading } = useCategoryByName(categoryName);
  const { data: products = [], isLoading: productsLoading } = useProductSearch(
    category?.id ? { categoryId: category.id } : {}
  );

  const isLoading = categoryLoading || (category?.id && productsLoading);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mb-4"></div>
          <p className="text-slate-600">상품을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50">
      {/* Header */}
      <header className="border-b border-violet-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => router.back()} className="flex items-center gap-1 md:gap-2 text-slate-700 hover:text-violet-600 transition-colors">
              <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
              <span className="text-sm md:text-base">뒤로가기</span>
            </button>
            <Link href="/" className="text-lg md:text-xl font-bold bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">
              Stage Rental
            </Link>
            <div className="w-16 md:w-24"></div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 md:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-1 md:mb-2">{categoryName}</h1>
          <p className="text-sm md:text-base text-slate-600">{categoryName} 카테고리의 대여 가능한 장비를 확인하세요</p>
        </div>

        {products.length === 0 ? (
          <div className="card p-8 md:p-12 text-center">
            <Package className="w-16 md:w-24 h-16 md:h-24 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl md:text-2xl font-bold mb-2">상품이 없습니다</h2>
            <p className="text-sm md:text-base text-slate-600 mb-6">이 카테고리에 등록된 상품이 없습니다.</p>
            <Link href="/" className="btn btn-primary inline-flex">
              메인으로 돌아가기
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((product: Product) => (
              <Link key={product.id} href={`/product/${product.id}`} className="card overflow-hidden group cursor-pointer">
                <div className="relative h-40 md:h-48 bg-gradient-to-br from-violet-200 to-pink-200 overflow-hidden">
                  {product.images && product.images.length > 0 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/images/placeholder-blue.svg';
                      }}
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute top-2 md:top-3 right-2 md:right-3 bg-white px-2 py-1 rounded-full text-xs font-medium">
                    {product.availableCount}개 가능
                  </div>
                </div>
                <div className="p-3 md:p-4">
                  <h4 className="text-sm md:text-lg font-bold mb-1 md:mb-2 group-hover:text-violet-600 transition-colors line-clamp-2">
                    {product.title}
                  </h4>
                  <div className="flex flex-wrap gap-1 mb-2 md:mb-3">
                    {product.tags?.slice(0, 2).map((tag: Tag) => (
                      <span key={tag.id} className="tag text-xs">
                        #{tag.name}
                      </span>
                    ))}
                  </div>
                  <div className="text-lg md:text-xl font-bold text-violet-600">
                    ₩{parseFloat(product.baseDailyPrice).toLocaleString()}
                    <span className="text-xs md:text-sm text-slate-500 font-normal">/일</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
