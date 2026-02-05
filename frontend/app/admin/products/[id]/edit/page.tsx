'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { productApi, categoryApi, tagApi, adminApi } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import Loading from '@/components/Loading';
import Toast, { ToastType } from '@/components/Toast';
import useAdminAuth from '@/hooks/useAdminAuth';
import { Category, Tag, Asset, BlockedPeriod, AssetBlockedPeriod, ProductFormData } from '@/types';
import ProductForm from '@/components/admin/ProductForm';
import AssetsManagement from '@/components/admin/AssetsManagement';
import BlockedPeriodsManagement from '@/components/admin/BlockedPeriodsManagement';
import { uploadImage } from '@/lib/firebaseService';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const { isChecking, isAdmin } = useAdminAuth();
  const [loading, setLoading] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [blockedPeriods, setBlockedPeriods] = useState<BlockedPeriod[]>([]);
  const [selectedAssetForBlocked, setSelectedAssetForBlocked] = useState<Asset | null>(null);
  const [assetBlockedPeriods, setAssetBlockedPeriods] = useState<AssetBlockedPeriod[]>([]);
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

  const fetchData = async () => {
    try {
      setLoadingProduct(true);
      const [product, categoriesRes, tagsRes, assetsRes, blockedPeriodsRes] = await Promise.all([
        productApi.getById(productId),
        categoryApi.getAll(),
        tagApi.getAll(),
        adminApi.getAssets(productId).catch(() => []),
        adminApi.getBlockedPeriods(productId).catch(() => []),
      ]);
      setCategories(categoriesRes || []);
      setAllTags(tagsRes || []);
      setAssets(assetsRes || []);
      setBlockedPeriods(blockedPeriodsRes || []);

      setFormData({
        title: product.title || '',
        description: product.description || '',
        categoryId: product.categoryId || '',
        baseDailyPrice: product.baseDailyPrice?.toString() || '',
        tags: product.tags?.map((t: Tag) => t.id) || [],
        images: product.images || [],
        detailImages: product.detailImages || [],
        status: product.status || 'active',
      });

      setLoadingProduct(false);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setToast({ message: '상품 정보를 불러오는데 실패했습니다.', type: 'error' });
      router.back();
    }
  };

  useEffect(() => {
    if (!isChecking && isAdmin) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isChecking, isAdmin, productId]);

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
      alert('새 태그가 추가되었습니다!');
    } catch (error) {
      console.error('Failed to create tag:', error);
      alert('태그 생성에 실패했습니다.');
    }
  };

  const handleAddAsset = async (data: { assetCode: string; serialNumber?: string; conditionGrade?: string; images?: string[]; notes?: string }) => {
    if (!data.assetCode.trim()) {
      setToast({ message: '자산 코드를 입력하세요.', type: 'error' });
      return;
    }

    try {
      await adminApi.createAssetWithCode(productId, data);
      setToast({ message: '자산이 추가되었습니다.', type: 'success' });
      fetchData();
    } catch (error: unknown) {
      console.error('Failed to add asset:', error);
      setToast({ message: (error as { response?: { data?: { message?: string } } }).response?.data?.message || '자산 추가에 실패했습니다.', type: 'error' });
    }
  };

  const handleUpdateAsset = async (assetId: string, data: Partial<Asset>) => {
    try {
      await adminApi.updateAssetById(productId, assetId, data);
      setToast({ message: '자산이 수정되었습니다.', type: 'success' });
      fetchData();
    } catch (error: unknown) {
      console.error('Failed to update asset:', error);
      setToast({ message: (error as { response?: { data?: { message?: string } } }).response?.data?.message || '자산 수정에 실패했습니다.', type: 'error' });
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    try {
      await adminApi.deleteAssetById(productId, assetId);
      setToast({ message: '자산이 삭제되었습니다.', type: 'success' });
      fetchData();
    } catch (error: unknown) {
      console.error('Failed to delete asset:', error);
      setToast({ message: (error as { response?: { data?: { message?: string } } }).response?.data?.message || '자산 삭제에 실패했습니다.', type: 'error' });
    }
  };

  const handleUploadAssetImage = async (file: File): Promise<string> => {
    const path = `assets/${productId}/${Date.now()}-${file.name}`;
    return uploadImage(file, path);
  };

  const handleViewAssetBlockedPeriods = async (assetId: string) => {
    const asset = assets.find(a => a.id === assetId);
    if (!asset) return;

    try {
      const periods = await adminApi.getAssetBlockedPeriods(productId, assetId);
      setAssetBlockedPeriods(periods);
      setSelectedAssetForBlocked(asset);
    } catch (error) {
      console.error('Failed to fetch asset blocked periods:', error);
      setToast({ message: '차단 기간을 불러오는데 실패했습니다.', type: 'error' });
    }
  };

  const handleAddAssetBlockedPeriod = async (data: { startDate: string; endDate: string; reason: string; notes?: string }) => {
    if (!selectedAssetForBlocked) return;

    try {
      await adminApi.createAssetBlockedPeriod(productId, selectedAssetForBlocked.id, {
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason as 'order' | 'maintenance' | 'manual',
        notes: data.notes,
      });
      setToast({ message: '차단 기간이 추가되었습니다.', type: 'success' });
      handleViewAssetBlockedPeriods(selectedAssetForBlocked.id);
    } catch (error: unknown) {
      console.error('Failed to add asset blocked period:', error);
      setToast({ message: '차단 기간 추가에 실패했습니다.', type: 'error' });
    }
  };

  const handleDeleteAssetBlockedPeriod = async (periodId: string) => {
    if (!selectedAssetForBlocked) return;

    try {
      await adminApi.deleteAssetBlockedPeriod(productId, selectedAssetForBlocked.id, periodId);
      setToast({ message: '차단 기간이 삭제되었습니다.', type: 'success' });
      handleViewAssetBlockedPeriods(selectedAssetForBlocked.id);
    } catch (error: unknown) {
      console.error('Failed to delete asset blocked period:', error);
      setToast({ message: '차단 기간 삭제에 실패했습니다.', type: 'error' });
    }
  };

  const handleAddBlockedPeriod = async (data: { startDate: string; endDate: string; reason: string }) => {
    if (!data.startDate || !data.endDate || !data.reason.trim()) {
      setToast({ message: '모든 필드를 입력하세요.', type: 'error' });
      return;
    }

    try {
      await adminApi.createBlockedPeriod(productId, data);
      setToast({ message: '예약 차단 기간이 추가되었습니다.', type: 'success' });
      fetchData();
    } catch (error: unknown) {
      console.error('Failed to add blocked period:', error);
      setToast({ message: (error as { response?: { data?: { message?: string } } }).response?.data?.message || '차단 기간 추가에 실패했습니다.', type: 'error' });
    }
  };

  const handleDeleteBlockedPeriod = async (periodId: string) => {
    if (!confirm('이 차단 기간을 삭제하시겠습니까?')) return;

    try {
      await adminApi.deleteBlockedPeriod(productId, periodId);
      setToast({ message: '차단 기간이 삭제되었습니다.', type: 'success' });
      fetchData();
    } catch (error: unknown) {
      console.error('Failed to delete blocked period:', error);
      setToast({ message: (error as { response?: { data?: { message?: string } } }).response?.data?.message || '차단 기간 삭제에 실패했습니다.', type: 'error' });
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
      await adminApi.updateProduct(productId, {
        title: formData.title,
        description: formData.description,
        categoryId: formData.categoryId,
        baseDailyPrice: parseFloat(formData.baseDailyPrice),
        images: formData.images,
        detailImages: formData.detailImages,
        status: formData.status as 'active' | 'inactive',
      });

      setToast({ message: '상품이 성공적으로 수정되었습니다.', type: 'success' });
      setTimeout(() => router.push('/admin/products'), 1500);
    } catch (error: unknown) {
      console.error('Failed to update product:', error);
      setToast({ message: (error as Error).message || '상품 수정에 실패했습니다.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (isChecking || loadingProduct) {
    return <Loading fullScreen message="상품 정보 로딩 중..." />;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8 max-w-4xl">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">상품 수정</h1>
          <p className="text-sm sm:text-base text-slate-600">상품 정보를 수정하세요</p>
        </div>

        <ProductForm
          formData={formData}
          categories={categories}
          allTags={allTags}
          newTag={newTag}
          loading={loading}
          onSubmit={handleSubmit}
          onChange={handleChange}
          onImagesChange={(images) => setFormData({ ...formData, images })}
          onDetailImagesChange={(detailImages) => setFormData({ ...formData, detailImages })}
          onAddTag={handleAddTag}
          onRemoveTag={handleRemoveTag}
          onNewTagChange={setNewTag}
          onCreateNewTag={handleCreateNewTag}
          onCancel={() => router.back()}
        />

        <div className="mt-4 sm:mt-6">
          <AssetsManagement
            productId={productId}
            assets={assets as Asset[]}
            onAddAsset={handleAddAsset}
            onUpdateAsset={handleUpdateAsset}
            onDeleteAsset={handleDeleteAsset}
            onUploadImage={handleUploadAssetImage}
            onViewBlockedPeriods={handleViewAssetBlockedPeriods}
          />
        </div>

        <div className="mt-4 sm:mt-6">
          <BlockedPeriodsManagement
            blockedPeriods={blockedPeriods}
            onAddBlockedPeriod={handleAddBlockedPeriod}
            onDeleteBlockedPeriod={handleDeleteBlockedPeriod}
          />
        </div>

        {/* 안내 메시지 */}
        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs sm:text-sm text-blue-800">
            <strong>안내:</strong> 상품 상태를 &apos;비활성&apos;으로 변경하면 고객이 해당 상품을 대여할 수 없습니다.
          </p>
        </div>
      </div>

      {/* Asset Blocked Periods Modal */}
      {selectedAssetForBlocked && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-4 sm:p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold">자산 차단 기간 관리</h2>
              <button
                onClick={() => {
                  setSelectedAssetForBlocked(null);
                  setAssetBlockedPeriods([]);
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-4 sm:p-6">
              <BlockedPeriodsManagement
                blockedPeriods={assetBlockedPeriods}
                onAddBlockedPeriod={handleAddAssetBlockedPeriod}
                onDeleteBlockedPeriod={handleDeleteAssetBlockedPeriod}
                title="자산 차단 기간"
                assetCode={selectedAssetForBlocked.assetCode || selectedAssetForBlocked.serialNumber}
              />
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
