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

const buildSequenceWithRatings = (history, likedIds = []) => {
  const interactionSeq = getRecentSequenceForLstm(history);

  if (!likedIds.length) {
    return interactionSeq;
  }

  const recentLikes = [...new Set(likedIds)].slice(-2);
  const filler = interactionSeq.filter((id) => !recentLikes.includes(id));
  let combined = [...filler, ...recentLikes].slice(-3);

  if (combined.length < 3) {
    combined = [...interactionSeq, ...recentLikes].slice(-3);
  }

  while (combined.length < 3 && interactionSeq.length > 0) {
    combined.unshift(interactionSeq[0]);
    combined = combined.slice(-3);
  }

  return combined.length ? combined : interactionSeq;
};

module.exports = {
  getRecentSequenceForLstm,
  buildSequenceWithRatings
};
