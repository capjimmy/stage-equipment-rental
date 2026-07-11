import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = { title: '취소 및 환불 정책 | 스테이지박스' };

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-violet-600 mb-8">
          <ArrowLeft className="w-4 h-4" /> 홈으로
        </Link>
        <h1 className="text-3xl font-bold mb-8">취소 및 환불 정책</h1>

        <section className="space-y-4 text-slate-700 leading-relaxed text-sm">
          <p>본 정책은 공연 의상·소품 렌탈 서비스의 예약 취소 및 환불 기준을 규정합니다.</p>

          <h2 className="text-lg font-bold text-slate-900 pt-4">1. 쿨링오프 (입금 직후)</h2>
          <p>입금 완료 후 <strong>2시간 이내</strong> 취소 시 100% 환불됩니다.</p>

          <h2 className="text-lg font-bold text-slate-900 pt-4">2. 대여 시작일 기준 환불 규정</h2>
          <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-3 border-b border-slate-200">취소 시점</th>
                <th className="text-left p-3 border-b border-slate-200">환불 비율</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="p-3 border-b border-slate-100">대여 시작 21일 이전</td><td className="p-3 border-b border-slate-100">100% 환불</td></tr>
              <tr><td className="p-3 border-b border-slate-100">대여 시작 14~20일 전</td><td className="p-3 border-b border-slate-100">50% 환불</td></tr>
              <tr><td className="p-3 border-b border-slate-100">대여 시작 7~13일 전</td><td className="p-3 border-b border-slate-100">20% 환불</td></tr>
              <tr><td className="p-3">대여 시작 0~6일 전</td><td className="p-3">10% 환불</td></tr>
            </tbody>
          </table>

          <h2 className="text-lg font-bold text-slate-900 pt-4">3. 파손·분실·연체</h2>
          <p>대여 물품의 파손·분실 시 수선비 또는 물품가액이 청구되며, 반납 지연 시 연체료가 부과됩니다.</p>

          <h2 className="text-lg font-bold text-slate-900 pt-4">4. 환불 방법</h2>
          <p>환불은 입금하신 계좌로 영업일 기준 3~5일 이내 처리됩니다. 문의는 고객센터(하단 참조)로 연락 주세요.</p>
        </section>
      </div>
    </div>
  );
}
