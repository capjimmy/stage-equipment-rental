'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, User, ShoppingCart, Menu, X } from 'lucide-react';
import Link from 'next/link';
import NotificationBell from '@/components/NotificationBell';
import { useCategories } from '@/hooks/useCategories';
import { useActiveFeaturedSets } from '@/hooks/useFeaturedSets';
import { User as UserType } from '@/types';
import HeroSection from '@/components/home/HeroSection';
import CategoriesSection from '@/components/home/CategoriesSection';
import FeaturedSetsGrid from '@/components/home/FeaturedSetsGrid';

export default function Home() {
  const router = useRouter();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<UserType | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: featuredSets = [] } = useActiveFeaturedSets();
  const { data: categories = [] } = useCategories();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUser(JSON.parse(userData));
      } catch {
        // Invalid user data, ignore
      }
    }
  }, []);

  const trendingTags = [
    '프랑스혁명', '빅토리아시대', '한복', '1920년대', '중세유럽',
    '현대무용', '오페라', '뮤지컬', '전통극', '실험극'
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      alert('대여 기간을 먼저 선택해주세요!');
      return;
    }
    router.push(`/search?start=${startDate}&end=${endDate}&q=${searchQuery}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50">
      {/* Header */}
      <header className="border-b border-violet-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-violet-600" />
              <h1 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">
                스테이지박스
              </h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/search" className="text-slate-700 hover:text-violet-600 transition-colors">
                검색
              </Link>
              <Link href="/cart" className="text-slate-700 hover:text-violet-600 transition-colors flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                장바구니
              </Link>
              {user && <NotificationBell />}
              {user ? (
                <Link href="/mypage" className="btn btn-primary flex items-center gap-2">
                  <User className="w-5 h-5" />
                  {user.name}
                </Link>
              ) : (
                <>
                  <Link href="/auth/login" className="btn btn-outline">로그인</Link>
                  <Link href="/auth/register" className="btn btn-primary">회원가입</Link>
                </>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-700 hover:text-violet-600"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <nav className="md:hidden mt-4 pb-4 border-t border-violet-100 pt-4">
              <div className="flex flex-col gap-4">
                <Link href="/search" className="text-slate-700 hover:text-violet-600 transition-colors">
                  검색
                </Link>
                <Link href="/cart" className="text-slate-700 hover:text-violet-600 transition-colors flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  장바구니
                </Link>
                {user && <NotificationBell />}
                {user ? (
                  <Link href="/mypage" className="btn btn-primary flex items-center gap-2 justify-center">
                    <User className="w-5 h-5" />
                    {user.name}
                  </Link>
                ) : (
                  <>
                    <Link href="/auth/login" className="btn btn-outline text-center">로그인</Link>
                    <Link href="/auth/register" className="btn btn-primary text-center">회원가입</Link>
                  </>
                )}
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <HeroSection
        startDate={startDate}
        endDate={endDate}
        searchQuery={searchQuery}
        trendingTags={trendingTags}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onSearchQueryChange={setSearchQuery}
        onSearch={handleSearch}
      />

      {/* Categories */}
      <CategoriesSection categories={categories} />

      {/* Featured Sets */}
      <FeaturedSetsGrid sets={featuredSets} />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 md:py-12 mt-12 md:mt-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-6 md:mb-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3 md:mb-4">
                <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-violet-600" />
                <span className="font-bold text-base md:text-lg">스테이지박스</span>
              </div>
              <p className="text-slate-600 text-xs md:text-sm">
                공연 의상 렌탈 플랫폼
              </p>
            </div>
            <div>
              <h5 className="font-bold mb-3 md:mb-4 text-sm md:text-base">서비스</h5>
              <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-slate-600">
                <li><Link href="/search">장비 검색</Link></li>
                <li><Link href="/cart">장바구니</Link></li>
                <li><Link href="/mypage">마이페이지</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold mb-3 md:mb-4 text-sm md:text-base">고객지원</h5>
              <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-slate-600">
                <li><span className="cursor-default">이메일: support@stagebox.com</span></li>
                <li><span className="cursor-default">전화: 02-1234-5678</span></li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold mb-3 md:mb-4 text-sm md:text-base">계정</h5>
              <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-slate-600">
                <li><Link href="/login">로그인</Link></li>
                <li><Link href="/register">회원가입</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-200 pt-6 md:pt-8 text-center text-xs md:text-sm text-slate-500">
            <p>© 2025 스테이지박스. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Floating Cart Button */}
      <Link href="/cart" className="fixed bottom-4 right-4 md:bottom-8 md:right-8 w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-violet-500 to-pink-500 text-white rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center justify-center group">
        <div className="relative">
          <ShoppingCart className="w-6 h-6 md:w-7 md:h-7" />
          <span className="absolute -top-2 -right-2 w-5 h-5 bg-pink-500 text-white text-xs rounded-full flex items-center justify-center">
            0
          </span>
        </div>
      </Link>
    </div>
  );
}
