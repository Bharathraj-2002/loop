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

  const workspaceId = currentUser.workspaceId;

  const total = await prisma.feedback.count({ where: { workspaceId } });

  const sentimentCounts = await prisma.feedback.groupBy({
    by: ["sentiment"],
    where: { workspaceId },
    _count: true,
  });

  const sentimentData = sentimentCounts.map((s) => ({
    name: s.sentiment || "Unclassified",
    value: s._count,
  }));

  const channelCounts = await prisma.feedback.groupBy({
    by: ["channel"],
    where: { workspaceId },
    _count: true,
    orderBy: { _count: { channel: "desc" } },
    take: 6,
  });

  const channelData = channelCounts.map((c) => ({
    name: c.channel,
    count: c._count,
  }));

  const allItems = await prisma.feedback.findMany({
    where: { workspaceId },
    select: { createdAt: true },
  });

  const volumeMap: Record<string, number> = {};
  for (const item of allItems) {
    const day = item.createdAt.toISOString().split("T")[0];
    volumeMap[day] = (volumeMap[day] || 0) + 1;
  }
  const volumeData = Object.entries(volumeMap)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const negativeCount = sentimentCounts.find((s) => s.sentiment === "NEG")?._count || 0;
  const percentNegative = total > 0 ? Math.round((negativeCount / total) * 100) : 0;

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const newThisWeek = await prisma.feedback.count({
    where: { workspaceId, createdAt: { gte: weekAgo } },
  });

  return NextResponse.json({
    total,
    percentNegative,
    newThisWeek,
    sentimentData,
    channelData,
    volumeData,
  });
}