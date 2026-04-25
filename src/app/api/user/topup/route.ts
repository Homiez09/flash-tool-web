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
    const { amount } = await req.json();

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ message: "Invalid amount" }, { status: 400 });
    }

    // Use a transaction to ensure atomic update and record creation
    const updatedUser = await prisma.$transaction(async (tx: any) => {
      const user = await tx.user.update({
        where: { id: session.user.id },
        data: {
          credits: {
            increment: amount,
          },
        },
      });

      await tx.creditTransaction.create({
        data: {
          userId: session.user.id,
          amount,
          type: "ADD",
          description: "Manual top-up (Phase 1 Hardcode)",
        },
      });

      return user;
    });

    return NextResponse.json({ 
      message: "Success", 
      credits: updatedUser.credits 
    });
  } catch (error) {
    console.error("Topup error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
