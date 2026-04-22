import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SolapiMessageService } from "solapi";

function getSolapi() {
  return new SolapiMessageService(
    process.env.SOLAPI_API_KEY!,
    process.env.SOLAPI_API_SECRET!
  );
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req: NextRequest) {
  const { phone } = await req.json();

  if (!phone || !/^01[0-9]{8,9}$/.test(phone.replace(/-/g, ""))) {
    return NextResponse.json({ error: "올바른 핸드폰 번호를 입력해주세요." }, { status: 400 });
  }

  const normalizedPhone = phone.replace(/-/g, "");
  const code = generateOtp();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5분

  await prisma.otpCode.create({
    data: { phone: normalizedPhone, code, expiresAt },
  });

  try {
    await getSolapi().send({
      to: normalizedPhone,
      from: process.env.SOLAPI_SENDER!,
      text: `[1초지원금] 인증번호는 ${code}입니다. 5분 이내에 입력해주세요.`,
    });
  } catch (err) {
    console.error("SMS 전송 실패:", err);
    return NextResponse.json({ error: "SMS 전송에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
