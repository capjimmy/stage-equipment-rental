'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Package } from 'lucide-react';
import Link from 'next/link';
import { productApi } from '@/lib/api';

interface Product {
  id: string;
  title: string;
  baseDailyPrice: string;
  availableCount: number;
  tags?: Array<{ id: string; name: string }>;
}

export default function FeaturedPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await productApi.getAll();
        setProducts(data);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
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
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-700 hover:text-violet-600 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span>뒤로가기</span>
            </button>
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">
              Stage Rental
            </Link>
            <div className="w-24"></div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">전체 상품</h1>
          <p className="text-slate-600">모든 대여 가능한 무대 장비를 확인하세요</p>
        </div>

        {products.length === 0 ? (
          <div className="card p-12 text-center">
            <Package className="w-24 h-24 text-slate-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">상품이 없습니다</h2>
            <p className="text-slate-600 mb-6">현재 등록된 상품이 없습니다.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <Link key={product.id} href={`/product/${product.id}`} className="card overflow-hidden group cursor-pointer">
                <div className="relative h-48 bg-gradient-to-br from-violet-200 to-pink-200 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute top-3 right-3 bg-white px-2 py-1 rounded-full text-xs font-medium">
                    {product.availableCount}개 가능
                  </div>
                </div>
                <div className="p-4">
                  <h4 className="text-lg font-bold mb-2 group-hover:text-violet-600 transition-colors line-clamp-2">
                    {product.title}
                  </h4>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {product.tags?.slice(0, 2).map((tag) => (
                      <span key={tag.id} className="tag text-xs">
                        #{tag.name}
                      </span>
                    ))}
                  </div>
                  <div className="text-xl font-bold text-violet-600">
                    ₩{parseFloat(product.baseDailyPrice).toLocaleString()}
                    <span className="text-sm text-slate-500 font-normal">/일</span>
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
