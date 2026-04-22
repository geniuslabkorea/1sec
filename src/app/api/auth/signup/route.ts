import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    phone,
    password,
    businessRegNumber,
    businessType,
    industry,
    sector,
    establishedDate,
    address,
    representativeName,
    companyName,
  } = body;

  const normalizedPhone = phone.replace(/-/g, "");

  // 중복 체크
  const existingPhone = await prisma.user.findUnique({ where: { phone: normalizedPhone } });
  if (existingPhone) {
    return NextResponse.json({ error: "이미 가입된 핸드폰 번호입니다." }, { status: 409 });
  }

  const existingReg = await prisma.user.findUnique({ where: { businessRegNumber } });
  if (existingReg) {
    return NextResponse.json({ error: "이미 등록된 사업자등록번호입니다." }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      phone: normalizedPhone,
      password: hashed,
      businessRegNumber,
      businessType,
      industry,
      sector: sector ?? "",
      establishedDate,
      address,
      representativeName: representativeName ?? "",
      companyName: companyName ?? "",
    },
  });

  const token = signToken({ userId: user.id, phone: user.phone });

  const res = NextResponse.json({ success: true });
  res.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  return res;
}
