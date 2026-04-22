"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";

type Grant = {
  id: string;
  title: string;
  agency: string;
  amount: string;
  deadline: string;
  category: string;
  matchScore: number;
  description: string;
  url: string;
};

type AnalysisResult = {
  businessInfo: {
    name: string;
    registrationNumber: string;
    businessType: string;
    industry: string;
    establishedDate: string;
    address: string;
  };
  grants: Grant[];
  totalAmount: string;
};

const CATEGORY_COLORS: Record<string, string> = {
  "자금·융자":    "bg-green-100 text-green-700",
  "고용·인력":    "bg-purple-100 text-purple-700",
  "기술·R&D":    "bg-blue-100 text-blue-700",
  "수출·글로벌":  "bg-orange-100 text-orange-700",
  "내수·판로":    "bg-yellow-100 text-yellow-700",
  "창업·벤처":    "bg-pink-100 text-pink-700",
  "경영·컨설팅":  "bg-teal-100 text-teal-700",
  "기타":         "bg-slate-100 text-slate-600",
};

const FREE_LIMIT = 9999;

const MOCK_RESULT: AnalysisResult = {
  businessInfo: {
    name: "(주)업룸",
    registrationNumber: "123-45-67890",
    businessType: "법인사업자",
    industry: "소프트웨어 개발업",
    establishedDate: "2022-03-15",
    address: "서울특별시 강남구 테헤란로 427",
  },
  grants: [
    {
      id: "1",
      title: "중소기업 디지털 전환 지원사업",
      agency: "중소벤처기업부",
      amount: "최대 5,000만원",
      deadline: "2026-05-30",
      category: "기술·R&D",
      matchScore: 97,
      description: "중소기업의 디지털 전환을 위한 솔루션 도입 비용의 70%를 무상 지원합니다.",
      url: "#",
    },
    {
      id: "2",
      title: "청년 고용장려금",
      agency: "고용노동부",
      amount: "월 최대 80만원",
      deadline: "2026-12-31",
      category: "고용·인력",
      matchScore: 92,
      description: "청년(15~34세) 신규 채용 시 1인당 최대 12개월간 고용장려금을 지원합니다.",
      url: "#",
    },
    {
      id: "3",
      title: "초기창업패키지",
      agency: "창업진흥원",
      amount: "최대 1억원",
      deadline: "2026-04-30",
      category: "창업·벤처",
      matchScore: 88,
      description: "창업 3년 이내 기업에 사업화 자금 및 멘토링을 지원합니다.",
      url: "#",
    },
    {
      id: "4",
      title: "수출바우처 사업",
      agency: "한국무역투자진흥공사",
      amount: "최대 3,000만원",
      deadline: "2026-06-15",
      category: "수출·글로벌",
      matchScore: 75,
      description: "해외 마케팅, 번역, 인증 등 수출 준비에 필요한 서비스 비용을 바우처로 지원합니다.",
      url: "#",
    },
    {
      id: "5",
      title: "스마트공장 구축지원",
      agency: "중소벤처기업부",
      amount: "최대 1억 5,000만원",
      deadline: "2026-07-31",
      category: "기술·R&D",
      matchScore: 71,
      description: "제조공정 디지털화를 위한 스마트공장 구축 비용의 50~75%를 지원합니다.",
      url: "#",
    },
    {
      id: "6",
      title: "소상공인 경영안정자금",
      agency: "소상공인시장진흥공단",
      amount: "최대 7,000만원",
      deadline: "2026-09-30",
      category: "자금·융자",
      matchScore: 68,
      description: "경영 위기 소상공인에게 저금리 정책자금을 지원합니다.",
      url: "#",
    },
    {
      id: "7",
      title: "R&D 기술개발 지원",
      agency: "중소기업기술정보진흥원",
      amount: "최대 2억원",
      deadline: "2026-08-15",
      category: "기술·R&D",
      matchScore: 64,
      description: "중소·중견기업의 혁신 기술 개발을 위한 R&D 비용을 지원합니다.",
      url: "#",
    },
    {
      id: "8",
      title: "고용촉진장려금",
      agency: "고용노동부",
      amount: "월 최대 60만원",
      deadline: "2026-12-31",
      category: "고용·인력",
      matchScore: 60,
      description: "취업 취약계층을 채용한 사업주에게 최대 1년간 장려금을 지원합니다.",
      url: "#",
    },
  ],
  totalAmount: "약 5억 8,000만원",
};

