require("dotenv").config();

const express = require("express");
const cors = require("cors");

const productsRouter = require("./routes/products");

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ service: "Gerry's Docks Product Service", status: "running" });
});

app.use("/products", productsRouter);

app.use((error, req, res, next) => {
  console.error(error);

  res.status(error.status || 500).json({
    error: error.message || "Internal server error",
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Product service running at http://localhost:${PORT}`);
  });
}

module.exports = app;
