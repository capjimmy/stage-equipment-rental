'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminApi } from '@/lib/api';
import type { Settings } from '@/types';

// Legal links + 사업자정보 shown at the very bottom of the storefront footer.
// Business info is read from settings (publicly readable) so it appears for
// logged-out visitors too, as required by 전자상거래법.
export default function BusinessInfoFooter() {
  const [biz, setBiz] = useState<NonNullable<Settings['business']> | null>(null);

  useEffect(() => {
    adminApi.getSettings().then((s) => setBiz(s?.business ?? null)).catch(() => {});
  }, []);

  return (
    <div className="border-t border-slate-200 pt-6 md:pt-8 text-xs md:text-sm text-slate-500 space-y-3">
      <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center">
        <Link href="/terms" className="hover:text-violet-600">이용약관</Link>
        <Link href="/privacy" className="hover:text-violet-600 font-medium text-slate-600">개인정보처리방침</Link>
        <Link href="/refund" className="hover:text-violet-600">취소·환불정책</Link>
      </div>

      {biz && (biz.name || biz.registrationNumber) && (
        <div className="text-center leading-relaxed">
          <div>
            {biz.name && <span>{biz.name}</span>}
            {biz.representative && <span> · 대표 {biz.representative}</span>}
            {biz.registrationNumber && <span> · 사업자등록번호 {biz.registrationNumber}</span>}
            {biz.mailOrderNumber && <span> · 통신판매업신고 {biz.mailOrderNumber}</span>}
          </div>
          <div>
            {biz.address && <span>{biz.address}</span>}
            {biz.phone && <span> · {biz.phone}</span>}
            {biz.email && <span> · {biz.email}</span>}
          </div>
        </div>
      )}

      <p className="text-center">© 2025 스테이지박스. All rights reserved.</p>
    </div>
  );
}
