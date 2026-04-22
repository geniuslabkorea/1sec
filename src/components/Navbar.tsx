"use client";

import Image from "next/image";

export default function Navbar() {
  return (
    <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Image
            src="/logo2.png"
            alt="1초 지원금"
            width={125}
            height={62}
            className="object-contain h-10 w-auto"
            priority
          />
          <span className="text-slate-400 text-[11px] font-bold tracking-widest uppercase">for business</span>
        </div>
        <div className="flex gap-6 items-center text-sm font-semibold text-slate-600">
          <a href="#" className="hover:text-slate-900 transition-colors">제휴문의</a>
          <a
            href="#"
            className="bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-all"
          >
            관리자 로그인
          </a>
        </div>
      </div>
    </nav>
  );
}
