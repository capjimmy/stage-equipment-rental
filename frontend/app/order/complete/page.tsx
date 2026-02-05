'use client';

import { useState } from 'react';
import { CheckCircle, Home, User } from 'lucide-react';
import Link from 'next/link';

export default function OrderCompletePage() {
  const [orderInfo] = useState(() => ({
    orderId: `ORD-${Date.now()}`,
    orderDate: new Date().toLocaleString('ko-KR'),
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="card p-12 text-center">
          {/* 성공 아이콘 */}
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6">
            <CheckCircle className="w-16 h-16 text-green-600" />
          </div>

          {/* 메시지 */}
          <h1 className="text-4xl font-bold mb-4">주문이 완료되었습니다!</h1>
          <p className="text-lg text-slate-600 mb-8">
            주문해 주셔서 감사합니다.<br />
            주문 내역은 마이페이지에서 확인하실 수 있습니다.
          </p>

          {/* 주문 정보 */}
          <div className="bg-violet-50 rounded-lg p-6 mb-8">
            <div className="space-y-3 text-left">
              <div className="flex justify-between">
                <span className="text-slate-600">주문번호</span>
                <span className="font-bold">{orderInfo.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">주문일시</span>
                <span className="font-bold">{orderInfo.orderDate}</span>
              </div>
              <div className="flex justify-between border-t border-violet-200 pt-3">
                <span className="text-slate-600">주문 상태</span>
                <span className="font-bold text-green-600">결제 완료</span>
              </div>
            </div>
          </div>

          {/* 안내 메시지 */}
          <div className="bg-slate-50 rounded-lg p-6 mb-8 text-left">
            <h3 className="font-bold mb-3">배송 안내</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <span className="text-violet-600 mt-1">•</span>
                <span>대여 시작일 1일 전에 출고 예정입니다</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-violet-600 mt-1">•</span>
                <span>배송은 주문 확인 후 1~2일 소요됩니다</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-violet-600 mt-1">•</span>
                <span>대여 종료일에 반납하셔야 합니다</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-violet-600 mt-1">•</span>
                <span>장비 파손 시 수리비가 청구될 수 있습니다</span>
              </li>
            </ul>
          </div>

          {/* 액션 버튼 */}
          <div className="grid md:grid-cols-2 gap-4">
            <Link href="/mypage" className="btn btn-outline">
              <User className="w-5 h-5" />
              주문 내역 보기
            </Link>
            <Link href="/" className="btn btn-primary">
              <Home className="w-5 h-5" />
              메인으로 가기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
