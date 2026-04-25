import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

async function getSession() {
  return await getServerSession(authOptions);
}

export async function GET() {
  const session = await getSession();
  
  // Allow all authenticated users to SEE the config (prices/features)
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const config = await prisma.systemConfig.findUnique({
    where: { id: "global" },
  });

  return NextResponse.json(config);
}

export async function POST(req: Request) {
  const session = await getSession();

  // Only ADMIN can CHANGE the config
  if (session?.user?.role !== "ADMIN") {
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
