'use client';

import { useState } from 'react';
import { Box, Plus, Trash2, Edit2, Image, Calendar, X, Upload, ChevronDown, ChevronUp } from 'lucide-react';
import { Asset, AssetBlockedPeriod } from '@/types';

interface AssetsManagementProps {
  productId: string;
  assets: Asset[];
  onAddAsset: (data: { assetCode: string; serialNumber?: string; conditionGrade?: string; images?: string[]; notes?: string }) => Promise<void>;
  onUpdateAsset: (assetId: string, data: Partial<Asset>) => Promise<void>;
  onDeleteAsset: (assetId: string) => Promise<void>;
  onViewBlockedPeriods?: (assetId: string) => void;
  onUploadImage?: (file: File) => Promise<string>;
}

const conditionGrades = [
  { value: 'S', label: 'S (최상)', description: '새것과 동일' },
  { value: 'A', label: 'A (상)', description: '사용감 거의 없음' },
  { value: 'B', label: 'B (중)', description: '약간의 사용감' },
  { value: 'C', label: 'C (하)', description: '사용감 있음' },
];

export default function AssetsManagement({
  productId,
  assets,
  onAddAsset,
  onUpdateAsset,
  onDeleteAsset,
  onViewBlockedPeriods,
  onUploadImage,
}: AssetsManagementProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [expandedAsset, setExpandedAsset] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    assetCode: '',
    serialNumber: '',
    conditionGrade: 'A',
    notes: '',
    images: [] as string[],
  });
  const [uploading, setUploading] = useState(false);

  const resetForm = () => {
    setFormData({
      assetCode: '',
      serialNumber: '',
      conditionGrade: 'A',
      notes: '',
      images: [],
    });
    setEditingAsset(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAsset) {
      await onUpdateAsset(editingAsset.id, {
        assetCode: formData.assetCode,
        serialNumber: formData.serialNumber || undefined,
        conditionGrade: formData.conditionGrade,
        notes: formData.notes || undefined,
        images: formData.images,
      });
    } else {
      await onAddAsset({
        assetCode: formData.assetCode,
        serialNumber: formData.serialNumber || undefined,
        conditionGrade: formData.conditionGrade,
        notes: formData.notes || undefined,
        images: formData.images,
      });
    }
    resetForm();
  };

  const handleEdit = (asset: Asset) => {
    setFormData({
      assetCode: asset.assetCode || '',
      serialNumber: asset.serialNumber || '',
      conditionGrade: asset.conditionGrade || 'A',
      notes: asset.notes || '',
      images: asset.images || [],
    });
    setEditingAsset(asset);
    setShowForm(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !onUploadImage) return;

    setUploading(true);
    try {
      const newImages: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const url = await onUploadImage(files[i]);
        newImages.push(url);
      }
      setFormData({
        ...formData,
        images: [...formData.images, ...newImages],
      });
    } catch (error) {
      console.error('Failed to upload image:', error);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...formData.images];
    newImages.splice(index, 1);
    setFormData({ ...formData, images: newImages });
  };

  const getConditionLabel = (grade: string) => {
    const condition = conditionGrades.find(c => c.value === grade);
    return condition ? condition.label : grade;
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      available: { label: '대여가능', color: 'bg-green-100 text-green-800' },
      rented: { label: '대여중', color: 'bg-blue-100 text-blue-800' },
      maintenance: { label: '점검중', color: 'bg-yellow-100 text-yellow-800' },
      retired: { label: '폐기', color: 'bg-gray-100 text-gray-800' },
    };
    return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
  };

  return (
    <div className="card p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
        <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <Box className="w-5 h-5 sm:w-6 sm:h-6 text-violet-600" />
          자산 관리
          <span className="text-sm font-normal text-slate-500">({assets.length}개)</span>
        </h2>
        <button
          type="button"
          onClick={() => {
            // 자산 코드 자동 생성: 상품ID 앞 6자리 + @ + 다음 번호
            const prefix = productId.substring(0, 6).toUpperCase();
            const nextNumber = assets.length + 1;
            const autoCode = `${prefix}@${String(nextNumber).padStart(2, '0')}`;
            setFormData({
              assetCode: autoCode,
              serialNumber: '',
              conditionGrade: 'A',
              notes: '',
              images: [],
            });
            setEditingAsset(null);
            setShowForm(!showForm);
          }}
          className="btn btn-secondary btn-sm w-full sm:w-auto text-sm sm:text-base"
        >
          <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
          자산 추가
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 p-3 sm:p-4 bg-slate-50 rounded-lg">
          <h3 className="font-medium mb-3">{editingAsset ? '자산 수정' : '새 자산 추가'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                자산 코드 *
              </label>
              <input
                type="text"
                value={formData.assetCode}
                onChange={(e) => setFormData({ ...formData, assetCode: e.target.value })}
                className="input text-sm sm:text-base"
                placeholder="예: NAP-001"
                required
              />
              <p className="text-xs text-slate-500 mt-1">고유 식별 코드 (예: 상품코드-번호)</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                시리얼 번호
              </label>
              <input
                type="text"
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                className="input text-sm sm:text-base"
                placeholder="제조사 시리얼 번호"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                상태 등급
              </label>
              <select
                value={formData.conditionGrade}
                onChange={(e) => setFormData({ ...formData, conditionGrade: e.target.value })}
                className="input text-sm sm:text-base"
              >
                {conditionGrades.map(grade => (
                  <option key={grade.value} value={grade.value}>
                    {grade.label} - {grade.description}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                메모
              </label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="input text-sm sm:text-base"
                placeholder="특이사항 메모"
              />
            </div>
          </div>

          {/* Image Upload Section */}
          {onUploadImage && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                자산 사진
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.images.map((img, idx) => (
                  <div key={idx} className="relative w-20 h-20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img}
                      alt={`Asset ${idx + 1}`}
                      className="w-full h-full object-cover rounded-lg border border-slate-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <label className="w-20 h-20 flex items-center justify-center border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-violet-500 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  {uploading ? (
                    <div className="animate-spin w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full" />
                  ) : (
                    <Upload className="w-5 h-5 text-slate-400" />
                  )}
                </label>
              </div>
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <button type="button" onClick={resetForm} className="btn btn-outline btn-sm flex-1 sm:flex-none text-xs sm:text-sm">
              취소
            </button>
            <button type="submit" className="btn btn-primary btn-sm flex-1 sm:flex-none text-xs sm:text-sm">
              {editingAsset ? '수정' : '추가'}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {assets.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <Box className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-600">등록된 자산이 없습니다.</p>
            <p className="text-xs text-slate-500 mt-1">자산을 추가하여 개별 물품을 관리하세요.</p>
          </div>
        ) : (
          assets.map((asset) => {
            const statusInfo = getStatusLabel(asset.status || 'available');
            const isExpanded = expandedAsset === asset.id;

            return (
              <div key={asset.id} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <div
                  className="flex items-center justify-between p-3 sm:p-4 cursor-pointer hover:bg-slate-50"
                  onClick={() => setExpandedAsset(isExpanded ? null : asset.id)}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {asset.images && asset.images.length > 0 ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={asset.images[0]}
                        alt={asset.assetCode}
                        className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-lg flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Box className="w-5 h-5 text-slate-400" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm sm:text-base truncate">{asset.assetCode || asset.serialNumber}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700">
                          {getConditionLabel(asset.conditionGrade || 'A')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(asset);
                      }}
                      className="text-violet-600 hover:text-violet-700 p-2"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('이 자산을 삭제하시겠습니까?')) {
                          onDeleteAsset(asset.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-700 p-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-200 p-3 sm:p-4 bg-slate-50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">시리얼 번호</p>
                        <p className="text-sm font-medium">{asset.serialNumber || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">상태 등급</p>
                        <p className="text-sm font-medium">{getConditionLabel(asset.conditionGrade || 'A')}</p>
                      </div>
                      {asset.notes && (
                        <div className="sm:col-span-2">
                          <p className="text-xs text-slate-500 mb-1">메모</p>
                          <p className="text-sm">{asset.notes}</p>
                        </div>
                      )}
                    </div>

                    {asset.images && asset.images.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs text-slate-500 mb-2">자산 사진</p>
                        <div className="flex flex-wrap gap-2">
                          {asset.images.map((img, idx) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              key={idx}
                              src={img}
                              alt={`${asset.assetCode} ${idx + 1}`}
                              className="w-20 h-20 object-cover rounded-lg border border-slate-200"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {onViewBlockedPeriods && (
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <button
                          type="button"
                          onClick={() => onViewBlockedPeriods(asset.id)}
                          className="btn btn-outline btn-sm text-xs"
                        >
                          <Calendar className="w-3 h-3" />
                          차단 기간 관리
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
