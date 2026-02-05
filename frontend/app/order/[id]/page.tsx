'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Package, Calendar, MapPin, CreditCard, User, Phone, Mail, Clock, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { orderApi, adminApi } from '@/lib/api';
import { auth } from '@/lib/firebase';

interface OrderItem {
  id?: string;
  productId: string;
  quantity: number;
  pricePerDay: number;
  product?: {
    id: string;
    title: string;
    baseDailyPrice?: string | number;
    images?: string[];
  };
}

interface OrderDetail {
  id: string;
  createdAt: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: string;
  deliveryMethod: string;
  shippingAddress: string;
  deliveryNotes?: string;
  approvedAt?: string;
  confirmedAt?: string;
  rejectedAt?: string;
  cancelledAt?: string;
  rejectionReason?: string;
  cancelReason?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  items: OrderItem[];
}

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const loadOrderDetail = async () => {
      console.log('[OrderDetailPage] loadOrderDetail started, orderId:', orderId);
      try {
        const userStr = localStorage.getItem('user');
        let adminMode = false;

        if (userStr) {
          const user = JSON.parse(userStr);
          adminMode = user.role === 'admin';
          setIsAdmin(adminMode);
          console.log('[OrderDetailPage] User found, adminMode:', adminMode);
        } else {
          console.log('[OrderDetailPage] No user in localStorage');
        }

        // Use Firebase API to get order
        console.log('[OrderDetailPage] Calling orderApi.getOrderById...');
        const orderData = await orderApi.getOrderById(orderId);
        console.log('[OrderDetailPage] orderData received:', orderData);

        // Get user info if admin
        let orderWithUser = orderData as any;
        if (adminMode && orderData.userId) {
          try {
            const { doc, getDoc } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');
            const userDoc = await getDoc(doc(db, 'users', orderData.userId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              orderWithUser.user = {
                id: userDoc.id,
                name: userData.name,
                email: userData.email,
                phone: userData.phone,
              };
            }
          } catch (err) {
            console.error('Failed to load user info:', err);
          }
        }

        // Populate product info for items if not already populated
        if (orderWithUser.items && Array.isArray(orderWithUser.items)) {
          const { doc, getDoc } = await import('firebase/firestore');
          const { db } = await import('@/lib/firebase');

          const populatedItems = await Promise.all(
            orderWithUser.items.map(async (item: any) => {
              if (item.product?.title) return item; // Already populated
              try {
                const productDoc = await getDoc(doc(db, 'products', item.productId));
                if (productDoc.exists()) {
                  const productData = productDoc.data();
                  return {
                    ...item,
                    product: {
                      id: productDoc.id,
                      title: productData.title,
                      baseDailyPrice: productData.baseDailyPrice,
                      images: productData.images || [],
                    },
                  };
                }
              } catch (err) {
                console.error('Failed to load product:', item.productId, err);
              }
              return item;
            })
          );
          orderWithUser.items = populatedItems;
        }

        setOrder(orderWithUser);
      } catch (error) {
        console.error('[OrderDetailPage] Failed to load order:', error);
        alert('주문 정보를 불러오는 중 오류가 발생했습니다.');
        router.push('/mypage');
      } finally {
        console.log('[OrderDetailPage] loadOrderDetail finished, setting loading to false');
        setLoading(false);
      }
    };

    console.log('[OrderDetailPage] useEffect triggered, orderId:', orderId);
    console.log('[OrderDetailPage] Firebase auth currentUser:', auth.currentUser);
    loadOrderDetail();
  }, [orderId, router]);

  const handleConfirmPayment = async () => {
    if (!confirm('입금을 확인하시겠습니까?')) {
      return;
    }

    try {
      await adminApi.confirmPayment(orderId);
      alert('입금이 확인되었습니다.');
      window.location.reload();
    } catch (error) {
      console.error('Failed to confirm payment:', error);
      alert('입금 확인 중 오류가 발생했습니다.');
    }
  };

  const handleDispatchOrder = async () => {
    if (!confirm('상품을 발송하시겠습니까?')) {
      return;
    }

    try {
      await adminApi.updateOrderStatus(orderId, 'dispatched');
      alert('상품이 발송되었습니다.');
      window.location.reload();
    } catch (error) {
      console.error('Failed to dispatch order:', error);
      alert('상품 발송 중 오류가 발생했습니다.');
    }
  };

  const handleCollectOrder = async () => {
    if (!confirm('상품을 회수하시겠습니까?')) {
      return;
    }

    try {
      await adminApi.updateOrderStatus(orderId, 'completed');
      alert('상품이 회수되었습니다.');
      window.location.reload();
    } catch (error) {
      console.error('Failed to collect order:', error);
      alert('상품 회수 중 오류가 발생했습니다.');
    }
  };

  const handleCancelOrder = async () => {
    const reason = prompt('취소 사유를 입력해주세요:');
    if (!reason) {
      return;
    }

    try {
      await orderApi.cancel(orderId, reason);
      alert('예약이 취소되었습니다.');
      window.location.reload();
    } catch (error) {
      console.error('Failed to cancel order:', error);
      alert('예약 취소 중 오류가 발생했습니다.');
    }
  };

  const statusMap: Record<string, { label: string; color: string }> = {
    requested: { label: '문의접수', color: 'bg-yellow-100 text-yellow-700' },
    approved: { label: '승인됨 (입금대기)', color: 'bg-orange-100 text-orange-700' },
    confirmed: { label: '예약확정', color: 'bg-blue-100 text-blue-700' },
    preparing: { label: '준비중', color: 'bg-indigo-100 text-indigo-700' },
    dispatched: { label: '배송중', color: 'bg-purple-100 text-purple-700' },
    delivered: { label: '배송완료', color: 'bg-cyan-100 text-cyan-700' },
    in_use: { label: '사용중', color: 'bg-emerald-100 text-emerald-700' },
    returned: { label: '반납완료', color: 'bg-slate-100 text-slate-700' },
    completed: { label: '완료', color: 'bg-green-100 text-green-700' },
    rejected: { label: '거절됨', color: 'bg-red-100 text-red-700' },
    cancelled: { label: '취소됨', color: 'bg-red-100 text-red-700' },
  };

  const calculateRentalDays = (start: string, end: string) => {
    const days = Math.ceil(
      (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;
    return days;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mb-4"></div>
          <p className="text-slate-600">주문 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const rentalDays = calculateRentalDays(order.startDate, order.endDate);

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50">
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
            <div className="w-10 sm:w-24"></div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 flex items-center gap-2 sm:gap-3">
            <Package className="w-7 sm:w-9 lg:w-10 h-7 sm:h-9 lg:h-10 text-violet-600" />
            주문 상세
          </h1>
          <p className="text-xs sm:text-sm lg:text-base text-slate-600">주문번호: {order.id}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* 주문 상세 정보 */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* 주문 상태 */}
            <div className="card p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2">
                <Clock className="w-5 sm:w-6 h-5 sm:h-6 text-violet-600" />
                주문 상태
              </h2>
              <div className="space-y-2.5 sm:space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                  <span className="text-xs sm:text-sm text-slate-600">주문 상태</span>
                  <span className={`px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium w-fit ${statusMap[order.status]?.color || 'bg-gray-100 text-gray-700'}`}>
                    {statusMap[order.status]?.label || order.status}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                  <span className="text-xs sm:text-sm text-slate-600">대여기간</span>
                  <span className="text-xs sm:text-sm font-medium">
                    {new Date(order.startDate).toLocaleDateString('ko-KR')} ~ {new Date(order.endDate).toLocaleDateString('ko-KR')} ({rentalDays}일)
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                  <span className="text-xs sm:text-sm text-slate-600">주문일시</span>
                  <span className="text-xs sm:text-sm font-medium">{new Date(order.createdAt).toLocaleString('ko-KR')}</span>
                </div>
                {order.approvedAt && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                    <span className="text-xs sm:text-sm text-slate-600">승인일시</span>
                    <span className="text-xs sm:text-sm font-medium">{new Date(order.approvedAt).toLocaleString('ko-KR')}</span>
                  </div>
                )}
                {order.confirmedAt && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                    <span className="text-xs sm:text-sm text-slate-600">예약확정일시</span>
                    <span className="text-xs sm:text-sm font-medium">{new Date(order.confirmedAt).toLocaleString('ko-KR')}</span>
                  </div>
                )}
                {order.cancelledAt && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                    <span className="text-xs sm:text-sm text-slate-600">취소일시</span>
                    <span className="text-xs sm:text-sm font-medium text-red-600">{new Date(order.cancelledAt).toLocaleString('ko-KR')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 대여 상품 목록 */}
            <div className="card p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2">
                <Package className="w-5 sm:w-6 h-5 sm:h-6 text-violet-600" />
                대여 상품
              </h2>
              <div className="space-y-3 sm:space-y-4">
                {order.items?.map((item, index) => {
                  const dailyPrice = Number(item.pricePerDay || item.product?.baseDailyPrice || 0);
                  const subtotal = dailyPrice * item.quantity * rentalDays;
                  return (
                    <div key={item.id || index} className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-4 border border-slate-200 rounded-lg hover:border-violet-300 transition-colors">
                      {item.product?.images?.[0] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.product.images[0]}
                          alt={item.product.title}
                          className="w-full sm:w-20 h-48 sm:h-20 object-cover rounded-lg"
                          onError={(e) => {
                            e.currentTarget.src = '/images/placeholder.svg';
                          }}
                        />
                      )}
                      <div className="flex-1">
                        <Link
                          href={`/product/${item.product?.id || item.productId}`}
                          className="font-bold text-base sm:text-lg mb-2 sm:mb-1 hover:text-violet-600 transition-colors"
                        >
                          {item.product?.title || `상품 #${item.productId}`}
                        </Link>
                        <div className="text-xs sm:text-sm text-slate-600 space-y-1.5 sm:space-y-1 mt-2">
                          <p className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            <Calendar className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                            <span className="break-all">{new Date(order.startDate).toLocaleDateString('ko-KR')} ~ {new Date(order.endDate).toLocaleDateString('ko-KR')}</span>
                            <span className="text-violet-600 font-medium">({rentalDays}일)</span>
                          </p>
                          <p>수량: {item.quantity}개</p>
                          <p>일 대여료: ₩{dailyPrice.toLocaleString()}</p>
                          <p className="font-bold text-violet-600">소계: ₩{subtotal.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {(!order.items || order.items.length === 0) && (
                  <p className="text-sm text-slate-500 text-center py-4">상품 정보 없음</p>
                )}
              </div>
            </div>

            {/* 배송 정보 */}
            <div className="card p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2">
                <MapPin className="w-5 sm:w-6 h-5 sm:h-6 text-violet-600" />
                배송 정보
              </h2>
              <div className="space-y-2.5 sm:space-y-3">
                <div>
                  <span className="text-xs sm:text-sm text-slate-600 block mb-1">배송 방법</span>
                  <span className="text-sm sm:text-base font-medium">{order.deliveryMethod === 'parcel' ? '택배' : order.deliveryMethod}</span>
                </div>
                <div>
                  <span className="text-xs sm:text-sm text-slate-600 block mb-1">배송지 주소</span>
                  <span className="text-sm sm:text-base font-medium break-all">{order.shippingAddress || '미입력'}</span>
                </div>
                {order.deliveryNotes && (
                  <div>
                    <span className="text-xs sm:text-sm text-slate-600 block mb-1">배송 메모</span>
                    <span className="text-sm sm:text-base font-medium">{order.deliveryNotes}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 주문자 정보 (관리자만) */}
            {isAdmin && order.user && (
              <div className="card p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2">
                  <User className="w-5 sm:w-6 h-5 sm:h-6 text-violet-600" />
                  주문자 정보
                </h2>
                <div className="space-y-2.5 sm:space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-slate-600" />
                    <span className="text-sm sm:text-base font-medium">{order.user.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-slate-600" />
                    <span className="text-sm sm:text-base font-medium break-all">{order.user.email}</span>
                  </div>
                  {order.user.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-slate-600" />
                      <span className="text-sm sm:text-base font-medium">{order.user.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 취소/환불 정보 */}
            {(order.cancelledAt || order.rejectedAt || order.rejectionReason || order.cancelReason) && (
              <div className="card p-4 sm:p-6 border-red-200 bg-red-50">
                <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2 text-red-700">
                  <XCircle className="w-5 sm:w-6 h-5 sm:h-6" />
                  취소/거절 정보
                </h2>
                <div className="space-y-2.5 sm:space-y-3">
                  {order.cancelReason && (
                    <div>
                      <span className="text-xs sm:text-sm text-slate-600 block mb-1">취소 사유</span>
                      <span className="text-sm sm:text-base font-medium">{order.cancelReason}</span>
                    </div>
                  )}
                  {order.rejectionReason && (
                    <div>
                      <span className="text-xs sm:text-sm text-slate-600 block mb-1">거절 사유</span>
                      <span className="text-sm sm:text-base font-medium">{order.rejectionReason}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 결제 정보 & 액션 버튼 */}
          <div className="lg:col-span-1">
            <div className="card p-4 sm:p-6 lg:sticky lg:top-24 space-y-4 sm:space-y-6">
              <div>
                <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 sm:w-6 h-5 sm:h-6 text-violet-600" />
                  결제 정보
                </h2>
                <div className="space-y-2.5 sm:space-y-3">
                  <div className="border-t border-slate-200 pt-2.5 sm:pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-base sm:text-lg font-bold">총 결제 금액</span>
                      <span className="text-xl sm:text-2xl font-bold text-violet-600">₩{Number(order.totalPrice).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="pt-2.5 sm:pt-3 border-t border-slate-200">
                    <div className="flex justify-between text-xs sm:text-sm text-slate-600">
                      <span>결제 방법</span>
                      <span className="font-medium">무통장입금</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="space-y-2.5 sm:space-y-3 pt-4 sm:pt-6 border-t border-slate-200">
                {isAdmin ? (
                  <>
                    {/* 문의접수/승인 상태: 입금확인, 취소 */}
                    {(order.status === 'requested' || order.status === 'approved') && (
                      <>
                        <button onClick={handleConfirmPayment} className="btn btn-primary w-full text-sm sm:text-base touch-manipulation">
                          <CheckCircle className="w-5 h-5" />
                          입금확인
                        </button>
                        <button onClick={handleCancelOrder} className="btn btn-outline w-full text-red-600 border-red-300 hover:bg-red-50 text-sm sm:text-base touch-manipulation">
                          <XCircle className="w-5 h-5" />
                          취소
                        </button>
                      </>
                    )}

                    {/* 예약확정 상태: 취소, 상품발송 */}
                    {order.status === 'confirmed' && (
                      <>
                        <button onClick={handleDispatchOrder} className="btn btn-primary w-full text-sm sm:text-base touch-manipulation">
                          <Package className="w-5 h-5" />
                          상품발송
                        </button>
                        <button onClick={handleCancelOrder} className="btn btn-outline w-full text-red-600 border-red-300 hover:bg-red-50 text-sm sm:text-base touch-manipulation">
                          <XCircle className="w-5 h-5" />
                          취소
                        </button>
                      </>
                    )}

                    {/* 배송중 상태: 취소, 회수 */}
                    {order.status === 'dispatched' && (
                      <>
                        <button onClick={handleCollectOrder} className="btn btn-primary w-full text-sm sm:text-base touch-manipulation">
                          <Package className="w-5 h-5" />
                          회수
                        </button>
                        <button onClick={handleCancelOrder} className="btn btn-outline w-full text-red-600 border-red-300 hover:bg-red-50 text-sm sm:text-base touch-manipulation">
                          <XCircle className="w-5 h-5" />
                          취소
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    {/* 사용자: 문의접수/승인 상태에서만 취소 가능 */}
                    {(order.status === 'requested' || order.status === 'approved') && (
                      <button onClick={handleCancelOrder} className="btn btn-outline w-full text-red-600 border-red-300 hover:bg-red-50 text-sm sm:text-base touch-manipulation">
                        <XCircle className="w-5 h-5" />
                        예약 취소
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* 안내 사항 */}
              <div className="p-3 sm:p-4 bg-violet-50 rounded-lg">
                <p className="text-xs sm:text-sm text-slate-600 space-y-1">
                  <span className="block font-medium text-slate-900">예약 안내</span>
                  {order.status === 'requested' && (
                    <span className="block">• 문의가 접수되었습니다. 관리자 확인 후 연락드리겠습니다.</span>
                  )}
                  {order.status === 'approved' && (
                    <span className="block">• 문의가 승인되었습니다. 입금 확인 후 예약이 확정됩니다.</span>
                  )}
                  {order.status === 'confirmed' && (
                    <span className="block">• 예약이 확정되었습니다.</span>
                  )}
                  {order.status === 'dispatched' && (
                    <span className="block">• 상품이 발송되었습니다.</span>
                  )}
                  {order.status === 'completed' && (
                    <span className="block">• 대여가 완료되었습니다. 이용해 주셔서 감사합니다.</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
