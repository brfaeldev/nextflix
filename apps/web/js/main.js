async function loadTrendingMovies() {
  const response = await fetch("http://localhost:3000/movies/trending");
  const movies = await response.json();

  const container = document.getElementById("trending-preview");

  container.innerHTML = `
    <h2>🔥 Em Alta</h2>
    <div class="movie-list">
      ${movies.map(movie => `
        <div class="movie-card">
          <img src="${movie.poster}" alt="${movie.title}">
          <p>${movie.title}</p>
        </div>
      `).join("")}
    </div>
  `;
}

loadTrendingMovies();