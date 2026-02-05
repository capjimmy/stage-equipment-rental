'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
  Box
} from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import Loading from '@/components/Loading';
import Toast, { ToastType } from '@/components/Toast';
import useAdminAuth from '@/hooks/useAdminAuth';
import { adminApi, categoryApi } from '@/lib/api';
import { Product, Category } from '@/types';

export default function AdminProductsPage() {
  const { isChecking, isAdmin } = useAdminAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsData, categoriesData] = await Promise.all([
        adminApi.getAllProducts({
          status: statusFilter !== 'all' ? statusFilter : undefined,
          categoryId: categoryFilter !== 'all' ? categoryFilter : undefined,
        }),
        categoryApi.getAll(),
      ]);
      setProducts((productsData || []) as Product[]);
      setCategories(categoriesData || []);
    } catch (error: unknown) {
      console.error('Failed to fetch data:', error);
      setToast({
        message: '데이터를 불러오는데 실패했습니다.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isChecking && isAdmin) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isChecking, isAdmin, statusFilter, categoryFilter]);

  const handleStatusChange = async (productId: string, newStatus: string) => {
    try {
      await adminApi.updateProductStatus(productId, newStatus);
      setToast({
        message: '상품 상태가 변경되었습니다.',
        type: 'success'
      });
      fetchData();
    } catch (error: unknown) {
      console.error('Failed to update status:', error);
      setToast({
        message: (error as { response?: { data?: { message?: string } } }).response?.data?.message || '상태 변경에 실패했습니다.',
        type: 'error'
      });
    }
  };

  const handleDelete = async (productId: string, productTitle: string) => {
    if (!confirm(`"${productTitle}" 상품을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await adminApi.deleteProduct(productId);
      setToast({
        message: '상품이 삭제되었습니다.',
        type: 'success'
      });
      fetchData();
    } catch (error: unknown) {
      console.error('Failed to delete product:', error);
      setToast({
        message: (error as { response?: { data?: { message?: string } } }).response?.data?.message || '상품 삭제에 실패했습니다.',
        type: 'error'
      });
    }
  };

  const filteredProducts = products.filter(product =>
    product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const badges = {
      active: { label: '활성', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
      inactive: { label: '비활성', icon: XCircle, color: 'bg-slate-100 text-slate-800' },
      maintenance: { label: '정비중', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
    };
    const badge = badges[status as keyof typeof badges] || { label: status, icon: Box, color: 'bg-gray-100 text-gray-800' };
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  };

  if (isChecking || loading) {
    return <Loading fullScreen message="상품 목록 로딩 중..." />;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">상품 관리</h1>
            <p className="text-sm sm:text-base text-slate-600">전체 {filteredProducts.length}개 상품</p>
          </div>
          <Link href="/admin/products/new" className="btn btn-primary text-sm sm:text-base w-full sm:w-auto">
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            새 상품 등록
          </Link>
        </div>

        {/* Filters */}
        <div className="card p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
              <input
                type="text"
                placeholder="상품명, 설명 검색..."
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
                <option value="active">활성</option>
                <option value="inactive">비활성</option>
                <option value="maintenance">정비중</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="input pl-9 sm:pl-10 text-sm sm:text-base"
              >
                <option value="all">전체 카테고리</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Products List */}
        {filteredProducts.length === 0 ? (
          <div className="card p-8 sm:p-12 text-center">
            <Package className="w-16 h-16 sm:w-24 sm:h-24 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl font-bold mb-2">상품이 없습니다</h2>
            <p className="text-sm sm:text-base text-slate-600 mb-6">
              {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
                ? '검색 조건에 맞는 상품이 없습니다.'
                : '새 상품을 등록해보세요.'
              }
            </p>
            {!searchQuery && statusFilter === 'all' && categoryFilter === 'all' && (
              <Link href="/admin/products/new" className="btn btn-primary text-sm sm:text-base">
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                첫 상품 등록하기
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4">
            {filteredProducts.map(product => (
              <div key={product.id} className="card hover:shadow-lg transition-shadow">
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    {/* Image */}
                    {product.images && product.images.length > 0 ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.images[0]}
                        alt={product.title}
                        className="w-full sm:w-16 md:w-24 h-48 sm:h-16 md:h-24 object-cover rounded-lg flex-shrink-0"
                        onError={(e) => {
                          e.currentTarget.src = '/images/placeholder.svg';
                        }}
                      />
                    ) : (
                      <div className="w-full sm:w-16 md:w-24 h-48 sm:h-16 md:h-24 bg-slate-200 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Package className="w-12 h-12 sm:w-8 sm:h-8 md:w-12 md:h-12 text-slate-400" />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 sm:gap-4 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg font-bold mb-1 truncate">{product.title}</h3>
                          <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 mb-2">
                            {product.description}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span className="px-2 py-1 bg-violet-100 text-violet-800 rounded font-medium">
                              {product.category?.name || '카테고리 없음'}
                            </span>
                            <span>자산: {product.assets?.length || 0}개</span>
                            <span className="hidden sm:inline">•</span>
                            <span className="hidden sm:inline">{new Date(product.createdAt).toLocaleDateString('ko-KR')}</span>
                          </div>
                        </div>
                        {getStatusBadge(product.status)}
                      </div>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-3 border-t border-slate-200 gap-3">
                        <div>
                          <p className="text-xl sm:text-2xl font-bold text-violet-600">
                            {product.baseDailyPrice.toLocaleString()}원
                            <span className="text-xs sm:text-sm text-slate-600 font-normal ml-1">/일</span>
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 w-full sm:w-auto">
                          <Link
                            href={`/product/${product.id}`}
                            target="_blank"
                            className="btn btn-outline btn-sm flex-1 sm:flex-none text-xs sm:text-sm"
                          >
                            <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">보기</span>
                          </Link>
                          <Link
                            href={`/admin/products/${product.id}/edit`}
                            className="btn btn-secondary btn-sm flex-1 sm:flex-none text-xs sm:text-sm"
                          >
                            <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                            수정
                          </Link>

                          {/* Status Menu */}
                          <div className="relative flex-1 sm:flex-none">
                            <button
                              onClick={() => setShowActionMenu(showActionMenu === product.id ? null : product.id)}
                              className="btn btn-outline btn-sm w-full sm:w-auto text-xs sm:text-sm"
                            >
                              <MoreVertical className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>

                            {showActionMenu === product.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setShowActionMenu(null)}
                                />
                                <div className="absolute right-0 mt-2 w-40 sm:w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-20">
                                  <button
                                    onClick={() => {
                                      handleStatusChange(product.id, 'active');
                                      setShowActionMenu(null);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-green-50 text-green-700 flex items-center gap-2"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    활성화
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleStatusChange(product.id, 'inactive');
                                      setShowActionMenu(null);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 text-slate-700 flex items-center gap-2"
                                  >
                                    <XCircle className="w-4 h-4" />
                                    비활성화
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleStatusChange(product.id, 'maintenance');
                                      setShowActionMenu(null);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-yellow-50 text-yellow-700 flex items-center gap-2"
                                  >
                                    <Clock className="w-4 h-4" />
                                    정비중으로 변경
                                  </button>
                                  <hr className="my-2" />
                                  <button
                                    onClick={() => {
                                      handleDelete(product.id, product.title);
                                      setShowActionMenu(null);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-700 flex items-center gap-2"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    삭제
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
