import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { amount, description } = await req.json();

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ message: "Invalid amount" }, { status: 400 });
    }

    // Check if user has enough credits
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || user.credits < amount) {
      return NextResponse.json({ message: "Insufficient credits" }, { status: 400 });
    }

    // Atomic transaction to deduct credits and log activity
    await prisma.$transaction(async (tx: any) => {
      await tx.user.update({
        where: { id: session.user.id },
        data: {
          credits: {
            decrement: amount,
          },
        },
      });

      await tx.creditTransaction.create({
        data: {
          userId: session.user.id,
          amount,
          type: "USE",
          description: description || "Maintenance operation",
        },
      });
    });

    return NextResponse.json({ message: "Success" });
  } catch (error) {
    console.error("Credit deduction error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
