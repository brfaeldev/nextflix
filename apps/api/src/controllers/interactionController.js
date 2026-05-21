const {
  saveInteraction,
  getUserInteractions
} = require("../services/interactionService");

const createInteraction = (req, res) => {

  const interaction = req.body;

  saveInteraction(interaction, (err, result) => {

    if (err) {
      return res.status(500).json({
        error: err.message
      });
    }

    res.status(201).json({
      message: "Interação salva ✅",
      interaction: result
    });
  });
};

const getInteractionsByUser = (req, res) => {

  const userId = req.params.userId;

  getUserInteractions(userId, (err, interactions) => {

    if (err) {
      return res.status(500).json({
        error: err.message
      });
    }

    res.json(interactions);
  });
};

module.exports = {
  createInteraction,
  getInteractionsByUser
};