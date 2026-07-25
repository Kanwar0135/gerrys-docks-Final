require("dotenv").config();

const express = require("express");
const cors = require("cors");

const quotesRouter = require("./routes/quotes");

const app = express();
const PORT = process.env.PORT || 5002;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ service: "Gerry's Docks Quote Service", status: "running" });
});

app.get("/healthz", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/quotes", quotesRouter);
app.use("/api/quotes", quotesRouter);

app.use((error, req, res, next) => {
  console.error(error);

  res.status(error.status || 500).json({
    error: error.message || "Internal server error",
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Quote service running at http://localhost:${PORT}`);
  });
}

module.exports = app;
