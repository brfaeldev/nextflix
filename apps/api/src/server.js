const express = require("express");
const cors = require("cors");
const interactionRoutes = require("./routes/interactionRoutes");

require("./database/init");

const movieRoutes = require("./routes/movieRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// TESTE API
app.get("/", (req, res) => {
  res.json({
    message: "NextFlix API funcionando 🚀"
  });
});

// ROUTES
app.use("/movies", movieRoutes);
app.use("/interactions", interactionRoutes);

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});