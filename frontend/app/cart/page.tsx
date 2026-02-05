'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, CreditCard, Calendar, Package } from 'lucide-react';
import Link from 'next/link';
import { cartApi } from '@/lib/api';
import Loading from '@/components/Loading';
import { useToast } from '@/hooks/useToast';
import { CartItem } from '@/types';

export default function CartPage() {
  const router = useRouter();
  const { success, error: showError, info, ToastContainer } = useToast();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const cart = await cartApi.getCart();
        setCartItems((cart.items || []) as CartItem[]);
      } catch (error: unknown) {
        console.error('Failed to fetch cart:', error);
        const err = error as { response?: { status: number } }; if (err.response?.status === 401) {
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [router]);

  const handleQuantityChange = async (id: string, delta: number) => {
    const item = cartItems.find(i => i.id === id);
    if (!item || !item.product) return;

    const newQuantity = Math.max(1, Math.min(item.product.availableCount ?? 99, item.quantity + delta));

    try {
      await cartApi.updateQuantity(id, newQuantity);
      setCartItems(items =>
        items.map(item =>
          item.id === id ? { ...item, quantity: newQuantity } : item
        )
      );
      success('수량이 변경되었습니다.');
    } catch (error) {
      console.error('Failed to update quantity:', error);
      showError('수량 변경에 실패했습니다.');
    }
  };

  const handleRemoveItem = async (id: string) => {
    if (confirm('이 상품을 장바구니에서 제거하시겠습니까?')) {
      try {
        await cartApi.removeItem(id);
        setCartItems(items => items.filter(item => item.id !== id));
        success('상품이 장바구니에서 제거되었습니다.');
      } catch (error) {
        console.error('Failed to remove item:', error);
        showError('상품 제거에 실패했습니다.');
      }
    }
  };

  const calculateItemTotal = (item: CartItem) => {
    if (!item.product) return 0;
    const days = Math.ceil(
      (new Date(item.endDate).getTime() - new Date(item.startDate).getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;
    return days * parseFloat(item.product.baseDailyPrice) * item.quantity;
  };

  const totalPrice = cartItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      info('장바구니가 비어있습니다.');
      return;
    }
    router.push('/checkout');
  };

  if (loading) {
    return <Loading fullScreen message="장바구니를 불러오는 중..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50">
      <ToastContainer />
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
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <ShoppingCart className="w-10 h-10 text-violet-600" />
            장바구니
          </h1>
          <p className="text-slate-600">선택하신 장비를 확인하고 대여를 진행하세요</p>
        </div>

        {cartItems.length === 0 ? (
          <div className="card p-12 text-center">
            <Package className="w-24 h-24 text-slate-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">장바구니가 비어있습니다</h2>
            <p className="text-slate-600 mb-6">원하시는 장비를 장바구니에 담아보세요</p>
            <Link href="/" className="btn btn-primary inline-flex">
              장비 둘러보기
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* 장바구니 아이템 목록 */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.filter(item => item.product).map(item => {
                const product = item.product!;
                const days = Math.ceil(
                  (new Date(item.endDate).getTime() - new Date(item.startDate).getTime()) / (1000 * 60 * 60 * 24)
                ) + 1;
                const itemTotal = calculateItemTotal(item);

                return (
                  <div key={item.id} className="card p-6">
                    <div className="flex gap-6">
                      {/* 상품 이미지 */}
                      <div className="w-32 h-32 bg-slate-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                        <Package className="w-12 h-12 text-slate-300" />
                      </div>

                      {/* 상품 정보 */}
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <Link
                              href={`/product/${product.id}`}
                              className="text-xl font-bold hover:text-violet-600 transition-colors"
                            >
                              {product.title}
                            </Link>
                            <p className="text-sm text-slate-600 mt-1">
                              일 대여료: ₩{parseFloat(product.baseDailyPrice).toLocaleString()}
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>

                        {/* 대여 기간 */}
                        <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(item.startDate).toLocaleDateString('ko-KR')} ~{' '}
                            {new Date(item.endDate).toLocaleDateString('ko-KR')} ({days}일)
                          </span>
                        </div>

                        {/* 수량 및 가격 */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-slate-700">수량:</span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleQuantityChange(item.id, -1)}
                                className="w-8 h-8 rounded-lg border border-slate-300 hover:bg-slate-50 flex items-center justify-center"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="text-lg font-bold w-8 text-center">{item.quantity}</span>
                              <button
                                onClick={() => handleQuantityChange(item.id, 1)}
                                className="w-8 h-8 rounded-lg border border-slate-300 hover:bg-slate-50 flex items-center justify-center"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-slate-600">소계</p>
                            <p className="text-2xl font-bold text-violet-600">₩{itemTotal.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 주문 요약 */}
            <div className="lg:col-span-1">
              <div className="card p-6 sticky top-24">
                <h2 className="text-xl font-bold mb-6">주문 요약</h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-slate-600">
                    <span>상품 수</span>
                    <span className="font-medium">{cartItems.length}개</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>총 수량</span>
                    <span className="font-medium">{cartItems.reduce((sum, item) => sum + item.quantity, 0)}개</span>
                  </div>
                  <div className="border-t border-slate-200 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold">총 대여료</span>
                      <span className="text-2xl font-bold text-violet-600">₩{totalPrice.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <button onClick={handleCheckout} className="btn btn-primary w-full">
                  <CreditCard className="w-5 h-5" />
                  예약신청
                </button>

                <Link href="/" className="btn btn-outline w-full mt-3">
                  쇼핑 계속하기
                </Link>

                <div className="mt-6 p-4 bg-violet-50 rounded-lg">
                  <p className="text-sm text-slate-600 space-y-1">
                    <span className="block font-medium text-slate-900">안내사항</span>
                    <span className="block">• 대여 기간은 배송일을 포함합니다</span>
                    <span className="block">• 반납 후 검수 기간이 소요됩니다</span>
                    <span className="block">• 파손 시 수리비가 청구될 수 있습니다</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
