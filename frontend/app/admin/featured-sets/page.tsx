'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Star, ArrowUp, ArrowDown, Eye, EyeOff } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import Loading from '@/components/Loading';
import Toast, { ToastType } from '@/components/Toast';
import useAdminAuth from '@/hooks/useAdminAuth';
import { featuredSetApi, productApi, uploadImage } from '@/lib/api';
import { Product } from '@/types';

interface FeaturedSet {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  productIds: string[];
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function FeaturedSetsManagementPage() {
  const { isChecking, isAdmin } = useAdminAuth();
  const [featuredSets, setFeaturedSets] = useState<FeaturedSet[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSet, setEditingSet] = useState<FeaturedSet | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    order: 0,
    isActive: true,
  });

  useEffect(() => {
    if (!isChecking && isAdmin) {
      fetchData();
    }
  }, [isChecking, isAdmin]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [setsData, productsData] = await Promise.all([
        featuredSetApi.getAll(),
        productApi.getAll(),
      ]);
      setFeaturedSets(setsData || []);
      setProducts(productsData || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setToast({ message: '데이터를 불러오는데 실패했습니다.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setToast({ message: '세트 이름을 입력해주세요.', type: 'error' });
      return;
    }

    try {
      let imageUrl = formData.imageUrl;

      // Upload image if new file selected
      if (imageFile) {
        imageUrl = await uploadImage(imageFile, 'featured-sets');
      }

      const setData = {
        title: formData.title,
        description: formData.description,
        imageUrl: imageUrl || '/images/placeholder.svg',
        productIds: selectedProducts,
        order: formData.order,
        isActive: formData.isActive,
      };

      if (editingSet) {
        await featuredSetApi.update(editingSet.id, setData);
        setToast({ message: '연출세트가 수정되었습니다.', type: 'success' });
      } else {
        await featuredSetApi.create(setData);
        setToast({ message: '연출세트가 생성되었습니다.', type: 'success' });
      }

      resetForm();
      fetchData();
    } catch (error) {
      console.error('Failed to save featured set:', error);
      setToast({ message: '연출세트 저장 중 오류가 발생했습니다.', type: 'error' });
    }
  };

  const handleEdit = (set: FeaturedSet) => {
    setEditingSet(set);
    setFormData({
      title: set.title,
      description: set.description,
      imageUrl: set.imageUrl,
      order: set.order,
      isActive: set.isActive,
    });
    setSelectedProducts(set.productIds || []);
    setImagePreview(set.imageUrl);
    setShowAddForm(true);
  };

  const handleDelete = async (setId: string) => {
    if (!confirm('정말 이 연출세트를 삭제하시겠습니까?')) {
      return;
    }

    try {
      await featuredSetApi.delete(setId);
      setToast({ message: '연출세트가 삭제되었습니다.', type: 'success' });
      fetchData();
    } catch (error) {
      console.error('Failed to delete featured set:', error);
      setToast({ message: '연출세트 삭제 중 오류가 발생했습니다.', type: 'error' });
    }
  };

  const handleToggleActive = async (set: FeaturedSet) => {
    try {
      await featuredSetApi.update(set.id, { isActive: !set.isActive });
      setToast({
        message: set.isActive ? '연출세트가 비활성화되었습니다.' : '연출세트가 활성화되었습니다.',
        type: 'success'
      });
      fetchData();
    } catch (error) {
      console.error('Failed to toggle active:', error);
      setToast({ message: '상태 변경에 실패했습니다.', type: 'error' });
    }
  };

  const handleOrderChange = async (set: FeaturedSet, direction: 'up' | 'down') => {
    const newOrder = direction === 'up' ? set.order - 1 : set.order + 1;
    if (newOrder < 0) return;

    try {
      await featuredSetApi.update(set.id, { order: newOrder });
      fetchData();
    } catch (error) {
      console.error('Failed to change order:', error);
    }
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const resetForm = () => {
    setShowAddForm(false);
    setEditingSet(null);
    setFormData({
      title: '',
      description: '',
      imageUrl: '',
      order: featuredSets.length,
      isActive: true,
    });
    setSelectedProducts([]);
    setImageFile(null);
    setImagePreview('');
  };

  if (isChecking || loading) {
    return <Loading fullScreen message="연출세트 로딩 중..." />;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <Star className="w-10 h-10 text-violet-600" />
              추천 연출세트 관리
            </h1>
            <p className="text-slate-600">홈페이지에 표시되는 추천 연출세트를 관리합니다</p>
          </div>
          <button
            onClick={() => {
              setFormData({ ...formData, order: featuredSets.length });
              setShowAddForm(!showAddForm);
            }}
            className="btn btn-primary"
          >
            <Plus className="w-5 h-5" />
            새 연출세트
          </button>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="card p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">
              {editingSet ? '연출세트 수정' : '새 연출세트 추가'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    세트 이름 *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input"
                    placeholder="예: 바람과 함께 사라지다 풀세트"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    표시 순서
                  </label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                    className="input"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  설명
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                  rows={3}
                  placeholder="세트에 대한 설명을 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  대표 이미지
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="input"
                />
                {imagePreview && (
                  <div className="mt-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover rounded-lg" />
                  </div>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium text-slate-700">활성화 (홈페이지에 표시)</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  포함 상품 선택
                </label>
                <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg p-2">
                  {products.length === 0 ? (
                    <p className="text-slate-500 text-center py-4">등록된 상품이 없습니다</p>
                  ) : (
                    <div className="space-y-2">
                      {products.map(product => (
                        <label
                          key={product.id}
                          className={`flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-slate-50 ${
                            selectedProducts.includes(product.id) ? 'bg-violet-50' : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(product.id)}
                            onChange={() => toggleProductSelection(product.id)}
                            className="w-4 h-4"
                          />
                          {product.images?.[0] && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={product.images[0]}
                              alt={product.title}
                              className="w-10 h-10 object-cover rounded"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{product.title}</p>
                            <p className="text-xs text-slate-500">{product.baseDailyPrice?.toLocaleString()}원/일</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  선택된 상품: {selectedProducts.length}개
                </p>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={resetForm} className="btn btn-outline flex-1">
                  취소
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  {editingSet ? '수정' : '추가'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Featured Sets List */}
        <div className="space-y-4">
          {featuredSets.length === 0 ? (
            <div className="card p-12 text-center">
              <Star className="w-24 h-24 text-slate-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">추천 연출세트가 없습니다</h2>
              <p className="text-slate-600 mb-6">새 연출세트를 추가해보세요</p>
            </div>
          ) : (
            featuredSets.map((set) => (
              <div key={set.id} className={`card ${!set.isActive ? 'opacity-60' : ''}`}>
                <div className="p-6 flex gap-4">
                  {/* Image */}
                  {set.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={set.imageUrl}
                      alt={set.title}
                      className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-slate-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Star className="w-8 h-8 text-slate-400" />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
                          {set.title}
                          {!set.isActive && (
                            <span className="text-xs px-2 py-1 bg-slate-200 text-slate-600 rounded">비활성</span>
                          )}
                        </h3>
                        <p className="text-sm text-slate-600">{set.description}</p>
                      </div>
                      <span className="text-sm text-slate-500">순서: {set.order}</span>
                    </div>

                    <p className="text-sm text-slate-500 mb-3">
                      포함 상품: {set.productIds?.length || 0}개
                    </p>

                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => handleOrderChange(set, 'up')}
                        className="btn btn-outline btn-sm"
                        disabled={set.order === 0}
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOrderChange(set, 'down')}
                        className="btn btn-outline btn-sm"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(set)}
                        className={`btn btn-sm ${set.isActive ? 'btn-outline' : 'btn-secondary'}`}
                      >
                        {set.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        {set.isActive ? '비활성화' : '활성화'}
                      </button>
                      <button
                        onClick={() => handleEdit(set)}
                        className="btn btn-secondary btn-sm"
                      >
                        <Edit className="w-4 h-4" />
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(set.id)}
                        className="btn bg-red-500 hover:bg-red-600 text-white btn-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
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
