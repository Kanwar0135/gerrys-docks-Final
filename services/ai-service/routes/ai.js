const express = require("express");

const { getClient } = require("../config/chat");
const { modelName } = require("../config/model");

const router = express.Router();
const VALID_WIDGETS = new Set(["products", "quote", "admin", "contact", "none"]);

function parseWidgetLine(line) {
  const [type, ...rest] = line.split(":");
  const widget = type.trim().toLowerCase();
  const filter = rest.join(":").trim() || null;

  return {
    widget: VALID_WIDGETS.has(widget) ? widget : "none",
    filter,
  };
}

function writeEvent(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function writeData(res, text) {
  String(text || "")
    .split(/\r?\n/)
    .forEach((line) => {
      res.write(`data: ${line}\n`);
    });
  res.write("\n");
}

function getLocalFallback(text) {
  const message = text.toLowerCase();

  if (message.includes("quote") || message.includes("price") || message.includes("cost")) {
    return {
      widget: "quote",
      filter: message.includes("dock") ? "dock" : null,
      response:
        "I can help you prepare a quote request. Browse the available products, add the dock, ramp, or accessory items you need, then submit your contact and project details so Gerry's Docks can follow up with accurate pricing.",
    };
  }

  if (message.includes("dock") || message.includes("ramp") || message.includes("product") || message.includes("accessory")) {
    return {
      widget: "products",
      filter: message.includes("ramp") ? "ramps" : message.includes("accessory") ? "accessories" : "docks",
      response:
        "You can review Gerry's Docks products from the product catalog. The catalog is organized by docks, ramps, and accessories so users can compare available items before starting a quote request.",
    };
  }

  if (message.includes("admin") || message.includes("login") || message.includes("manage")) {
    return {
      widget: "admin",
      filter: null,
      response:
        "The admin area is for managing product listings, pricing, availability, and submitted quote requests. Admin access should stay protected so only authorized users can update business data.",
    };
  }

  if (message.includes("contact") || message.includes("phone") || message.includes("email")) {
    return {
      widget: "contact",
      filter: null,
      response:
        "For project-specific questions, users should submit their contact details through the quote form so the client can respond with the right product and pricing information.",
    };
  }

  return {
    widget: "none",
    filter: null,
    response:
      "I can help with Gerry's Docks products, quote requests, and admin workflow questions. Ask about docks, ramps, accessories, pricing, or how the quote process works.",
  };
}

function streamLocalFallback(res, text, reason) {
  const fallback = getLocalFallback(text);
  writeEvent(res, "widget", {
    widget: fallback.widget,
    filter: fallback.filter,
    source: "local-fallback",
  });

  res.write(`event: notice\ndata: ${JSON.stringify({ message: reason })}\n\n`);
  writeData(res, fallback.response);
  res.write("data: [done]\n\n");
  return res.end();
}

function buildAgentRequest(text) {
  const agentName = process.env.AZURE_FOUNDRY_AGENT_NAME;
  const agentVersion = process.env.AZURE_FOUNDRY_AGENT_VERSION;

  if (!agentName || !agentVersion) {
    return {
      model: modelName,
      input: text,
    };
  }

  return {
    model: modelName,
    input: text,
    extra_body: {
      agent_reference: {
        name: agentName,
        version: agentVersion,
        type: "agent_reference",
      },
    },
  };
}

router.post("/", async (req, res) => {
  const text = String(req.body?.text || "").trim();

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("X-Accel-Buffering", "no");

  if (!text) {
    writeEvent(res, "error", { error: "Message text is required" });
    return res.end();
  }

  try {
    const client = getClient();
    const apiResponse = await client.responses.create(buildAgentRequest(text));

    const output = String(apiResponse.output_text || "").trim();
    const newlineIdx = output.indexOf("\n");
    const firstLine = newlineIdx === -1 ? output : output.slice(0, newlineIdx).trim();
    const responseText = newlineIdx === -1 ? output : output.slice(newlineIdx + 1).trim();

    writeEvent(res, "widget", parseWidgetLine(firstLine));

    if (responseText) {
      writeData(res, responseText);
    }

    res.write("data: [done]\n\n");
    return res.end();
  } catch (error) {
    console.error("AI service error:", error);

    return streamLocalFallback(
      res,
      text,
      "AI service is unavailable, so a local project response was used instead."
    );
  }
});

module.exports = router;