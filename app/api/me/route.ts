import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email! },
  });
  if (!currentUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  return NextResponse.json({ role: currentUser.role, name: currentUser.name });
}