function GrantCard({ grant, index }: { grant: Grant; index: number }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 hover:border-blue-300 hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              CATEGORY_COLORS[grant.category] ?? "bg-slate-100 text-slate-600"
            }`}
          >
            {grant.category}
          </span>
          {index === 0 && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700">
              최고 매칭
            </span>
          )}
        </div>
        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
          <span className="text-xs font-black text-blue-600">{grant.matchScore}%</span>
        </div>
      </div>

      <h3 className="text-lg font-black mb-1">{grant.title}</h3>
      <p className="text-xs text-slate-400 font-semibold mb-3">{grant.agency}</p>
      <p className="text-sm text-slate-600 leading-relaxed mb-4">{grant.description}</p>

      <div className="flex items-center justify-between">
        <div className="flex gap-4 text-sm">
          <div>
            <span className="text-slate-400 text-xs font-bold">지원금액</span>
            <div className="font-black text-blue-600">{grant.amount}</div>
          </div>
          <div>
            <span className="text-slate-400 text-xs font-bold">마감일</span>
            <div className="font-bold">{grant.deadline}</div>
          </div>
        </div>
        <a
          href={grant.url}
          className="bg-slate-900 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-slate-800 transition-all"
        >
          신청하기 →
        </a>
      </div>
    </div>
  );
}

function LockedSection({ count }: { count: number }) {
  return (
    <div className="relative">
      {/* 블러 처리된 카드 미리보기 */}
      <div className="space-y-4 blur-sm pointer-events-none select-none">
        {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex gap-2">
                <div className="h-6 w-20 bg-slate-200 rounded-full" />
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-200" />
            </div>
            <div className="h-5 w-3/4 bg-slate-200 rounded mb-2" />
            <div className="h-3 w-1/4 bg-slate-100 rounded mb-4" />
            <div className="h-3 w-full bg-slate-100 rounded mb-2" />
            <div className="h-3 w-5/6 bg-slate-100 rounded mb-4" />
            <div className="flex justify-between">
              <div className="h-5 w-24 bg-slate-200 rounded" />
              <div className="h-8 w-20 bg-slate-200 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* 자물쇠 오버레이 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl border border-slate-200 shadow-2xl px-10 py-10 text-center max-w-sm mx-auto">
          <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">
            {count}개 추가 지원금 잠김
          </p>
          <h3 className="text-xl font-black mb-2">
            전체 결과를 보려면<br />로그인이 필요합니다
          </h3>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            무료 회원가입 후 매칭된<br />모든 지원금을 확인하세요
          </p>
          <Link href="/signup" className="block w-full bg-slate-900 text-white font-black py-3.5 rounded-xl hover:bg-slate-800 transition-all mb-3 text-center">
            무료로 시작하기
          </Link>
          <Link href="/login" className="block w-full text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors text-center">
            이미 계정이 있어요 →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("analysisResult");
    setResult(raw ? JSON.parse(raw) : MOCK_RESULT);
  }, []);

  if (!result) return null;

  const freeGrants = result.grants.slice(0, FREE_LIMIT);
  const lockedCount = result.grants.length - FREE_LIMIT;

  return (
    <div className="bg-[#f8fafc] min-h-screen">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* 헤더 */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-green-600 font-bold text-sm">분석 완료</span>
          </div>
          <h1 className="text-4xl font-black mb-2" style={{ letterSpacing: "-0.02em" }}>
            총 {result.grants.length}개의 지원금을 찾았습니다
          </h1>
          <p className="text-slate-500 text-lg">
            수령 가능 예상 금액 합계{" "}
            <span className="text-blue-600 font-black">{result.totalAmount}</span>
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* 사업자 정보 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sticky top-24">
              <h2 className="font-black text-sm text-slate-400 uppercase tracking-wider mb-4">
                인식된 사업자 정보
              </h2>
              <div className="space-y-3">
                {[
                  { label: "상호명", value: result.businessInfo.name },
                  { label: "등록번호", value: result.businessInfo.registrationNumber },
                  { label: "사업자 구분", value: result.businessInfo.businessType },
                  { label: "업종", value: result.businessInfo.industry },
                  { label: "개업일", value: result.businessInfo.establishedDate },
                  { label: "주소", value: result.businessInfo.address },
                ].map((item) => (
                  <div key={item.label} className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-slate-400">{item.label}</span>
                    <span className="text-sm font-semibold text-slate-800">{item.value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t border-slate-100">
                <button
                  onClick={() => router.push("/")}
                  className="w-full text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
                >
                  ← 다시 분석하기
                </button>
              </div>
            </div>
          </div>

          {/* 지원금 목록 */}
          <div className="lg:col-span-2 space-y-4">
            {freeGrants.map((grant, i) => (
              <GrantCard key={grant.id} grant={grant} index={i} />
            ))}

            {lockedCount > 0 && <LockedSection count={lockedCount} />}
          </div>
        </div>
      </div>
    </div>
  );
}
