'use client';

import { useState } from 'react';
import { Box, Plus, Trash2 } from 'lucide-react';
import { Asset } from '@/types';

interface AssetsManagementProps {
  assets: Asset[];
  onAddAsset: (data: { serialNumber: string; condition: string }) => Promise<void>;
  onDeleteAsset: (assetId: string) => Promise<void>;
}

export default function AssetsManagement({
  assets,
  onAddAsset,
  onDeleteAsset,
}: AssetsManagementProps) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ serialNumber: '', condition: 'good' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAddAsset(formData);
    setFormData({ serialNumber: '', condition: 'good' });
    setShowForm(false);
  };

  return (
    <div className="card p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
        <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <Box className="w-5 h-5 sm:w-6 sm:h-6 text-violet-600" />
          자산 관리
        </h2>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="btn btn-secondary btn-sm w-full sm:w-auto text-sm sm:text-base"
        >
          <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
          자산 추가
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 p-3 sm:p-4 bg-slate-50 rounded-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                시리얼 번호 *
              </label>
              <input
                type="text"
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                className="input text-sm sm:text-base"
                placeholder="SN-001"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                상태
              </label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                className="input text-sm sm:text-base"
              >
                <option value="good">양호</option>
                <option value="fair">보통</option>
                <option value="poor">불량</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="button" onClick={() => setShowForm(false)} className="btn btn-outline btn-sm flex-1 sm:flex-none text-xs sm:text-sm">
              취소
            </button>
            <button type="submit" className="btn btn-primary btn-sm flex-1 sm:flex-none text-xs sm:text-sm">
              추가
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {assets.length === 0 ? (
          <p className="text-xs sm:text-sm text-slate-600 text-center py-6 sm:py-8">등록된 자산이 없습니다.</p>
        ) : (
          assets.map((asset) => (
            <div key={asset.id} className="flex items-center justify-between p-2 sm:p-3 bg-white rounded-lg border border-slate-200 gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm sm:text-base truncate">{asset.serialNumber}</p>
                <p className="text-xs text-slate-600">
                  상태: {asset.condition === 'good' ? '양호' : asset.condition === 'fair' ? '보통' : '불량'}
                  {asset.status && ` • ${asset.status}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onDeleteAsset(asset.id)}
                className="text-red-600 hover:text-red-700 p-2 flex-shrink-0"
              >
                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
