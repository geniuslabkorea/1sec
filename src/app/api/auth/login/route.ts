import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  const { phone, password } = await req.json();
  const normalizedPhone = phone.replace(/-/g, "");

  const user = await prisma.user.findUnique({ where: { phone: normalizedPhone } });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return NextResponse.json({ error: "핸드폰 번호 또는 비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

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
