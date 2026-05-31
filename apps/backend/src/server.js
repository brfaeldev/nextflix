require("dotenv").config();

const express = require("express");
const cors = require("cors");

require("./database/init");

const { seedMoviesIfEmpty } = require("./database/seed");
const { fetchPostersBatch } = require("./services/posterService");

const authRoutes = require("./routes/authRoutes");
const movieRoutes = require("./routes/movieRoutes");
const interactionRoutes = require("./routes/interactionRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const ratingRoutes = require("./routes/ratingRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "NextFlix API funcionando 🚀"
  });
});

app.use("/auth", authRoutes);
app.use("/movies", movieRoutes);
app.use("/interactions", interactionRoutes);
app.use("/recommendation", recommendationRoutes);
app.use("/ratings", ratingRoutes);

const PORT = process.env.PORT || 3000;

seedMoviesIfEmpty()
  .then(() => fetchPostersBatch(40))
  .then((count) => {
    if (count > 0) {
      console.log(`✅ ${count} posters TMDB atualizados`);
    }
  })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Erro ao inicializar catálogo:", err.message);
    process.exit(1);
  });
