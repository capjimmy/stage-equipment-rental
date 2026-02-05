'use client';

import { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Search,
  Filter,
  Eye,
  Calendar,
  User,
  Package,
  MapPin,
  XCircle,
  Truck,
  Phone,
  Mail,
  CreditCard,
  RotateCcw,
  CheckCircle,
  Ban,
  Banknote,
  AlertCircle
} from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import Loading from '@/components/Loading';
import Toast, { ToastType } from '@/components/Toast';
import useAdminAuth from '@/hooks/useAdminAuth';
import { adminApi } from '@/lib/api';
import type { Settings } from '@/types';

// Extended type for display with optional fields
interface AdminOrder {
  id: string;
  userId?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
  };
  startDate: string;
  endDate: string;
  totalPrice?: number;
  totalAmount?: number;
  paymentMethod?: string;
  paymentStatus?: string;
  status?: string;
  fulfillmentStatus?: string;
  deliveryMethod: string;
  shippingCost?: number;
  shippingAddress: string;
  deliveryNotes?: string;
  depositDeadlineAt?: string;
  adminApprovedAt2?: string | null;
  canceledAt?: string | null;
  cancellationReason?: string | null;
  rejectionReason?: string | null;
  items?: Array<{
    id?: string;
    productId?: string;
    quantity: number;
    pricePerDay: number;
    product?: {
      id: string;
      title: string;
      baseDailyPrice?: string | number;
      images?: string[] | null;
    };
  }>;
  createdAt: string;
  updatedAt?: string;
}

