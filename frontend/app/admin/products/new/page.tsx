'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X } from 'lucide-react';
import { adminApi, categoryApi, tagApi } from '@/lib/api';
import ImageUpload from '@/components/ImageUpload';
import AdminLayout from '@/components/AdminLayout';
import Loading from '@/components/Loading';
import Toast, { ToastType } from '@/components/Toast';
import useAdminAuth from '@/hooks/useAdminAuth';
import { Category, Tag, ProductFormData } from '@/types';

export default function NewProductPage() {
  const router = useRouter();
  const { isChecking, isAdmin } = useAdminAuth();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    title: '',
    description: '',
    categoryId: '',
    baseDailyPrice: '',
    tags: [] as string[],
    images: [] as string[],
    detailImages: [] as string[],
    status: 'active',
  });
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (!isChecking && isAdmin) {
      fetchData();
    }
  }, [isChecking, isAdmin]);

  const fetchData = async () => {
    try {
      setLoadingData(true);
      const [categoriesRes, tagsRes] = await Promise.all([
        categoryApi.getAll(),
        tagApi.getAll(),
      ]);
      setCategories(categoriesRes || []);
      setAllTags(tagsRes || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setToast({ message: '데이터를 불러오는데 실패했습니다.', type: 'error' });
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddTag = (tagId: string) => {
    if (!formData.tags.includes(tagId)) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagId],
      });
    }
  };

  const handleRemoveTag = (tagId: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(id => id !== tagId),
    });
  };

  const handleCreateNewTag = async () => {
    if (!newTag.trim()) return;

    try {
      const response = await tagApi.create({
        name: newTag,
        type: 'other',
      });

      setAllTags([...allTags, response]);
      handleAddTag(response.id);
      setNewTag('');
      setToast({ message: '새 태그가 추가되었습니다.', type: 'success' });
    } catch (error) {
      console.error('Failed to create tag:', error);
      setToast({ message: '태그 생성에 실패했습니다.', type: 'error' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.categoryId) {
      setToast({ message: '카테고리를 선택해주세요.', type: 'error' });
      return;
    }

    setLoading(true);

    try {
      await adminApi.createProduct({
        title: formData.title,
        description: formData.description,
        categoryId: formData.categoryId,
        baseDailyPrice: parseFloat(formData.baseDailyPrice),
        tagIds: formData.tags,
        images: formData.images,
        detailImages: formData.detailImages,
        status: 'active',
      });

      setToast({ message: '상품이 성공적으로 등록되었습니다.', type: 'success' });
      setTimeout(() => router.push('/admin/products'), 1500);
    } catch (error: unknown) {
      console.error('Failed to create product:', error);
      setToast({ message: (error as Error).message || '상품 등록에 실패했습니다.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (isChecking || loadingData) {
    return <Loading fullScreen message="페이지 로딩 중..." />;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">새 상품 등록</h1>
          <p className="text-slate-600">대여할 무대 장비 정보를 입력하세요</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-8">
          {/* 기본 정보 */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6">기본 정보</h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-2">
                  상품명 *
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="예: 프랑스 혁명 시대 군복"
                  className="input"
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-2">
                  상품 설명 *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="상품에 대한 자세한 설명을 입력하세요"
                  className="input resize-none"
                  rows={5}
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="categoryId" className="block text-sm font-medium text-slate-700 mb-2">
                    카테고리 *
                  </label>
                  <select
                    id="categoryId"
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleChange}
                    className="input"
                    required
                  >
                    <option value="">카테고리 선택</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="baseDailyPrice" className="block text-sm font-medium text-slate-700 mb-2">
                    일 대여료 (₩) *
                  </label>
                  <input
                    id="baseDailyPrice"
                    name="baseDailyPrice"
                    type="number"
                    value={formData.baseDailyPrice}
                    onChange={handleChange}
                    placeholder="45000"
                    className="input"
                    min="0"
                    step="1000"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 이미지 업로드 */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6">상품 이미지</h2>
            <ImageUpload
              label="메인 이미지"
              images={formData.images}
              onChange={(images) => setFormData({ ...formData, images })}
              maxImages={5}
              helperText="첫 번째 이미지가 대표 이미지로 사용됩니다. 드래그하여 순서를 변경할 수 있습니다."
            />
          </div>

          {/* 상세 이미지 업로드 */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6">상세 설명 이미지</h2>
            <ImageUpload
              label="상세 이미지"
              images={formData.detailImages}
              onChange={(detailImages) => setFormData({ ...formData, detailImages })}
              maxImages={10}
              helperText="상품 상세 페이지에 표시될 이미지들입니다. 순서대로 표시됩니다."
            />
          </div>

          {/* 태그 */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">태그</h2>
            <p className="text-sm text-slate-600 mb-4">상품을 검색하기 쉽도록 태그를 추가하세요</p>

            {/* 선택된 태그 */}
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4 p-4 bg-violet-50 rounded-lg">
                {formData.tags.map(tagId => {
                  const tag = allTags.find(t => t.id === tagId);
                  return tag ? (
                    <span key={tagId} className="inline-flex items-center gap-1 px-3 py-1 bg-violet-200 text-violet-800 rounded-full text-sm font-medium">
                      #{tag.name}
                      <button type="button" onClick={() => handleRemoveTag(tagId)} className="hover:text-violet-900">
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  ) : null;
                })}
              </div>
            )}

            {/* 태그 선택 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
              {allTags
                .filter(tag => !formData.tags.includes(tag.id))
                .map(tag => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleAddTag(tag.id)}
                    className="px-3 py-2 text-sm border border-slate-300 rounded-lg hover:border-violet-500 hover:bg-violet-50 transition-colors text-left"
                  >
                    #{tag.name}
                  </button>
                ))}
            </div>

            {/* 새 태그 추가 */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="새 태그 입력"
                className="input flex-1"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateNewTag();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleCreateNewTag}
                className="btn btn-outline whitespace-nowrap"
              >
                <Plus className="w-5 h-5" />
                태그 생성
              </button>
            </div>
          </div>

          {/* 제출 버튼 */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn btn-outline flex-1"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary flex-1"
            >
              {loading ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  등록 중...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  상품 등록
                </>
              )}
            </button>
          </div>
        </form>

        {/* 안내 메시지 */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>안내:</strong> 상품 등록 후 수정 페이지에서 자산(Asset) 정보와 예약 차단 기간을 추가할 수 있습니다.
          </p>
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
