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

  // RBAC check: only ADMIN can view member list
  if (currentUser.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
  }

  const members = await prisma.user.findMany({
    where: { workspaceId: currentUser.workspaceId },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  return NextResponse.json({ members });
}