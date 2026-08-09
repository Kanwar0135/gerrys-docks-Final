const express = require("express");
const Filter = require("bad-words");

const { requireAdmin } = require("../middleware/requireAdmin");
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../services/productService");

const router = express.Router();
const profanityFilter = new Filter();

const PRODUCT_NAME_MAX = 40;
const PRODUCT_DESC_MAX = 300;
// Allowed: letters, numbers, spaces, hyphens, apostrophes, ampersands, periods, commas, parentheses
const ALLOWED_NAME_PATTERN = /^[a-zA-Z0-9 \-'&.,()]+$/;

function validateProduct(product) {
  if (!product.name || !product.category || !product.description) {
    return "Name, category, and description are required";
  }

  // --- Product Name Rules ---
  const name = String(product.name).trim();

  if (name.length === 0) {
    return "Product name cannot be blank";
  }

  if (name.length > PRODUCT_NAME_MAX) {
    return `Product name cannot exceed ${PRODUCT_NAME_MAX} characters`;
  }

  // Must contain at least 2 letters so names like "1@3#" or "AB1" alone don't fly
  const letterCount = (name.match(/[a-zA-Z]/g) || []).length;
  if (letterCount < 2) {
    return "Product name must contain at least 2 letters";
  }

  // No special characters (@, #, $, !, ?, %, ^, *, etc.)
  if (!ALLOWED_NAME_PATTERN.test(name)) {
    return "Product name may only contain letters, numbers, spaces, hyphens, and basic punctuation — no special characters like @, #, $, !, or ?";
  }

  // Profanity check on name
  if (profanityFilter.isProfane(name)) {
    return "Product name contains inappropriate language and cannot be saved";
  }

  // --- Description Rules ---
  const description = String(product.description).trim();

  if (description.length > PRODUCT_DESC_MAX) {
    return `Product description cannot exceed ${PRODUCT_DESC_MAX} characters`;
  }

  // Profanity check on description
  if (profanityFilter.isProfane(description)) {
    return "Product description contains inappropriate language and cannot be saved";
  }

  // --- Price Rules ---
  if (!Number.isFinite(Number(product.price)) || Number(product.price) < 0) {
    return "Price must be a valid number";
  }

  if (!["Docks", "Ramps", "Accessories"].includes(product.category)) {
    return "Category must be Docks, Ramps, or Accessories";
  }

  return null;
}

router.get("/", async (req, res, next) => {
  try {
    res.json(await getAllProducts());
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const product = await getProductById(req.params.id);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    return res.json(product);
  } catch (error) {
    return next(error);
  }
});

router.post("/", requireAdmin, async (req, res, next) => {
  try {
    const validationError = validateProduct(req.body);

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const product = await createProduct({
      id: req.body.id,
      name: req.body.name.trim(),
      category: req.body.category,
      price: req.body.price,
      description: req.body.description.trim(),
      available: Boolean(req.body.available),
    });

    return res.status(201).json(product);
  } catch (error) {
    return next(error);
  }
});

router.post("/reset", requireAdmin, async (req, res) => {
  return res.status(410).json({
    error: "Catalog reset is disabled for the final client database.",
  });
});

router.put("/:id", requireAdmin, async (req, res, next) => {
  try {
    const validationError = validateProduct(req.body);

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const product = await updateProduct(req.params.id, {
      name: req.body.name.trim(),
      category: req.body.category,
      price: req.body.price,
      description: req.body.description.trim(),
      available: Boolean(req.body.available),
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    return res.json(product);
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    const deletedProduct = await deleteProduct(req.params.id);

    if (!deletedProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    return res.json({
      message: "Product deleted",
      product: deletedProduct,
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
