'use client';

import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { usePathname } from 'next/navigation';

export default function FloatingCart() {
  const { data: cart } = useCart();
  const pathname = usePathname();

  // 관리자 페이지, 장바구니 페이지, 로그인/회원가입 페이지에서는 숨김
  if (pathname?.startsWith('/admin') || pathname === '/cart' || pathname === '/checkout' || pathname?.startsWith('/auth')) {
    return null;
  }

  const itemCount = cart?.items?.length || 0;

  return (
    <Link
      href="/cart"
      className="fixed bottom-4 right-4 md:bottom-8 md:right-8 w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-violet-500 to-pink-500 text-white rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center justify-center group z-50"
    >
      <div className="relative">
        <ShoppingCart className="w-6 h-6 md:w-7 md:h-7" />
        {itemCount > 0 && (
          <span className="absolute -top-2 -right-2 w-5 h-5 bg-pink-500 text-white text-xs rounded-full flex items-center justify-center">
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        )}
      </div>
    </Link>
  );
}
