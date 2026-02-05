'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, MapPin, User, ArrowLeft, CheckCircle, Package } from 'lucide-react';
import Link from 'next/link';
import { cartApi, orderApi } from '@/lib/api';
import { useToast } from '@/hooks/useToast';

interface CheckoutCartItem {
  id: string;
  product: {
    id: string;
    title: string;
    baseDailyPrice: string;
  };
  startDate: string;
  endDate: string;
  quantity: number;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { success, error: showError, info, ToastContainer } = useToast();
  const [cartItems, setCartItems] = useState<CheckoutCartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    detailAddress: '',
    zipCode: '',
    notes: '',
  });

  useEffect(() => {
    const loadCartAndUserData = async () => {
      try {
        // 장바구니 데이터 불러오기
        const cartData = await cartApi.getCart();
        if (cartData && cartData.items) {
          setCartItems(cartData.items as CheckoutCartItem[]);
        }
      } catch (error) {
        console.error('Failed to load cart:', error);
        showError('장바구니를 불러오는데 실패했습니다.');
      }

      // 사용자 정보 불러오기
      const user = localStorage.getItem('user');
      if (user) {
        const userData = JSON.parse(user);
        setFormData(prev => ({
          ...prev,
          name: userData.name || '',
          phone: userData.phone || '',
          email: userData.email || '',
        }));
      }
    };

    loadCartAndUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const calculateItemTotal = (item: CheckoutCartItem) => {
    const days = Math.ceil(
      (new Date(item.endDate).getTime() - new Date(item.startDate).getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;
    return days * parseFloat(item.product.baseDailyPrice) * item.quantity;
  };

  const totalPrice = cartItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  const deliveryFee = totalPrice > 100000 ? 0 : 5000;
  const finalPrice = totalPrice + deliveryFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (cartItems.length === 0) {
        info('장바구니가 비어있습니다.');
        setLoading(false);
        return;
      }

      // 장바구니의 첫 번째 아이템에서 날짜 가져오기
      const firstItem = cartItems[0];
      const shippingAddress = `${formData.zipCode} ${formData.address} ${formData.detailAddress}`;

      const orderData = {
        startDate: firstItem.startDate,
        endDate: firstItem.endDate,
        deliveryMethod: 'parcel', // 택배 배송 고정
        shippingAddress,
        deliveryNotes: formData.notes,
      };

      const order = await orderApi.create(orderData);

      success('예약 신청이 완료되었습니다!');

      // 주문 완료 페이지로 이동
      setTimeout(() => router.push(`/order/complete?orderId=${order.id}`), 1000);
    } catch (error: unknown) {
      console.error('Order creation failed:', error);
      const err = error as { response?: { data?: { message?: string } } };
      const errorMessage = err.response?.data?.message || '주문에 실패했습니다. 다시 시도해주세요.';
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
            <CreditCard className="w-10 h-10 text-violet-600" />
            예약 신청
          </h1>
          <p className="text-slate-600">배송 정보를 입력하고 예약을 신청하세요</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* 주문 정보 입력 */}
            <div className="lg:col-span-2 space-y-6">
              {/* 주문자 정보 */}
              <div className="card p-6">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <User className="w-6 h-6 text-violet-600" />
                  주문자 정보
                </h2>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                      이름 *
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleChange}
                      className="input"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">
                      전화번호 *
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="010-1234-5678"
                      className="input"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                      이메일 *
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="input"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* 배송 정보 */}
              <div className="card p-6">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <MapPin className="w-6 h-6 text-violet-600" />
                  배송 정보
                </h2>

                <div className="space-y-4">
                  <div className="flex gap-3">
                    <input
                      id="zipCode"
                      name="zipCode"
                      type="text"
                      value={formData.zipCode}
                      onChange={handleChange}
                      placeholder="우편번호"
                      className="input flex-1"
                      required
                    />
                    <button type="button" className="btn btn-outline whitespace-nowrap">
                      우편번호 찾기
                    </button>
                  </div>

                  <div>
                    <input
                      id="address"
                      name="address"
                      type="text"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="주소 *"
                      className="input"
                      required
                    />
                  </div>

                  <div>
                    <input
                      id="detailAddress"
                      name="detailAddress"
                      type="text"
                      value={formData.detailAddress}
                      onChange={handleChange}
                      placeholder="상세주소 *"
                      className="input"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-2">
                      배송 메모
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      placeholder="배송 시 요청사항을 입력해주세요"
                      className="input resize-none"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* 주문 상품 목록 (모바일에서만 표시) */}
              <div className="card p-6 lg:hidden">
                <h2 className="text-xl font-bold mb-6">주문 상품</h2>
                {cartItems.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    장바구니가 비어있습니다
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cartItems.map(item => {
                      const days = Math.ceil(
                        (new Date(item.endDate).getTime() - new Date(item.startDate).getTime()) / (1000 * 60 * 60 * 24)
                      ) + 1;
                      return (
                        <div key={item.id} className="border-b border-slate-200 pb-4 last:border-0">
                          <p className="font-medium">{item.product.title}</p>
                          <p className="text-sm text-slate-600 mt-1">
                            {days}일 × {item.quantity}개 = ₩{calculateItemTotal(item).toLocaleString()}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* 주문 요약 */}
            <div className="lg:col-span-1">
              <div className="card p-6 sticky top-24">
                <h2 className="text-xl font-bold mb-6">주문 요약</h2>

                {/* 주문 상품 (데스크톱에서만 표시) */}
                <div className="hidden lg:block mb-6 max-h-64 overflow-y-auto">
                  {cartItems.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <Package className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                      <p>장바구니가 비어있습니다</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {cartItems.map(item => {
                        const days = Math.ceil(
                          (new Date(item.endDate).getTime() - new Date(item.startDate).getTime()) / (1000 * 60 * 60 * 24)
                        ) + 1;
                        return (
                          <div key={item.id} className="border-b border-slate-200 pb-4 last:border-0">
                            <p className="font-medium text-sm">{item.product.title}</p>
                            <p className="text-xs text-slate-600 mt-1">
                              {days}일 × {item.quantity}개
                            </p>
                            <p className="text-sm font-bold text-violet-600 mt-1">
                              ₩{calculateItemTotal(item).toLocaleString()}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="space-y-3 mb-6 border-t border-slate-200 pt-6">
                  <div className="flex justify-between text-slate-600">
                    <span>상품 금액</span>
                    <span className="font-medium">₩{totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>배송비</span>
                    <span className="font-medium">
                      {deliveryFee === 0 ? '무료' : `₩${deliveryFee.toLocaleString()}`}
                    </span>
                  </div>
                  {deliveryFee === 0 && (
                    <p className="text-xs text-green-600">✓ 10만원 이상 무료배송</p>
                  )}
                  <div className="border-t border-slate-200 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold">최종 결제 금액</span>
                      <span className="text-2xl font-bold text-violet-600">₩{finalPrice.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || cartItems.length === 0}
                  className="btn btn-primary w-full"
                >
                  {loading ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      처리 중...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      예약신청
                    </>
                  )}
                </button>

                <div className="mt-6 p-4 bg-violet-50 rounded-lg">
                  <p className="text-sm text-slate-600 space-y-1">
                    <span className="block font-medium text-slate-900">예약 안내</span>
                    <span className="block">• 예약 신청 후 관리자 승인이 필요합니다</span>
                    <span className="block">• 입금 확인 후 예약이 확정됩니다</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
