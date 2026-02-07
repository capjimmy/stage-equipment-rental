'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Package, Settings, LogOut, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { User as UserType } from '@/types';
import { useOrders } from '@/hooks/useOrders';
import OrdersSection from '@/components/OrdersSection';
import ProfileSection from '@/components/ProfileSection';

export default function MyPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'profile'>('orders');
  const [isAdmin, setIsAdmin] = useState(false);

  const { orders, loading, confirmPayment, cancelOrder, dispatchOrder, collectOrder } = useOrders(isAdmin);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAdmin(parsedUser.role === 'admin');
      } catch {
        router.push('/login');
      }
    }
  }, [router]);

  const handleViewOrderDetail = (orderId: string | number) => {
    console.log('[MyPage] handleViewOrderDetail called with orderId:', orderId);
    router.push(`/order/${orderId}`);
  };

  const handleLogout = () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      router.push('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mb-4"></div>
          <p className="text-slate-600">정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50">
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
        <div className="grid lg:grid-cols-4 gap-8">
          {/* 사이드바 */}
          <div className="lg:col-span-1">
            <div className="card p-6">
              {/* 사용자 정보 */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-violet-500 to-pink-500 rounded-full mb-4">
                  <User className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-xl font-bold mb-1">{user.name}</h2>
                <p className="text-sm text-slate-600">{user.email}</p>
              </div>

              {/* 메뉴 */}
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'orders'
                      ? 'bg-violet-50 text-violet-700 font-medium'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Package className="w-5 h-5" />
                  대여 내역
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'profile'
                      ? 'bg-violet-50 text-violet-700 font-medium'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Settings className="w-5 h-5" />
                  프로필 설정
                </button>

                {/* 관리자 전용 메뉴 */}
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 hover:bg-violet-50 hover:text-violet-700 transition-colors"
                  >
                    <Settings className="w-5 h-5" />
                    관리자 설정
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  로그아웃
                </button>
              </nav>
            </div>
          </div>

          {/* 메인 콘텐츠 */}
          <div className="lg:col-span-3">
            {activeTab === 'orders' ? (
              <div>
                <h1 className="text-3xl font-bold mb-6">대여 내역</h1>
                <OrdersSection
                  orders={orders}
                  isAdmin={isAdmin}
                  onConfirmPayment={confirmPayment}
                  onCancelOrder={cancelOrder}
                  onDispatchOrder={dispatchOrder}
                  onCollectOrder={collectOrder}
                  onViewOrderDetail={handleViewOrderDetail}
                />
              </div>
            ) : (
              <div>
                <h1 className="text-3xl font-bold mb-6">프로필 설정</h1>
                <ProfileSection user={user} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
