require("dotenv").config({ path: require("path").join(__dirname, "../../../.env") });

const express = require("express");
const cors = require("cors");
const { initDatabase } = require("./db/init");

const authRoutes = require("./routes/authRoutes");
const movieRoutes = require("./routes/movieRoutes");
const ratingRoutes = require("./routes/ratingRoutes");
const eventRoutes = require("./routes/eventRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");

const app = express();
const PORT = process.env.API_PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "NextFlix API rodando" });
});

app.use("/auth", authRoutes);
app.use("/movies", movieRoutes);
app.use("/ratings", ratingRoutes);
app.use("/events", eventRoutes);
app.use("/recommendations", recommendationRoutes);

async function start() {
  try {
    await initDatabase();
  } catch (error) {
    console.warn("Aviso na inicialização do banco:", error.message);
  }

  app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
}

start();
