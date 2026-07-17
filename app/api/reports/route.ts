import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { generateVoCReport } from "@/lib/ai";

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
  const reports = await prisma.report.findMany({
    where: { workspaceId: currentUser.workspaceId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ reports });
}

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

  const body = await req.json().catch(() => ({}));
  const periodDays = body.periodDays || 7;
  const now = new Date();
  const periodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
  const prevPeriodStart = new Date(now.getTime() - 2 * periodDays * 24 * 60 * 60 * 1000);

  const workspaceId = currentUser.workspaceId;

  const currentFeedback = await prisma.feedback.findMany({
    where: { workspaceId, createdAt: { gte: periodStart } },
    include: { themes: { include: { theme: true } } },
  });
  const previousFeedback = await prisma.feedback.findMany({
    where: { workspaceId, createdAt: { gte: prevPeriodStart, lt: periodStart } },
  });

  if (currentFeedback.length === 0) {
    return NextResponse.json(
      { error: "No feedback in this period to report on" },
      { status: 400 }
    );
  }

  const themeCounts: Record<string, number> = {};
  for (const f of currentFeedback) {
    for (const ft of f.themes) {
      themeCounts[ft.theme.name] = (themeCounts[ft.theme.name] || 0) + 1;
    }
  }
  const topThemes = Object.entries(themeCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const pos = currentFeedback.filter((f) => f.sentiment === "POS").length;
  const neu = currentFeedback.filter((f) => f.sentiment === "NEU").length;
  const neg = currentFeedback.filter((f) => f.sentiment === "NEG").length;

  const currentNegPct = currentFeedback.length ? neg / currentFeedback.length : 0;
  const prevNegCount = previousFeedback.filter((f) => f.sentiment === "NEG").length;
  const prevNegPct = previousFeedback.length ? prevNegCount / previousFeedback.length : 0;
  const sentimentDeltaPct =
    prevNegPct > 0 ? Math.round(((currentNegPct - prevNegPct) / prevNegPct) * 100) : 0;

  const notableQuotes = currentFeedback
    .filter((f) => f.sentiment === "NEG" || f.sentiment === "POS")
    .slice(0, 6)
    .map((f) => ({
      content: f.content,
      channel: f.channel,
      sentiment: f.sentiment || "NEU",
    }));

  const aiResult = await generateVoCReport({
    periodStart: periodStart.toISOString().slice(0, 10),
    periodEnd: now.toISOString().slice(0, 10),
    totalFeedback: currentFeedback.length,
    topThemes,
    sentimentBreakdown: { pos, neu, neg },
    sentimentDeltaPct,
    notableQuotes,
  });

  if (!aiResult) {
    return NextResponse.json({ error: "AI report generation failed" }, { status: 500 });
  }

  const startStr = periodStart.toISOString().slice(0, 10);
  const endStr = now.toISOString().slice(0, 10);

  const report = await prisma.report.create({
    data: {
      title: "Voice of Customer - " + startStr + " to " + endStr,
      periodStart,
      periodEnd: now,
      workspaceId,
      generatedBy: currentUser.id,
      contentJson: {
        summary: aiResult.summary,
        topThemes,
        sentimentBreakdown: { pos, neu, neg },
        sentimentDeltaPct,
        notableQuotes,
        recommendedActions: aiResult.recommendedActions,
      },
    },
  });

  return NextResponse.json({ report });
}
