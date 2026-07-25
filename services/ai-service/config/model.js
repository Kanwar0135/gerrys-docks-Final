const usingAzureFoundry =
  Boolean(process.env.AZURE_FOUNDRY_PROJECT_ENDPOINT) &&
  Boolean(process.env.AZURE_FOUNDRY_API_KEY);

const modelName = usingAzureFoundry
  ? process.env.AZURE_FOUNDRY_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini"
  : process.env.OPENAI_MODEL || "gpt-4o-mini";

module.exports = { modelName };
