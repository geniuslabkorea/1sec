import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const OCR_PROMPT = `이 사업자등록증 이미지에서 다음 정보를 정확히 추출해주세요.
반드시 아래 JSON 형식으로만 응답하고, 다른 텍스트는 포함하지 마세요.

{
  "name": "상호(법인명)",
  "registrationNumber": "사업자등록번호 (xxx-xx-xxxxx 형식)",
  "businessType": "법인사업자 또는 개인사업자",
  "industry": "업태",
  "sector": "종목",
  "establishedDate": "개업연월일 (YYYY-MM-DD)",
  "address": "사업장 소재지",
  "representative": "대표자 성명"
}

읽을 수 없는 필드는 빈 문자열("")로 두세요.`;

async function parseBusinessRegistration(fileBuffer: Buffer, mimeType: string) {
  const base64 = fileBuffer.toString("base64");

  // PDF는 vision 지원 안되므로 JPEG 안내
  const supportedImageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!supportedImageTypes.includes(mimeType)) {
    throw new Error("PDF는 현재 지원되지 않습니다. JPG 또는 PNG 파일을 업로드해주세요.");
  }

  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mimeType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
              data: base64,
            },
          },
          { type: "text", text: OCR_PROMPT },
        ],
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("OCR 파싱 실패");

  return JSON.parse(jsonMatch[0]);
}

// 업종 기반 지원금 매칭 (추후 실제 API로 교체)
function matchGrants(businessInfo: Record<string, string>) {
  const grants = [
    {
      id: "1",
      title: "중소기업 디지털 전환 지원사업",
      agency: "중소벤처기업부",
      amount: "최대 5,000만원",
      deadline: "2026-05-30",
      category: "기술·R&D",
      matchScore: 97,
      description: "중소기업의 디지털 전환을 위한 솔루션 도입 비용의 70%를 무상 지원합니다.",
      url: "https://www.bizinfo.go.kr",
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
      url: "https://www.work.go.kr",
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
      url: "https://www.kised.or.kr",
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
      url: "https://www.kotra.or.kr",
    },
    {
      id: "5",
      title: "사업장 환경개선 융자",
      agency: "소상공인시장진흥공단",
      amount: "최대 5,000만원",
      deadline: "2026-12-31",
      category: "자금·융자",
      matchScore: 70,
      description: "소상공인 사업장 시설 개선 및 환경 개선을 위한 저금리 융자를 지원합니다.",
      url: "https://www.semas.or.kr",
    },
  ];

  // 개업일 기준 창업 3년 이내면 창업패키지 점수 상향
  if (businessInfo.establishedDate) {
    const established = new Date(businessInfo.establishedDate);
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
    if (established > threeYearsAgo) {
      const pkg = grants.find((g) => g.id === "3");
      if (pkg) pkg.matchScore = 96;
    }
  }

  return grants.sort((a, b) => b.matchScore - a.matchScore);
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file");

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type;

  try {
    const businessInfo = await parseBusinessRegistration(buffer, mimeType);
    const grants = matchGrants(businessInfo);

    return NextResponse.json({
      businessInfo,
      grants,
      totalAmount: "약 3억 2,000만원",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "분석 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
