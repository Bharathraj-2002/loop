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

  const themes = await prisma.theme.findMany({
    where: { workspaceId: currentUser.workspaceId },
    include: {
      feedback: {
        include: { feedback: { select: { createdAt: true } } },
      },
    },
  });

  const now = new Date();
  const periodDays = 7;
  const currentPeriodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
  const previousPeriodStart = new Date(now.getTime() - 2 * periodDays * 24 * 60 * 60 * 1000);

  const result = themes.map((t) => {
    const dates = t.feedback.map((f) => f.feedback.createdAt);
    const currentCount = dates.filter((d) => d >= currentPeriodStart).length;
    const previousCount = dates.filter((d) => d >= previousPeriodStart && d < currentPeriodStart).length;

    let trend: "up" | "down" | "flat" = "flat";
    let changePercent = 0;
    if (previousCount > 0) {
      changePercent = Math.round(((currentCount - previousCount) / previousCount) * 100);
      if (changePercent > 15) trend = "up";
      else if (changePercent < -15) trend = "down";
    } else if (currentCount > 0) {
      trend = "up";
      changePercent = 100;
    }

    return {
      id: t.id,
      name: t.name,
      description: t.description,
      color: t.color,
      count: dates.length,
      currentPeriodCount: currentCount,
      previousPeriodCount: previousCount,
      trend,
      changePercent,
    };
  });

  result.sort((a, b) => b.count - a.count);

  return NextResponse.json({ themes: result });
}