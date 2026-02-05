'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User, Package, Settings, LogOut, ArrowLeft, BoxIcon, PlusCircle, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { User as UserType, Product } from '@/types';
import { useOrders } from '@/hooks/useOrders';
import OrdersSection from '@/components/OrdersSection';
import ProfileSection from '@/components/ProfileSection';
import { productApi, adminApi } from '@/lib/api';

export default function MyPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'profile' | 'products'>('orders');
  const [isAdmin, setIsAdmin] = useState(false);
  const [productStats, setProductStats] = useState({
    total: 0,
    available: 0,
    rented: 0,
    outOfStock: 0,
  });
  const [products, setProducts] = useState<Product[]>([]);

  const { orders, loading, confirmPayment, cancelOrder, dispatchOrder, collectOrder } = useOrders(isAdmin);

  const fetchProducts = useCallback(async () => {
    try {
      const data = await adminApi.getAllProducts();
      setProducts(data);
      const total = data.length;
      const available = data.filter((p: Product) => p.status === 'active').length;
      setProductStats({ total, available, rented: 0, outOfStock: 0 });
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reading from localStorage on mount
      setUser(parsedUser);
      setIsAdmin(parsedUser.role === 'admin');
      if (parsedUser.role === 'admin') {
        fetchProducts();
      }
    }
  }, [router, fetchProducts]);

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('정말 이 상품을 삭제하시겠습니까?')) return;
    try {
      await adminApi.deleteProduct(productId);
      alert('상품이 삭제되었습니다.');
      fetchProducts();
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('상품 삭제 중 오류가 발생했습니다.');
    }
  };

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
                  <>
                    <button
                      onClick={() => setActiveTab('products')}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        activeTab === 'products'
                          ? 'bg-violet-50 text-violet-700 font-medium'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <BoxIcon className="w-5 h-5" />
                      상품 관리
                    </button>
                    <Link
                      href="/admin/categories"
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Settings className="w-5 h-5" />
                      카테고리 관리
                    </Link>
                  </>
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
            {activeTab === 'products' ? (
              <div>
                <h1 className="text-3xl font-bold mb-6">상품 관리</h1>

                <div className="grid md:grid-cols-3 gap-4">
                  {/* 상품 등록 */}
                  <Link
                    href="/admin/products/new"
                    className="card p-6 hover:shadow-lg transition-shadow cursor-pointer group"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <PlusCircle className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">상품 등록</h3>
                        <p className="text-sm text-slate-600">새로운 상품 추가</p>
                      </div>
                    </div>
                    <p className="text-slate-600 text-sm">
                      대여할 새로운 장비를 시스템에 등록하고 상세 정보를 입력합니다.
                    </p>
                  </Link>

                  {/* 상품 관리 (전체) */}
                  <Link
                    href="/admin/products"
                    className="card p-6 hover:shadow-lg transition-shadow cursor-pointer group"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Edit className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">상품 관리</h3>
                        <p className="text-sm text-slate-600">상품 수정/삭제</p>
                      </div>
                    </div>
                    <p className="text-slate-600 text-sm">
                      등록된 상품의 정보 수정, 상태 변경, 삭제 등을 관리합니다.
                    </p>
                  </Link>

                  {/* 관리자 대시보드 */}
                  <Link
                    href="/admin"
                    className="card p-6 hover:shadow-lg transition-shadow cursor-pointer group"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <BoxIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">관리자 대시보드</h3>
                        <p className="text-sm text-slate-600">전체 현황 보기</p>
                      </div>
                    </div>
                    <p className="text-slate-600 text-sm">
                      주문, 상품, 사용자 현황을 한눈에 확인합니다.
                    </p>
                  </Link>
                </div>

                {/* 빠른 통계 */}
                <div className="mt-8">
                  <h2 className="text-xl font-bold mb-4">통계</h2>
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="card p-4">
                      <p className="text-sm text-slate-600 mb-1">전체 상품</p>
                      <p className="text-2xl font-bold text-violet-600">{productStats.total}</p>
                    </div>
                    <div className="card p-4">
                      <p className="text-sm text-slate-600 mb-1">대여 가능</p>
                      <p className="text-2xl font-bold text-green-600">{productStats.available}</p>
                    </div>
                    <div className="card p-4">
                      <p className="text-sm text-slate-600 mb-1">대여 중</p>
                      <p className="text-2xl font-bold text-blue-600">{productStats.rented}</p>
                    </div>
                    <div className="card p-4">
                      <p className="text-sm text-slate-600 mb-1">품절</p>
                      <p className="text-2xl font-bold text-red-600">{productStats.outOfStock}</p>
                    </div>
                  </div>
                </div>

                {/* 상품 목록 */}
                <div className="mt-8">
                  <h2 className="text-xl font-bold mb-4">전체 상품 목록</h2>
                  <div className="space-y-3">
                    {products.map((product) => (
                      <div key={product.id} className="card p-4 flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold">{product.title}</h3>
                          <p className="text-sm text-slate-600">{product.description}</p>
                          <p className="text-sm text-violet-600 font-medium mt-1">
                            {product.baseDailyPrice?.toLocaleString()}원/일
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Link
                            href={`/admin/products/${product.id}/edit`}
                            className="btn btn-secondary"
                          >
                            수정
                          </Link>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="btn bg-red-500 hover:bg-red-600 text-white"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    ))}
                    {products.length === 0 && (
                      <div className="card p-8 text-center text-slate-500">
                        등록된 상품이 없습니다.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : activeTab === 'orders' ? (
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
