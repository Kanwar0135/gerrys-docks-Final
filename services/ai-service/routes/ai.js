const express = require("express");

const { getClient } = require("../config/chat");
const { modelName } = require("../config/model");
const { isTextAllowed } = require("../services/contentSafetyService");
const GerrysAssistantPrompt = require("../prompts/gerrys-assistant-prompt");

const router = express.Router();
const promptBuilder = new GerrysAssistantPrompt();
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

  if (
    message.includes("rough") ||
    message.includes("wave") ||
    message.includes("wavy") ||
    message.includes("wind") ||
    message.includes("storm") ||
    message.includes("ice")
  ) {
    return {
      widget: "products",
      filter: "pontoon floating dock",
      response:
        "For rough water, the best recommendation is the 18 inch diameter pontoon floating dock from the client product list. Pontoon floats handle waves better because the water has to push higher before lifting the dock, and the client notes this style can be left in ice. For exact sizing and pricing, submit the quote form with shoreline and water-condition details.",
    };
  }

  if (message.includes("summer") || message.includes("swim") || message.includes("seasonal")) {
    return {
      widget: "quote",
      filter: "summer dock setup",
      response:
        "For a strong summer setup, start with the 8 x 16 Aluminum Dock Section ($3,295), add a 4 x 12 Hinged Access Ramp ($1,425), include the Flip-Up Swim Ladder ($325), and a Boat Bumper Package ($185). That gives you a stable dock, easy water access, and boat protection for summer. Use the quote form for exact project pricing.",
    };
  }

  if (
    message.includes("popular") ||
    message.includes("best") ||
    message.includes("recommend") ||
    message.includes("better") ||
    message.includes("good")
  ) {
    return {
      widget: "products",
      filter: "recommended dock setup",
      response:
        "The 8 x 16 Aluminum Dock Section ($3,295) is the best starting point for most lakefront setups. Pair it with a 4 x 12 Hinged Access Ramp ($1,425) and Flip-Up Swim Ladder ($325) for a complete setup. For rough water, 18-inch Pontoon Floating Docks are recommended instead.",
    };
  }

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
        "Gerry's Docks offers top product options: 8 x 16 Aluminum Dock Section ($3,295), 4 x 10 Shoreline Extension ($1,795), 4 x 12 Hinged Ramp ($1,425), 18-inch Pontoon Floating Docks for rough water, Flip-Up Swim Ladder ($325), and Boat Bumper Package ($185). Select any items to add to your quote request.",
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
    const safetyResult = await isTextAllowed(text);

    if (!safetyResult.safe) {
      writeEvent(res, "widget", { widget: "none", filter: null, source: "content-safety" });
      writeData(
        res,
        "Please avoid inappropriate or harmful language. I can help with Gerry's Docks products, quotes, and shoreline setup information."
      );
      res.write("data: [done]\n\n");
      return res.end();
    }

    const client = getClient();
    const promptText = promptBuilder.generatePrompt(text);

    let outputText = "";
    if (client.responses && typeof client.responses.create === "function") {
      const apiResponse = await client.responses.create({
        model: modelName,
        input: promptText,
      });

      if (apiResponse.output_text) {
        outputText = apiResponse.output_text;
      } else if (Array.isArray(apiResponse.output)) {
        const parts = [];
        for (const item of apiResponse.output) {
          if (item.content && Array.isArray(item.content)) {
            for (const c of item.content) {
              if (c.type === "output_text" && c.text) {
                parts.push(c.text);
              }
            }
          }
        }
        outputText = parts.join("\n");
      }
    } else if (client.chat && client.chat.completions) {
      const completion = await client.chat.completions.create({
        model: modelName,
        messages: [{ role: "user", content: promptText }],
      });
      outputText = completion.choices?.[0]?.message?.content || "";
    }

    const output = String(outputText || "").trim();
    if (!output) {
      return streamLocalFallback(
        res,
        text,
        "AI service returned empty response, so a local project response was used instead."
      );
    }

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
