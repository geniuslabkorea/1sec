"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

type UploadState = "idle" | "dragging" | "uploading" | "error";

export default function UploadZone() {
  const router = useRouter();
  const [state, setState] = useState<UploadState>("idle");
  const [fileName, setFileName] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleFile = useCallback((f: File) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowed.includes(f.type)) {
      setErrorMsg("PDF, JPG, PNG, WEBP 파일만 업로드할 수 있습니다.");
      setState("error");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setErrorMsg("파일 크기는 10MB 이하여야 합니다.");
      setState("error");
      return;
    }
    setFile(f);
    setFileName(f.name);
    setState("idle");
    setErrorMsg("");
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setState("idle");
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setState("uploading");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/analyze", { method: "POST", body: formData });
      if (!res.ok) throw new Error("분석 실패");
      const data = await res.json();
      // 결과 페이지로 이동 (쿼리로 전달 또는 sessionStorage)
      sessionStorage.setItem("analysisResult", JSON.stringify(data));
      router.push("/result");
    } catch {
      setErrorMsg("분석 중 오류가 발생했습니다. 다시 시도해주세요.");
      setState("error");
    }
  };

  const isDragging = state === "dragging";
  const isUploading = state === "uploading";

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl">
      <div className="text-center mb-8">
        <h3 className="text-xl font-bold mb-2">무료 분석 시작하기</h3>
        <p className="text-sm text-slate-400">사업자등록증 파일을 끌어서 놓으세요</p>
      </div>

      <label
        htmlFor="file-upload"
        className={`block rounded-xl py-14 flex flex-col items-center justify-center gap-4 cursor-pointer mb-6 border-2 border-dashed transition-all
          ${isDragging ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-blue-400 hover:bg-slate-50"}
          ${fileName ? "border-green-400 bg-green-50" : ""}
        `}
        onDragOver={(e) => { e.preventDefault(); setState("dragging"); }}
        onDragLeave={() => setState("idle")}
        onDrop={onDrop}
      >
        {fileName ? (
          <>
            <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-bold text-green-600">{fileName}</span>
            <span className="text-xs text-slate-400">다른 파일을 올리려면 클릭하세요</span>
          </>
        ) : (
          <>
            <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-sm font-bold text-slate-500">PDF, JPG, PNG 파일 지원</span>
            <span className="text-xs text-slate-400">또는 클릭하여 파일 선택</span>
          </>
        )}
        <input
          id="file-upload"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          className="hidden"
          onChange={onInputChange}
        />
      </label>

      {state === "error" && (
        <p className="text-red-500 text-xs text-center mb-4 font-semibold">{errorMsg}</p>
      )}

      <button
        onClick={handleAnalyze}
        disabled={!file || isUploading}
        className={`w-full py-5 rounded-xl font-black text-lg shadow-lg transition-all text-white
          ${!file || isUploading
            ? "bg-slate-300 cursor-not-allowed shadow-none"
            : "bg-slate-900 hover:bg-slate-800 active:scale-[0.98]"
          }`}
      >
        {isUploading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            분석 중...
          </span>
        ) : (
          "1초 만에 분석 결과 보기"
        )}
      </button>

      <p className="mt-4 text-[11px] text-slate-400 text-center leading-tight">
        보안 처리된 환경에서 분석 후 즉시 파기됩니다.<br />
        개인정보 및 기업정보는 안전하게 보호됩니다.
      </p>
    </div>
  );
}
