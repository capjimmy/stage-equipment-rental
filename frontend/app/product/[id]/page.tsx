'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Calendar, ArrowLeft, ShoppingCart, Heart, CheckCircle, AlertCircle, Package, Truck, Shield } from 'lucide-react';
import Link from 'next/link';
import Loading from '@/components/Loading';
import { useToast } from '@/hooks/useToast';
import RentalCalendar from '@/components/RentalCalendar';
import { BlockedPeriod, Tag, Asset } from '@/types';
import { useProduct, useBlockedPeriods } from '@/hooks/useProducts';
import { useAddToCart } from '@/hooks/useCart';

function ProductDetailContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { success, error: showError, info, ToastContainer } = useToast();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showCalendar, setShowCalendar] = useState(true);

  const { data: product, isLoading } = useProduct(params.id as string);
  const { data: blockedPeriods = [] } = useBlockedPeriods(params.id as string);
  const addToCartMutation = useAddToCart();

  useEffect(() => {
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing URL params to state on mount
    if (start) setStartDate(start);
    if (end) setEndDate(end);
  }, [searchParams]);

  const handleAddToCart = async () => {
    if (!startDate || !endDate) {
      info('대여 기간을 선택해주세요!');
      return;
    }

    try {
      await addToCartMutation.mutateAsync({
        productId: params.id as string,
        quantity,
        startDate,
        endDate,
      });
      success('장바구니에 추가되었습니다!');
    } catch (error: unknown) {
      console.error('Failed to add to cart:', error);
      const err = error as { response?: { status?: number; data?: { message?: string } } };
      if (err.response?.status === 401) {
        showError('로그인이 필요합니다.');
        setTimeout(() => router.push('/login'), 1500);
      } else {
        showError(err.response?.data?.message || '장바구니 추가에 실패했습니다.');
      }
    }
  };


  if (isLoading) {
    return <Loading fullScreen message="상품 정보를 불러오는 중..." />;
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">상품을 찾을 수 없습니다</h2>
          <p className="text-slate-600 mb-6">요청하신 상품이 존재하지 않습니다.</p>
          <Link href="/" className="btn btn-primary">메인으로 돌아가기</Link>
        </div>
      </div>
    );
  }

  const totalDays = startDate && endDate ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1 : 0;
  const totalPrice = totalDays * parseFloat(product.baseDailyPrice) * quantity;

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50">
      <ToastContainer />
      {/* Header */}
      <header className="border-b border-violet-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => router.back()} className="flex items-center gap-1 sm:gap-2 text-slate-700 hover:text-violet-600 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">뒤로가기</span>
            </button>
            <Link href="/" className="text-lg sm:text-xl font-bold bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">
              Stage Rental
            </Link>
            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/cart" className="btn btn-outline px-3 py-2 sm:px-6 sm:py-3">
                <ShoppingCart className="w-5 h-5" />
                <span className="hidden sm:inline">장바구니</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
          {/* 이미지 갤러리 */}
          <div>
            <div className="card p-2 sm:p-4 mb-3 sm:mb-4">
              <div className="aspect-square bg-slate-100 rounded-lg mb-3 sm:mb-4 relative overflow-hidden">
                {product.images && product.images.length > 0 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.images[selectedImage] || product.images[0]}
                    alt={product.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/images/placeholder-violet.svg';
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Package className="w-24 h-24 text-slate-300" />
                  </div>
                )}
              </div>
            </div>

            {/* 썸네일 */}
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-4 gap-2">
                {product.images.map((image: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`aspect-square bg-slate-100 rounded-lg relative overflow-hidden border-2 transition-colors ${
                      selectedImage === i ? 'border-violet-500' : 'border-transparent hover:border-violet-300'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image}
                      alt={`${product.title} - ${i + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/images/placeholder-violet.svg';
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 상품 정보 */}
          <div>
            <div className="mb-4 sm:mb-6">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {product.tags?.slice(0, 3).map((tag: Tag) => (
                  <span key={tag.id} className="tag text-xs sm:text-sm">{tag.name}</span>
                ))}
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">{product.title}</h1>
              <p className="text-sm sm:text-base text-slate-600 mb-3 sm:mb-4">{product.description}</p>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="text-2xl sm:text-3xl font-bold text-violet-600">
                  ₩{parseFloat(product.baseDailyPrice).toLocaleString()}
                  <span className="text-base sm:text-lg text-slate-500 font-normal">/일</span>
                </div>
                {product.availableCount > 0 ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-4 sm:w-5 h-4 sm:h-5" />
                    <span className="text-sm sm:text-base font-medium">대여 가능 ({product.availableCount}개)</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="w-4 sm:w-5 h-4 sm:h-5" />
                    <span className="text-sm sm:text-base font-medium">대여 불가</span>
                  </div>
                )}
              </div>

              <div className="text-xs sm:text-sm text-slate-600 mb-4 sm:mb-6">
                공급업체: <span className="font-medium text-slate-900">{product.supplier?.name}</span>
              </div>
            </div>

            {/* 대여 기간 선택 */}
            <div className="card p-4 sm:p-6 mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 mb-4">
                <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                  <Calendar className="w-4 sm:w-5 h-4 sm:h-5 text-violet-600" />
                  대여 기간 선택
                </h3>
                <button
                  onClick={() => setShowCalendar(!showCalendar)}
                  className="text-xs sm:text-sm text-violet-600 hover:text-violet-700 font-medium whitespace-nowrap"
                >
                  {showCalendar ? '간편 입력' : '달력 보기'}
                </button>
              </div>

              {showCalendar ? (
                <RentalCalendar
                  blockedPeriods={blockedPeriods}
                  startDate={startDate}
                  endDate={endDate}
                  onStartDateChange={setStartDate}
                  onEndDateChange={setEndDate}
                />
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">시작일</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="input text-sm sm:text-base"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">종료일</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate || new Date().toISOString().split('T')[0]}
                        className="input text-sm sm:text-base"
                      />
                    </div>
                  </div>

                  {/* 대여 불가 기간 표시 */}
                  {blockedPeriods.length > 0 && (
                    <div className="mb-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 sm:w-5 h-4 sm:h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="text-sm sm:text-base font-bold text-red-900 mb-2">대여 불가 기간</h4>
                          <div className="space-y-1 text-xs sm:text-sm text-red-700">
                            {blockedPeriods.map((period: BlockedPeriod, index: number) => (
                              <div key={index}>
                                • {new Date(period.blockedStart).toLocaleDateString('ko-KR')} ~ {new Date(period.blockedEnd).toLocaleDateString('ko-KR')}
                                {period.availableCount !== undefined && ` (잔여: ${period.availableCount}개)`}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="mb-4">
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">수량</label>
                <div className="flex items-center gap-3 sm:gap-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-12 h-12 sm:w-10 sm:h-10 rounded-lg border-2 border-slate-300 hover:bg-slate-50 active:bg-slate-100 flex items-center justify-center text-lg sm:text-base font-medium transition-colors touch-manipulation"
                  >
                    -
                  </button>
                  <span className="text-xl sm:text-xl font-bold w-12 sm:w-12 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.availableCount || 1, quantity + 1))}
                    className="w-12 h-12 sm:w-10 sm:h-10 rounded-lg border-2 border-slate-300 hover:bg-slate-50 active:bg-slate-100 flex items-center justify-center text-lg sm:text-base font-medium transition-colors touch-manipulation"
                  >
                    +
                  </button>
                </div>
              </div>

              {totalDays > 0 && (
                <div className="bg-violet-50 rounded-lg p-3 sm:p-4">
                  <div className="flex justify-between items-center mb-2 text-sm sm:text-base">
                    <span className="text-slate-600">대여 일수</span>
                    <span className="font-bold">{totalDays}일</span>
                  </div>
                  <div className="flex justify-between items-center mb-2 text-sm sm:text-base">
                    <span className="text-slate-600">수량</span>
                    <span className="font-bold">{quantity}개</span>
                  </div>
                  <div className="border-t border-violet-200 pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-base sm:text-lg font-bold">총 대여료</span>
                      <span className="text-xl sm:text-2xl font-bold text-violet-600">₩{totalPrice.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 액션 버튼 */}
            <div className="mb-4 sm:mb-6">
              <button onClick={handleAddToCart} className="btn btn-primary w-full text-sm sm:text-base touch-manipulation">
                <ShoppingCart className="w-5 h-5" />
                장바구니에 담기
              </button>
            </div>

            {/* 추가 정보 */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="text-center p-3 sm:p-4 bg-slate-50 rounded-lg">
                <Truck className="w-6 sm:w-8 h-6 sm:h-8 text-violet-600 mx-auto mb-1 sm:mb-2" />
                <div className="text-xs sm:text-sm font-medium">배송 가능</div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-slate-50 rounded-lg">
                <Shield className="w-6 sm:w-8 h-6 sm:h-8 text-violet-600 mx-auto mb-1 sm:mb-2" />
                <div className="text-xs sm:text-sm font-medium">안전 보장</div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-slate-50 rounded-lg">
                <Heart className="w-6 sm:w-8 h-6 sm:h-8 text-violet-600 mx-auto mb-1 sm:mb-2" />
                <div className="text-xs sm:text-sm font-medium">관심 상품</div>
              </div>
            </div>
          </div>
        </div>

        {/* 상품 상세 설명 */}
        <div className="mt-6 sm:mt-8 lg:mt-12">
          <div className="card p-4 sm:p-6 lg:p-8">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">상품 상세 정보</h2>

            <div className="prose max-w-none">
              <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">상품 설명</h3>
              <p className="text-sm sm:text-base text-slate-600 mb-4 sm:mb-6">{product.description}</p>

              {/* 상세 이미지 */}
              {product.detailImages && product.detailImages.length > 0 && (
                <div className="mb-6 sm:mb-8">
                  <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">상세 이미지</h3>
                  <div className="space-y-4">
                    {product.detailImages.map((image: string, index: number) => (
                      <div key={index} className="relative w-full">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={image}
                          alt={`${product.title} 상세 이미지 ${index + 1}`}
                          className="w-full h-auto rounded-lg"
                          onError={(e) => {
                            e.currentTarget.src = '/images/placeholder-violet.svg';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">보유 자산 목록</h3>
              {product.assets && product.assets.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                  {product.assets.map((asset: Asset) => (
                    <div key={asset.id} className="border border-slate-200 rounded-lg overflow-hidden">
                      {/* Asset Image */}
                      {asset.images && asset.images.length > 0 ? (
                        <div className="aspect-video bg-slate-100 relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={asset.images[0]}
                            alt={asset.assetCode || '자산 이미지'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '/images/placeholder-violet.svg';
                            }}
                          />
                          {asset.images.length > 1 && (
                            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                              +{asset.images.length - 1}장
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="aspect-video bg-slate-100 flex items-center justify-center">
                          <Package className="w-12 h-12 text-slate-300" />
                        </div>
                      )}
                      <div className="p-3 sm:p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-sm sm:text-base font-bold">{asset.assetCode || asset.serialNumber}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            asset.status === 'available' ? 'bg-green-100 text-green-700' :
                            asset.status === 'maintenance' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {asset.status === 'available' ? '대여가능' :
                             asset.status === 'maintenance' ? '점검중' : '대여중'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600">
                          <span className={`px-2 py-0.5 rounded ${
                            asset.conditionGrade === 'S' ? 'bg-violet-100 text-violet-700' :
                            asset.conditionGrade === 'A' ? 'bg-blue-100 text-blue-700' :
                            asset.conditionGrade === 'B' ? 'bg-green-100 text-green-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {asset.conditionGrade || 'A'}급
                          </span>
                          {asset.notes && (
                            <span className="text-slate-500 truncate">{asset.notes}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-slate-50 rounded-lg mb-4 sm:mb-6">
                  <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">등록된 자산 정보가 없습니다</p>
                </div>
              )}

              <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">대여 안내</h3>
              <ul className="list-disc list-inside text-slate-600 space-y-2 text-sm sm:text-base">
                <li>대여 기간은 최소 1일부터 가능합니다</li>
                <li>반납 후 검수 기간이 1일 소요됩니다</li>
                <li>배송은 대여 시작일 1일 전 출고됩니다</li>
                <li>파손 시 수리비가 청구될 수 있습니다</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductDetailPage() {
  return (
    <Suspense fallback={<Loading fullScreen message="상품 정보를 불러오는 중..." />}>
      <ProductDetailContent />
    </Suspense>
  );
}
