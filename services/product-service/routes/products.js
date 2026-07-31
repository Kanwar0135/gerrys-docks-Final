const express = require("express");

const { requireAdmin } = require("../middleware/requireAdmin");
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../services/productService");

const router = express.Router();

function validateProduct(product) {
  if (!product.name || !product.category || !product.description) {
    return "Name, category, and description are required";
  }

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
