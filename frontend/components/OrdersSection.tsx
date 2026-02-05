'use client';

import { Package, Calendar } from 'lucide-react';
import Link from 'next/link';

// Updated to match DisplayOrder from useOrders hook
interface DisplayOrder {
  id: string;
  createdAt: string;
  totalAmount: number;
  status: string;
  items: {
    id?: string;
    productId?: string;
    quantity: number;
    pricePerDay: number;
    product?: {
      id: string;
      title: string;
      baseDailyPrice?: string | number;
      images?: string[];
    };
  }[];
  startDate?: string;
  endDate?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

interface OrdersSectionProps {
  orders: DisplayOrder[];
  isAdmin: boolean;
  onConfirmPayment: (orderId: string | number) => void;
  onCancelOrder: (orderId: string | number) => void;
  onDispatchOrder: (orderId: string | number) => void;
  onCollectOrder: (orderId: string | number) => void;
  onViewOrderDetail: (orderId: string | number) => void;
}

const statusMap: Record<string, { label: string; color: string }> = {
  requested: { label: '예약신청', color: 'bg-yellow-100 text-yellow-700' },
  hold_pendingpay: { label: '입금대기', color: 'bg-orange-100 text-orange-700' },
  confirmed: { label: '확정됨', color: 'bg-blue-100 text-blue-700' },
  preparing: { label: '준비중', color: 'bg-indigo-100 text-indigo-700' },
  dispatched: { label: '배송중', color: 'bg-purple-100 text-purple-700' },
  delivered: { label: '배송완료', color: 'bg-cyan-100 text-cyan-700' },
  returned: { label: '반납완료', color: 'bg-slate-100 text-slate-700' },
  completed: { label: '완료', color: 'bg-green-100 text-green-700' },
  inspecting: { label: '검수중', color: 'bg-teal-100 text-teal-700' },
  inspection_passed: { label: '검수완료', color: 'bg-green-100 text-green-700' },
  inspection_failed: { label: '검수실패', color: 'bg-rose-100 text-rose-700' },
  rejected: { label: '거절됨', color: 'bg-red-100 text-red-700' },
  canceled: { label: '취소됨', color: 'bg-red-100 text-red-700' },
  cancelled: { label: '취소됨', color: 'bg-red-100 text-red-700' },
  expired: { label: '만료됨', color: 'bg-gray-100 text-gray-700' },
};

export default function OrdersSection({
  orders,
  isAdmin,
  onConfirmPayment,
  onCancelOrder,
  onDispatchOrder,
  onCollectOrder,
  onViewOrderDetail,
}: OrdersSectionProps) {
  if (orders.length === 0) {
    return (
      <div className="card p-12 text-center">
        <Package className="w-24 h-24 text-slate-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">대여 내역이 없습니다</h2>
        <p className="text-slate-600 mb-6">원하시는 장비를 대여해보세요</p>
        <Link href="/" className="btn btn-primary inline-flex">
          장비 둘러보기
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map(order => {
        const orderStatus = order.status || 'requested';
        const startDate = order.startDate ? new Date(order.startDate) : null;
        const endDate = order.endDate ? new Date(order.endDate) : null;
        const days = startDate && endDate
          ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
          : 1;

        return (
          <div key={order.id} className="card p-6">
            {/* 주문 헤더 */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
              <div>
                <p className="text-sm text-slate-600">주문번호: #{order.id.slice(0, 8).toUpperCase()}</p>
                <p className="text-sm text-slate-600">
                  주문일: {new Date(order.createdAt).toLocaleDateString('ko-KR')}
                </p>
                {startDate && endDate && (
                  <p className="text-sm text-slate-600">
                    대여기간: {startDate.toLocaleDateString('ko-KR')} ~ {endDate.toLocaleDateString('ko-KR')} ({days}일)
                  </p>
                )}
                {isAdmin && order.user && (
                  <p className="text-sm text-slate-600">
                    고객: {order.user.name} ({order.user.email})
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusMap[orderStatus]?.color || 'bg-gray-100 text-gray-700'}`}>
                  {statusMap[orderStatus]?.label || orderStatus}
                </span>
                <p className="text-xl font-bold text-violet-600">
                  ₩{Number(order.totalAmount).toLocaleString()}
                </p>
              </div>
            </div>

            {/* 주문 상품 목록 */}
            <div className="space-y-4">
              {order.items?.map((item, index) => {
                const dailyPrice = Number(item.pricePerDay || item.product?.baseDailyPrice || 0);
                return (
                  <div key={item.productId || index} className="flex gap-4">
                    <div className="w-20 h-20 bg-slate-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                      <Package className="w-8 h-8 text-slate-300" />
                    </div>
                    <div className="flex-1">
                      <Link
                        href={`/product/${item.product?.id || item.productId}`}
                        className="font-bold hover:text-violet-600 transition-colors"
                      >
                        {item.product?.title || `상품 #${item.productId}`}
                      </Link>
                      {startDate && endDate && (
                        <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {startDate.toLocaleDateString('ko-KR')} ~{' '}
                            {endDate.toLocaleDateString('ko-KR')} ({days}일)
                          </span>
                        </div>
                      )}
                      <p className="text-sm text-slate-600 mt-1">
                        수량: {item.quantity || 1}개 / 일 대여료: ₩{dailyPrice.toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
              {(!order.items || order.items.length === 0) && (
                <p className="text-sm text-slate-500 text-center py-4">상품 정보 없음</p>
              )}
            </div>

            {/* 주문 액션 */}
            <div className="flex gap-3 mt-6 pt-4 border-t border-slate-200">
              {isAdmin ? (
                <>
                  {/* 예약신청 상태: 입금확인, 취소, 주문상세 */}
                  {(orderStatus === 'requested' || orderStatus === 'hold_pendingpay') && (
                    <>
                      <button
                        onClick={() => onConfirmPayment(order.id)}
                        className="btn btn-primary flex-1"
                      >
                        입금확인
                      </button>
                      <button
                        onClick={() => onCancelOrder(order.id)}
                        className="btn btn-outline flex-1 text-red-600 border-red-300 hover:bg-red-50"
                      >
                        취소
                      </button>
                      <button
                        onClick={() => onViewOrderDetail(order.id)}
                        className="btn btn-outline flex-1"
                      >
                        주문상세
                      </button>
                    </>
                  )}

                  {/* 확정됨 상태: 주문상세, 취소, 상품발송 */}
                  {orderStatus === 'confirmed' && (
                    <>
                      <button
                        onClick={() => onViewOrderDetail(order.id)}
                        className="btn btn-outline flex-1"
                      >
                        주문상세
                      </button>
                      <button
                        onClick={() => onCancelOrder(order.id)}
                        className="btn btn-outline flex-1 text-red-600 border-red-300 hover:bg-red-50"
                      >
                        취소
                      </button>
                      <button
                        onClick={() => onDispatchOrder(order.id)}
                        className="btn btn-primary flex-1"
                      >
                        상품발송
                      </button>
                    </>
                  )}

                  {/* 배송중 상태: 취소, 회수, 기타 */}
                  {orderStatus === 'dispatched' && (
                    <>
                      <button
                        onClick={() => onCancelOrder(order.id)}
                        className="btn btn-outline flex-1 text-red-600 border-red-300 hover:bg-red-50"
                      >
                        취소
                      </button>
                      <button
                        onClick={() => onCollectOrder(order.id)}
                        className="btn btn-primary flex-1"
                      >
                        회수
                      </button>
                      <button
                        onClick={() => onViewOrderDetail(order.id)}
                        className="btn btn-outline flex-1"
                      >
                        기타
                      </button>
                    </>
                  )}

                  {/* 기타 상태: 주문상세만 */}
                  {!['requested', 'hold_pendingpay', 'confirmed', 'dispatched'].includes(orderStatus) && (
                    <button
                      onClick={() => onViewOrderDetail(order.id)}
                      className="btn btn-outline flex-1"
                    >
                      주문상세
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={() => onViewOrderDetail(order.id)}
                    className="btn btn-outline flex-1"
                  >
                    주문 상세
                  </button>
                  {(orderStatus === 'requested' || orderStatus === 'hold_pendingpay') && (
                    <button
                      onClick={() => onCancelOrder(order.id)}
                      className="btn btn-outline flex-1 text-red-600 border-red-300 hover:bg-red-50"
                    >
                      예약 취소
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
