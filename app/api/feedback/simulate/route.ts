import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SAMPLE_ITEMS = [
  { content: "The search bar doesn't return results for partial matches.", channel: "Zendesk" },
  { content: "Really impressed with how fast the new update loads.", channel: "Zendesk" },
  { content: "Can we get a dark mode toggle in settings?", channel: "App Store" },
  { content: "Crashes every time I try to export a PDF.", channel: "App Store" },
  { content: "Support team resolved my issue in under 10 minutes, great service.", channel: "Twitter" },
  { content: "Pricing page is confusing, hard to tell which plan I need.", channel: "Twitter" },
  { content: "Would love an API so we can integrate with our internal tools.", channel: "Community post" },
  { content: "The onboarding checklist was super helpful for my team.", channel: "Community post" },
];

export async function POST() {
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
    return NextResponse.json({ error: "Forbidden: Viewers cannot simulate feedback" }, { status: 403 });
  }

  let created = 0;
  for (const item of SAMPLE_ITEMS) {
    await prisma.feedback.create({
      data: {
        content: item.content,
        channel: item.channel,
        workspaceId: currentUser.workspaceId,
      },
    });
    created++;
  }

  return NextResponse.json({ created });
}