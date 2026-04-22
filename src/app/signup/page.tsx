"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

type BusinessInfo = {
  companyName: string;
  businessRegNumber: string;
  businessType: string;
  industry: string;
  sector: string;
  establishedDate: string;
  address: string;
  representativeName: string;
};

type Step = "phone" | "otp" | "business" | "password";

const BUSINESS_TYPES = ["개인사업자", "법인사업자"];

function StepIndicator({ current }: { current: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: "phone", label: "본인인증" },
    { key: "otp", label: "인증확인" },
    { key: "business", label: "사업자정보" },
    { key: "password", label: "완료" },
  ];
  const idx = steps.findIndex((s) => s.key === current);

  return (
    <div className="flex items-center gap-2 mb-8">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 ${i <= idx ? "text-slate-900" : "text-slate-300"}`}>
            <div className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center
              ${i < idx ? "bg-green-500 text-white" : i === idx ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-400"}`}>
              {i < idx ? "✓" : i + 1}
            </div>
            <span className="text-xs font-bold hidden sm:block">{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-px w-6 sm:w-10 ${i < idx ? "bg-green-400" : "bg-slate-200"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");

  // 1단계: 핸드폰
  const [phone, setPhone] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  // 2단계: OTP
  const [otp, setOtp] = useState("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);

  // 3단계: 사업자 정보
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    companyName: "",
    businessRegNumber: "",
    businessType: "법인사업자",
    industry: "",
    sector: "",
    establishedDate: "",
    address: "",
    representativeName: "",
  });
  const [ocrLoading, setOcrLoading] = useState(false);
  const [regCheckStatus, setRegCheckStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");

  // 4단계: 비밀번호
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  const formatPhone = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 11);
    if (d.length <= 3) return d;
    if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
    return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  };

  const formatRegNumber = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 10);
    if (d.length <= 3) return d;
    if (d.length <= 5) return `${d.slice(0, 3)}-${d.slice(3)}`;
    return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`;
  };

  // OTP 전송
  const handleSendOtp = async () => {
    setError("");
    setSendingOtp(true);
    const res = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();
    setSendingOtp(false);
    if (!res.ok) { setError(data.error); return; }
    setOtpSent(true);
    setStep("otp");
  };

  // OTP 검증
  const handleVerifyOtp = async () => {
    setError("");
    setVerifyingOtp(true);
    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, code: otp }),
    });
    const data = await res.json();
    setVerifyingOtp(false);
    if (!res.ok) { setError(data.error); return; }
    setPhoneVerified(true);
    setStep("business");
  };

  // OCR 업로드
  const handleOcrUpload = useCallback(async (file: File) => {
    setOcrLoading(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/analyze", { method: "POST", body: formData });
      const data = await res.json();
      if (data.businessInfo) {
        const b = data.businessInfo;
        setBusinessInfo((prev) => ({
          ...prev,
          companyName: b.name ?? prev.companyName,
          businessRegNumber: formatRegNumber(b.registrationNumber ?? ""),
          businessType: b.businessType?.includes("개인") ? "개인사업자" : "법인사업자",
          industry: b.industry ?? prev.industry,
          sector: b.sector ?? prev.sector,
          establishedDate: b.establishedDate ?? prev.establishedDate,
          address: b.address ?? prev.address,
          representativeName: b.representative ?? prev.representativeName,
        }));
        setRegCheckStatus("idle");
      }
    } catch {
      setError("OCR 분석에 실패했습니다. 직접 입력해주세요.");
    }
    setOcrLoading(false);
  }, []);

  // 사업자등록번호 중복 체크
  const handleCheckReg = async () => {
    if (!businessInfo.businessRegNumber) return;
    setRegCheckStatus("checking");
    const res = await fetch("/api/auth/check-registration", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessRegNumber: businessInfo.businessRegNumber }),
    });
    const data = await res.json();
    setRegCheckStatus(data.available ? "available" : "taken");
  };

  // 최종 제출
  const handleSubmit = async () => {
    setError("");
    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (password.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, password, ...businessInfo }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) { setError(data.error); return; }
    router.push("/result");
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/">
            <Image src="/logo2.png" alt="1초 지원금" width={140} height={70} className="object-contain h-14 w-auto mx-auto" />
          </Link>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8">
          <StepIndicator current={step} />

          {/* 1단계: 핸드폰 번호 */}
          {step === "phone" && (
            <div>
              <h1 className="text-2xl font-black mb-2">본인 인증</h1>
              <p className="text-slate-500 text-sm mb-6">핸드폰 번호로 인증번호를 보내드립니다.</p>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1.5 block">핸드폰 번호</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    placeholder="010-0000-0000"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                {error && <p className="text-red-500 text-xs font-semibold">{error}</p>}
                <button
                  onClick={handleSendOtp}
                  disabled={sendingOtp || phone.replace(/-/g, "").length < 10}
                  className="w-full bg-slate-900 text-white font-black py-4 rounded-xl hover:bg-slate-800 transition-all disabled:opacity-40"
                >
                  {sendingOtp ? "전송 중..." : "인증번호 받기"}
                </button>
              </div>
            </div>
          )}

          {/* 2단계: OTP 인증 */}
          {step === "otp" && (
            <div>
              <h1 className="text-2xl font-black mb-2">인증번호 확인</h1>
              <p className="text-slate-500 text-sm mb-6">
                <span className="font-bold text-slate-700">{phone}</span>으로 발송된 6자리 번호를 입력해주세요.
              </p>
              <div className="space-y-4">
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-center text-2xl font-black tracking-[0.5em] focus:outline-none focus:border-blue-500 transition-colors"
                />
                {error && <p className="text-red-500 text-xs font-semibold text-center">{error}</p>}
                <button
                  onClick={handleVerifyOtp}
                  disabled={verifyingOtp || otp.length !== 6}
                  className="w-full bg-slate-900 text-white font-black py-4 rounded-xl hover:bg-slate-800 transition-all disabled:opacity-40"
                >
                  {verifyingOtp ? "확인 중..." : "인증 확인"}
                </button>
                <button
                  onClick={() => { setStep("phone"); setOtp(""); setError(""); }}
                  className="w-full text-sm font-bold text-slate-400 hover:text-slate-700 transition-colors"
                >
                  번호 다시 입력하기
                </button>
              </div>
            </div>
          )}

          {/* 3단계: 사업자 정보 */}
          {step === "business" && (
            <div>
              <h1 className="text-2xl font-black mb-2">사업자 정보</h1>
              <p className="text-slate-500 text-sm mb-5">사업자등록증을 올리면 자동으로 입력돼요.</p>

              {/* OCR 업로드 */}
              <label className="block border-2 border-dashed border-slate-200 rounded-xl py-6 text-center cursor-pointer hover:border-blue-400 hover:bg-slate-50 transition-all mb-6">
                {ocrLoading ? (
                  <span className="text-sm font-bold text-blue-600">분석 중...</span>
                ) : (
                  <>
                    <span className="text-2xl mb-1 block">📄</span>
                    <span className="text-sm font-bold text-slate-500">사업자등록증 업로드 (선택)</span>
                    <span className="text-xs text-slate-400 block mt-1">JPG, PNG — 자동 입력</span>
                  </>
                )}
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleOcrUpload(f); }}
                />
              </label>

              <div className="space-y-4">
                {/* 상호명 */}
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1.5 block">상호(법인명)</label>
                  <input
                    value={businessInfo.companyName}
                    onChange={(e) => setBusinessInfo((p) => ({ ...p, companyName: e.target.value }))}
                    placeholder="(주)업룸"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* 사업자등록번호 + 중복체크 */}
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1.5 block">사업자등록번호</label>
                  <div className="flex gap-2">
                    <input
                      value={businessInfo.businessRegNumber}
                      onChange={(e) => {
                        setBusinessInfo((p) => ({ ...p, businessRegNumber: formatRegNumber(e.target.value) }));
                        setRegCheckStatus("idle");
                      }}
                      placeholder="000-00-00000"
                      className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    <button
                      onClick={handleCheckReg}
                      disabled={businessInfo.businessRegNumber.replace(/-/g, "").length !== 10 || regCheckStatus === "checking"}
                      className="px-4 py-3 rounded-xl text-xs font-black border border-slate-200 hover:border-slate-400 transition-all disabled:opacity-40 whitespace-nowrap"
                    >
                      {regCheckStatus === "checking" ? "확인 중" : "중복확인"}
                    </button>
                  </div>
                  {regCheckStatus === "available" && (
                    <p className="text-green-600 text-xs font-bold mt-1">사용 가능한 사업자등록번호입니다.</p>
                  )}
                  {regCheckStatus === "taken" && (
                    <p className="text-red-500 text-xs font-bold mt-1">이미 등록된 사업자등록번호입니다.</p>
                  )}
                </div>

                {/* 사업자 구분 */}
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1.5 block">사업자 구분</label>
                  <div className="flex gap-3">
                    {BUSINESS_TYPES.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setBusinessInfo((p) => ({ ...p, businessType: t }))}
                        className={`flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-all
                          ${businessInfo.businessType === t
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 text-slate-500 hover:border-slate-400"
                          }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 업종 */}
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1.5 block">업종 (업태)</label>
                  <input
                    value={businessInfo.industry}
                    onChange={(e) => setBusinessInfo((p) => ({ ...p, industry: e.target.value }))}
                    placeholder="소프트웨어 개발업"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* 개업일 */}
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1.5 block">개업일</label>
                  <input
                    type="date"
                    value={businessInfo.establishedDate}
                    onChange={(e) => setBusinessInfo((p) => ({ ...p, establishedDate: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* 주소 */}
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1.5 block">사업장 주소</label>
                  <input
                    value={businessInfo.address}
                    onChange={(e) => setBusinessInfo((p) => ({ ...p, address: e.target.value }))}
                    placeholder="서울특별시 강남구 테헤란로 427"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                {error && <p className="text-red-500 text-xs font-semibold">{error}</p>}

                <button
                  onClick={() => {
                    if (!businessInfo.businessRegNumber || !businessInfo.industry || !businessInfo.address) {
                      setError("필수 항목을 모두 입력해주세요.");
                      return;
                    }
                    if (regCheckStatus !== "available") {
                      setError("사업자등록번호 중복확인을 해주세요.");
                      return;
                    }
                    setError("");
                    setStep("password");
                  }}
                  className="w-full bg-slate-900 text-white font-black py-4 rounded-xl hover:bg-slate-800 transition-all"
                >
                  다음
                </button>
              </div>
            </div>
          )}

          {/* 4단계: 비밀번호 */}
          {step === "password" && (
            <div>
              <h1 className="text-2xl font-black mb-2">비밀번호 설정</h1>
              <p className="text-slate-500 text-sm mb-6">8자 이상의 비밀번호를 설정해주세요.</p>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1.5 block">비밀번호</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="8자 이상"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1.5 block">비밀번호 확인</label>
                  <input
                    type="password"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    placeholder="비밀번호 재입력"
                    className={`w-full border rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none transition-colors
                      ${passwordConfirm && password !== passwordConfirm ? "border-red-300 focus:border-red-400" : "border-slate-200 focus:border-blue-500"}`}
                  />
                  {passwordConfirm && password !== passwordConfirm && (
                    <p className="text-red-500 text-xs font-bold mt-1">비밀번호가 일치하지 않습니다.</p>
                  )}
                </div>

                {error && <p className="text-red-500 text-xs font-semibold">{error}</p>}

                <button
                  onClick={handleSubmit}
                  disabled={submitting || !password || password !== passwordConfirm}
                  className="w-full bg-slate-900 text-white font-black py-4 rounded-xl hover:bg-slate-800 transition-all disabled:opacity-40"
                >
                  {submitting ? "가입 중..." : "회원가입 완료"}
                </button>
                <button
                  onClick={() => setStep("business")}
                  className="w-full text-sm font-bold text-slate-400 hover:text-slate-700 transition-colors"
                >
                  ← 이전으로
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 text-center">
            <span className="text-sm text-slate-400">이미 계정이 있으신가요? </span>
            <Link href="/login" className="text-sm font-bold text-blue-600 hover:text-blue-700">
              로그인
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
