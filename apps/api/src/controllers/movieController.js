const getTrendingMovies = (req, res) => {
  const movies = [
    {
      id: 1,
      title: "Matrix",
      year: 1999,
      poster: "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg"
    },
    {
      id: 2,
      title: "Interstellar",
      year: 2014,
      poster: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg"
    },
    {
      id: 3,
      title: "John Wick",
      year: 2014,
      poster: "https://image.tmdb.org/t/p/w500/fZPSd91yGE9fCcCe6OoQr6E3Bev.jpg"
    }
  ];

  res.json(movies);
};

module.exports = {
  getTrendingMovies
};