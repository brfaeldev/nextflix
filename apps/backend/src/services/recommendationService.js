const { exec } = require("child_process");

const path = require("path");

const getRecommendation = (history, callback) => {

  const predictPath = path.join(
    __dirname,
    "../ml/models/predict.py"
  );

  const command = `python "${predictPath}" ${history.join(" ")}`;

  console.log(command);

  exec(command, (error, stdout, stderr) => {

    if (error) {
      console.log(error);
      return callback(error);
    }

    if (stderr) {
      console.log(stderr);
    }

    console.log(stdout);

    callback(null, stdout);
  });
};

module.exports = {
  getRecommendation
};