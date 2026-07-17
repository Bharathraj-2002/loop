import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
  const { id } = await params;
  const report = await prisma.report.findUnique({ where: { id } });
  if (!report || report.workspaceId !== currentUser.workspaceId) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }
  return NextResponse.json({ report });
}
