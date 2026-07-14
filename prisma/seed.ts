import { PrismaClient, Role, Sentiment, FeedbackStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Create demo workspace
  const workspace = await prisma.workspace.create({
    data: { name: "Acme Corp" },
  });

  // 2. Create 3 users, one per role
  const passwordHash = await bcrypt.hash("Demo@1234", 10);

  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@acme.test",
      passwordHash,
      role: Role.ADMIN,
      workspaceId: workspace.id,
    },
  });

  await prisma.user.create({
    data: {
      name: "Analyst User",
      email: "analyst@acme.test",
      passwordHash,
      role: Role.ANALYST,
      workspaceId: workspace.id,
    },
  });

  await prisma.user.create({
    data: {
      name: "Viewer User",
      email: "viewer@acme.test",
      passwordHash,
      role: Role.VIEWER,
      workspaceId: workspace.id,
    },
  });

  // 3. Create themes
  const themeNames = [
    "Onboarding",
    "Billing",
    "Performance",
    "Mobile Experience",
    "Customer Support",
  ];
  const themes = await Promise.all(
    themeNames.map((name) =>
      prisma.theme.create({
        data: { name, workspaceId: workspace.id },
      })
    )
  );

  // 4. Create sample feedback
  const channels = ["Support ticket", "App store review", "NPS survey", "Sales call note", "Community post"];
  const sentiments = [Sentiment.POS, Sentiment.NEU, Sentiment.NEG];
  const sampleContent = [
    "Onboarding took forever, couldn't figure out how to invite my team.",
    "The new dashboard is gorgeous and finally fast. Huge improvement.",
    "It does the job, but the mobile experience needs work.",
    "Prospect wants SSO before they'll sign, third time this month.",
    "Love the new export feature, saved me an hour today.",
    "Billing page keeps timing out when I try to download an invoice.",
  ];

  for (let i = 0; i < 120; i++) {
    await prisma.feedback.create({
      data: {
        content: sampleContent[i % sampleContent.length],
        channel: channels[i % channels.length],
        sentiment: sentiments[i % sentiments.length],
        sentimentScore: Math.random() * 2 - 1,
        status: FeedbackStatus.NEW,
        workspaceId: workspace.id,
        themes: {
          create: {
            themeId: themes[i % themes.length].id,
            confidence: 0.8,
          },
        },
      },
    });
  }

  console.log("Seed complete!");
  console.log("Login credentials:");
  console.log("Admin:   admin@acme.test   / Demo@1234");
  console.log("Analyst: analyst@acme.test / Demo@1234");
  console.log("Viewer:  viewer@acme.test  / Demo@1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });