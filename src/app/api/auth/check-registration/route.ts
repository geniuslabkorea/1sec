import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { businessRegNumber } = await req.json();

  const exists = await prisma.user.findUnique({ where: { businessRegNumber } });

  return NextResponse.json({ available: !exists });
}
