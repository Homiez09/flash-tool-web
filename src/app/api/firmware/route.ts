import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";

  try {
    const firmwares = await prisma.firmware.findMany({
      where: {
        OR: [
          { brand: { contains: query, mode: "insensitive" } },
          { model: { contains: query, mode: "insensitive" } },
          { version: { contains: query, mode: "insensitive" } },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(firmwares);
  } catch (error) {
    console.error("Fetch firmware error:", error);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}

// Admin only: Add new firmware
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const firmware = await prisma.firmware.create({
      data: body,
    });

    return NextResponse.json(firmware);
  } catch (error) {
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}
