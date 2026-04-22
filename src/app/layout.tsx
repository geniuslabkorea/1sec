import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "1초지원금 | 사업자 지원금 실시간 매칭",
  description: "사업자등록증 한 장으로 받을 수 있는 정부 지원금을 1초 만에 찾아드립니다.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
