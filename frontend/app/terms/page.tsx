import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = { title: '이용약관 | 스테이지박스' };

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-violet-600 mb-8">
          <ArrowLeft className="w-4 h-4" /> 홈으로
        </Link>
        <h1 className="text-3xl font-bold mb-8">이용약관</h1>

        <section className="space-y-4 text-slate-700 leading-relaxed text-sm">
          <h2 className="text-lg font-bold text-slate-900">제1조 (목적)</h2>
          <p>본 약관은 스테이지박스(이하 &ldquo;회사&rdquo;)가 제공하는 공연 의상·소품 렌탈 서비스(이하 &ldquo;서비스&rdquo;)의 이용과 관련하여 회사와 이용자 간의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.</p>

          <h2 className="text-lg font-bold text-slate-900 pt-4">제2조 (이용계약의 성립)</h2>
          <p>이용계약은 이용자가 상품을 선택하여 대여를 신청하고, 회사가 이를 승인함으로써 성립합니다. 결제는 계좌이체(무통장입금) 방식으로 진행되며, 입금 확인 후 예약이 확정됩니다.</p>

          <h2 className="text-lg font-bold text-slate-900 pt-4">제3조 (대여 및 반납)</h2>
          <p>이용자는 약정한 대여 기간 동안 물품을 사용하고, 반납일까지 회사가 지정한 방법으로 반납하여야 합니다. 대여 물품은 선량한 관리자의 주의로 사용하여야 합니다.</p>

          <h2 className="text-lg font-bold text-slate-900 pt-4">제4조 (파손·분실 및 배상)</h2>
          <p>대여 물품의 파손·오염·분실이 발생한 경우 이용자는 수선비 또는 물품가액을 배상하여야 합니다.</p>

          <h2 className="text-lg font-bold text-slate-900 pt-4">제5조 (취소 및 환불)</h2>
          <p>예약의 취소 및 환불은 <Link href="/refund" className="text-violet-600 underline">취소 및 환불 정책</Link>에 따릅니다.</p>

          <h2 className="text-lg font-bold text-slate-900 pt-4">제6조 (책임의 한계)</h2>
          <p>천재지변 등 불가항력으로 인한 서비스 제공 불가에 대해 회사는 책임을 지지 않습니다.</p>

          <p className="pt-6 text-slate-500">본 약관은 표준 템플릿을 기반으로 하며, 실제 운영 정책에 맞게 검토·보완하시기 바랍니다.</p>
        </section>
      </div>
    </div>
  );
}
