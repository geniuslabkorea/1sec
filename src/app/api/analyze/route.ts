import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { fetchGrants, extractHashtags, type BizinfoItem } from "@/lib/bizinfo";

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
              data: fileBuffer.toString("base64"),
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

function scoreGrant(item: BizinfoItem, industry: string, sector: string): number {
  const text = `${item.bsnsSumryCn} ${item.trgetNm} ${item.hashtags} ${item.pldirSportRealmLclasCodeNm}`.toLowerCase();
  const keywords = `${industry} ${sector}`.toLowerCase().split(/\s+/);

  let score = 60;
  for (const kw of keywords) {
    if (kw.length > 1 && text.includes(kw)) score += 8;
  }

  // 마감일 임박할수록 높은 우선순위
  if (item.reqstBeginEndDe) {
    const parts = item.reqstBeginEndDe.split("~");
    if (parts[1]) {
      const deadline = new Date(parts[1].trim().replace(/\./g, "-"));
      const daysLeft = (deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      if (daysLeft > 0 && daysLeft < 30) score += 5;
    }
  }

  return Math.min(score, 99);
}

function mapCategory(lclasNm: string): string {
  if (lclasNm.includes("자금") || lclasNm.includes("융자")) return "자금·융자";
  if (lclasNm.includes("인력") || lclasNm.includes("고용")) return "고용·인력";
  if (lclasNm.includes("기술") || lclasNm.includes("R&D")) return "기술·R&D";
  if (lclasNm.includes("수출") || lclasNm.includes("글로벌")) return "수출·글로벌";
  if (lclasNm.includes("창업")) return "창업·벤처";
  return "기타";
}

function parseDeadline(reqstBeginEndDe: string): string {
  if (!reqstBeginEndDe) return "-";
  const parts = reqstBeginEndDe.split("~");
  return parts[1]?.trim().replace(/\./g, "-") ?? parts[0]?.trim() ?? "-";
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
    // 1. OCR로 사업자 정보 추출
    const businessInfo = await parseBusinessRegistration(buffer, mimeType);

    // 2. 업종 기반 해시태그 생성
    const hashtags = extractHashtags(businessInfo.industry ?? "", businessInfo.sector ?? "");

    // 3. 기업마당 API에서 공고 조회 (여러 분야 병렬)
    const [generalGrants, hashtagGrants] = await Promise.allSettled([
      fetchGrants({ numOfRows: 30 }),
      hashtags ? fetchGrants({ hashtags, numOfRows: 20 }) : Promise.resolve({ items: [], totalCount: 0 }),
    ]);

    const allItems = [
      ...(generalGrants.status === "fulfilled" ? generalGrants.value.items : []),
      ...(hashtagGrants.status === "fulfilled" ? hashtagGrants.value.items : []),
    ];

    // 중복 제거
    const seen = new Set<string>();
    const unique = allItems.filter((item) => {
      if (seen.has(item.pblancId)) return false;
      seen.add(item.pblancId);
      return true;
    });

    // 4. 스코어링 & 정렬
    const grants = unique
      .map((item) => ({
        id: item.pblancId,
        title: item.pblancNm,
        agency: item.jrsdInsttNm || item.excInsttNm,
        amount: "-",
        deadline: parseDeadline(item.reqstBeginEndDe),
        category: mapCategory(item.pldirSportRealmLclasCodeNm),
        matchScore: scoreGrant(item, businessInfo.industry ?? "", businessInfo.sector ?? ""),
        description: (() => {
          const plain = (item.bsnsSumryCn ?? "").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
          return plain.length > 120 ? plain.slice(0, 120) + "..." : plain;
        })(),
        url: item.rceptEngnHmpgUrl || item.pblancUrl,
      }))
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 20);

    return NextResponse.json({
      businessInfo,
      grants,
      totalAmount: "분석 중",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "분석 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
