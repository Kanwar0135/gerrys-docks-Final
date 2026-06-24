const express = require("express");

const { getClient } = require("../config/chat");
const { modelName } = require("../config/model");
const GerrysAssistantPrompt = require("../prompts/gerrys-assistant-prompt");

const router = express.Router();
const assistantPrompt = new GerrysAssistantPrompt();
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
  res.write(`data: ${fallback.response}\n\n`);
  res.write("data: [done]\n\n");
  return res.end();
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
    const apiResponse = await client.chat.completions.create({
      model: modelName,
      messages: [{ role: "user", content: assistantPrompt.generatePrompt(text) }],
      stream: true,
    });

    let widgetSent = false;
    let buffer = "";

    for await (const chunk of apiResponse) {
      const token = chunk?.choices?.[0]?.delta?.content;

      if (!token) {
        continue;
      }

      if (!widgetSent) {
        buffer += token;
        const newlineIdx = buffer.indexOf("\n");

        if (newlineIdx === -1) {
          continue;
        }

        const firstLine = buffer.slice(0, newlineIdx).trim();
        writeEvent(res, "widget", parseWidgetLine(firstLine));
        widgetSent = true;

        const rest = buffer.slice(newlineIdx + 1);

        if (rest) {
          res.write(`data: ${rest}\n\n`);
        }

        buffer = "";
        continue;
      }

      res.write(`data: ${token}\n\n`);
    }

    if (!widgetSent) {
      writeEvent(res, "widget", { widget: "none", filter: null });

      if (buffer) {
        res.write(`data: ${buffer}\n\n`);
      }
    }

    res.write("data: [done]\n\n");
    return res.end();
  } catch (error) {
    console.error(error);
    return streamLocalFallback(
      res,
      text,
      "OpenAI is unavailable, so a local demo response was used instead."
    );
  }
});

module.exports = router;
