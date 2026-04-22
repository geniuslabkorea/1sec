"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  "고용·인력": "bg-purple-100 text-purple-700",
  "기술·R&D": "bg-blue-100 text-blue-700",
  "자금·융자": "bg-green-100 text-green-700",
  "수출·글로벌": "bg-orange-100 text-orange-700",
  "창업·벤처": "bg-pink-100 text-pink-700",
};

// 개발 중 미리보기용 목업 데이터
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
  ],
  totalAmount: "약 3억 2,000만원",
};

export default function ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("analysisResult");
    if (raw) {
      setResult(JSON.parse(raw));
    } else {
      // 개발 편의를 위해 목업 데이터 사용
      setResult(MOCK_RESULT);
    }
  }, []);

  if (!result) return null;

  return (
    <div className="bg-[#f8fafc] min-h-screen">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* 분석 완료 헤더 */}
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
            {result.grants.length}개의 지원금을 찾았습니다
          </h1>
          <p className="text-slate-500 text-lg">
            수령 가능 예상 금액 합계{" "}
            <span className="text-blue-600 font-black">{result.totalAmount}</span>
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* 사업자 정보 카드 */}
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
            {result.grants.map((grant, i) => (
              <div
                key={grant.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        CATEGORY_COLORS[grant.category] ?? "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {grant.category}
                    </span>
                    {i === 0 && (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700">
                        최고 매칭
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                      <span className="text-xs font-black text-blue-600">{grant.matchScore}%</span>
                    </div>
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
