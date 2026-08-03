const CONTENT_SAFETY_API_VERSION = "2024-09-01";
const DEFAULT_BLOCK_SEVERITY = 4;

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

async function isTextAllowed(text) {
  try {
    return await analyzeTextSafety(text);
  } catch (error) {
    console.warn("Content Safety check skipped:", error.message);
    return { safe: true, skipped: true, reason: error.message };
  }
}

module.exports = {
  isTextAllowed,
};
