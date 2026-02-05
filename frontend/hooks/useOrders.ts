import { useState, useEffect } from 'react';
import { orderApi, adminApi } from '@/lib/api';
import { Order, AdminOrder } from '@/types';

// Unified order type for display
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

// Convert Order/AdminOrder to DisplayOrder
const toDisplayOrder = (order: Order | AdminOrder): DisplayOrder => {
  // Handle both Order (has totalAmount as string, fulfillmentStatus) and AdminOrder (has totalPrice as number, status)
  const amount = 'totalPrice' in order
    ? order.totalPrice
    : parseFloat((order as Order).totalAmount || '0');

  const status = 'status' in order
    ? order.status
    : (order as Order).fulfillmentStatus || 'requested';

  const items = 'items' in order
    ? order.items
    : [];

  return {
    id: String(order.id),
    createdAt: order.createdAt || '',
    totalAmount: amount,
    status: status,
    items: items,
    startDate: 'startDate' in order ? order.startDate : undefined,
    endDate: 'endDate' in order ? order.endDate : undefined,
    user: (order as AdminOrder).user,
  };
};

export function useOrders(isAdmin: boolean) {
  const [orders, setOrders] = useState<DisplayOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const userData = localStorage.getItem('user');
      const parsedUser = userData ? JSON.parse(userData) : null;

      // 관리자인 경우 모든 주문 조회, 일반 사용자는 자신의 주문만 조회
      if (parsedUser?.role === 'admin') {
        const ordersData = await adminApi.getAllOrders();
        setOrders(ordersData.map(toDisplayOrder));
      } else {
        const ordersData = await orderApi.getMyOrders();
        setOrders(ordersData.map(toDisplayOrder));
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [isAdmin]);

  const confirmPayment = async (orderId: string | number) => {
    if (!confirm('입금을 확인하셨습니까? 확인 시 예약이 확정됩니다.')) {
      return;
    }

    try {
      await adminApi.updateOrderStatus(String(orderId), 'confirmed');
      alert('입금이 확인되었습니다. 예약이 확정되었습니다.');
      fetchOrders();
    } catch (error) {
      console.error('Failed to confirm payment:', error);
      alert('입금 확인 중 오류가 발생했습니다.');
    }
  };

  const cancelOrder = async (orderId: string | number) => {
    const reason = prompt('취소 사유를 입력해주세요:');
    if (!reason) {
      return;
    }

    try {
      await orderApi.cancel(String(orderId), reason);
      alert('주문이 취소되었습니다. 예약 날짜가 다시 열렸습니다.');
      fetchOrders();
    } catch (error) {
      console.error('Failed to cancel order:', error);
      alert('주문 취소 중 오류가 발생했습니다.');
    }
  };

  const dispatchOrder = async (orderId: string | number) => {
    if (!confirm('상품을 발송하시겠습니까?')) {
      return;
    }

    try {
      await adminApi.updateOrderStatus(String(orderId), 'dispatched');
      alert('상품이 발송되었습니다.');
      fetchOrders();
    } catch (error) {
      console.error('Failed to dispatch order:', error);
      alert('상품 발송 중 오류가 발생했습니다.');
    }
  };

  const collectOrder = async (orderId: string | number) => {
    if (!confirm('상품을 회수하시겠습니까?')) {
      return;
    }

    try {
      await adminApi.updateOrderStatus(String(orderId), 'completed');
      alert('상품이 회수되었습니다.');
      fetchOrders();
    } catch (error) {
      console.error('Failed to collect order:', error);
      alert('상품 회수 중 오류가 발생했습니다.');
    }
  };

  return {
    orders,
    loading,
    confirmPayment,
    cancelOrder,
    dispatchOrder,
    collectOrder,
    refetch: fetchOrders,
  };
}
