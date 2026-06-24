let client;

function getClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required for the AI assistant");
  }

  if (!client) {
    const OpenAI = require("openai");

    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  return client;
}

module.exports = { getClient };
