'use client';

import { useState, useEffect } from 'react';
import { Save, CreditCard, Building2 } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import Loading from '@/components/Loading';
import Toast, { ToastType } from '@/components/Toast';
import useAdminAuth from '@/hooks/useAdminAuth';
import { adminApi } from '@/lib/api';

export default function SettingsPage() {
  const { isChecking, isAdmin } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const [bank, setBank] = useState({ bank: '', accountNumber: '', holder: '' });
  const [business, setBusiness] = useState({
    name: '', representative: '', registrationNumber: '',
    mailOrderNumber: '', address: '', phone: '', email: '',
  });

  useEffect(() => {
    if (!isChecking && isAdmin) {
      (async () => {
        try {
          const s = await adminApi.getSettings();
          if (s?.bankAccount) setBank({ ...bank, ...s.bankAccount });
          if (s?.business) setBusiness({ ...business, ...s.business });
        } catch (e) {
          console.error('Failed to load settings:', e);
        } finally {
          setLoading(false);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isChecking, isAdmin]);

  const handleSave = async () => {
    if (!bank.bank || !bank.accountNumber || !bank.holder) {
      setToast({ message: '입금 계좌 정보(은행/계좌번호/예금주)를 모두 입력해주세요.', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      await adminApi.updateSettings({ bankAccount: bank, business });
      setToast({ message: '설정이 저장되었습니다.', type: 'success' });
    } catch (e) {
      console.error('Failed to save settings:', e);
      setToast({ message: (e as Error)?.message || '저장에 실패했습니다.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (isChecking || !isAdmin) return <Loading fullScreen />;

  const field = (label: string, value: string, onChange: (v: string) => void, placeholder = '', required = false) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}{required && <span className="text-red-500"> *</span>}
      </label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="input" />
    </div>
  );

  return (
    <AdminLayout>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">설정</h1>
        <p className="text-slate-600 mb-6 text-sm">입금 계좌와 사업자 정보를 관리합니다.</p>

        {loading ? (
          <Loading />
        ) : (
          <div className="space-y-6">
            {/* 입금 계좌 */}
            <section className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-violet-600" />
                <h2 className="text-lg font-bold">입금 계좌 (필수)</h2>
              </div>
              <p className="text-sm text-slate-500 mb-4">
                계좌가 설정되어야 주문을 승인할 수 있습니다. 고객에게 입금 안내로 표시됩니다.
              </p>
              <div className="grid sm:grid-cols-3 gap-4">
                {field('은행명', bank.bank, (v) => setBank({ ...bank, bank: v }), '예: 국민은행', true)}
                {field('계좌번호', bank.accountNumber, (v) => setBank({ ...bank, accountNumber: v }), '숫자만', true)}
                {field('예금주', bank.holder, (v) => setBank({ ...bank, holder: v }), '', true)}
              </div>
            </section>

            {/* 사업자 정보 */}
            <section className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-5 h-5 text-violet-600" />
                <h2 className="text-lg font-bold">사업자 정보</h2>
              </div>
              <p className="text-sm text-slate-500 mb-4">
                전자상거래법상 하단(푸터)과 약관 페이지에 표시됩니다.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {field('상호', business.name, (v) => setBusiness({ ...business, name: v }))}
                {field('대표자명', business.representative, (v) => setBusiness({ ...business, representative: v }))}
                {field('사업자등록번호', business.registrationNumber, (v) => setBusiness({ ...business, registrationNumber: v }))}
                {field('통신판매업 신고번호', business.mailOrderNumber, (v) => setBusiness({ ...business, mailOrderNumber: v }))}
                {field('고객센터 전화', business.phone, (v) => setBusiness({ ...business, phone: v }))}
                {field('고객센터 이메일', business.email, (v) => setBusiness({ ...business, email: v }))}
              </div>
              <div className="mt-4">
                {field('사업장 주소', business.address, (v) => setBusiness({ ...business, address: v }))}
              </div>
            </section>

            <button onClick={handleSave} disabled={saving} className="btn btn-primary w-full sm:w-auto">
              <Save className="w-5 h-5" />
              {saving ? '저장 중...' : '설정 저장'}
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
