import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { GoogleGenerativeAI } from "@google/generative-ai";

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

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

  const body = await req.json();
  const question = body.question;

  if (!question || typeof question !== "string") {
    return NextResponse.json({ error: "question is required" }, { status: 400 });
  }

  const keywords = question
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(" ")
    .filter(function (w: string) {
      return w.length > 3;
    });

  let relevantFeedback = await prisma.feedback.findMany({
    where: {
      workspaceId: currentUser.workspaceId,
      OR: keywords.map(function (k: string) {
        return { content: { contains: k, mode: "insensitive" as const } };
      }),
    },
    take: 20,
    orderBy: { createdAt: "desc" },
  });

  if (relevantFeedback.length < 5) {
    const more = await prisma.feedback.findMany({
      where: { workspaceId: currentUser.workspaceId },
      take: 20,
      orderBy: { createdAt: "desc" },
    });
    const existingIds: Set<string> = new Set(
      relevantFeedback.map(function (f) {
        return f.id;
      })
    );
    for (let i = 0; i < more.length; i++) {
      const item = more[i];
      if (!existingIds.has(item.id) && relevantFeedback.length < 20) {
        relevantFeedback.push(item);
      }
    }
  }

  if (relevantFeedback.length === 0) {
    return NextResponse.json({
      answer: "There isn't any feedback data yet to answer this question from.",
      sources: [],
    });
  }

  const contextText = relevantFeedback
    .map(function (f, i) {
      return "[" + (i + 1) + "] (" + f.channel + ", " + (f.sentiment || "unclassified") + "): \"" + f.content + "\"";
    })
    .join("\n");

  const prompt =
    "You are answering a question about customer feedback for a product team, using ONLY the feedback items provided below. Do not invent or assume any feedback that isn't listed.\n\n" +
    "Feedback items:\n" +
    contextText +
    "\n\nQuestion: \"" + question + "\"\n\n" +
    "Instructions:\n" +
    "- Answer in 2-4 sentences based only on the feedback items above.\n" +
    "- Reference specific items by their number (e.g. \"as seen in [3]\") where relevant.\n" +
    "- If the feedback doesn't contain enough information to answer, say so honestly.\n" +
    "- Do not make up statistics or feedback that isn't in the list.";

  const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const answer = result.response.text().trim();

      return NextResponse.json({
        answer: answer,
        sources: relevantFeedback.map(function (f, i) {
          return {
            index: i + 1,
            id: f.id,
            content: f.content,
            channel: f.channel,
          };
        }),
      });
    } catch (err) {
      console.error("Ask LOOP attempt " + (attempt + 1) + " failed:", err);
      if (attempt < 2) {
        await new Promise(function (resolve) {
          setTimeout(resolve, 2000);
        });
      }
    }
  }

  return NextResponse.json({ error: "Failed to generate answer after retries" }, { status: 500 });
}