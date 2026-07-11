import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = { title: '개인정보처리방침 | 스테이지박스' };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-violet-600 mb-8">
          <ArrowLeft className="w-4 h-4" /> 홈으로
        </Link>
        <h1 className="text-3xl font-bold mb-8">개인정보처리방침</h1>

        <section className="space-y-4 text-slate-700 leading-relaxed text-sm">
          <p>스테이지박스(이하 &ldquo;회사&rdquo;)는 이용자의 개인정보를 중요하게 생각하며, 「개인정보 보호법」 등 관련 법령을 준수합니다.</p>

          <h2 className="text-lg font-bold text-slate-900 pt-4">1. 수집하는 개인정보 항목</h2>
          <p>회원가입 및 서비스 이용 과정에서 이름, 이메일, 전화번호, 배송지 주소, 주문·결제 정보를 수집합니다.</p>

          <h2 className="text-lg font-bold text-slate-900 pt-4">2. 개인정보의 수집·이용 목적</h2>
          <p>회원 관리, 대여 계약의 이행(주문 접수·승인·배송·반납), 고객 문의 응대, 서비스 안내를 위해 이용합니다.</p>

          <h2 className="text-lg font-bold text-slate-900 pt-4">3. 개인정보의 보유 및 이용기간</h2>
          <p>원칙적으로 수집·이용 목적 달성 시 지체 없이 파기합니다. 단, 관련 법령에 따라 거래기록 등은 일정 기간 보관합니다(전자상거래법: 계약·청약철회 5년, 대금결제 5년, 소비자 불만 3년).</p>

          <h2 className="text-lg font-bold text-slate-900 pt-4">4. 개인정보의 제3자 제공</h2>
          <p>회사는 이용자의 동의 없이 개인정보를 외부에 제공하지 않습니다. 배송 등 서비스 이행에 필요한 최소한의 범위에서만 처리합니다.</p>

          <h2 className="text-lg font-bold text-slate-900 pt-4">5. 이용자의 권리</h2>
          <p>이용자는 언제든지 자신의 개인정보 열람·정정·삭제·처리정지를 요청할 수 있으며, 고객센터(하단 참조)를 통해 접수할 수 있습니다.</p>

          <p className="pt-6 text-slate-500">본 방침은 표준 템플릿을 기반으로 하며, 실제 처리 현황에 맞게 개인정보 보호책임자 지정 등 검토·보완하시기 바랍니다.</p>
        </section>
      </div>
    </div>
  );
}
