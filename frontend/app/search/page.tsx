'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, Filter, X, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { productApi } from '@/lib/api';

interface SearchProduct {
  id: string | number;
  title: string;
  baseDailyPrice?: string;
  price?: number;
  availableCount?: number;
  available?: number;
  isAvailable?: boolean;
  images?: string[] | null;
  category?: { name: string } | string;
  assets?: Array<{ conditionGrade?: string }>;
  tags?: Array<{ id: string; name: string }> | string[];
  supplier?: { name: string } | string;
  condition?: string;
  unavailableReason?: string;
}

interface DisplayProduct {
  id: string | number;
  title: string;
  price: number;
  available: number;
  category: string;
  condition: string;
  tags: string[];
  supplier: string;
  images?: string[] | null;
  isAvailable?: boolean;
  unavailableReason?: string;
}

const ITEMS_PER_PAGE = 12;

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [startDate, setStartDate] = useState(searchParams.get('start') || '');
  const [endDate, setEndDate] = useState(searchParams.get('end') || '');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [showUnavailable, setShowUnavailable] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('');
  const [products, setProducts] = useState<SearchProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);

  // Fetch products from API
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setHasSearched(true);
    try {
      // 날짜가 있으면 날짜 포함, 없으면 날짜 없이 검색
      const searchParams: {
        startDate?: string;
        endDate?: string;
        q?: string;
        includeUnavailable?: boolean;
      } = {
        q: searchQuery || undefined,
        includeUnavailable: showUnavailable,
      };

      // 날짜가 둘 다 있을 때만 날짜 파라미터 추가
      if (startDate && endDate) {
        searchParams.startDate = startDate;
        searchParams.endDate = endDate;
      }

      const data = await productApi.search(searchParams);
      setProducts(data);
      setCurrentPage(1); // 검색 시 첫 페이지로 리셋
    } catch (error) {
      console.error('Failed to fetch products:', error);
      // 에러 시 전체 상품 목록 시도
      try {
        const allProducts = await productApi.getAll();
        setProducts(allProducts);
      } catch {
        setProducts([]);
      }
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, searchQuery, showUnavailable]);

  // 초기 로드: URL 파라미터가 있거나 처음 접근 시 전체 상품 로드
  useEffect(() => {
    const initFetch = async () => {
      setLoading(true);
      try {
        // URL에 검색 파라미터가 있으면 검색 실행
        if (searchParams.get('q') || (searchParams.get('start') && searchParams.get('end'))) {
          await fetchProducts();
        } else {
          // 없으면 전체 상품 로드
          const allProducts = await productApi.getAll();
          setProducts(allProducts);
          setHasSearched(true);
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };

    initFetch();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 검색 버튼 클릭 핸들러
  const handleSearch = () => {
    // URL 업데이트
    const params = new URLSearchParams();
    if (startDate) params.set('start', startDate);
    if (endDate) params.set('end', endDate);
    if (searchQuery) params.set('q', searchQuery);

    router.push(`/search?${params.toString()}`, { scroll: false });
    fetchProducts();
  };

  // Enter 키 검색
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Transform API products to match the expected format
  const displayProducts: DisplayProduct[] = products.map((product: SearchProduct): DisplayProduct => {
    const categoryName = typeof product.category === 'object' ? product.category?.name : product.category;
    const supplierName = typeof product.supplier === 'object' ? product.supplier?.name : product.supplier;

    // Determine available count:
    // - If availableCount is set, use it
    // - If availableCount is undefined, treat as available (use assets count or default to 1)
    const assetsCount = product.assets?.length || 0;
    const available = product.availableCount !== undefined
      ? product.availableCount
      : (product.available !== undefined ? product.available : (assetsCount > 0 ? assetsCount : 1));

    return {
      id: product.id,
      title: product.title,
      price: product.baseDailyPrice ? parseFloat(product.baseDailyPrice) : (product.price || 0),
      available,
      category: categoryName || '의상',
      condition: product.assets?.[0]?.conditionGrade || product.condition || 'A',
      tags: Array.isArray(product.tags) && product.tags.length > 0 && typeof product.tags[0] === 'object'
        ? (product.tags as Array<{ name: string }>).map((t) => t.name)
        : (product.tags as string[] || []),
      supplier: supplierName || '공급자',
      images: product.images,
      isAvailable: product.isAvailable,
      unavailableReason: product.unavailableReason,
    };
  });

  // 필터링
  const filteredProducts = displayProducts.filter(product => {
    if (selectedCategory && product.category !== selectedCategory) return false;
    if (selectedCondition && product.condition !== selectedCondition) return false;
    return true;
  });

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 페이지 번호 배열 생성
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50">
      {/* Header */}
      <header className="border-b border-violet-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-violet-600" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">
                Stage Rental
              </h1>
            </Link>
            <nav className="flex items-center gap-6">
              <Link href="/search" className="text-violet-600 font-medium">
                검색
              </Link>
              <button className="btn btn-outline">로그인</button>
            </nav>
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="border-b border-violet-100 bg-white/50 backdrop-blur-sm py-6">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-4 gap-4">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input"
                placeholder="시작일"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input"
                placeholder="종료일"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="검색어 입력... (예: 바람사, 나폴레옹)"
                className="input"
              />
              <button onClick={handleSearch} className="btn btn-primary">
                <Search className="w-5 h-5" />
                검색
              </button>
            </div>
            <p className="text-sm text-slate-500 mt-2">
              * 날짜 없이도 검색 가능합니다. 날짜를 입력하면 해당 기간의 대여 가능 여부를 확인할 수 있습니다.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  필터
                </h3>
              </div>

              {/* Show Unavailable Toggle */}
              <div className="mb-6 pb-6 border-b border-slate-200">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showUnavailable}
                    onChange={(e) => setShowUnavailable(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                  />
                  <span className="text-sm">대여 불가 상품도 표시</span>
                </label>
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <h4 className="font-semibold mb-3 text-sm text-slate-700">카테고리</h4>
                <div className="space-y-2">
                  {['의상', '소품', '악세서리', '신발', '대도구', '무대장치', '장비'].map((cat) => (
                    <label key={cat} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="category"
                        value={cat}
                        checked={selectedCategory === cat}
                        onChange={(e) => {
                          setSelectedCategory(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-4 h-4 text-violet-600 focus:ring-violet-500"
                      />
                      <span className="text-sm">{cat}</span>
                    </label>
                  ))}
                  <button
                    onClick={() => {
                      setSelectedCategory('');
                      setCurrentPage(1);
                    }}
                    className="text-sm text-violet-600 hover:text-violet-700"
                  >
                    전체
                  </button>
                </div>
              </div>

              {/* Condition Filter */}
              <div className="mb-6">
                <h4 className="font-semibold mb-3 text-sm text-slate-700">상태</h4>
                <div className="space-y-2">
                  {['A', 'B', 'C'].map((cond) => (
                    <label key={cond} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="condition"
                        value={cond}
                        checked={selectedCondition === cond}
                        onChange={(e) => {
                          setSelectedCondition(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-4 h-4 text-violet-600 focus:ring-violet-500"
                      />
                      <span className="text-sm">등급 {cond}</span>
                    </label>
                  ))}
                  <button
                    onClick={() => {
                      setSelectedCondition('');
                      setCurrentPage(1);
                    }}
                    className="text-sm text-violet-600 hover:text-violet-700"
                  >
                    전체
                  </button>
                </div>
              </div>

              {/* Active Filters */}
              {(selectedCategory || selectedCondition) && (
                <div className="pt-4 border-t border-slate-200">
                  <h4 className="font-semibold mb-3 text-sm text-slate-700">적용된 필터</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCategory && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-sm">
                        {selectedCategory}
                        <button onClick={() => setSelectedCategory('')}>
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {selectedCondition && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-sm">
                        등급 {selectedCondition}
                        <button onClick={() => setSelectedCondition('')}>
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* Products Grid */}
          <main className="lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-1">검색 결과</h2>
                <p className="text-slate-600">
                  {filteredProducts.length}개의 상품을 찾았습니다
                  {startDate && endDate && (
                    <span className="text-violet-600 font-medium ml-2">
                      ({startDate} ~ {endDate})
                    </span>
                  )}
                  {totalPages > 1 && (
                    <span className="text-slate-500 ml-2">
                      (페이지 {currentPage}/{totalPages})
                    </span>
                  )}
                </p>
              </div>
              <select className="px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500">
                <option>인기순</option>
                <option>가격 낮은순</option>
                <option>가격 높은순</option>
                <option>신규순</option>
              </select>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mb-4"></div>
                  <p className="text-slate-600">상품을 불러오는 중...</p>
                </div>
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {paginatedProducts.map((product) => (
                  <Link
                    key={product.id}
                    href={`/product/${product.id}${startDate && endDate ? `?start=${startDate}&end=${endDate}` : ''}`}
                    className={`card overflow-hidden group cursor-pointer relative ${product.available === 0 ? 'opacity-75' : ''}`}
                  >
                    {product.available === 0 && (
                      <div className="absolute top-4 left-4 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-medium z-10">
                        선예약 존재
                      </div>
                    )}
                    <div className="relative h-48 bg-gradient-to-br from-violet-200 to-pink-200 overflow-hidden">
                      {product.images && product.images.length > 0 ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.images[0]}
                          alt={product.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : null}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      {product.available > 0 && (
                        <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full text-sm font-medium">
                          {product.available}개 가능
                        </div>
                      )}
                      {product.available === 0 && (
                        <div className="absolute top-4 right-4 bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium">
                          0개 가능
                        </div>
                      )}
                      <div className="absolute bottom-4 left-4">
                        <span className="inline-block px-2 py-1 bg-white/90 rounded text-xs font-medium">
                          등급 {product.condition}
                        </span>
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="text-lg font-bold mb-2 group-hover:text-violet-600 transition-colors line-clamp-2">
                        {product.title}
                      </h3>
                      <p className="text-sm text-slate-500 mb-3">{product.supplier}</p>
                      <div className="flex flex-wrap gap-1 mb-4">
                        {product.tags.slice(0, 3).map((tag: string) => (
                          <span key={String(tag)} className="tag text-xs">
                            #{String(tag)}
                          </span>
                        ))}
                      </div>
                      {product.available === 0 ? (
                        <div className="text-sm text-orange-600 mb-2">
                          {product.unavailableReason || '해당 기간에 선예약이 있습니다'}
                        </div>
                      ) : null}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <span className="text-xl font-bold text-violet-600">
                          {product.price.toLocaleString()}원
                          <span className="text-xs text-slate-500 font-normal">/일</span>
                        </span>
                        <button
                          className={`btn py-2 px-4 text-sm ${
                            product.available > 0 ? 'btn-primary' : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                          }`}
                          disabled={product.available === 0}
                        >
                          {product.available > 0 ? '담기' : '불가'}
                        </button>
                      </div>
                    </div>
                  </Link>
                ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    {getPageNumbers().map((page, index) => (
                      typeof page === 'number' ? (
                        <button
                          key={index}
                          onClick={() => handlePageChange(page)}
                          className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                            currentPage === page
                              ? 'bg-violet-600 text-white'
                              : 'border border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          {page}
                        </button>
                      ) : (
                        <span key={index} className="px-2 text-slate-400">
                          {page}
                        </span>
                      )
                    ))}

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </>
            )}

            {!loading && filteredProducts.length === 0 && hasSearched && (
              <div className="text-center py-20">
                <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">검색 결과가 없습니다</h3>
                <p className="text-slate-600 mb-6">
                  다른 검색어나 필터를 시도해보세요
                </p>
                <Link href="/" className="btn btn-primary">
                  홈으로 돌아가기
                </Link>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Floating Cart Button */}
      <Link
        href="/cart"
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-br from-violet-500 to-pink-500 text-white rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center justify-center"
      >
        <div className="relative">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <span className="absolute -top-2 -right-2 w-5 h-5 bg-pink-500 text-white text-xs rounded-full flex items-center justify-center">
            0
          </span>
        </div>
      </Link>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}
