'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Star, ShoppingCart, MessageCircle } from 'lucide-react';
import { featuredSetApi, productApi, inquiryApi } from '@/lib/api';
import { Product } from '@/types';

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

export default function FeaturedSetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [set, setSet] = useState<FeaturedSet | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({
    name: '',
    phone: '',
    email: '',
    message: '',
  });
  const [inquirySubmitting, setInquirySubmitting] = useState(false);
  const [inquirySubmitted, setInquirySubmitted] = useState(false);

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryForm.name || !inquiryForm.phone || !inquiryForm.message) {
      alert('이름, 연락처, 문의 내용을 입력해주세요.');
      return;
    }

    setInquirySubmitting(true);
    try {
      await inquiryApi.create({
        featuredSetId: set?.id,
        featuredSetTitle: set?.title,
        name: inquiryForm.name,
        phone: inquiryForm.phone,
        email: inquiryForm.email || undefined,
        message: inquiryForm.message,
      });
      setInquirySubmitted(true);
    } catch (error) {
      console.error('Failed to submit inquiry:', error);
      alert('문의 전송에 실패했습니다.');
    } finally {
      setInquirySubmitting(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Get all featured sets and find the one we need
        const sets = await featuredSetApi.getAll();
        const foundSet = sets.find((s: FeaturedSet) => s.id === params.id);

        if (!foundSet) {
          router.push('/featured');
          return;
        }

        setSet(foundSet);

        // Fetch products in this set
        if (foundSet.productIds && foundSet.productIds.length > 0) {
          const allProducts = await productApi.getAll();
          const filteredProducts = allProducts.filter((p: Product) =>
            foundSet.productIds.includes(p.id)
          );
          setProducts(filteredProducts);
        }
      } catch (error) {
        console.error('Failed to fetch featured set:', error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchData();
    }
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mb-4"></div>
          <p className="text-slate-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!set) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50">
      {/* Header */}
      <header className="border-b border-violet-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-slate-700 hover:text-violet-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>뒤로가기</span>
            </button>
            <Link
              href="/"
              className="text-xl font-bold bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent"
            >
              스테이지박스
            </Link>
            <Link href="/cart" className="p-2 text-slate-700 hover:text-violet-600">
              <ShoppingCart className="w-6 h-6" />
            </Link>
          </div>
        </div>
      </header>

      {/* Set Header */}
      <div className="relative">
        {set.imageUrl ? (
          <div className="h-64 md:h-80 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={set.imageUrl}
              alt={set.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = '/images/placeholder-pink.svg';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          </div>
        ) : (
          <div className="h-64 md:h-80 bg-gradient-to-br from-violet-400 to-pink-400 flex items-center justify-center">
            <Star className="w-24 h-24 text-white/50" />
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white">
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-5 h-5" />
                  <span className="text-sm font-medium">추천 연출 세트</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">{set.title}</h1>
                <p className="text-white/80 max-w-2xl">{set.description}</p>
              </div>
              <button
                onClick={() => setShowInquiryModal(true)}
                className="inline-flex items-center gap-2 bg-white text-violet-600 hover:bg-violet-50 px-8 py-4 rounded-xl font-bold text-lg shadow-xl flex-shrink-0 transition-all hover:scale-105"
              >
                <MessageCircle className="w-6 h-6" />
                문의하기
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Description */}
      {set.detailedDescription && (
        <div className="container mx-auto px-4 md:px-6 py-6">
          <div className="card p-6">
            <h2 className="text-2xl font-bold mb-4">세트 상세 설명</h2>
            <div className="prose prose-slate max-w-none">
              <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                {set.detailedDescription}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Products */}
      <div className="container mx-auto px-4 md:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">세트 구성 상품</h2>
          <span className="text-slate-600">{products.length}개 상품</span>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
                className="card overflow-hidden group cursor-pointer"
              >
                <div className="relative h-48 bg-gradient-to-br from-violet-200 to-pink-200 overflow-hidden">
                  {product.images && product.images.length > 0 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.currentTarget.src = '/images/placeholder-pink.svg';
                      }}
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                </div>
                <div className="p-4">
                  <h3 className="font-bold mb-2 group-hover:text-violet-600 transition-colors">
                    {product.title}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-violet-600">
                      ₩{Number(product.baseDailyPrice).toLocaleString()}
                      <span className="text-xs text-slate-500 font-normal">/일</span>
                    </span>
                    <button className="btn btn-primary btn-sm">보기</button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card p-12 text-center">
            <p className="text-slate-500">이 세트에 등록된 상품이 없습니다.</p>
          </div>
        )}
      </div>

      {/* Floating Inquiry Button */}
      <button
        onClick={() => setShowInquiryModal(true)}
        className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-40 w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-violet-500 to-pink-500 text-white rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center justify-center"
      >
        <MessageCircle className="w-7 h-7 md:w-8 md:h-8" />
      </button>

      {/* Inquiry Modal */}
      {showInquiryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">대여 문의하기</h3>
                <button
                  onClick={() => {
                    setShowInquiryModal(false);
                    setInquirySubmitted(false);
                    setInquiryForm({ name: '', phone: '', email: '', message: '' });
                  }}
                  className="text-slate-500 hover:text-slate-700"
                >
                  ✕
                </button>
              </div>

              {inquirySubmitted ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">✓</span>
                  </div>
                  <h4 className="text-lg font-bold mb-2">문의가 접수되었습니다!</h4>
                  <p className="text-slate-600 mb-4">빠른 시간 내에 연락드리겠습니다.</p>
                  <div className="bg-violet-50 p-4 rounded-lg text-left">
                    <p className="text-sm font-medium mb-2">빠른 상담을 원하시면:</p>
                    <p className="text-sm text-slate-600">전화: 02-1234-5678</p>
                    <p className="text-sm text-slate-600">카카오톡: @스테이지박스</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowInquiryModal(false);
                      setInquirySubmitted(false);
                    }}
                    className="btn btn-primary w-full mt-4"
                  >
                    확인
                  </button>
                </div>
              ) : (
                <form onSubmit={handleInquirySubmit} className="space-y-4">
                  <div className="bg-violet-50 p-3 rounded-lg mb-4">
                    <p className="text-sm text-slate-700">
                      <span className="font-medium">문의 세트:</span> {set?.title}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      이름 *
                    </label>
                    <input
                      type="text"
                      value={inquiryForm.name}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })}
                      className="input"
                      placeholder="홍길동"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      연락처 *
                    </label>
                    <input
                      type="tel"
                      value={inquiryForm.phone}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })}
                      className="input"
                      placeholder="010-1234-5678"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      이메일 (선택)
                    </label>
                    <input
                      type="email"
                      value={inquiryForm.email}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })}
                      className="input"
                      placeholder="email@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      문의 내용 *
                    </label>
                    <textarea
                      value={inquiryForm.message}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
                      className="input"
                      rows={4}
                      placeholder="대여 희망일, 수량, 기타 문의사항을 입력해주세요"
                      required
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowInquiryModal(false)}
                      className="btn btn-outline flex-1"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      disabled={inquirySubmitting}
                      className="btn btn-primary flex-1"
                    >
                      {inquirySubmitting ? '전송 중...' : '문의 보내기'}
                    </button>
                  </div>

                  <div className="text-center text-sm text-slate-500 pt-2">
                    <p>또는 직접 연락해주세요</p>
                    <p className="font-medium text-violet-600">02-1234-5678</p>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
