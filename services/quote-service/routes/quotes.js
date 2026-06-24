const express = require("express");

const { requireAdmin } = require("../middleware/requireAdmin");
const { createQuote, getAllQuotes } = require("../services/quoteService");

const router = express.Router();

function validateQuote(quoteData) {
  const contact = quoteData.contact || {};
  const customerName = quoteData.customerName || contact.name;
  const email = quoteData.email || contact.email;
  const phone = quoteData.phone || contact.phone;
  const location = quoteData.location || contact.location;

  if (!customerName || !email || !phone || !location) {
    return "Name, email, phone, and location are required";
  }

  if (!email.includes("@")) {
    return "Valid email is required";
  }

  if (!Array.isArray(quoteData.items) || quoteData.items.length === 0) {
    return "At least one quote item is required";
  }

  if (
    quoteData.subtotal !== undefined &&
    (!Number.isFinite(Number(quoteData.subtotal)) || Number(quoteData.subtotal) < 0)
  ) {
    return "Valid subtotal is required";
  }

  return null;
}

router.post("/", async (req, res, next) => {
  try {
    const validationError = validateQuote(req.body);

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const quote = await createQuote(req.body);

    return res.status(201).json({
      message: "Quote request received",
      quote,
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/", requireAdmin, async (req, res, next) => {
  try {
    res.json(await getAllQuotes());
  } catch (error) {
    next(error);
  }
});

module.exports = router;
