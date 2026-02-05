'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  ArrowUpRight,
  Calendar
} from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import Loading from '@/components/Loading';
import Toast, { ToastType } from '@/components/Toast';
import useAdminAuth from '@/hooks/useAdminAuth';
import { adminApi } from '@/lib/api';
import { DashboardStats, AdminOrder, Product } from '@/types';

export default function AdminDashboardPage() {
  const { isChecking, isAdmin } = useAdminAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  useEffect(() => {
    if (!isChecking && isAdmin) {
      fetchStats();
    }
  }, [isChecking, isAdmin]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getDashboardStats();
      setStats(data as DashboardStats);
    } catch (error: unknown) {
      console.error('Failed to fetch stats:', error);
      setToast({
        message: '통계 데이터를 불러오는데 실패했습니다.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  if (isChecking || loading) {
    return <Loading fullScreen message="데이터 로딩 중..." />;
  }

  if (!isAdmin) {
    return null;
  }

  const statCards = [
    {
      title: '전체 상품',
      value: stats?.totalProducts || 0,
      subtitle: `활성: ${stats?.activeProducts || 0}개`,
      icon: Package,
      color: 'violet',
      link: '/admin/products'
    },
    {
      title: '전체 주문',
      value: stats?.totalOrders || 0,
      subtitle: `대기: ${stats?.pendingOrders || 0}개`,
      icon: ShoppingCart,
      color: 'blue',
      link: '/admin/orders'
    },
    {
      title: '사용자',
      value: stats?.totalUsers || 0,
      subtitle: '전체 사용자',
      icon: Users,
      color: 'green',
      link: '/admin/users'
    },
    {
      title: '총 매출',
      value: `${(stats?.totalRevenue || 0).toLocaleString()}원`,
      subtitle: '누적 매출',
      icon: DollarSign,
      color: 'pink',
      link: '/admin/orders'
    }
  ];

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { label: '대기중', color: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: '확인됨', color: 'bg-blue-100 text-blue-800' },
      preparing: { label: '준비중', color: 'bg-purple-100 text-purple-800' },
      in_use: { label: '사용중', color: 'bg-green-100 text-green-800' },
      completed: { label: '완료', color: 'bg-slate-100 text-slate-800' },
      cancelled: { label: '취소됨', color: 'bg-red-100 text-red-800' },
    };
    const badge = badges[status as keyof typeof badges] || { label: status, color: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">관리자 대시보드</h1>
          <p className="text-sm sm:text-base text-slate-600">Stage Rental 서비스 관리</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.title}
                href={card.link}
                className="card p-4 sm:p-6 hover:shadow-xl transition-all transform hover:-translate-y-1"
              >
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div
                    className={`p-2 sm:p-3 bg-gradient-to-r from-${card.color}-500 to-${card.color}-600 rounded-lg`}
                  >
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                </div>
                <h3 className="text-xs sm:text-sm font-medium text-slate-600 mb-1">{card.title}</h3>
                <p className="text-xl sm:text-2xl font-bold mb-1">{card.value}</p>
                <p className="text-xs text-slate-500">{card.subtitle}</p>
              </Link>
            );
          })}
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Recent Orders */}
          <div className="card overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-violet-600" />
                  <span className="hidden sm:inline">최근 주문</span>
                  <span className="sm:hidden">주문</span>
                </h2>
                <Link href="/admin/orders" className="text-xs sm:text-sm text-violet-600 hover:text-violet-700 font-medium">
                  전체 보기
                </Link>
              </div>
            </div>
            <div className="divide-y divide-slate-200 overflow-x-auto">
              {stats?.recentOrders && stats.recentOrders.length > 0 ? (
                stats.recentOrders.slice(0, 5).map((order: AdminOrder) => (
                  <Link
                    key={order.id}
                    href={`/admin/orders`}
                    className="p-3 sm:p-4 hover:bg-violet-50 transition-colors block"
                  >
                    <div className="flex items-start justify-between mb-2 gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-xs sm:text-sm truncate">주문 #{order.id.slice(0, 8)}</p>
                        <p className="text-xs text-slate-600 truncate">
                          {order.user?.name || '사용자'} • {order.totalPrice?.toLocaleString()}원
                        </p>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Calendar className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{new Date(order.createdAt).toLocaleDateString('ko-KR')}</span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="p-6 sm:p-8 text-center text-slate-500">
                  <ShoppingCart className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm">최근 주문이 없습니다</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Products */}
          <div className="card overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                  <Package className="w-4 h-4 sm:w-5 sm:h-5 text-violet-600" />
                  <span className="hidden sm:inline">최근 등록 상품</span>
                  <span className="sm:hidden">상품</span>
                </h2>
                <Link href="/admin/products" className="text-xs sm:text-sm text-violet-600 hover:text-violet-700 font-medium">
                  전체 보기
                </Link>
              </div>
            </div>
            <div className="divide-y divide-slate-200 overflow-x-auto">
              {stats?.recentProducts && stats.recentProducts.length > 0 ? (
                stats.recentProducts.slice(0, 5).map((product: Product) => (
                  <Link
                    key={product.id}
                    href={`/admin/products`}
                    className="p-3 sm:p-4 hover:bg-violet-50 transition-colors block"
                  >
                    <div className="flex gap-2 sm:gap-3">
                      {product.images && product.images.length > 0 ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.images[0]}
                          alt={product.title}
                          className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-lg flex-shrink-0"
                          onError={(e) => {
                            e.currentTarget.src = '/images/placeholder.svg';
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-200 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Package className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs sm:text-sm truncate">{product.title}</p>
                        <p className="text-xs text-slate-600">{product.baseDailyPrice?.toLocaleString()}원/일</p>
                        <p className="text-xs text-slate-500 hidden sm:block">
                          {new Date(product.createdAt).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium h-fit flex-shrink-0 ${
                        product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {product.status === 'active' ? '활성' : '비활성'}
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="p-6 sm:p-8 text-center text-slate-500">
                  <Package className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm">등록된 상품이 없습니다</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Order Status Summary */}
        <div className="card mt-4 sm:mt-6 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-violet-600" />
            주문 현황
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="p-3 sm:p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 flex-shrink-0" />
                <span className="font-medium text-sm sm:text-base text-yellow-800">대기중</span>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-yellow-900">{stats?.pendingOrders || 0}</p>
            </div>
            <div className="p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                <span className="font-medium text-sm sm:text-base text-blue-800">확인됨</span>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-blue-900">{stats?.confirmedOrders || 0}</p>
            </div>
            <div className="p-3 sm:p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
                <span className="font-medium text-sm sm:text-base text-green-800">완료</span>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-green-900">{stats?.completedOrders || 0}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card mt-4 sm:mt-6 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">빠른 작업</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <Link href="/admin/products/new" className="btn btn-primary text-sm sm:text-base">
              <Package className="w-4 h-4 sm:w-5 sm:h-5" />
              새 상품 등록
            </Link>
            <Link href="/admin/orders" className="btn btn-secondary text-sm sm:text-base">
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
              주문 관리
            </Link>
            <Link href="/admin/categories" className="btn btn-outline text-sm sm:text-base">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
              카테고리 관리
            </Link>
          </div>
        </div>
      </div>

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