export default function AdminOrdersPage() {
  const { isChecking, isAdmin } = useAdminAuth();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingOrderId, setRejectingOrderId] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const [ordersData, settingsData] = await Promise.all([
        adminApi.getAllOrders(),
        adminApi.getSettings(),
      ]);
      // Map Firebase data to display format
      const mappedOrders = ordersData.map((order) => ({
        ...order,
        totalAmount: order.totalPrice || 0,
        fulfillmentStatus: order.status || 'requested',
        paymentStatus: order.status === 'confirmed' ? 'confirmed' : (order.status === 'approved' ? 'pending' : 'pending'),
        items: order.items || [],
      })) as AdminOrder[];
      setOrders(mappedOrders);
      setSettings(settingsData);
    } catch (error: unknown) {
      console.error('Failed to fetch orders:', error);
      setToast({
        message: '주문 목록을 불러오는데 실패했습니다.',
        type: 'error'
      });
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isChecking && isAdmin) {
      fetchOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isChecking, isAdmin, statusFilter]);

  // 주문 승인 (입금 대기 상태로)
  const approveOrder = async (orderId: string) => {
    if (!settings?.bankAccount) {
      setToast({ message: '입금 계좌 정보가 설정되지 않았습니다. 설정 페이지에서 먼저 설정해주세요.', type: 'error' });
      return;
    }

    if (!confirm('이 주문을 승인하시겠습니까? 고객에게 입금 안내가 전송됩니다.')) {
      return;
    }

    try {
      await adminApi.approveOrder(orderId);
      setToast({ message: '주문이 승인되었습니다. 고객에게 입금 안내가 전송되었습니다.', type: 'success' });
      fetchOrders();
    } catch (error) {
      console.error('Failed to approve order:', error);
      setToast({ message: '주문 승인 중 오류가 발생했습니다.', type: 'error' });
    }
  };

  // 주문 거절 모달 열기
  const openRejectModal = (orderId: string) => {
    setRejectingOrderId(orderId);
    setRejectReason('');
    setShowRejectModal(true);
  };

  // 주문 거절 실행
  const executeReject = async () => {
    if (!rejectingOrderId || !rejectReason.trim()) {
      setToast({ message: '거절 사유를 입력해주세요.', type: 'error' });
      return;
    }

    try {
      await adminApi.rejectOrder(rejectingOrderId, rejectReason);
      setToast({ message: '주문이 거절되었습니다. 고객에게 사유가 전송되었습니다.', type: 'success' });
      setShowRejectModal(false);
      setRejectingOrderId(null);
      setRejectReason('');
      fetchOrders();
    } catch (error) {
      console.error('Failed to reject order:', error);
      setToast({ message: '주문 거절 중 오류가 발생했습니다.', type: 'error' });
    }
  };

  // 입금 확인 (예약 확정)
  const confirmPayment = async (orderId: string) => {
    if (!confirm('입금을 확인하셨습니까? 확인 시 예약이 확정되고 해당 날짜가 차단됩니다.')) {
      return;
    }

    try {
      await adminApi.confirmPayment(orderId);
      setToast({ message: '입금이 확인되었습니다. 예약이 확정되었습니다.', type: 'success' });
      fetchOrders();
    } catch (error) {
      console.error('Failed to confirm payment:', error);
      setToast({ message: '입금 확인 중 오류가 발생했습니다.', type: 'error' });
    }
  };

  // 주문 취소
  const cancelOrder = async (orderId: string) => {
    if (!confirm('정말 이 주문을 취소하시겠습니까?')) {
      return;
    }

    try {
      await adminApi.cancelOrder(orderId);
      setToast({ message: '주문이 취소되었습니다.', type: 'success' });
      fetchOrders();
    } catch (error) {
      console.error('Failed to cancel order:', error);
      setToast({ message: '주문 취소 중 오류가 발생했습니다.', type: 'error' });
    }
  };

  const dispatchOrder = async (orderId: string) => {
    if (!confirm('상품을 발송하시겠습니까?')) {
      return;
    }

    try {
      await adminApi.updateOrderStatus(orderId, 'dispatched');
      setToast({ message: '상품이 발송되었습니다.', type: 'success' });
      fetchOrders();
    } catch (error) {
      console.error('Failed to dispatch order:', error);
      setToast({ message: '상품 발송 중 오류가 발생했습니다.', type: 'error' });
    }
  };

  const collectOrder = async (orderId: string) => {
    if (!confirm('상품을 회수하시겠습니까?')) {
      return;
    }

    try {
      await adminApi.updateOrderStatus(orderId, 'completed');
      setToast({ message: '상품이 회수되었습니다.', type: 'success' });
      fetchOrders();
    } catch (error) {
      console.error('Failed to collect order:', error);
      setToast({ message: '상품 회수 중 오류가 발생했습니다.', type: 'error' });
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      String(order.id).toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.user?.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const orderStatus = order.fulfillmentStatus || order.status || 'requested';
    const matchesStatus = statusFilter === 'all' || orderStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string; color: string; border: string }> = {
      requested: { label: '문의접수', color: 'bg-yellow-100 text-yellow-800', border: 'border-yellow-300' },
      approved: { label: '승인(입금대기)', color: 'bg-orange-100 text-orange-800', border: 'border-orange-300' },
      confirmed: { label: '예약확정', color: 'bg-blue-100 text-blue-800', border: 'border-blue-300' },
      preparing: { label: '준비중', color: 'bg-purple-100 text-purple-800', border: 'border-purple-300' },
      dispatched: { label: '발송됨', color: 'bg-indigo-100 text-indigo-800', border: 'border-indigo-300' },
      delivered: { label: '배송완료', color: 'bg-teal-100 text-teal-800', border: 'border-teal-300' },
      in_use: { label: '사용중', color: 'bg-cyan-100 text-cyan-800', border: 'border-cyan-300' },
      returned: { label: '반납완료', color: 'bg-green-100 text-green-800', border: 'border-green-300' },
      completed: { label: '완료', color: 'bg-emerald-100 text-emerald-800', border: 'border-emerald-300' },
      rejected: { label: '거절됨', color: 'bg-red-100 text-red-800', border: 'border-red-300' },
      cancelled: { label: '취소됨', color: 'bg-gray-100 text-gray-800', border: 'border-gray-300' },
    };
    return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800', border: 'border-gray-300' };
  };

  const getPaymentStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      pending: { label: '미결제', color: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: '결제완료', color: 'bg-green-100 text-green-800' },
      failed: { label: '결제실패', color: 'bg-red-100 text-red-800' },
      refunded: { label: '환불완료', color: 'bg-gray-100 text-gray-800' },
    };
    return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
  };

  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  if (isChecking || loading) {
    return <Loading fullScreen message="주문 목록 로딩 중..." />;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">주문 관리</h1>
          <p className="text-sm sm:text-base text-slate-600">전체 {filteredOrders.length}개 주문</p>
        </div>

        {/* Filters */}
        <div className="card p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
              <input
                type="text"
                placeholder="주문번호, 사용자 이름, 이메일 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-9 sm:pl-10 text-sm sm:text-base"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input pl-9 sm:pl-10 text-sm sm:text-base"
              >
                <option value="all">전체 상태</option>
                <option value="requested">문의접수</option>
                <option value="approved">승인(입금대기)</option>
                <option value="confirmed">예약확정</option>
                <option value="preparing">준비중</option>
                <option value="dispatched">발송됨</option>
                <option value="delivered">배송완료</option>
                <option value="returned">반납완료</option>
                <option value="completed">완료</option>
                <option value="rejected">거절됨</option>
                <option value="cancelled">취소됨</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="card p-8 sm:p-12 text-center">
            <ShoppingCart className="w-16 h-16 sm:w-24 sm:h-24 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl font-bold mb-2">주문이 없습니다</h2>
            <p className="text-sm sm:text-base text-slate-600">
              {searchQuery || statusFilter !== 'all'
                ? '검색 조건에 맞는 주문이 없습니다.'
                : '아직 접수된 주문이 없습니다.'
              }
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredOrders.map((order) => {
              const orderStatus = order.fulfillmentStatus || order.status || 'requested';
              const paymentStatus = order.paymentStatus || (order.status === 'confirmed' ? 'confirmed' : 'pending');
              const statusInfo = getStatusInfo(orderStatus);
              const paymentInfo = getPaymentStatusInfo(paymentStatus);
              const days = calculateDays(order.startDate, order.endDate);
              const totalAmount = order.totalAmount || order.totalPrice || 0;

              return (
                <div key={order.id} className={`card border-l-4 ${statusInfo.border} hover:shadow-lg transition-shadow`}>
                  <div className="p-4 sm:p-6">
                    {/* Header Row */}
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold">주문 #{order.id.slice(0, 8).toUpperCase()}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${paymentInfo.color}`}>
                            {paymentInfo.label}
                          </span>
                        </div>
                        <div className="text-sm text-slate-500">
                          {new Date(order.createdAt).toLocaleString('ko-KR')}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowDetailModal(true);
                          }}
                          className="btn btn-outline btn-sm text-xs"
                        >
                          <Eye className="w-4 h-4" />
                          상세
                        </button>

                        {/* 문의접수 상태: 승인/거절 버튼 */}
                        {orderStatus === 'requested' && (
                          <>
                            <button
                              onClick={() => approveOrder(order.id)}
                              className="btn btn-primary btn-sm text-xs"
                            >
                              <CheckCircle className="w-4 h-4" />
                              승인
                            </button>
                            <button
                              onClick={() => openRejectModal(order.id)}
                              className="btn btn-outline btn-sm text-xs text-red-600 border-red-300 hover:bg-red-50"
                            >
                              <Ban className="w-4 h-4" />
                              거절
                            </button>
                          </>
                        )}

                        {/* 승인(입금대기) 상태: 입금확인/취소 버튼 */}
                        {orderStatus === 'approved' && (
                          <>
                            <button
                              onClick={() => confirmPayment(order.id)}
                              className="btn btn-primary btn-sm text-xs"
                            >
                              <Banknote className="w-4 h-4" />
                              입금확인
                            </button>
                            <button
                              onClick={() => cancelOrder(order.id)}
                              className="btn btn-outline btn-sm text-xs text-red-600 border-red-300 hover:bg-red-50"
                            >
                              <XCircle className="w-4 h-4" />
                              취소
                            </button>
                          </>
                        )}

                        {/* 예약확정 상태: 발송처리/취소 버튼 */}
                        {orderStatus === 'confirmed' && (
                          <>
                            <button
                              onClick={() => dispatchOrder(order.id)}
                              className="btn btn-secondary btn-sm text-xs"
                            >
                              <Truck className="w-4 h-4" />
                              발송처리
                            </button>
                            <button
                              onClick={() => cancelOrder(order.id)}
                              className="btn btn-outline btn-sm text-xs text-red-600 border-red-300 hover:bg-red-50"
                            >
                              <XCircle className="w-4 h-4" />
                              취소
                            </button>
                          </>
                        )}

                        {/* 발송됨 상태: 회수처리 버튼 */}
                        {orderStatus === 'dispatched' && (
                          <button
                            onClick={() => collectOrder(order.id)}
                            className="btn btn-secondary btn-sm text-xs"
                          >
                            <RotateCcw className="w-4 h-4" />
                            회수처리
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg mb-4">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">주문자 정보</p>
                        <div className="space-y-1">
                          <p className="font-medium flex items-center gap-2">
                            <User className="w-4 h-4 text-slate-400" />
                            {order.user?.name || '알 수 없음'}
                          </p>
                          <p className="text-sm flex items-center gap-2">
                            <Mail className="w-4 h-4 text-slate-400" />
                            {order.user?.email || '-'}
                          </p>
                          <p className="text-sm flex items-center gap-2">
                            <Phone className="w-4 h-4 text-slate-400" />
                            {order.user?.phone || '전화번호 없음'}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">대여 기간</p>
                        <p className="font-medium flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          {new Date(order.startDate).toLocaleDateString('ko-KR')} ~ {new Date(order.endDate).toLocaleDateString('ko-KR')}
                          <span className="text-violet-600">({days}일)</span>
                        </p>
                        <p className="text-sm flex items-center gap-2 mt-1">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          <span className="line-clamp-1">{order.shippingAddress || '직접 수령'}</span>
                        </p>
                      </div>
                    </div>

                    {/* Bank Account Info for Approved Orders */}
                    {orderStatus === 'approved' && settings?.bankAccount && (
                      <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg mb-4">
                        <div className="flex items-start gap-3">
                          <Banknote className="w-5 h-5 text-orange-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-orange-800 mb-1">입금 계좌 정보 (고객 안내용)</p>
                            <p className="text-sm text-orange-700">
                              {settings.bankAccount.bank} {settings.bankAccount.accountNumber}
                            </p>
                            <p className="text-sm text-orange-700">예금주: {settings.bankAccount.holder}</p>
                            {order.depositDeadlineAt && (
                              <p className="text-xs text-orange-600 mt-2">
                                입금 기한: {new Date(order.depositDeadlineAt).toLocaleString('ko-KR')}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Rejected Order Info */}
                    {orderStatus === 'rejected' && (order.rejectionReason || order.cancellationReason) && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-red-800 mb-1">거절 사유</p>
                            <p className="text-sm text-red-700">{order.rejectionReason || order.cancellationReason}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Rental Items */}
                    <div className="mb-4">
                      <p className="text-sm font-medium text-slate-700 mb-2">대여 상품</p>
                      <div className="space-y-2">
                        {order.items?.map((item, index) => (
                          <div key={item.id || index} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200">
                            {item.product?.images && item.product.images.length > 0 ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={item.product.images[0]}
                                alt={item.product?.title || '상품'}
                                className="w-12 h-12 object-cover rounded flex-shrink-0"
                                onError={(e) => {
                                  e.currentTarget.src = '/images/placeholder.svg';
                                }}
                              />
                            ) : (
                              <div className="w-12 h-12 bg-slate-200 rounded flex items-center justify-center flex-shrink-0">
                                <Package className="w-6 h-6 text-slate-400" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{item.product?.title || `상품 #${item.productId}`}</p>
                              <p className="text-xs text-slate-600">
                                수량: {item.quantity}개 | 일대여료: {Number(item.pricePerDay || item.product?.baseDailyPrice || 0).toLocaleString()}원
                              </p>
                            </div>
                            <p className="font-bold text-violet-600 flex-shrink-0">
                              {(Number(item.pricePerDay || item.product?.baseDailyPrice || 0) * days * item.quantity).toLocaleString()}원
                            </p>
                          </div>
                        ))}
                        {(!order.items || order.items.length === 0) && (
                          <p className="text-sm text-slate-500 text-center py-4">대여 상품 정보 없음</p>
                        )}
                      </div>
                    </div>

                    {/* Total */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                      <span className="font-medium text-slate-700">총 결제 금액</span>
                      <span className="text-2xl font-bold text-violet-600">
                        {Number(totalAmount).toLocaleString()}원
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">주문 상세</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Order Info */}
              <div>
                <h3 className="font-bold mb-3">주문 정보</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">주문번호</span>
                    <span className="font-medium">#{selectedOrder.id.slice(0, 8).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">주문일시</span>
                    <span className="font-medium">{new Date(selectedOrder.createdAt).toLocaleString('ko-KR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">주문 상태</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusInfo(selectedOrder.fulfillmentStatus || selectedOrder.status || 'requested').color}`}>
                      {getStatusInfo(selectedOrder.fulfillmentStatus || selectedOrder.status || 'requested').label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">결제 상태</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusInfo(selectedOrder.paymentStatus || 'pending').color}`}>
                      {getPaymentStatusInfo(selectedOrder.paymentStatus || 'pending').label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div>
                <h3 className="font-bold mb-3">고객 정보</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">이름</span>
                    <span className="font-medium">{selectedOrder.user?.name || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">이메일</span>
                    <span className="font-medium">{selectedOrder.user?.email || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">전화번호</span>
                    <span className="font-medium">{selectedOrder.user?.phone || '등록된 전화번호 없음'}</span>
                  </div>
                </div>
              </div>

              {/* Delivery Info */}
              <div>
                <h3 className="font-bold mb-3">배송 정보</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">배송 방법</span>
                    <span className="font-medium">{selectedOrder.deliveryMethod || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">배송비</span>
                    <span className="font-medium">{Number(selectedOrder.shippingCost).toLocaleString()}원</span>
                  </div>
                  <div>
                    <span className="text-slate-600">배송지</span>
                    <p className="font-medium mt-1 p-3 bg-slate-50 rounded">{selectedOrder.shippingAddress || '직접 수령'}</p>
                  </div>
                  {selectedOrder.deliveryNotes && (
                    <div>
                      <span className="text-slate-600">배송 메모</span>
                      <p className="font-medium mt-1 p-3 bg-slate-50 rounded">{selectedOrder.deliveryNotes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Rental Period */}
              <div>
                <h3 className="font-bold mb-3">대여 기간</h3>
                <div className="p-4 bg-violet-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-sm text-slate-600 mb-1">대여 시작</p>
                      <p className="font-bold">{new Date(selectedOrder.startDate).toLocaleDateString('ko-KR')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 mb-1">대여 종료</p>
                      <p className="font-bold">{new Date(selectedOrder.endDate).toLocaleDateString('ko-KR')}</p>
                    </div>
                  </div>
                  <p className="text-center text-violet-600 font-bold mt-3">
                    총 {calculateDays(selectedOrder.startDate, selectedOrder.endDate)}일
                  </p>
                </div>
              </div>

              {/* Payment Info */}
              <div>
                <h3 className="font-bold mb-3">결제 정보</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">결제 방법</span>
                    <span className="font-medium">{selectedOrder.paymentMethod || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">입금 기한</span>
                    <span className="font-medium">
                      {selectedOrder.depositDeadlineAt
                        ? new Date(selectedOrder.depositDeadlineAt).toLocaleString('ko-KR')
                        : '-'}
                    </span>
                  </div>
                  {selectedOrder.adminApprovedAt2 && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">입금 확인일</span>
                      <span className="font-medium text-green-600">
                        {new Date(selectedOrder.adminApprovedAt2).toLocaleString('ko-KR')}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-bold">총 결제 금액</span>
                    <span className="font-bold text-violet-600 text-lg">
                      {Number(selectedOrder.totalAmount).toLocaleString()}원
                    </span>
                  </div>
                </div>
              </div>

              {/* Cancellation Info */}
              {selectedOrder.canceledAt && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <h3 className="font-bold mb-3 text-red-800">취소 정보</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-red-600">취소일시</span>
                      <span className="font-medium">{new Date(selectedOrder.canceledAt).toLocaleString('ko-KR')}</span>
                    </div>
                    {(selectedOrder.cancellationReason || selectedOrder.rejectionReason) && (
                      <div>
                        <span className="text-red-600">취소 사유</span>
                        <p className="font-medium mt-1">{selectedOrder.cancellationReason || selectedOrder.rejectionReason}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Rejection Info */}
              {(selectedOrder.fulfillmentStatus === 'rejected' || selectedOrder.status === 'rejected') && selectedOrder.rejectionReason && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <h3 className="font-bold mb-3 text-red-800">거절 정보</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-red-600">거절 사유</span>
                      <p className="font-medium mt-1">{selectedOrder.rejectionReason}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="border-b border-slate-200 p-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Ban className="w-5 h-5 text-red-600" />
                주문 거절
              </h2>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-600 mb-4">
                주문을 거절하시려면 사유를 입력해주세요. 사유는 고객에게 전송됩니다.
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="거절 사유를 입력하세요..."
                className="input w-full h-32 resize-none"
              />
            </div>
            <div className="border-t border-slate-200 p-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectingOrderId(null);
                  setRejectReason('');
                }}
                className="btn btn-outline"
              >
                취소
              </button>
              <button
                onClick={executeReject}
                disabled={!rejectReason.trim()}
                className="btn btn-primary bg-red-600 hover:bg-red-700 disabled:bg-slate-300"
              >
                거절하기
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </AdminLayout>
  );
}
