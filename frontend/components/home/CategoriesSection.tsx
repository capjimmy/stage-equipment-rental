'use client';

import Link from 'next/link';
import { Shirt, Box, Theater, Mic2, Sparkles } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  productCount?: number;
}

interface CategoriesSectionProps {
  categories: Category[];
}

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  '의상': Shirt,
  '소품': Box,
  '무대장치': Theater,
  '장비': Mic2,
  '조명': Sparkles,
  '음향': Mic2,
};

const categoryColors = ['violet', 'pink', 'blue', 'amber', 'purple', 'rose'];

export default function CategoriesSection({ categories }: CategoriesSectionProps) {
  return (
    <section className="container mx-auto px-4 md:px-6 py-12 md:py-16">
      <h3 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8 text-center">카테고리별 탐색</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {categories.map((cat, index) => {
          const Icon = categoryIcons[cat.name] || Box;
          const color = categoryColors[index % categoryColors.length];
          const colorMap: Record<string, string> = {
            violet: 'from-violet-500 to-purple-600',
            pink: 'from-pink-500 to-rose-600',
            blue: 'from-blue-500 to-cyan-600',
            amber: 'from-amber-500 to-orange-600',
            purple: 'from-purple-500 to-violet-600',
            rose: 'from-rose-500 to-pink-600',
          };
          return (
            <Link
              key={cat.id}
              href={`/category/${cat.name}`}
              className="card p-4 md:p-8 text-center hover:scale-105 transition-transform cursor-pointer group"
            >
              <div className={`w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 rounded-2xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <Icon className="w-6 h-6 md:w-8 md:h-8 text-white" />
              </div>
              <h4 className="text-base md:text-xl font-bold mb-1 md:mb-2">{cat.name}</h4>
              <p className="text-slate-500 text-xs md:text-sm">{cat.productCount || 0}개의 상품</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
