const getRecentSequenceForLstm = (history) => {
  if (history.length <= 3) return history;

  const last3 = history.slice(-3);

  if (new Set(last3).size > 1) {
    return last3;
  }

  const distinct = [];

  for (let i = history.length - 1; i >= 0 && distinct.length < 3; i--) {
    if (!distinct.includes(history[i])) {
      distinct.unshift(history[i]);
    }
  }

  if (distinct.length >= 3) {
    return distinct;
  }

  return last3;
};

module.exports = {
  getRecentSequenceForLstm
};
