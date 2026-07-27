const express = require("express");

const { requireAdmin } = require("../middleware/requireAdmin");
const { createQuote, getAllQuotes } = require("../services/quoteService");

const router = express.Router();

function isValidNorthAmericanPhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  const normalized = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;

  if (normalized.length !== 10) return false;
  if (/^(\d)\1{9}$/.test(normalized)) return false;
  if (normalized[0] === "0" || normalized[0] === "1") return false;
  if (normalized[3] === "0" || normalized[3] === "1") return false;

  return true;
}

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

  if (!isValidNorthAmericanPhone(phone)) {
    return "Valid 10-digit phone number is required";
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
