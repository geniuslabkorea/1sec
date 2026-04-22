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

// 주소에서 시/도 추출
function extractRegion(address: string): string {
  const regions = ["서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종",
    "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"];
  return regions.find((r) => address.includes(r)) ?? "";
}

function scoreGrant(
  item: BizinfoItem,
  industry: string,
  sector: string,
  businessType: string,
  region: string
): number {
  const fullText = `${item.pblancNm} ${item.bsnsSumryCn} ${item.trgetNm} ${item.hashtags}`.toLowerCase();
  const targetText = (item.trgetNm ?? "").toLowerCase();
  const titleText = (item.pblancNm ?? "").toLowerCase();

  let score = 60;

  // 1. 업종 키워드 매칭
  const keywords = `${industry} ${sector}`.toLowerCase().split(/\s+/);
  for (const kw of keywords) {
    if (kw.length > 1 && fullText.includes(kw)) score += 8;
  }

  // 2. 법인/개인 매칭
  const isCorpGrant = targetText.includes("법인");
  const isPersonGrant = targetText.includes("개인사업자") || targetText.includes("개인 사업자");
  const isMyType = businessType.includes("법인") ? isCorpGrant : isPersonGrant;
  const isOppositeType = businessType.includes("법인") ? isPersonGrant : isCorpGrant;

  if (isMyType) score += 15;
  if (isOppositeType && !isMyType) score -= 20; // 반대 타입 전용 공고 페널티

  // 3. 지역 매칭
  if (region) {
    const titleHasRegion = titleText.includes(region);
    const contentHasRegion = fullText.includes(region);

    // 다른 지역 전용 공고 페널티
    const otherRegions = ["서울", "부산", "대구", "인천", "광주", "대전", "울산",
      "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주", "제주도", "세종"]
      .filter((r) => r !== region);
    const hasOtherRegion = otherRegions.some((r) => titleText.startsWith(`[${r}`) || titleText.includes(`[${r}]`));

    if (titleHasRegion) score += 20; // 내 지역 공고 우선
    else if (contentHasRegion) score += 10;
    if (hasOtherRegion) score -= 25; // 타 지역 공고 페널티
  }

  // 4. 마감일 임박
  if (item.reqstBeginEndDe) {
    const parts = item.reqstBeginEndDe.split("~");
    if (parts[1]) {
      const deadline = new Date(parts[1].trim().replace(/\./g, "-"));
      const daysLeft = (deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      if (daysLeft > 0 && daysLeft < 30) score += 5;
      if (daysLeft < 0) score -= 50; // 마감 지난 공고 제외
    }
  }

  return Math.max(0, Math.min(score, 99));
}

function mapCategory(lclasNm: string): string {
  if (lclasNm.includes("자금") || lclasNm.includes("융자")) return "자금·융자";
  if (lclasNm.includes("인력") || lclasNm.includes("고용")) return "고용·인력";
  if (lclasNm.includes("기술") || lclasNm.includes("R&D") || lclasNm.includes("연구")) return "기술·R&D";
  if (lclasNm.includes("수출") || lclasNm.includes("글로벌") || lclasNm.includes("해외")) return "수출·글로벌";
  if (lclasNm.includes("내수") || lclasNm.includes("판로") || lclasNm.includes("유통")) return "내수·판로";
  if (lclasNm.includes("창업") || lclasNm.includes("벤처")) return "창업·벤처";
  if (lclasNm.includes("경영") || lclasNm.includes("컨설팅")) return "경영·컨설팅";
  return "기타";
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 150);
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

    // 3. 기업마당 API 병렬 조회 — 전분야 + 분야별(자금/인력/기술/창업) + 해시태그
    const fetches = await Promise.allSettled([
      fetchGrants({ numOfRows: 100 }),                                   // 전체 최신
      fetchGrants({ numOfRows: 100, pageNo: 2 }),                        // 2페이지
      fetchGrants({ numOfRows: 100, searchLclasId: "LCLASS_0001" }),     // 자금·융자
      fetchGrants({ numOfRows: 100, searchLclasId: "LCLASS_0002" }),     // 인력·고용
      fetchGrants({ numOfRows: 100, searchLclasId: "LCLASS_0003" }),     // 기술·R&D
      fetchGrants({ numOfRows: 100, searchLclasId: "LCLASS_0004" }),     // 수출·글로벌
      fetchGrants({ numOfRows: 100, searchLclasId: "LCLASS_0005" }),     // 내수·판로
      fetchGrants({ numOfRows: 100, searchLclasId: "LCLASS_0006" }),     // 창업·벤처
      fetchGrants({ numOfRows: 100, searchLclasId: "LCLASS_0007" }),     // 경영·컨설팅
      fetchGrants({ numOfRows: 100, searchLclasId: "LCLASS_0008" }),     // 기타
      hashtags
        ? fetchGrants({ numOfRows: 100, hashtags })
        : Promise.resolve({ items: [], totalCount: 0 }),
    ]);

    const allItems = fetches.flatMap((r) =>
      r.status === "fulfilled" ? r.value.items : []
    );

    // 중복 제거
    const seen = new Set<string>();
    const unique = allItems.filter((item) => {
      if (seen.has(item.pblancId)) return false;
      seen.add(item.pblancId);
      return true;
    });

    // 4. 스코어링 & 정렬
    const region = extractRegion(businessInfo.address ?? "");
    const grants = unique
      .map((item) => ({
        id: item.pblancId,
        title: item.pblancNm,
        agency: item.jrsdInsttNm || item.excInsttNm,
        amount: "-",
        deadline: parseDeadline(item.reqstBeginEndDe),
        category: mapCategory(item.pldirSportRealmLclasCodeNm),
        matchScore: scoreGrant(
          item,
          businessInfo.industry ?? "",
          businessInfo.sector ?? "",
          businessInfo.businessType ?? "",
          region
        ),
        description: stripHtml(item.bsnsSumryCn ?? ""),
        url: item.rceptEngnHmpgUrl || item.pblancUrl,
      }))
      .filter((g) => g.matchScore > 20) // 너무 낮은 매칭 제외
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 50);

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
