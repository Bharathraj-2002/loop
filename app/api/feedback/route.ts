import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET all feedback for the user's workspace
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

  const feedback = await prisma.feedback.findMany({
    where: { workspaceId: currentUser.workspaceId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ feedback });
}

// POST new feedback - only ADMIN and ANALYST allowed
export async function POST(req: Request) {
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

  // RBAC check: VIEWER cannot create feedback
  if (currentUser.role === "VIEWER") {
    return NextResponse.json({ error: "Forbidden: Viewers cannot add feedback" }, { status: 403 });
  }

  const body = await req.json();
  const { content, channel } = body;

  if (!content || !channel) {
    return NextResponse.json({ error: "content and channel are required" }, { status: 400 });
  }

  const newFeedback = await prisma.feedback.create({
    data: {
      content,
      channel,
      workspaceId: currentUser.workspaceId,
    },
  });

  return NextResponse.json({ feedback: newFeedback });
}