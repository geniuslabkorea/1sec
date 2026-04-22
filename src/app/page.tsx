import Image from "next/image";
import Navbar from "@/components/Navbar";
import UploadZone from "@/components/UploadZone";

const STATS = [
  { label: "매칭 가능 공고", value: "42,891건", highlight: false },
  { label: "어제 지급 확정액", value: "18.4억", highlight: true },
];

const STEPS = [
  {
    num: "01",
    title: "자동 OCR 스캔",
    desc: "업종, 업태, 설립일 등 복잡한 정보를 타이핑할 필요가 없습니다. 이미지 한 장이면 시스템이 알아서 분류합니다.",
  },
  {
    num: "02",
    title: "맞춤형 매칭 엔진",
    desc: "공고 텍스트를 AI가 분석하여, 해당 사업자가 실제로 받을 수 있는 확률이 높은 지원금만 선별합니다.",
  },
  {
    num: "03",
    title: "신규 공고 알림",
    desc: "대표님 사업장에 맞는 새로운 공고가 올라오면, 1초 만에 카카오톡으로 바로 알려드립니다.",
  },
];

const LOGOS = ["SAMSUNG", "HYUNDAI", "NAVER", "KAKAOBANK", "COUPANG"];

export default function Home() {
  return (
    <div className="bg-[#f8fafc] min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
              </span>
              실시간 사업자 데이터 분석 엔진 가동 중
            </div>

            <h1
              className="text-5xl lg:text-6xl font-black mb-8"
              style={{ letterSpacing: "-0.03em", lineHeight: 1.2 }}
            >
              사업자등록증 한 장이면
              <br />
              <span className="text-blue-600">지원금 검색 끝.</span>
            </h1>

            <p className="text-lg text-slate-500 font-medium mb-10 leading-relaxed">
              수만 개의 정부 공고를 일일이 확인하지 마세요.
              <br />
              국내 유일의 OCR 매칭 엔진이 대표님의 사업장에 딱 맞는
              <br />
              무상환 지원금만 골라 1초 만에 리포트합니다.
            </p>

            <div className="flex gap-4">
              {STATS.map((s) => (
                <div
                  key={s.label}
                  className="bg-white border border-slate-200 shadow-sm px-6 py-4 rounded-xl flex-1 text-center"
                >
                  <div className="text-xs text-slate-400 font-bold mb-1 uppercase">{s.label}</div>
                  <div className={`text-2xl font-black ${s.highlight ? "text-blue-600" : ""}`}>
                    {s.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200">
            <UploadZone />
          </div>
        </div>
      </section>

      {/* Trust logos */}
      <section className="py-16 border-y border-slate-100 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-xs font-black text-slate-400 uppercase tracking-widest mb-10">
            Trusted by 2,000+ Enterprises
          </p>
          <div className="flex justify-between items-center opacity-30 grayscale gap-8 overflow-hidden">
            {LOGOS.map((l) => (
              <span key={l} className="text-2xl font-black">
                {l}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-12">
          {STEPS.map((s) => (
            <div key={s.num}>
              <div className="text-blue-600 font-black text-4xl mb-4 italic leading-none">
                {s.num}
              </div>
              <h4 className="text-xl font-bold mb-3">{s.title}</h4>
              <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-12 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center text-xs text-slate-400 font-medium">
          <div>© 2026 UPROOM LTD. All Rights Reserved.</div>
          <div className="flex gap-4">
            <a href="#" className="hover:text-slate-600 transition-colors">이용약관</a>
            <a href="#" className="text-slate-900 font-bold hover:text-slate-700 transition-colors">
              개인정보처리방침
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
