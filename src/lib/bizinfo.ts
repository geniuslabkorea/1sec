const BASE_URL = "https://apis.data.go.kr/1421000/bizinfo/pblancBsnsService";

export type BizinfoItem = {
  pblancNm: string;       // 공고명
  pblancUrl: string;      // 공고URL
  pblancId: string;       // 공고ID
  jrsdInsttNm: string;    // 소관명(부처)
  excInsttNm: string;     // 수행기관명
  bsnsSumryCn: string;    // 사업개요
  pldirSportRealmLclasCodeNm: string; // 분야
  reqstBeginEndDe: string; // 신청기간
  trgetNm: string;        // 지원대상
  hashtags: string;       // 해시태그
  reqstMthPapersCn: string; // 신청방법
  refrncNm: string;       // 문의처
  rceptEngnHmpgUrl: string; // 신청URL
  creatPnttm: string;     // 등록일
};

type BizinfoResponse = {
  header: { resultCode: string; resultMsg: string };
  body: {
    items: { item: BizinfoItem | BizinfoItem[] } | "";
    numOfRows: string;
    pageNo: string;
    totalCount: string;
  };
};

export async function fetchGrants(params: {
  pageNo?: number;
  numOfRows?: number;
  searchLclasId?: string;
  hashtags?: string;
  registDe?: string;
}): Promise<{ items: BizinfoItem[]; totalCount: number }> {
  const apiKey = process.env.BIZINFO_API_KEY;
  if (!apiKey) throw new Error("BIZINFO_API_KEY가 설정되지 않았습니다.");

  const query = new URLSearchParams({
    serviceKey: apiKey,
    dataType: "JSON",
    pageNo: String(params.pageNo ?? 1),
    numOfRows: String(params.numOfRows ?? 20),
    ...(params.searchLclasId && { searchLclasId: params.searchLclasId }),
    ...(params.hashtags && { hashtags: params.hashtags }),
    ...(params.registDe && { registDe: params.registDe }),
  });

  const res = await fetch(`${BASE_URL}?${query}`, {
    next: { revalidate: 3600 }, // 1시간 캐시
  });

  if (!res.ok) throw new Error(`기업마당 API 오류: ${res.status}`);

  const json: BizinfoResponse = await res.json();

  if (json.header.resultCode !== "00" && json.header.resultCode !== "0000") {
    throw new Error(`기업마당 API 응답 오류: ${json.header.resultMsg}`);
  }

  if (!json.body.items || (json.body.items as unknown) === "") {
    return { items: [], totalCount: 0 };
  }

  const raw = json.body.items.item;
  const items = Array.isArray(raw) ? raw : [raw];

  return {
    items,
    totalCount: Number(json.body.totalCount),
  };
}

// 업종/업태 키워드로 관련 분야 해시태그 추출
export function extractHashtags(industry: string, sector: string): string {
  const text = `${industry} ${sector}`.toLowerCase();
  const tags: string[] = [];

  if (text.match(/소프트웨어|it|정보통신|앱|플랫폼|개발/)) tags.push("정보통신");
  if (text.match(/제조|생산|공장|부품/)) tags.push("제조");
  if (text.match(/음식|식품|요식|카페|베이커리/)) tags.push("식품");
  if (text.match(/유통|도매|소매|판매/)) tags.push("유통");
  if (text.match(/건설|인테리어|건축/)) tags.push("건설");
  if (text.match(/의료|바이오|헬스|병원/)) tags.push("바이오의료");
  if (text.match(/교육|학원|연구/)) tags.push("교육");
  if (text.match(/물류|배송|운송/)) tags.push("물류");

  return tags.join(",");
}

// 기업마당 분야코드
export const LCLASS_CODES: Record<string, string> = {
  "자금": "LCLASS_0001",
  "인력": "LCLASS_0002",
  "기술": "LCLASS_0003",
  "수출": "LCLASS_0004",
  "내수": "LCLASS_0005",
  "창업": "LCLASS_0006",
  "경영": "LCLASS_0007",
  "기타": "LCLASS_0008",
};
