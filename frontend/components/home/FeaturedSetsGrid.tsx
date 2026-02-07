'use client';

import Link from 'next/link';
import { Star, MessageCircle } from 'lucide-react';

interface FeaturedSet {
  id: string;
  title: string;
  description: string;
  detailedDescription?: string;
  imageUrl: string;
  productIds: string[];
  order: number;
  isActive: boolean;
}

interface FeaturedSetsGridProps {
  sets: FeaturedSet[];
}

const demoSets = [
  {
    id: 'demo-1',
    title: '프랑스 혁명 시대 의상 세트',
    description: '18세기 프랑스 혁명 시대의 화려한 귀족 의상 컬렉션',
    imageUrl: '/images/placeholder-pink.svg',
    productCount: 8,
  },
  {
    id: 'demo-2',
    title: '빅토리아 시대 귀족 의상',
    description: '19세기 영국 빅토리아 시대의 우아한 드레스와 정장',
    imageUrl: '/images/placeholder-pink.svg',
    productCount: 5,
  },
  {
    id: 'demo-3',
    title: '조선시대 궁중 한복 세트',
    description: '조선시대 왕실의 화려한 궁중 한복 컬렉션',
    imageUrl: '/images/placeholder-pink.svg',
    productCount: 12,
  },
];

export default function FeaturedSetsGrid({ sets }: FeaturedSetsGridProps) {
  const displaySets = sets.length > 0 ? sets : [];

  return (
    <section className="container mx-auto px-4 md:px-6 py-12 md:py-16 bg-gradient-to-b from-transparent to-violet-50/50">
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <h3 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Star className="w-6 h-6 md:w-8 md:h-8 text-violet-600" />
          추천 연출 세트
        </h3>
        <Link href="/featured" className="text-sm md:text-base text-violet-600 hover:text-violet-700 font-medium">
          전체 보기 →
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
        {displaySets.length > 0 ? (
          displaySets.slice(0, 6).map((set) => (
            <Link key={set.id} href={`/featured/${set.id}`} className="card overflow-hidden group cursor-pointer">
              <div className="relative h-48 md:h-56 bg-gradient-to-br from-violet-200 to-pink-200 overflow-hidden">
                {set.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={set.imageUrl}
                    alt={set.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.currentTarget.src = '/images/placeholder-pink.svg';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Star className="w-16 h-16 text-violet-400" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute top-3 right-3 md:top-4 md:right-4 bg-violet-600 text-white px-2 py-1 md:px-3 md:py-1 rounded-full text-xs md:text-sm font-medium">
                  {set.productIds?.length || 0}개 상품
                </div>
              </div>
              <div className="p-4 md:p-6">
                <h4 className="text-lg md:text-xl font-bold mb-2 group-hover:text-violet-600 transition-colors">
                  {set.title}
                </h4>
                <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                  {set.description || '다양한 의상으로 구성된 연출 세트입니다.'}
                </p>
                <button className="btn btn-primary w-full py-2 text-sm flex items-center justify-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  문의하기
                </button>
              </div>
            </Link>
          ))
        ) : (
          demoSets.map((set) => (
            <div key={set.id} className="card overflow-hidden group cursor-pointer opacity-60">
              <div className="relative h-48 md:h-56 bg-gradient-to-br from-violet-200 to-pink-200 overflow-hidden">
                <div className="w-full h-full flex items-center justify-center">
                  <Star className="w-16 h-16 text-violet-400" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute top-3 right-3 md:top-4 md:right-4 bg-slate-500 text-white px-2 py-1 md:px-3 md:py-1 rounded-full text-xs md:text-sm font-medium">
                  {set.productCount}개 상품
                </div>
              </div>
              <div className="p-4 md:p-6">
                <h4 className="text-lg md:text-xl font-bold mb-2">
                  {set.title}
                </h4>
                <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                  {set.description}
                </p>
                <div className="text-center text-sm text-slate-500 py-2">
                  문의하기
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
