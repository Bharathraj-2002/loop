import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

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

  if (currentUser.role === "VIEWER") {
    return NextResponse.json({ error: "Forbidden: Viewers cannot update feedback" }, { status: 403 });
  }

  const body = await req.json();
  const { status } = body;

  if (!["NEW", "REVIEWED", "ACTIONED"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const existing = await prisma.feedback.findUnique({ where: { id } });
  if (!existing || existing.workspaceId !== currentUser.workspaceId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.feedback.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json({ feedback: updated });
}