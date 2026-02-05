'use client';

import { useState } from 'react';
import { Calendar, Plus, Trash2 } from 'lucide-react';
import { BlockedPeriod } from '@/types';

interface BlockedPeriodsManagementProps {
  blockedPeriods: BlockedPeriod[];
  onAddBlockedPeriod: (data: { startDate: string; endDate: string; reason: string }) => Promise<void>;
  onDeleteBlockedPeriod: (periodId: string) => Promise<void>;
}

export default function BlockedPeriodsManagement({
  blockedPeriods,
  onAddBlockedPeriod,
  onDeleteBlockedPeriod,
}: BlockedPeriodsManagementProps) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    reason: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAddBlockedPeriod(formData);
    setFormData({ startDate: '', endDate: '', reason: '' });
    setShowForm(false);
  };

  return (
    <div className="card p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
        <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-violet-600" />
          예약 차단 기간
        </h2>
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
                required
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              사유 *
            </label>
            <input
              type="text"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="input text-sm sm:text-base"
              placeholder="정비, 이벤트 등"
              required
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
        {blockedPeriods.length === 0 ? (
          <p className="text-xs sm:text-sm text-slate-600 text-center py-6 sm:py-8">차단된 기간이 없습니다.</p>
        ) : (
          blockedPeriods.map((period) => (
            <div key={period.id} className="flex items-center justify-between p-2 sm:p-3 bg-white rounded-lg border border-slate-200 gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm sm:text-base truncate">{period.reason}</p>
                <p className="text-xs text-slate-600">
                  {new Date(period.blockedStart).toLocaleDateString('ko-KR')} - {new Date(period.blockedEnd).toLocaleDateString('ko-KR')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onDeleteBlockedPeriod(period.id)}
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
