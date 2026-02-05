'use client';

import { Calendar, Search } from 'lucide-react';

interface HeroSectionProps {
  startDate: string;
  endDate: string;
  searchQuery: string;
  trendingTags: string[];
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onSearchQueryChange: (query: string) => void;
  onSearch: (e: React.FormEvent) => void;
}

export default function HeroSection({
  startDate,
  endDate,
  searchQuery,
  trendingTags,
  onStartDateChange,
  onEndDateChange,
  onSearchQueryChange,
  onSearch,
}: HeroSectionProps) {
  return (
    <section className="container mx-auto px-4 md:px-6 py-12 md:py-16 lg:py-20">
      <div className="text-center max-w-4xl mx-auto mb-8 md:mb-12 animate-fade-in">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          당신의 무대를 완성할
          <br />
          완벽한 연출 자산을 찾아보세요
        </h2>
        <p className="text-base md:text-lg lg:text-xl text-slate-600 mb-6 md:mb-8 px-4">
          날짜를 선택하고, 키워드로 검색하여 공연에 필요한 모든 것을 한 곳에서
        </p>
      </div>

      {/* Search Box */}
      <form onSubmit={onSearch} className="max-w-5xl mx-auto px-4">
        <div className="card p-4 md:p-8 shadow-2xl shadow-violet-500/10">
          <div className="flex flex-col md:flex-row gap-3 md:gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                대여 시작일
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                className="input w-full"
                required
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                대여 종료일
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                className="input w-full"
                required
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Search className="w-4 h-4 inline mr-1" />
                검색어
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                placeholder="예: 프랑스 혁명"
                className="input w-full"
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary w-full text-base md:text-lg py-3 md:py-4">
            <Search className="w-5 h-5" />
            검색하기
          </button>
        </div>
      </form>

      {/* Trending Tags */}
      <div className="max-w-5xl mx-auto mt-6 md:mt-8 px-4">
        <p className="text-sm text-slate-500 mb-3">🔥 인기 검색 태그</p>
        <div className="flex flex-wrap gap-2">
          {trendingTags.map((tag) => (
            <button key={tag} className="tag text-xs md:text-sm">
              #{tag}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
