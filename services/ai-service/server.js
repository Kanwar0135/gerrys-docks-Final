require("dotenv").config();

const express = require("express");
const cors = require("cors");

const aiRouter = require("./routes/ai");

const app = express();
const PORT = process.env.PORT || 5004;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ service: "Gerry's Docks AI Service", status: "running" });
});

app.use("/ai", aiRouter);

app.use((error, req, res, next) => {
  console.error(error);

  res.status(error.status || 500).json({
    error: error.message || "Internal server error",
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`AI service running at http://localhost:${PORT}`);
  });
}

module.exports = app;
