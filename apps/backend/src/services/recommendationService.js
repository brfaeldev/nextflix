const { exec } = require("child_process");
const path = require("path");

const predictPath = path.join(__dirname, "../ml/models/predict.py");

const resolvePythonCommand = () => {
  if (process.env.PYTHON_PATH) {
    return process.env.PYTHON_PATH;
  }
  return process.platform === "win32" ? "python" : "python3";
};

const getRecommendation = (history, callback) => {
  if (!history?.length) {
    return callback(new Error("Histórico vazio para recomendação"));
  }

  const python = resolvePythonCommand();
  const historyArgs = history.map(String).join(" ");
  const command = `${python} "${predictPath}" ${historyArgs}`;

  exec(command, { timeout: 60000 }, (error, stdout, stderr) => {
    if (error) {
      console.error("[recommendation] Erro ao executar predict.py:", error.message);
      if (stderr) console.error(stderr);
      return callback(
        new Error(
          "Modelo LSTM indisponível. Execute npm run ml:train na pasta apps/backend."
        )
      );
    }

    if (stderr?.trim()) {
      console.warn("[recommendation] stderr:", stderr.trim());
    }

    callback(null, stdout);
  });
};

module.exports = {
  getRecommendation,
  resolvePythonCommand
};
