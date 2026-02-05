'use client';

import Link from 'next/link';

interface Product {
  id: string;
  title: string;
  baseDailyPrice: string;
  images?: string[];
  tags?: { id: string; name: string }[];
  availableCount: number;
}

interface ProductGridProps {
  products: Product[];
}

const featuredSets = [
  {
    title: '프랑스 혁명 시대 의상 세트',
    image: '/images/product-1.svg',
    tags: ['프랑스', '혁명', '18세기'],
    price: 45000,
    available: 8,
  },
  {
    title: '빅토리아 시대 귀족 의상',
    image: '/images/product-2.svg',
    tags: ['영국', '빅토리아', '19세기'],
    price: 52000,
    available: 5,
  },
  {
    title: '조선시대 궁중 한복 세트',
    image: '/images/product-3.svg',
    tags: ['한국', '조선', '궁중'],
    price: 38000,
    available: 12,
  },
];

export default function ProductGrid({ products }: ProductGridProps) {
  return (
    <section className="container mx-auto px-4 md:px-6 py-12 md:py-16 bg-gradient-to-b from-transparent to-violet-50/50">
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <h3 className="text-2xl md:text-3xl font-bold">추천 연출 세트</h3>
        <Link href="/featured" className="text-sm md:text-base text-violet-600 hover:text-violet-700 font-medium">
          전체 보기 →
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
        {products.length > 0 ? (
          products.map((product) => (
            <Link key={product.id} href={`/product/${product.id}`} className="card overflow-hidden group cursor-pointer">
              <div className="relative h-48 md:h-56 bg-gradient-to-br from-violet-200 to-pink-200 overflow-hidden">
                {product.images && product.images.length > 0 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.images[0]}
                    alt={product.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/images/placeholder-pink.svg';
                    }}
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute top-3 right-3 md:top-4 md:right-4 bg-white px-2 py-1 md:px-3 md:py-1 rounded-full text-xs md:text-sm font-medium">
                  {product.availableCount}개 가능
                </div>
              </div>
              <div className="p-4 md:p-6">
                <h4 className="text-lg md:text-xl font-bold mb-2 md:mb-3 group-hover:text-violet-600 transition-colors">
                  {product.title}
                </h4>
                <div className="flex flex-wrap gap-1.5 md:gap-2 mb-3 md:mb-4">
                  {product.tags?.slice(0, 3).map((tag: { id: string; name: string }) => (
                    <span key={tag.id} className="tag text-xs">
                      #{tag.name}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg md:text-2xl font-bold text-violet-600">
                    ₩{parseFloat(product.baseDailyPrice).toLocaleString()}
                    <span className="text-xs md:text-sm text-slate-500 font-normal">/일</span>
                  </span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      alert('장바구니 기능은 상세 페이지에서 이용하세요!');
                    }}
                    className="btn btn-primary py-2 px-3 md:px-4 text-xs md:text-sm"
                  >
                    보기
                  </button>
                </div>
              </div>
            </Link>
          ))
        ) : (
          featuredSets.map((set, idx) => (
            <div key={idx} className="card overflow-hidden group cursor-pointer">
              <div className="relative h-48 md:h-56 bg-gradient-to-br from-violet-200 to-pink-200 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={set.image}
                  alt={set.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/images/placeholder-pink.svg';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute top-3 right-3 md:top-4 md:right-4 bg-white px-2 py-1 md:px-3 md:py-1 rounded-full text-xs md:text-sm font-medium">
                  {set.available}개 가능
                </div>
              </div>
              <div className="p-4 md:p-6">
                <h4 className="text-lg md:text-xl font-bold mb-2 md:mb-3 group-hover:text-violet-600 transition-colors">
                  {set.title}
                </h4>
                <div className="flex flex-wrap gap-1.5 md:gap-2 mb-3 md:mb-4">
                  {set.tags.map((tag) => (
                    <span key={tag} className="tag text-xs">
                      #{tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg md:text-2xl font-bold text-violet-600">
                    {set.price.toLocaleString()}원
                    <span className="text-xs md:text-sm text-slate-500 font-normal">/일</span>
                  </span>
                  <button className="btn btn-primary py-2 px-3 md:px-4 text-xs md:text-sm">
                    담기
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
