const CONTENT_SAFETY_API_VERSION = "2024-09-01";
const DEFAULT_BLOCK_SEVERITY = 2;
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
  const foundryApiVersion = process.env.AZURE_FOUNDRY_API_VERSION || "v1";

  if (!foundryEndpoint || !foundryApiKey) return null;

  if (!languageClient) {
    const OpenAI = require("openai");
    const cleanEndpoint = foundryEndpoint.replace(/\/responses\/?$/, "").replace(/\/$/, "");

    languageClient = new OpenAI({
      apiKey: foundryApiKey,
      baseURL: cleanEndpoint,
      defaultQuery: { "api-version": foundryApiVersion },
      defaultHeaders: { "api-key": foundryApiKey },
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

function hasTargetedProfanity(text) {
  const normalized = String(text || "").toLowerCase();

  return /\b(f+u+c+k+|f\W*u\W*c\W*k|bitch|asshole|idiot|moron|stupid)\b[\s,!.]*(you|u)\b|\b(you|u)\b[\s,!.]*(are|r)?[\s,!.]*(a\s+)?\b(f+u+c+k+|f\W*u\W*c\W*k|bitch|asshole|idiot|moron|stupid)\b/.test(
    normalized
  );
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

  const promptText = `Classify user text for a public business website. Return only JSON with keys unsafe:boolean and reason:string. Mark unsafe true for targeted insults, harassment, threats, hate, sexual content, self-harm, violence, or abusive profanity. Do not mark mild non-targeted frustration unsafe.\n\nUser text: ${text}`;

  const response = await client.responses.create({
    model: process.env.AZURE_FOUNDRY_MODEL || process.env.OPENAI_MODEL || DEFAULT_LANGUAGE_MODEL,
    input: promptText,
  });

  let rawText = response.output_text || "";
  if (!rawText && Array.isArray(response.output)) {
    const parts = [];
    for (const item of response.output) {
      if (item.content && Array.isArray(item.content)) {
        for (const c of item.content) {
          if (c.type === "output_text" && c.text) {
            parts.push(c.text);
          }
        }
      }
    }
    rawText = parts.join("\n");
  }

  const result = parseJsonObject(rawText || "{}");

  return {
    safe: !result?.unsafe,
    reason: result?.reason || "",
    source: "foundry-language-classifier",
  };
}

function hasGeneralProfanity(text) {
  const normalized = String(text || "").toLowerCase();
  const profaneWords = [
    'fuck','fuk','shit','sh1t','shyt','bitch','b1tch','bastard',
    'asshole','ass','arse','cunt','cock','dick','d1ck','prick','pussy','twat',
    'wanker','whore','slut','nigger','nigga','faggot','fag','retard','moron',
    'idiot','imbecile','stupid','dumbass','jackass','piss','crap','goddamn',
    'bullshit','horseshit','motherfucker','kys','rape'
  ];
  return profaneWords.some(word => {
    return new RegExp(`\\b${word}\\b`, 'i').test(normalized);
  });
}

async function isTextAllowed(text) {
  if (hasTargetedProfanity(text) || hasGeneralProfanity(text)) {
    return {
      safe: false,
      reason: "Inappropriate or offensive language detected",
      source: "profanity-guard",
    };
  }

  try {
    const contentSafetyResult = await analyzeTextSafety(text);
    if (!contentSafetyResult.safe) {
      return contentSafetyResult;
    }
  } catch (error) {
    console.warn("Content Safety check skipped, using language classifier:", error.message);
  }

  try {
    return await analyzeAbusiveLanguage(text);
  } catch (error) {
    console.warn("Language classifier skipped:", error.message);
    return { safe: true, skipped: true, reason: error.message };
  }
}

module.exports = {
  isTextAllowed,
};
