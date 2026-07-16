import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { classifyFeedback } from "@/lib/ai";

const prisma = new PrismaClient();

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

  if (currentUser.role === "VIEWER") {
    return NextResponse.json({ error: "Forbidden: Viewers cannot classify feedback" }, { status: 403 });
  }

  const body = await req.json();
  const { feedbackId } = body;

  if (!feedbackId) {
    return NextResponse.json({ error: "feedbackId is required" }, { status: 400 });
  }

  const feedback = await prisma.feedback.findUnique({ where: { id: feedbackId } });
  if (!feedback || feedback.workspaceId !== currentUser.workspaceId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const existingThemes = await prisma.theme.findMany({
    where: { workspaceId: currentUser.workspaceId },
    select: { name: true },
  });
  const themeNames = existingThemes.map((t) => t.name);

  const result = await classifyFeedback(feedback.content, themeNames);

  if (!result) {
    return NextResponse.json({ error: "Classification failed" }, { status: 500 });
  }

  await prisma.feedback.update({
    where: { id: feedbackId },
    data: {
      sentiment: result.sentiment,
      sentimentScore: result.sentimentScore,
    },
  });

  for (const themeName of result.themes) {
    let theme = await prisma.theme.findFirst({
      where: { workspaceId: currentUser.workspaceId, name: themeName },
    });
    if (!theme) {
      theme = await prisma.theme.create({
        data: { name: themeName, workspaceId: currentUser.workspaceId },
      });
    }
    const existingLink = await prisma.feedbackTheme.findUnique({
      where: { feedbackId_themeId: { feedbackId, themeId: theme.id } },
    });
    if (!existingLink) {
      await prisma.feedbackTheme.create({
        data: { feedbackId, themeId: theme.id, confidence: 1.0 },
      });
    }
  }

  return NextResponse.json({ result });
}