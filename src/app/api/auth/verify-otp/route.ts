import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { phone, code } = await req.json();
  const normalizedPhone = phone.replace(/-/g, "");

  const otp = await prisma.otpCode.findFirst({
    where: {
      phone: normalizedPhone,
      code,
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) {
    return NextResponse.json({ error: "인증번호가 올바르지 않거나 만료되었습니다." }, { status: 400 });
  }

  await prisma.otpCode.update({ where: { id: otp.id }, data: { used: true } });

  return NextResponse.json({ success: true });
}
