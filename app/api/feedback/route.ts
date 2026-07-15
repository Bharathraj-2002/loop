import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
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

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = 10;
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";

  const where: any = { workspaceId: currentUser.workspaceId };
  if (search) {
    where.content = { contains: search, mode: "insensitive" };
  }
  if (status) {
    where.status = status;
  }

  const [items, total] = await Promise.all([
    prisma.feedback.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.feedback.count({ where }),
  ]);

  return NextResponse.json({
    feedback: items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
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