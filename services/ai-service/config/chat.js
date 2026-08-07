const OpenAI = require("openai");

let client;

function getClient() {
  const foundryEndpoint = process.env.AZURE_FOUNDRY_PROJECT_ENDPOINT;
  const foundryApiKey = process.env.AZURE_FOUNDRY_API_KEY;
  const openAiApiKey = process.env.OPENAI_API_KEY;

  if (!client) {
    if (foundryEndpoint && foundryApiKey) {
      const cleanEndpoint = foundryEndpoint.replace(/\/responses\/?$/, "").replace(/\/$/, "");
      client = new OpenAI({
        apiKey: foundryApiKey,
        baseURL: cleanEndpoint,
        defaultQuery: { "api-version": process.env.AZURE_FOUNDRY_API_VERSION || "v1" },
        defaultHeaders: { "api-key": foundryApiKey },
      });
    } else if (openAiApiKey) {
      client = new OpenAI({
        apiKey: openAiApiKey,
      });
    } else {
      throw new Error("AI API key is missing. Add AZURE_FOUNDRY_API_KEY or OPENAI_API_KEY to ai-service/.env");
    }
  }

  return client;
}

module.exports = { getClient };
