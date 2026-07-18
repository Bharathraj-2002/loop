import { PrismaClient, Role, Sentiment, FeedbackStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  await prisma.feedbackTheme.deleteMany({});
  await prisma.embedding.deleteMany({});
  await prisma.feedback.deleteMany({});
  await prisma.theme.deleteMany({});
  await prisma.report.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.workspace.deleteMany({});

  const workspace = await prisma.workspace.create({
    data: { name: "Acme Corp" },
  });

  const passwordHash = await bcrypt.hash("Demo@1234", 10);
  await prisma.user.create({
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

  const channels = [
    "Support ticket",
    "App store review",
    "NPS survey",
    "Sales call note",
    "Community post",
  ];

  type SeedItem = { content: string; themeIndex: number; sentiment: Sentiment };

  const feedbackByTheme: SeedItem[] = [
    // Onboarding (theme 0)
    { content: "Onboarding took forever, couldn't figure out how to invite my team.", themeIndex: 0, sentiment: Sentiment.NEG },
    { content: "The setup wizard is confusing, I got stuck on step 3 for 20 minutes.", themeIndex: 0, sentiment: Sentiment.NEG },
    { content: "Once I got past the first day, onboarding was actually pretty smooth.", themeIndex: 0, sentiment: Sentiment.NEU },
    { content: "Loved the guided checklist during onboarding, made it easy to know what to do next.", themeIndex: 0, sentiment: Sentiment.POS },
    { content: "Would be great to have a sample workspace pre-populated so new users can explore before adding real data.", themeIndex: 0, sentiment: Sentiment.NEU },
    { content: "Inviting teammates should not require them to accept an email link that expires in 24 hours.", themeIndex: 0, sentiment: Sentiment.NEG },
    { content: "The onboarding checklist was super helpful for my team.", themeIndex: 0, sentiment: Sentiment.POS },
    { content: "Took our team about a week to fully ramp up, longer than we expected.", themeIndex: 0, sentiment: Sentiment.NEU },

    // Billing (theme 1)
    { content: "Billing page keeps timing out when I try to download an invoice.", themeIndex: 1, sentiment: Sentiment.NEG },
    { content: "Wish there was a way to see a breakdown of usage before the invoice arrives.", themeIndex: 1, sentiment: Sentiment.NEU },
    { content: "Switched to annual billing and the discount was applied instantly, no issues.", themeIndex: 1, sentiment: Sentiment.POS },
    { content: "Got double charged last month, support fixed it quickly but it was stressful.", themeIndex: 1, sentiment: Sentiment.NEG },
    { content: "Please add support for purchase orders, our finance team needs it for renewal.", themeIndex: 1, sentiment: Sentiment.NEU },
    { content: "The new billing dashboard makes it so much easier to track spend across teams.", themeIndex: 1, sentiment: Sentiment.POS },
    { content: "Can we get itemized invoices broken down by workspace?", themeIndex: 1, sentiment: Sentiment.NEU },
    { content: "Pricing page is confusing, hard to tell which plan I need.", themeIndex: 1, sentiment: Sentiment.NEG },

    // Performance (theme 2)
    { content: "Crashes every time I try to export a PDF.", themeIndex: 2, sentiment: Sentiment.NEG },
    { content: "Dashboard used to take 10+ seconds to load, now it's basically instant. Nice work.", themeIndex: 2, sentiment: Sentiment.POS },
    { content: "Really impressed with how fast the new update loads.", themeIndex: 2, sentiment: Sentiment.POS },
    { content: "The search bar doesn't return results for partial matches.", themeIndex: 2, sentiment: Sentiment.NEG },
    { content: "Uploading a CSV with more than 500 rows seems to hang the browser tab.", themeIndex: 2, sentiment: Sentiment.NEG },
    { content: "Performance has been solid for us, no complaints over the past month.", themeIndex: 2, sentiment: Sentiment.NEU },
    { content: "Charts on the dashboard occasionally flicker before rendering, minor but noticeable.", themeIndex: 2, sentiment: Sentiment.NEU },
    { content: "App feels noticeably snappier since the last release.", themeIndex: 2, sentiment: Sentiment.POS },

    // Mobile Experience (theme 3)
    { content: "It does the job, but the mobile experience needs work.", themeIndex: 3, sentiment: Sentiment.NEG },
    { content: "Can we get a dark mode toggle in settings?", themeIndex: 3, sentiment: Sentiment.NEU },
    { content: "Mobile site is basically unusable on smaller phones, text gets cut off.", themeIndex: 3, sentiment: Sentiment.NEG },
    { content: "I love the new dark mode", themeIndex: 3, sentiment: Sentiment.POS },
    { content: "Would really appreciate a native mobile app instead of the mobile web view.", themeIndex: 3, sentiment: Sentiment.NEU },
    { content: "Filters on mobile are hard to tap, buttons feel too small.", themeIndex: 3, sentiment: Sentiment.NEG },
    { content: "Surprisingly good mobile experience for a web app, works well on my tablet.", themeIndex: 3, sentiment: Sentiment.POS },
    { content: "Mobile notifications would be a nice addition for status changes.", themeIndex: 3, sentiment: Sentiment.NEU },

    // Customer Support (theme 4)
    { content: "Support team resolved my issue in under 10 minutes, great service.", themeIndex: 4, sentiment: Sentiment.POS },
    { content: "Waited almost two days for a response to a critical bug report.", themeIndex: 4, sentiment: Sentiment.NEG },
    { content: "The help center articles are outdated and don't match the current UI.", themeIndex: 4, sentiment: Sentiment.NEG },
    { content: "Support agent was friendly and knew exactly how to fix my problem.", themeIndex: 4, sentiment: Sentiment.POS },
    { content: "Would love an API so we can integrate with our internal tools.", themeIndex: 4, sentiment: Sentiment.NEU },
    { content: "Please add bulk export for reports", themeIndex: 4, sentiment: Sentiment.NEU },
    { content: "Live chat support has been a game changer for quick questions.", themeIndex: 4, sentiment: Sentiment.POS },
    { content: "Ticket system doesn't notify me when someone replies, I have to keep checking manually.", themeIndex: 4, sentiment: Sentiment.NEG },
  ];

  const totalToSeed = 130;
  let created = 0;

  for (let i = 0; i < totalToSeed; i++) {
    const item = feedbackByTheme[i % feedbackByTheme.length];
    const channel = channels[i % channels.length];

    let sentimentScore = 0;
    if (item.sentiment === Sentiment.POS) sentimentScore = 0.4 + Math.random() * 0.6;
    if (item.sentiment === Sentiment.NEG) sentimentScore = -1 + Math.random() * 0.6;
    if (item.sentiment === Sentiment.NEU) sentimentScore = -0.15 + Math.random() * 0.3;

    const daysAgo = Math.floor(Math.random() * 30);
    const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    await prisma.feedback.create({
      data: {
        content: item.content,
        channel,
        sentiment: item.sentiment,
        sentimentScore,
        status: FeedbackStatus.NEW,
        workspaceId: workspace.id,
        createdAt,
        themes: {
          create: {
            themeId: themes[item.themeIndex].id,
            confidence: 0.75 + Math.random() * 0.25,
          },
        },
      },
    });
    created++;
  }

  console.log(`Seed complete! Created ${created} feedback items.`);
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