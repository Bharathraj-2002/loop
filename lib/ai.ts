import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export type ClassificationResult = {
  sentiment: "POS" | "NEU" | "NEG";
  sentimentScore: number;
  themes: string[];
  featureArea: string;
  rationale: string;
};

export async function classifyFeedback(
  content: string,
  existingThemes: string[]
): Promise<ClassificationResult | null> {
  const themesList = existingThemes.length > 0 ? existingThemes.join(", ") : "none yet";

  const prompt = `You are classifying a piece of customer feedback for a product feedback intelligence platform.

Feedback: "${content}"

Existing themes in the system: ${themesList}

Analyze this feedback and return ONLY a JSON object (no markdown fences, no extra text) with this exact structure:
{
  "sentiment": "POS" or "NEU" or "NEG",
  "sentimentScore": a number between -1 and 1,
  "themes": an array of 1-2 theme names (reuse existing themes when they fit, otherwise create a short new one, 2-4 words),
  "featureArea": a short 1-3 word label for the product area this relates to (e.g. "Billing", "Onboarding", "Mobile app", "Search"),
  "rationale": a one-sentence explanation of your classification
}

Return ONLY the JSON object, nothing else.`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
    const result = await model.generateContent(prompt);
    const response = result.response;
    let text = response.text().trim();

    text = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();

    const parsed = JSON.parse(text);

    if (
      !parsed.sentiment ||
      typeof parsed.sentimentScore !== "number" ||
      !Array.isArray(parsed.themes) ||
      !parsed.featureArea
    ) {
      return null;
    }

    return parsed as ClassificationResult;
  } catch (err) {
    console.error("Classification error:", err);
    return null;
  }
}

export type VoCReportInput = {
  periodStart: string;
  periodEnd: string;
  totalFeedback: number;
  topThemes: { name: string; count: number }[];
  sentimentBreakdown: { pos: number; neu: number; neg: number };
  sentimentDeltaPct: number;
  notableQuotes: { content: string; channel: string; sentiment: string }[];
};

export type VoCReportResult = {
  summary: string;
  recommendedActions: string[];
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateVoCReport(
  data: VoCReportInput
): Promise<VoCReportResult | null> {
  const prompt = `You are writing a Voice-of-Customer report for a product team.
Use ONLY the data below. Do not invent any numbers, themes, or quotes not listed here.

Period: ${data.periodStart} to ${data.periodEnd}
Total feedback items: ${data.totalFeedback}
Top themes: ${data.topThemes.map(t => `${t.name} (${t.count})`).join(", ")}
Sentiment breakdown: ${data.sentimentBreakdown.pos} positive, ${data.sentimentBreakdown.neu} neutral, ${data.sentimentBreakdown.neg} negative
Sentiment change vs previous period: ${data.sentimentDeltaPct}%
Notable quotes: ${data.notableQuotes.map(q => `"${q.content}" (${q.channel}, ${q.sentiment})`).join(" | ")}

Return ONLY a JSON object (no markdown fences, no extra text) with this exact structure:
{
  "summary": "a 3-5 sentence executive summary of what customers are saying, referencing the actual themes and sentiment numbers above",
  "recommendedActions": ["3-5 short, specific, actionable recommendations based only on the data above"]
}
Return ONLY the JSON object, nothing else.`;

  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
      const result = await model.generateContent(prompt);
      let text = result.response.text().trim();
      text = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      const parsed = JSON.parse(text);
      if (!parsed.summary || !Array.isArray(parsed.recommendedActions)) {
        return null;
      }
      return parsed as VoCReportResult;
    } catch (err: any) {
      const isOverloaded =
        err?.status === 503 || (err?.message && err.message.includes("503"));
      console.error(`VoC report generation error (attempt ${attempt}):`, err);
      if (isOverloaded && attempt < maxAttempts) {
        await sleep(attempt * 2000);
        continue;
      }
      return null;
    }
  }
  return null;
}
