import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const history = await prisma.creditTransaction.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20, // Get last 20 activities
    });

    return NextResponse.json(history);
  } catch (error) {
    console.error("Fetch history error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
