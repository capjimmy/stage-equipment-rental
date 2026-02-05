'use client';

import { useState } from 'react';
import { Calendar, Plus, Trash2, Clock, Wrench, Hand, ShoppingCart } from 'lucide-react';
import { BlockedPeriod, AssetBlockedPeriod } from '@/types';

interface BlockedPeriodsManagementProps {
  blockedPeriods: (BlockedPeriod | AssetBlockedPeriod)[];
  onAddBlockedPeriod: (data: { startDate: string; endDate: string; reason: string; notes?: string }) => Promise<void>;
  onDeleteBlockedPeriod: (periodId: string) => Promise<void>;
  title?: string;
  assetCode?: string;
}

const reasonTypes = [
  { value: 'manual', label: '수동 차단', icon: Hand, color: 'bg-violet-100 text-violet-800' },
  { value: 'maintenance', label: '점검/수리', icon: Wrench, color: 'bg-yellow-100 text-yellow-800' },
  { value: 'order', label: '예약', icon: ShoppingCart, color: 'bg-blue-100 text-blue-800' },
];

export default function BlockedPeriodsManagement({
  blockedPeriods,
  onAddBlockedPeriod,
  onDeleteBlockedPeriod,
  title = '예약 차단 기간',
  assetCode,
}: BlockedPeriodsManagementProps) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    reason: 'manual',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAddBlockedPeriod({
      startDate: formData.startDate,
      endDate: formData.endDate,
      reason: formData.reason,
      notes: formData.notes || undefined,
    });
    setFormData({ startDate: '', endDate: '', reason: 'manual', notes: '' });
    setShowForm(false);
  };

  const getReasonInfo = (reason: string) => {
    const info = reasonTypes.find(r => r.value === reason);
    return info || { value: reason, label: reason, icon: Clock, color: 'bg-gray-100 text-gray-800' };
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('ko-KR');
    } catch {
      return dateStr;
    }
  };

  const getStartDate = (period: BlockedPeriod | AssetBlockedPeriod) => {
    return (period as AssetBlockedPeriod).startDate || (period as BlockedPeriod).blockedStart;
  };

  const getEndDate = (period: BlockedPeriod | AssetBlockedPeriod) => {
    return (period as AssetBlockedPeriod).endDate || (period as BlockedPeriod).blockedEnd;
  };

  const getReason = (period: BlockedPeriod | AssetBlockedPeriod) => {
    return (period as AssetBlockedPeriod).reason || (period as BlockedPeriod).reason || 'manual';
  };

  // Sort periods by start date (most recent first)
  const sortedPeriods = [...blockedPeriods].sort((a, b) => {
    const dateA = new Date(getStartDate(a));
    const dateB = new Date(getStartDate(b));
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <div className="card p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-violet-600" />
            {title}
          </h2>
          {assetCode && (
            <p className="text-sm text-slate-500 mt-1">자산: {assetCode}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="btn btn-secondary btn-sm w-full sm:w-auto text-sm sm:text-base"
        >
          <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
          차단 기간 추가
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 p-3 sm:p-4 bg-slate-50 rounded-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                시작일 *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="input text-sm sm:text-base"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                종료일 *
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="input text-sm sm:text-base"
                min={formData.startDate}
                required
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              차단 유형 *
            </label>
            <div className="flex flex-wrap gap-2">
              {reasonTypes.filter(r => r.value !== 'order').map(type => {
                const Icon = type.icon;
                const isSelected = formData.reason === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, reason: type.value })}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                      isSelected
                        ? 'border-violet-500 bg-violet-50 text-violet-700'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              메모
            </label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input text-sm sm:text-base"
              placeholder="차단 사유 상세 (선택)"
            />
          </div>
          <div className="flex gap-2">
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
        {sortedPeriods.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-600">차단된 기간이 없습니다.</p>
            <p className="text-xs text-slate-500 mt-1">날짜를 차단하면 해당 기간에 예약이 불가능합니다.</p>
          </div>
        ) : (
          sortedPeriods.map((period) => {
            const reason = getReason(period);
            const reasonInfo = getReasonInfo(reason);
            const Icon = reasonInfo.icon;
            const startDate = getStartDate(period);
            const endDate = getEndDate(period);
            const isOrderBlocked = reason === 'order';
            const periodData = period as AssetBlockedPeriod;

            return (
              <div key={period.id} className="flex items-center justify-between p-3 sm:p-4 bg-white rounded-lg border border-slate-200 gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`p-2 rounded-lg ${reasonInfo.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${reasonInfo.color}`}>
                        {reasonInfo.label}
                      </span>
                      {periodData.orderId && (
                        <span className="text-xs text-slate-500">
                          주문 #{periodData.orderId.slice(0, 8).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <p className="font-medium text-sm mt-1">
                      {formatDate(startDate)} ~ {formatDate(endDate)}
                    </p>
                    {periodData.notes && (
                      <p className="text-xs text-slate-500 mt-1 truncate">{periodData.notes}</p>
                    )}
                  </div>
                </div>
                {!isOrderBlocked && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('이 차단 기간을 삭제하시겠습니까?')) {
                        onDeleteBlockedPeriod(period.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-700 p-2 flex-shrink-0"
                    title="삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                {isOrderBlocked && (
                  <span className="text-xs text-slate-400 px-2">예약 연동</span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
