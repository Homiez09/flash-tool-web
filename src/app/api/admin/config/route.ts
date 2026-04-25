import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

async function isAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === "ADMIN";
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const config = await prisma.systemConfig.findUnique({
    where: { id: "global" },
  });

  return NextResponse.json(config);
}

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { features, prices } = await req.json();

    const config = await prisma.systemConfig.update({
      where: { id: "global" },
      data: {
        features: features || undefined,
        prices: prices || undefined,
      },
    });

    return NextResponse.json(config);
  } catch (error) {
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}
