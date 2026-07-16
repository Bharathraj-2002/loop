import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
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

  const theme = await prisma.theme.findUnique({ where: { id } });
  if (!theme || theme.workspaceId !== currentUser.workspaceId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const links = await prisma.feedbackTheme.findMany({
    where: { themeId: id },
    include: { feedback: true },
    orderBy: { feedback: { createdAt: "desc" } },
  });

  const feedbackItems = links.map((l) => l.feedback);

  return NextResponse.json({ theme, feedback: feedbackItems });
}