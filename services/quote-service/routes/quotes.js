const express = require("express");

const { requireAdmin } = require("../middleware/requireAdmin");
const { createQuote, getAllQuotes } = require("../services/quoteService");

const router = express.Router();
const ADDRESS_COUNTRIES = new Set(["ca", "us"]);

function mapGeoapifyAddress(feature) {
  const properties = feature.properties || {};

  return {
    label: properties.formatted,
    streetAddress: [properties.housenumber, properties.street].filter(Boolean).join(" "),
    city: properties.city || properties.town || properties.village || properties.county || "",
    province: properties.state || "",
    postalCode: properties.postcode || "",
    country: properties.country || "",
    countryCode: properties.country_code || "",
    latitude: properties.lat,
    longitude: properties.lon,
  };
}

router.get("/address-suggestions", async (req, res, next) => {
  try {
    const query = String(req.query.query || "").trim();

    if (query.length < 3) {
      return res.json([]);
    }

    const apiKey = process.env.GEOAPIFY_API_KEY || process.env.ADDRESS_AUTOCOMPLETE_API_KEY;

    if (!apiKey) {
      return res.status(503).json({
        error: "Address autocomplete is not configured",
      });
    }

    const params = new URLSearchParams({
      text: query,
      limit: "6",
      filter: "countrycode:ca,us",
      apiKey,
    });

    const response = await fetch(`https://api.geoapify.com/v1/geocode/autocomplete?${params}`);
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.message || "Unable to fetch address suggestions",
      });
    }

    const suggestions = Array.isArray(data.features)
      ? data.features
          .map(mapGeoapifyAddress)
          .filter((address) => address.label && ADDRESS_COUNTRIES.has(address.countryCode))
      : [];

    return res.json(suggestions);
  } catch (error) {
    return next(error);
  }
});

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
