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