const CONTENT_SAFETY_API_VERSION = "2024-09-01";
const DEFAULT_BLOCK_SEVERITY = 4;
const DEFAULT_LANGUAGE_MODEL = "gpt-5";

let languageClient;

function getContentSafetyConfig() {
  return {
    endpoint: process.env.AZURE_CONTENT_SAFETY_ENDPOINT,
    key: process.env.AZURE_CONTENT_SAFETY_KEY,
    blockSeverity: Number(process.env.CONTENT_SAFETY_BLOCK_SEVERITY || DEFAULT_BLOCK_SEVERITY),
  };
}

function getHighestSeverity(categoriesAnalysis = []) {
  return categoriesAnalysis.reduce(
    (highest, category) => Math.max(highest, Number(category.severity || 0)),
    0
  );
}

function getLanguageClient() {
  const foundryEndpoint = process.env.AZURE_FOUNDRY_PROJECT_ENDPOINT;
  const foundryApiKey = process.env.AZURE_FOUNDRY_API_KEY;

  if (!foundryEndpoint || !foundryApiKey) return null;

  if (!languageClient) {
    const OpenAI = require("openai");

    languageClient = new OpenAI({
      apiKey: foundryApiKey,
      baseURL: `${foundryEndpoint.replace(/\/$/, "")}/openai/v1`,
    });
  }

  return languageClient;
}

function parseJsonObject(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = String(text || "").match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : null;
  }
}

async function analyzeTextSafety(text) {
  const { endpoint, key, blockSeverity } = getContentSafetyConfig();

  if (!endpoint || !key) {
    return { safe: true, skipped: true, reason: "Content Safety is not configured" };
  }

  const url = `${endpoint.replace(/\/$/, "")}/contentsafety/text:analyze?api-version=${CONTENT_SAFETY_API_VERSION}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Ocp-Apim-Subscription-Key": key,
    },
    body: JSON.stringify({
      text,
      categories: ["Hate", "Sexual", "SelfHarm", "Violence"],
      outputType: "FourSeverityLevels",
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error?.message || data.message || "Content Safety request failed");
  }

  const highestSeverity = getHighestSeverity(data.categoriesAnalysis);

  return {
    safe: highestSeverity < blockSeverity,
    highestSeverity,
    categoriesAnalysis: data.categoriesAnalysis || [],
  };
}

async function analyzeAbusiveLanguage(text) {
  const client = getLanguageClient();

  if (!client) {
    return { safe: true, skipped: true, reason: "Foundry language classifier is not configured" };
  }

  const response = await client.responses.create({
    model: process.env.AZURE_FOUNDRY_MODEL || process.env.OPENAI_MODEL || DEFAULT_LANGUAGE_MODEL,
    input: [
      {
        role: "system",
        content:
          "Classify user text for a public business website. Return only JSON with keys unsafe:boolean and reason:string. Mark unsafe true for targeted insults, harassment, threats, hate, sexual content, self-harm, violence, or abusive profanity. Do not mark mild non-targeted frustration unsafe.",
      },
      {
        role: "user",
        content: text,
      },
    ],
  });

  const result = parseJsonObject(response.output_text || "{}");

  return {
    safe: !result?.unsafe,
    reason: result?.reason || "",
    source: "foundry-language-classifier",
  };
}

async function isTextAllowed(text) {
  try {
    const contentSafetyResult = await analyzeTextSafety(text);

    if (!contentSafetyResult.safe) {
      return contentSafetyResult;
    }

    return await analyzeAbusiveLanguage(text);
  } catch (error) {
    console.warn("Content Safety check skipped:", error.message);
    return { safe: true, skipped: true, reason: error.message };
  }
}

module.exports = {
  isTextAllowed,
};
